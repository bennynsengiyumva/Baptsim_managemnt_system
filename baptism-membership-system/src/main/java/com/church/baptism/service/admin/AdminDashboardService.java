package com.church.baptism.service.admin;

import com.church.baptism.entity.audit.AuthLog;
import com.church.baptism.entity.audit.CertificateDownloadLog;
import com.church.baptism.entity.audit.MessageLog;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.message.Message;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.AuthLogRepository;
import com.church.baptism.repository.audit.CertificateDownloadLogRepository;
import com.church.baptism.repository.audit.MessageLogRepository;
import com.church.baptism.repository.activity.ActivityLogRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.baptism.BaptismEventRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.message.MessageRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final UserRepository userRepository;
    private final BaptismEventRepository baptismEventRepository;
    private final BaptismRepository baptismRepository;
    private final MessageRepository messageRepository;
    private final CertificateDownloadLogRepository downloadLogRepository;
    private final MessageLogRepository messageLogRepository;
    private final AuthLogRepository authLogRepository;
    private final ActivityLogRepository activityLogRepository;

    public AdminDashboardService(
            CandidateRepository candidateRepository,
            InstructorRepository instructorRepository,
            UserRepository userRepository,
            BaptismEventRepository baptismEventRepository,
            BaptismRepository baptismRepository,
            MessageRepository messageRepository,
            CertificateDownloadLogRepository downloadLogRepository,
            MessageLogRepository messageLogRepository,
            AuthLogRepository authLogRepository,
            ActivityLogRepository activityLogRepository) {
        this.candidateRepository = candidateRepository;
        this.instructorRepository = instructorRepository;
        this.userRepository = userRepository;
        this.baptismEventRepository = baptismEventRepository;
        this.baptismRepository = baptismRepository;
        this.messageRepository = messageRepository;
        this.downloadLogRepository = downloadLogRepository;
        this.messageLogRepository = messageLogRepository;
        this.authLogRepository = authLogRepository;
        this.activityLogRepository = activityLogRepository;
    }

    // ===================== DASHBOARD STATISTICS =====================

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // User stats
        stats.put("totalCandidates", candidateRepository.count());
        stats.put("totalInstructors", instructorRepository.count());
        stats.put("totalUsers", userRepository.count());

        // Baptism stats
        List<Baptism> allBaptisms = baptismRepository.findAll();
        long pendingRequests = allBaptisms.stream()
                .filter(b -> "PENDING".equals(b.getRequestStatus() != null ? b.getRequestStatus().name() : null))
                .count();
        long approvedRequests = allBaptisms.stream()
                .filter(b -> "APPROVED".equals(b.getRequestStatus() != null ? b.getRequestStatus().name() : null))
                .count();
        long rejectedRequests = allBaptisms.stream()
                .filter(b -> "REJECTED".equals(b.getRequestStatus() != null ? b.getRequestStatus().name() : null))
                .count();
        long baptized = allBaptisms.stream().filter(Baptism::isBaptized).count();
        long certsGenerated = allBaptisms.stream().filter(b -> b.getCertificateNumber() != null).count();
        long certsSigned = allBaptisms.stream().filter(Baptism::isCertificateSigned).count();

        stats.put("totalBaptismEvents", baptismEventRepository.count());
        stats.put("pendingBaptismRequests", pendingRequests);
        stats.put("approvedBaptismRequests", approvedRequests);
        stats.put("rejectedBaptismRequests", rejectedRequests);
        stats.put("totalBaptized", baptized);
        stats.put("certificatesGenerated", certsGenerated);
        stats.put("certificatesSigned", certsSigned);

        // Certificate downloads
        stats.put("totalDownloads", downloadLogRepository.count());

        // Messages
        stats.put("totalMessagesSent", messageRepository.count());
        stats.put("totalMessageLogs", messageLogRepository.count());

        // Auth stats
        stats.put("totalLogins", authLogRepository.countByAction("LOGIN_SUCCESS"));
        stats.put("failedLogins", authLogRepository.countByActionAndSuccess("LOGIN_FAILED", false));

        // Activity logs
        stats.put("totalActivityLogs", activityLogRepository.count());

        return stats;
    }

    // ===================== CERTIFICATES =====================

    public List<Map<String, Object>> getAllCertificates() {
        return baptismRepository.findByBaptizedTrueOrderByConfirmedAtDesc()
                .stream()
                .map(b -> {
                    Map<String, Object> cert = new LinkedHashMap<>();
                    cert.put("id", b.getId());
                    cert.put("certificateNumber", b.getCertificateNumber());
                    cert.put("candidateName", b.getCandidate().getFullName());
                    candidateRepository.findById(b.getCandidate().getId()).ifPresent(c -> {
                        cert.put("candidateEmail", c.getEmail());
                        if (c.getChurch() != null) {
                            cert.put("churchName", c.getChurch().getChurchName());
                        }
                    });
                    cert.put("baptismDate", b.getBaptismDate());
                    cert.put("location", b.getLocation());
                    cert.put("officiatingPastor", b.getOfficiatingPastor());
                    cert.put("certificateSigned", b.isCertificateSigned());
                    cert.put("signedAt", b.getSignedAt());
                    cert.put("requestStatus", b.getRequestStatus() != null ? b.getRequestStatus().name() : null);
                    cert.put("confirmedAt", b.getConfirmedAt());

                    long downloadCount = downloadLogRepository.countByBaptismId(b.getId());
                    cert.put("downloadCount", downloadCount);
                    return cert;
                })
                .toList();
    }

    // ===================== CERTIFICATE DOWNLOADS =====================

    public List<CertificateDownloadLog> getCertificateDownloads() {
        return downloadLogRepository.findTop20ByOrderByCreatedAtDesc();
    }

    public List<CertificateDownloadLog> getDownloadsByBaptism(Long baptismId) {
        return downloadLogRepository.findByBaptismIdOrderByCreatedAtDesc(baptismId);
    }

    // ===================== MESSAGING =====================

    public List<Map<String, Object>> getConversationsOverview() {
        List<Message> allMessages = messageRepository.findAll();
        Map<String, List<Message>> grouped = new LinkedHashMap<>();

        for (Message msg : allMessages) {
            Long id1 = Math.min(msg.getSender().getId(), msg.getReceiver().getId());
            Long id2 = Math.max(msg.getSender().getId(), msg.getReceiver().getId());
            String key = id1 + "-" + id2;
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(msg);
        }

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<Message> msgs = entry.getValue();
                    Message last = msgs.get(msgs.size() - 1);
                    Map<String, Object> conv = new LinkedHashMap<>();
                    conv.put("conversationId", entry.getKey());
                    conv.put("participant1", msgs.get(0).getSender().getFullName());
                    conv.put("participant2", msgs.get(0).getReceiver().getFullName());
                    conv.put("totalMessages", msgs.size());
                    conv.put("lastMessageDate", last.getCreatedAt());
                    conv.put("lastMessageContent", last.getContent() != null && last.getContent().length() > 50
                            ? last.getContent().substring(0, 50) + "..." : last.getContent());
                    long unreadCount = msgs.stream().filter(m -> !m.isRead()).count();
                    conv.put("unreadMessages", unreadCount);
                    return conv;
                })
                .sorted((a, b) -> {
                    Object d1 = a.get("lastMessageDate");
                    Object d2 = b.get("lastMessageDate");
                    if (d1 == null) return 1;
                    if (d2 == null) return -1;
                    return d2.toString().compareTo(d1.toString());
                })
                .toList();
    }

    public List<MessageLog> getMessageLogs() {
        return messageLogRepository.findTop20ByOrderByCreatedAtDesc();
    }

    // ===================== BAPTISM REQUESTS =====================

    public List<Map<String, Object>> getAllBaptismRequests() {
        return baptismRepository.findAll().stream()
                .map(b -> {
                    Map<String, Object> req = new LinkedHashMap<>();
                    req.put("id", b.getId());
                    req.put("candidateName", b.getCandidate().getFullName());
                    req.put("candidateId", b.getCandidate().getId());
                    req.put("event", b.getEvent() != null ? b.getEvent().getEventName() : "—");
                    req.put("requestStatus", b.getRequestStatus() != null ? b.getRequestStatus().name() : "UNKNOWN");
                    req.put("requestedAt", b.getRequestedAt());
                    req.put("baptismDate", b.getBaptismDate());
                    req.put("approved", b.isApproved());
                    req.put("baptized", b.isBaptized());
                    req.put("certificateSigned", b.isCertificateSigned());
                    return req;
                })
                .sorted((a, b) -> {
                    Object d1 = a.get("requestedAt");
                    Object d2 = b.get("requestedAt");
                    if (d1 == null) return 1;
                    if (d2 == null) return -1;
                    return d2.toString().compareTo(d1.toString());
                })
                .toList();
    }

    // ===================== AUTH LOGS =====================

    public List<AuthLog> getAuthLogs() {
        return authLogRepository.findTop20ByOrderByCreatedAtDesc();
    }

    // ===================== USER ACTIVITY =====================

    public List<Map<String, Object>> getUserActivity() {
        List<Map<String, Object>> activities = new ArrayList<>();

        // Recent activity logs
        activityLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(20)
                .forEach(log -> {
                    Map<String, Object> activity = new LinkedHashMap<>();
                    activity.put("id", log.getId());
                    activity.put("userName", log.getUserName());
                    activity.put("userEmail", log.getUserEmail());
                    activity.put("action", log.getAction());
                    activity.put("details", log.getDetails());
                    activity.put("entityType", log.getEntityType());
                    activity.put("timestamp", log.getCreatedAt());
                    activity.put("source", "ACTIVITY_LOG");
                    activities.add(activity);
                });

        // Recent auth logs
        authLogRepository.findTop20ByOrderByCreatedAtDesc().forEach(log -> {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("id", "auth-" + log.getId());
            activity.put("userName", log.getUserName() != null ? log.getUserName() : log.getUserEmail());
            activity.put("userEmail", log.getUserEmail());
            activity.put("action", log.getAction());
            activity.put("details", log.getDetails());
            activity.put("entityType", "AUTH");
            activity.put("timestamp", log.getCreatedAt());
            activity.put("success", log.isSuccess());
            activity.put("source", "AUTH_LOG");
            activities.add(activity);
        });

        // Recent message logs
        messageLogRepository.findTop20ByOrderByCreatedAtDesc().forEach(log -> {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("id", "msg-" + log.getId());
            activity.put("userName", log.getSenderName());
            activity.put("userEmail", log.getSenderName());
            activity.put("action", log.getAction());
            activity.put("details", "To: " + log.getReceiverName());
            activity.put("entityType", "MESSAGE");
            activity.put("timestamp", log.getCreatedAt());
            activity.put("source", "MESSAGE_LOG");
            activities.add(activity);
        });

        // Recent certificate downloads
        downloadLogRepository.findTop20ByOrderByCreatedAtDesc().forEach(log -> {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("id", "dl-" + log.getId());
            activity.put("userName", log.getDownloadedByName());
            activity.put("userEmail", log.getDownloadedBy());
            activity.put("action", "DOWNLOAD_CERTIFICATE");
            activity.put("details", "Certificate: " + log.getCertificateNumber());
            activity.put("entityType", "CERTIFICATE");
            activity.put("timestamp", log.getCreatedAt());
            activity.put("source", "DOWNLOAD_LOG");
            activities.add(activity);
        });

        // Sort by timestamp descending, take top 30
        activities.sort((a, b) -> {
            Object t1 = a.get("timestamp");
            Object t2 = b.get("timestamp");
            if (t1 == null) return 1;
            if (t2 == null) return -1;
            return t2.toString().compareTo(t1.toString());
        });

        return activities.stream().limit(30).toList();
    }
}
