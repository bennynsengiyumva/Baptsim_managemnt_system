package com.church.baptism.service.baptism;

import com.church.baptism.dto.request.BaptismEventRequest;
import com.church.baptism.dto.request.BaptismRegistrationRequest;
import com.church.baptism.dto.response.BaptismEventResponse;
import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.baptism.BaptismEvent;
import com.church.baptism.entity.baptism.BaptismEvent.BaptismEventStatus;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.candidate.Candidate.CandidateStatus;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismEventRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.member.MemberRepository;
import com.church.baptism.repository.user.UserRepository;
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
    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public BaptismService(
            BaptismRepository baptismRepository,
            BaptismEventRepository eventRepository,
            CandidateRepository candidateRepository,
            LessonRepository lessonRepository,
            MemberRepository memberRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService,
            UserRepository userRepository
    ) {
        this.baptismRepository = baptismRepository;
        this.eventRepository = eventRepository;
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.memberRepository = memberRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // ===================== EVENT MANAGEMENT =====================

    @Transactional
    public BaptismEventResponse createEvent(BaptismEventRequest request) {
        BaptismEvent event = new BaptismEvent();
        event.setEventDate(request.eventDate);
        event.setLocation(request.location);
        event.setOfficiatingPastor(request.officiatingPastor);
        event.setDescription(request.description);
        event.setStatus(BaptismEventStatus.PLANNED);
        eventRepository.save(event);

        // Notify all CANDIDATE users about the new event
        List<User> candidates = userRepository.findByRole(Role.CANDIDATE);
        for (User u : candidates) {
            notificationService.sendToUser(u.getId(),
                "New Baptism Event Available",
                "A baptism event has been scheduled for " + request.eventDate
                    + " at " + request.location + ". Register now!",
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
        return eventRepository.findByEventDateAfterOrderByEventDateAsc(LocalDate.now())
                .stream()
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
        return mapEventToResponse(event);
    }

    // ===================== CANDIDATE REGISTRATION =====================

    @Transactional
    public BaptismResponse registerCandidate(BaptismRegistrationRequest request) {
        BaptismEvent event = eventRepository.findById(request.eventId)
                .orElseThrow(() -> new RuntimeException("Baptism event not found"));

        Candidate candidate = candidateRepository.findById(request.candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        // Candidate can register at ANY stage
        if (baptismRepository.existsByCandidateIdAndBaptizedTrue(request.candidateId)) {
            throw new RuntimeException("Candidate already baptized");
        }

        // Check not already registered for this event
        boolean alreadyRegistered = event.getRegistrations().stream()
                .anyMatch(b -> b.getCandidate().getId().equals(candidate.getId()));
        if (alreadyRegistered) {
            throw new RuntimeException("Candidate already registered for this event");
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
        baptism.setCandidate(candidate);
        baptism.setEvent(event);

        event.getRegistrations().add(baptism);
        eventRepository.save(event);

        // Notify candidate about registration
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Registration Confirmed",
                "You have been registered for the baptism event on "
                    + event.getEventDate() + " at " + event.getLocation(),
                NotificationType.BAPTISM_REGISTERED)
        );

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
        baptismRepository.save(baptism);

        // Notify candidate
        Candidate candidate = baptism.getCandidate();
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Registration Approved",
                "Your baptism registration has been approved for the event on "
                    + baptism.getBaptismDate() + " at " + baptism.getLocation(),
                NotificationType.BAPTISM_APPROVAL)
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

        // Check if all lessons completed → auto-create member
        boolean allLessonsCompleted = lessonRepository.findByCandidateId(candidate.getId())
                .stream()
                .allMatch(l -> l.isCompleted());

        if (allLessonsCompleted) {
            Member member = new Member();
            member.setCandidate(candidate);
            member.setBaptismDate(baptism.getBaptismDate());
            member.setLocalChurch(candidate.getChurch() != null
                    ? candidate.getChurch().getChurchName() : null);
            member.setStatus(Member.MemberStatus.ACTIVE);
            memberRepository.save(member);
        }

        baptismRepository.save(baptism);
        candidateRepository.save(candidate);

        // Notify candidate that their certificate is ready
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Baptism Certificate Ready",
                "Your baptism has been confirmed! You can now download your certificate (No: "
                    + baptism.getCertificateNumber() + ").",
                NotificationType.BAPTISM_CERTIFICATE_READY)
        );

        return mapToBaptismResponse(baptism);
    }

    @Transactional
    public void updateBaptismOrder(Long baptismId, int newOrder) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));
        baptism.setBaptismOrder(newOrder);
        baptismRepository.save(baptism);
    }

    // ===================== HISTORY & EXPORT =====================

    public List<BaptismResponse> getAllBaptisms() {
        return baptismRepository.findAll()
                .stream()
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

    // ===================== MAPPER =====================

    private BaptismEventResponse mapEventToResponse(BaptismEvent event) {
        BaptismEventResponse r = new BaptismEventResponse();
        r.id = event.getId();
        r.eventDate = event.getEventDate();
        r.location = event.getLocation();
        r.officiatingPastor = event.getOfficiatingPastor();
        r.description = event.getDescription();
        r.status = event.getStatus().name();

        List<Baptism> registrations = event.getRegistrations() != null
                ? event.getRegistrations() : new ArrayList<>();
        r.registeredCount = registrations.size();
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
        return r;
    }
}
