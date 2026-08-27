package com.church.baptism.service.baptism;

import com.church.baptism.dto.request.BaptismEventRequest;
import com.church.baptism.dto.request.BaptismRegistrationRequest;
import com.church.baptism.dto.response.BaptismEventResponse;
import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.baptism.BaptismEvent;
import com.church.baptism.entity.baptism.BaptismEvent.BaptismEventStatus;
import com.church.baptism.entity.baptism.BaptismRequestLog;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.candidate.Candidate.CandidateStatus;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismEventRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.baptism.BaptismRequestLogRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.member.MemberRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.auth.EmailService;
import com.church.baptism.service.file.FileStorageService;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BaptismService {

    private final BaptismRepository baptismRepository;
    private final BaptismEventRepository eventRepository;
    private final BaptismRequestLogRepository auditLogRepository;
    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public BaptismService(
            BaptismRepository baptismRepository,
            BaptismEventRepository eventRepository,
            BaptismRequestLogRepository auditLogRepository,
            CandidateRepository candidateRepository,
            LessonRepository lessonRepository,
            MemberRepository memberRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService,
            EmailService emailService,
            UserRepository userRepository
    ) {
        this.baptismRepository = baptismRepository;
        this.eventRepository = eventRepository;
        this.auditLogRepository = auditLogRepository;
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.memberRepository = memberRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    // ===================== EVENT MANAGEMENT =====================

    @Transactional
    public BaptismEventResponse createEvent(BaptismEventRequest request) {
        BaptismEvent event = new BaptismEvent();
        event.setEventName(request.eventName);
        event.setEventDate(request.eventDate);
        event.setEventTime(request.eventTime);
        event.setLocation(request.location);
        event.setOfficiatingPastor(request.officiatingPastor);
        event.setDescription(request.description);
        event.setStatus(BaptismEventStatus.PLANNED);
        eventRepository.save(event);

        // Notify all CANDIDATE users about the new event (email limited to same district/field)
        List<User> candidates = userRepository.findByRole(Role.CANDIDATE);
        for (User u : candidates) {
            notificationService.sendToUserInSameOrg(u.getId(), null, null,
                "New Baptism Event Available",
                request.eventName + " has been scheduled for " + request.eventDate
                    + " at " + request.location + ". Register now!",
                NotificationType.BAPTISM_EVENT_AVAILABLE);
        }

        // Notify ALL leadership roles about the new event (email limited to same district/field)
        List<User> leaders = new ArrayList<>();
        leaders.addAll(userRepository.findByRole(Role.HEAD_OF_DISTRICT));
        leaders.addAll(userRepository.findByRole(Role.HEAD_OF_FIELD));
        leaders.addAll(userRepository.findByRole(Role.HEAD_OF_RUM));
        leaders.addAll(userRepository.findByRole(Role.PASTOR));
        leaders.addAll(userRepository.findByRole(Role.FIRST_CHURCH_ELDER));
        leaders.addAll(userRepository.findByRole(Role.INSTRUCTOR));
        for (User u : leaders) {
            notificationService.sendToUserInSameOrg(u.getId(), null, null,
                "New Baptism Event Created",
                request.eventName + " has been scheduled for " + request.eventDate
                    + " at " + request.location + " by " + request.officiatingPastor + ".",
                NotificationType.BAPTISM_EVENT_AVAILABLE);
        }

        return mapEventToResponse(event);
    }

    public List<BaptismEventResponse> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateDesc()
                .stream()
                .map(this::mapEventToResponse)
                .collect(Collectors.toList());
    }

    public List<BaptismEventResponse> getUpcomingEvents() {
        return eventRepository.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now())
                .stream()
                .filter(e -> e.getStatus() != BaptismEventStatus.CANCELLED)
                .map(this::mapEventToResponse)
                .collect(Collectors.toList());
    }

    public BaptismEventResponse getEventById(Long eventId) {
        BaptismEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));
        return mapEventToResponse(event);
    }

    @Transactional
    public BaptismEventResponse updateEventStatus(Long eventId, String status) {
        BaptismEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));
        event.setStatus(BaptismEventStatus.valueOf(status));
        eventRepository.save(event);

        // Notify all relevant users about event status change (email limited to same district/field)
        String statusMsg = status.charAt(0) + status.substring(1).toLowerCase();
        List<User> allUsers = new ArrayList<>();
        allUsers.addAll(userRepository.findByRole(Role.CANDIDATE));
        allUsers.addAll(userRepository.findByRole(Role.HEAD_OF_DISTRICT));
        allUsers.addAll(userRepository.findByRole(Role.HEAD_OF_FIELD));
        allUsers.addAll(userRepository.findByRole(Role.HEAD_OF_RUM));
        allUsers.addAll(userRepository.findByRole(Role.PASTOR));
        allUsers.addAll(userRepository.findByRole(Role.FIRST_CHURCH_ELDER));
        for (User u : allUsers) {
            notificationService.sendToUserInSameOrg(u.getId(), null, null,
                "Baptism Event " + statusMsg,
                "The baptism event on " + event.getEventDate() + " at " + event.getLocation()
                    + " has been " + status.toLowerCase() + ".",
                NotificationType.BAPTISM_EVENT_AVAILABLE);
        }

        return mapEventToResponse(event);
    }

    // ===================== CANDIDATE REGISTRATION (Request Baptism) =====================

    @Transactional
    public BaptismResponse registerCandidate(BaptismRegistrationRequest request) {
        BaptismEvent event = eventRepository.findById(request.eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));

        Candidate candidate = candidateRepository.findById(request.candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        // Candidate can register at ANY stage (no lesson completion required)
        if (baptismRepository.existsByCandidateIdAndBaptizedTrue(request.candidateId)) {
            throw new RuntimeException("Candidate already baptized");
        }

        // Check not already registered for this event (any active status)
        boolean alreadyRegistered = event.getRegistrations().stream()
                .anyMatch(b -> b.getCandidate().getId().equals(candidate.getId())
                    && b.getRequestStatus() != null
                    && b.getRequestStatus() != Baptism.BaptismRequestStatus.REJECTED);
        if (alreadyRegistered) {
            throw new RuntimeException("You have already submitted a request for this baptism event");
        }

        int nextOrder = event.getRegistrations().size() + 1;

        Baptism baptism = new Baptism();
        baptism.setBaptismDate(event.getEventDate());
        baptism.setLocation(event.getLocation());
        baptism.setOfficiatingPastor(event.getOfficiatingPastor());
        baptism.setWitnessName(request.witnessName);
        baptism.setSponsorName(request.sponsorName);
        baptism.setBaptismOrder(nextOrder);
        baptism.setCertificateNumber("BAPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        baptism.setBaptized(false);
        baptism.setApproved(false);
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.PENDING);
        baptism.setRequestedAt(LocalDateTime.now());
        baptism.setCandidate(candidate);
        baptism.setEvent(event);

        // Update candidate status
        candidate.setStatus(CandidateStatus.BAPTISM_REQUEST_PENDING);
        candidateRepository.save(candidate);

        event.getRegistrations().add(baptism);
        eventRepository.save(event);

        // Audit log
        auditLogRepository.save(new BaptismRequestLog(
            baptism.getId(), candidate.getId(), event.getId(),
            BaptismRequestLog.Action.REQUEST_CREATED.name(),
            candidate.getEmail(),
            "Baptism request created for " + event.getEventName()
        ));

        // Notify candidate about registration
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Request Submitted",
                "Your baptism request has been submitted for " + event.getEventName()
                    + " on " + event.getEventDate() + " at " + event.getLocation()
                    + ". Awaiting approval from your First Church Elder.",
                NotificationType.BAPTISM_REGISTERED)
        );

        // Notify FCE that a new request needs approval (email limited to same district/field)
        List<User> approvers = new ArrayList<>();
        approvers.addAll(userRepository.findByRole(Role.FIRST_CHURCH_ELDER));
        approvers.addAll(userRepository.findByRole(Role.PASTOR));
        approvers.addAll(userRepository.findByRole(Role.HEAD_OF_DISTRICT));
        for (User u : approvers) {
            notificationService.sendToUserInSameOrg(u.getId(),
                candidate.getChurch() != null ? candidate.getChurch().getDistrict() : null,
                candidate.getChurch() != null && candidate.getChurch().getDistrict() != null ? candidate.getChurch().getDistrict().getField() : null,
                "New Baptism Request Pending Approval",
                candidate.getFullName() + " has requested baptism for " + event.getEventName()
                    + " on " + event.getEventDate() + " at " + event.getLocation()
                    + ". Please review and approve.",
                NotificationType.BAPTISM_REGISTERED);
        }

        return mapToBaptismResponse(baptism);
    }

    @Transactional
    public void unregisterCandidate(Long baptismId) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));
        if (baptism.isBaptized()) {
            throw new RuntimeException("Cannot unregister a baptized candidate");
        }
        baptismRepository.delete(baptism);
    }

    // ===================== APPROVE REGISTRATION =====================

    @Transactional
    public BaptismResponse approveRegistration(Long eventId, Long candidateId) {
        BaptismEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));
        Baptism baptism = event.getRegistrations().stream()
                .filter(b -> b.getCandidate().getId().equals(candidateId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Registration not found for this candidate and event"));
        baptism.setApproved(true);
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.APPROVED);
        baptismRepository.save(baptism);

        // Update candidate status to APPROVED_FOR_BAPTISM
        Candidate candidate = baptism.getCandidate();
        candidate.setStatus(CandidateStatus.APPROVED_FOR_BAPTISM);
        candidateRepository.save(candidate);

        // Audit log
        auditLogRepository.save(new BaptismRequestLog(
            baptism.getId(), candidate.getId(), event.getId(),
            BaptismRequestLog.Action.REQUEST_APPROVED.name(),
            "System",
            "Baptism request approved for " + event.getEventName()
        ));

        // Send approval email
        emailService.sendNotification(candidate.getEmail(),
            "Baptism Request Approved",
            "Dear " + candidate.getFullName() + ",\n\n" +
            "Your baptism request for the event:\n\n" +
            "**" + event.getEventName() + "**\n" +
            "Date: " + baptism.getBaptismDate() + "\n" +
            "Location: " + baptism.getLocation() + "\n\n" +
            "has been **approved**.\n\n" +
            "Please continue preparing spiritually and attend the baptism ceremony.\n\n" +
            "God bless you."
        );
        auditLogRepository.save(new BaptismRequestLog(
            baptism.getId(), candidate.getId(), event.getId(),
            BaptismRequestLog.Action.EMAIL_SENT.name(),
            "System",
            "Approval email sent to " + candidate.getEmail()
        ));

        // Notify candidate
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Request Approved",
                "Your baptism request has been approved for " + event.getEventName()
                    + " on " + baptism.getBaptismDate() + " at " + baptism.getLocation()
                    + ". Please attend the baptism ceremony.",
                NotificationType.BAPTISM_APPROVAL)
        );

        // Notify HeadOfDistrict and Pastor about the approval (email limited to same district/field)
        List<User> leaders = new ArrayList<>();
        leaders.addAll(userRepository.findByRole(Role.HEAD_OF_DISTRICT));
        leaders.addAll(userRepository.findByRole(Role.PASTOR));
        for (User u : leaders) {
            notificationService.sendToUserInSameOrg(u.getId(),
                candidate.getChurch() != null ? candidate.getChurch().getDistrict() : null,
                candidate.getChurch() != null && candidate.getChurch().getDistrict() != null ? candidate.getChurch().getDistrict().getField() : null,
                "Registration Approved",
                candidate.getFullName() + "'s baptism registration has been approved for "
                    + event.getEventName() + " on " + baptism.getBaptismDate()
                    + " at " + baptism.getLocation() + ".",
                NotificationType.BAPTISM_APPROVAL);
        }

        return mapToBaptismResponse(baptism);
    }

    // ===================== REJECT REGISTRATION =====================

    @Transactional
    public BaptismResponse rejectRegistration(Long eventId, Long candidateId) {
        BaptismEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));
        Baptism baptism = event.getRegistrations().stream()
                .filter(b -> b.getCandidate().getId().equals(candidateId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Registration not found for this candidate and event"));
        baptism.setApproved(false);
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.REJECTED);
        baptismRepository.save(baptism);

        // Update candidate status back to IN_PROGRESS
        Candidate candidate = baptism.getCandidate();
        candidate.setStatus(CandidateStatus.IN_PROGRESS);
        candidateRepository.save(candidate);

        // Audit log
        auditLogRepository.save(new BaptismRequestLog(
            baptism.getId(), candidate.getId(), event.getId(),
            BaptismRequestLog.Action.REQUEST_REJECTED.name(),
            "System",
            "Baptism request rejected for " + event.getEventName()
        ));

        // Send rejection email
        emailService.sendNotification(candidate.getEmail(),
            "Baptism Request Update",
            "Dear " + candidate.getFullName() + ",\n\n" +
            "Your baptism request for:\n\n" +
            "**" + event.getEventName() + "**\n\n" +
            "has not been approved at this time.\n\n" +
            "Please contact your instructor or church elder for additional guidance.\n\n" +
            "God bless you."
        );
        auditLogRepository.save(new BaptismRequestLog(
            baptism.getId(), candidate.getId(), event.getId(),
            BaptismRequestLog.Action.EMAIL_SENT.name(),
            "System",
            "Rejection email sent to " + candidate.getEmail()
        ));

        // Notify candidate
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Request Rejected",
                "Your baptism request for " + event.getEventName() + " has been declined. "
                    + "Please contact your First Church Elder for more information.",
                NotificationType.BAPTISM_REGISTERED)
        );

        return mapToBaptismResponse(baptism);
    }

    // ===================== CONFIRM BAPTISM =====================

    @Transactional
    public BaptismResponse confirmBaptism(Long baptismId, List<MultipartFile> photos) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        baptism.setBaptized(true);
        baptism.setApproved(true);
        baptism.setConfirmedAt(LocalDateTime.now());
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.BAPTIZED);

        // Upload photos
        if (photos != null && !photos.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile photo : photos) {
                if (!photo.isEmpty()) {
                    urls.add(fileStorageService.uploadFile(photo));
                }
            }
            baptism.setPhotoUrls(urls);
        }

        Candidate candidate = baptism.getCandidate();
        candidate.setStatus(CandidateStatus.BAPTIZED);
        candidate.setBaptismDate(baptism.getBaptismDate());
        candidateRepository.save(candidate);

        // Auto-generate certificate (set status to CERTIFICATE_GENERATED)
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.CERTIFICATE_GENERATED);

        baptismRepository.save(baptism);
        candidateRepository.save(candidate);

        // Warn candidate if they have no profile photo (certificate cannot be signed without it)
        if (candidate.getProfilePicturePath() == null || candidate.getProfilePicturePath().isEmpty()) {
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Profile Photo Required",
                    "Your baptism has been recorded and your certificate (number: "
                        + baptism.getCertificateNumber()
                        + ") is ready for signing. However, you must upload a profile photo before the Head of District can sign your certificate. "
                        + "Please go to your profile and add a photo now.",
                    NotificationType.SYSTEM)
            );
        }

        // Notify candidate that their certificate is ready for signing
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Recorded - Certificate Generated",
                "Your baptism has been recorded! Certificate number: "
                    + baptism.getCertificateNumber()
                    + ". Awaiting pastor's signature.",
                NotificationType.BAPTISM_CERTIFICATE_READY)
        );

        // Notify leadership about the baptism confirmation (email limited to same district/field)
        List<User> leaders = new ArrayList<>();
        leaders.addAll(userRepository.findByRole(Role.HEAD_OF_DISTRICT));
        leaders.addAll(userRepository.findByRole(Role.PASTOR));
        leaders.addAll(userRepository.findByRole(Role.FIRST_CHURCH_ELDER));
        for (User u : leaders) {
            notificationService.sendToUserInSameOrg(u.getId(),
                candidate.getChurch() != null ? candidate.getChurch().getDistrict() : null,
                candidate.getChurch() != null && candidate.getChurch().getDistrict() != null ? candidate.getChurch().getDistrict().getField() : null,
                "Baptism Confirmed",
                candidate.getFullName() + " has been baptized on " + baptism.getBaptismDate()
                    + ". Certificate number: " + baptism.getCertificateNumber()
                    + ". Please sign the certificate.",
                NotificationType.BAPTISM_CERTIFICATE_READY);
        }

        return mapToBaptismResponse(baptism);
    }

    @Transactional
    public void updateBaptismOrder(Long baptismId, int newOrder) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));
        baptism.setBaptismOrder(newOrder);
        baptismRepository.save(baptism);
    }

    // ===================== CMS TRANSFER =====================

    @Transactional
    public BaptismResponse cmsTransfer(Long baptismId) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        Candidate candidate = baptism.getCandidate();

        // Verify all requirements met
        if (!baptism.isBaptized()) {
            throw new RuntimeException("Candidate must be baptized");
        }
        if (!baptism.isCertificateSigned()) {
            throw new RuntimeException("Certificate must be signed");
        }

        boolean allLessonsCompleted = lessonRepository.findByCandidateId(candidate.getId())
                .stream()
                .allMatch(l -> l.isCompleted());
        if (!allLessonsCompleted) {
            throw new RuntimeException("All lessons must be completed");
        }

        // Transfer to CMS
        candidate.setStatus(CandidateStatus.TRANSFERRED_TO_CMS);
        candidateRepository.save(candidate);
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.TRANSFERRED_TO_CMS);
        baptismRepository.save(baptism);

        // Create member
        Member member = new Member();
        member.setCandidate(candidate);
        member.setBaptismDate(baptism.getBaptismDate());
        member.setLocalChurch(candidate.getChurch() != null
                ? candidate.getChurch().getChurchName() : null);
        member.setStatus(Member.MemberStatus.ACTIVE);
        memberRepository.save(member);

        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Transferred to Church Membership",
                "Your record has been transferred to the Church Membership System. Welcome!",
                com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
        );

        return mapToBaptismResponse(baptism);
    }

    // ===================== HISTORY & EXPORT =====================

    public List<BaptismResponse> getAllBaptisms() {
        return baptismRepository.findAll()
                .stream()
                .map(this::mapToBaptismResponse)
                .collect(Collectors.toList());
    }

    public List<BaptismResponse> getPendingRequests() {
        return baptismRepository.findAll()
                .stream()
                .filter(b -> b.getRequestStatus() == Baptism.BaptismRequestStatus.PENDING)
                .map(this::mapToBaptismResponse)
                .collect(Collectors.toList());
    }

    public List<BaptismResponse> getBaptismsByCandidate(Long candidateId) {
        return baptismRepository.findByCandidateId(candidateId)
                .stream()
                .map(this::mapToBaptismResponse)
                .collect(Collectors.toList());
    }

    public List<BaptismResponse> getBaptizedCandidates() {
        return baptismRepository.findAll()
                .stream()
                .filter(Baptism::isBaptized)
                .map(this::mapToBaptismResponse)
                .collect(Collectors.toList());
    }

    public String exportBaptismRecords() {
        List<Baptism> baptized = baptismRepository.findAll()
                .stream()
                .filter(Baptism::isBaptized)
                .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder();
        csv.append("Certificate No,Candidate Name,Date,Location,Pastor,Witness,Sponsor,Order\n");
        for (Baptism b : baptized) {
            csv.append(b.getCertificateNumber()).append(",");
            csv.append(b.getCandidate().getFullName()).append(",");
            csv.append(b.getBaptismDate()).append(",");
            csv.append(b.getLocation()).append(",");
            csv.append(b.getOfficiatingPastor()).append(",");
            csv.append(b.getWitnessName() != null ? b.getWitnessName() : "").append(",");
            csv.append(b.getSponsorName() != null ? b.getSponsorName() : "").append(",");
            csv.append(b.getBaptismOrder()).append("\n");
        }
        return csv.toString();
    }

    // ===================== AUDIT LOGS =====================

    public List<BaptismRequestLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    // ===================== MAPPER =====================

    private BaptismEventResponse mapEventToResponse(BaptismEvent event) {
        BaptismEventResponse r = new BaptismEventResponse();
        r.id = event.getId();
        r.eventName = event.getEventName();
        r.eventDate = event.getEventDate();
        r.eventTime = event.getEventTime();
        r.location = event.getLocation();
        r.officiatingPastor = event.getOfficiatingPastor();
        r.description = event.getDescription();
        r.status = event.getStatus().name();
        r.createdAt = event.getCreatedAt();

        List<Baptism> registrations = event.getRegistrations() != null
                ? event.getRegistrations() : new ArrayList<>();
        r.registeredCount = registrations.size();
        r.approvedCount = (int) registrations.stream()
                .filter(b -> b.getRequestStatus() == Baptism.BaptismRequestStatus.APPROVED
                        || b.getRequestStatus() == Baptism.BaptismRequestStatus.BAPTIZED
                        || b.getRequestStatus() == Baptism.BaptismRequestStatus.CERTIFICATE_GENERATED
                        || b.getRequestStatus() == Baptism.BaptismRequestStatus.CERTIFICATE_SIGNED
                        || b.getRequestStatus() == Baptism.BaptismRequestStatus.TRANSFERRED_TO_CMS)
                .count();
        r.pendingCount = (int) registrations.stream()
                .filter(b -> b.getRequestStatus() == Baptism.BaptismRequestStatus.PENDING)
                .count();
        r.rejectedCount = (int) registrations.stream()
                .filter(b -> b.getRequestStatus() == Baptism.BaptismRequestStatus.REJECTED)
                .count();
        r.baptizedCount = (int) registrations.stream().filter(Baptism::isBaptized).count();
        r.registrations = registrations.stream()
                .map(this::mapToBaptismResponse)
                .collect(Collectors.toList());

        return r;
    }

    private BaptismResponse mapToBaptismResponse(Baptism baptism) {
        BaptismResponse r = new BaptismResponse();
        r.id = baptism.getId();
        r.candidateId = baptism.getCandidate().getId();
        r.candidateName = baptism.getCandidate().getFullName();
        r.candidateEmail = baptism.getCandidate().getEmail();
        r.eventId = baptism.getEvent() != null ? baptism.getEvent().getId() : null;
        r.baptismDate = baptism.getBaptismDate();
        r.location = baptism.getLocation();
        r.officiatingPastor = baptism.getOfficiatingPastor();
        r.witnessName = baptism.getWitnessName();
        r.sponsorName = baptism.getSponsorName();
        r.baptized = baptism.isBaptized();
        r.approved = baptism.isApproved();
        r.certificateNumber = baptism.getCertificateNumber();
        r.certificateSigned = baptism.isCertificateSigned();
        r.signedAt = baptism.getSignedAt();
        r.baptismOrder = baptism.getBaptismOrder();
        r.photoUrls = baptism.getPhotoUrls();
        r.confirmedAt = baptism.getConfirmedAt();
        r.requestStatus = baptism.getRequestStatus() != null ? baptism.getRequestStatus().name() : null;
        r.requestedAt = baptism.getRequestedAt();
        return r;
    }
}
