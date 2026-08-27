package com.church.baptism.service.certificate;

import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.member.MemberRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import com.church.baptism.util.QrCodeGenerator;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CertificateService {

    private final BaptismRepository baptismRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final MemberRepository memberRepository;

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, new BaseColor(0x1a, 0x36, 0x5d));
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new BaseColor(0x1a, 0x36, 0x5d));
    private static final Font HEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BaseColor.BLACK);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK);
    private static final Font SMALL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY);
    private static final Font BOLD_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.BLACK);
    private static final Font GOLD_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new BaseColor(0xc9, 0x96, 0x3a));
    private static final Font SEAL_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new BaseColor(0xc9, 0x96, 0x3a));

    @Value("${app.certificate-storage:uploads/certificates}")
    private String certificateStoragePath;

    @Value("${app.profile-picture-storage:uploads/profile-pictures}")
    private String profilePicturePath;

    public CertificateService(BaptismRepository baptismRepository, UserRepository userRepository,
                               NotificationService notificationService, CandidateRepository candidateRepository,
                               LessonRepository lessonRepository, MemberRepository memberRepository) {
        this.baptismRepository = baptismRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public void signCertificate(Long baptismId, String pastorEmail) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));
        if (!baptism.isBaptized()) {
            throw new RuntimeException("Cannot sign certificate for an unbaptized candidate");
        }
        // Check if candidate has profile picture
        Candidate candidate = baptism.getCandidate();
        if (candidate.getProfilePicturePath() == null || candidate.getProfilePicturePath().isEmpty()) {
            // Send notification to candidate to upload profile picture
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Profile Picture Required",
                    "Please upload a profile picture to complete your certificate processing. Your certificate cannot be signed until a profile picture has been added to your profile.",
                    NotificationType.SYSTEM)
            );
            throw new RuntimeException("This candidate has not uploaded a profile picture. Certificate signing cannot continue until a profile picture has been provided.");
        }
        baptism.setCertificateSigned(true);
        baptism.setSignedAt(LocalDateTime.now());
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.CERTIFICATE_SIGNED);
        baptismRepository.save(baptism);

        try {
            byte[] pdf = generateCertificate(baptismId, pastorEmail);
            String certNumber = baptism.getCertificateNumber() != null ? baptism.getCertificateNumber() : "CERT-" + baptismId;
            Path storageDir = Paths.get(certificateStoragePath).toAbsolutePath();
            Files.createDirectories(storageDir);
            Path filePath = storageDir.resolve(certNumber + ".pdf");
            Files.write(filePath, pdf);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store certificate PDF", e);
        }

        candidate.setStatus(Candidate.CandidateStatus.CERTIFICATE_SIGNED);
        candidateRepository.save(candidate);

        boolean allLessonsCompleted = lessonRepository.findByCandidateId(candidate.getId())
                .stream()
                .allMatch(Lesson::isCompleted);

        if (allLessonsCompleted) {
            candidate.setStatus(Candidate.CandidateStatus.COURSE_COMPLETED);
            candidateRepository.save(candidate);

            Member member = new Member();
            member.setCandidate(candidate);
            member.setBaptismDate(baptism.getBaptismDate());
            member.setLocalChurch(candidate.getChurch() != null
                    ? candidate.getChurch().getChurchName() : null);
            member.setStatus(Member.MemberStatus.ACTIVE);
            memberRepository.save(member);
        }

        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Certificate Signed",
                "Your baptism certificate has been digitally signed. You can now download it.",
                NotificationType.BAPTISM_CERTIFICATE_READY)
        );
    }

    @Transactional
    public BaptismResponse cmsTransfer(Long baptismId) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        Candidate candidate = baptism.getCandidate();

        if (!baptism.isBaptized()) {
            throw new RuntimeException("Candidate must be baptized");
        }
        if (!baptism.isCertificateSigned()) {
            throw new RuntimeException("Certificate must be signed");
        }

        boolean allLessonsCompleted = lessonRepository.findByCandidateId(candidate.getId())
                .stream()
                .allMatch(Lesson::isCompleted);
        if (!allLessonsCompleted) {
            throw new RuntimeException("All lessons must be completed");
        }

        candidate.setStatus(Candidate.CandidateStatus.TRANSFERRED_TO_CMS);
        candidateRepository.save(candidate);
        baptism.setRequestStatus(Baptism.BaptismRequestStatus.TRANSFERRED_TO_CMS);
        baptismRepository.save(baptism);

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
                NotificationType.SYSTEM)
        );

        BaptismResponse r = new BaptismResponse();
        r.id = baptism.getId();
        r.candidateId = candidate.getId();
        r.candidateName = candidate.getFullName();
        r.candidateEmail = candidate.getEmail();
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
        r.profilePicturePath = candidate.getProfilePicturePath();
        return r;
    }

    public List<BaptismResponse> getUnsignedCertificates() {
        return baptismRepository.findByBaptizedTrueAndCertificateSignedFalse()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BaptismResponse> getCertificatesByCandidate(Long candidateId) {
        return baptismRepository.findByCandidateId(candidateId)
                .stream()
                .filter(b -> b.isBaptized())
                .map(this::toResponse)
                .toList();
    }

    public List<BaptismResponse> getAllBaptizedCertificates() {
        return baptismRepository.findByBaptizedTrueOrderByConfirmedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private BaptismResponse toResponse(Baptism b) {
        BaptismResponse r = new BaptismResponse();
        r.id = b.getId();
        r.candidateId = b.getCandidate().getId();
        r.candidateName = b.getCandidate().getFullName();
        r.candidateEmail = b.getCandidate().getEmail();
        r.eventId = b.getEvent() != null ? b.getEvent().getId() : null;
        r.baptismDate = b.getBaptismDate();
        r.location = b.getLocation();
        r.officiatingPastor = b.getOfficiatingPastor();
        r.witnessName = b.getWitnessName();
        r.sponsorName = b.getSponsorName();
        r.baptized = b.isBaptized();
        r.approved = b.isApproved();
        r.certificateNumber = b.getCertificateNumber();
        r.certificateSigned = b.isCertificateSigned();
        r.signedAt = b.getSignedAt();
        r.baptismOrder = b.getBaptismOrder();
        r.photoUrls = b.getPhotoUrls();
        r.confirmedAt = b.getConfirmedAt();
        r.requestStatus = b.getRequestStatus() != null ? b.getRequestStatus().name() : null;
        r.requestedAt = b.getRequestedAt();
        r.profilePicturePath = b.getCandidate().getProfilePicturePath();
        return r;
    }

    public byte[] generateCertificate(Long baptismId) {
        return generateCertificate(baptismId, null);
    }

    public byte[] generateCertificate(Long baptismId, String signerEmail) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            PdfContentByte canvas = writer.getDirectContent();
            addPage1(document, baptism, canvas, signerEmail);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating certificate PDF", e);
        }
    }

    private void addPage1(Document doc, Baptism baptism, PdfContentByte canvas, String signerEmail) throws DocumentException, IOException {
        Candidate candidate = baptism.getCandidate();
        Church church = candidate.getChurch();

        BaseColor bluePrimary = new BaseColor(0x1E, 0x5A, 0xA8); // Deep blue
        BaseColor blueAccent = new BaseColor(0x06, 0xB6, 0xD4);  // Cyan accent
        drawThemedBorder(doc, canvas, bluePrimary, blueAccent);

        float pageWidth = doc.getPageSize().getWidth();
        float pageHeight = doc.getPageSize().getHeight();

        // === HEADER BAR (at very top) ===
        canvas.setColorFill(bluePrimary);
        canvas.rectangle(30, pageHeight - 75, pageWidth - 60, 30);
        canvas.fill();

        Phrase headerText = new Phrase("SEVENTH-DAY ADVENTIST CHURCH", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE));
        ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, headerText, pageWidth / 2, pageHeight - 65, 0);

        // === SDA Logo (below header, left side) ===
        float logoY = pageHeight - 140;
        try {
            Path logoPath = Paths.get("src/main/resources/static/images/sda-logo.png");
            if (!Files.exists(logoPath)) {
                logoPath = Paths.get("src/main/resources/static/images.png");
            }
            if (!Files.exists(logoPath)) {
                logoPath = Paths.get("images.png");
            }
            if (Files.exists(logoPath)) {
                Image logo = Image.getInstance(logoPath.toAbsolutePath().toString());
                logo.scaleToFit(55, 55);
                logo.setAbsolutePosition(45, logoY);
                canvas.addImage(logo);
            }
        } catch (Exception e) {
            // Logo not found
        }

        // === Candidate Photo (below header, right side) ===
        if (candidate.getProfilePicturePath() != null && !candidate.getProfilePicturePath().isEmpty()) {
            try {
                String path = candidate.getProfilePicturePath();
                if (path.startsWith("/api/candidates/profile-pictures/")) {
                    path = path.substring("/api/candidates/profile-pictures/".length());
                }
                Path photoPath = Paths.get(profilePicturePath).toAbsolutePath().resolve(path);
                if (Files.exists(photoPath)) {
                    Image photo = Image.getInstance(photoPath.toAbsolutePath().toString());
                    photo.scaleToFit(55, 55);
                    photo.setAbsolutePosition(pageWidth - 100, logoY);
                    canvas.addImage(photo);

                    // Border around photo
                    canvas.setColorStroke(bluePrimary);
                    canvas.setLineWidth(1.5);
                    canvas.rectangle(pageWidth - 102, logoY - 2, 59, 59);
                    canvas.stroke();
                }
            } catch (Exception e) {
                // Photo not found
            }
        }

        // === ALL CONTENT IN DOCUMENT FLOW (no overlapping) ===
        
        // Spacer after header/logo area
        doc.add(new Chunk("\n\n\n\n"));

        // === Bible Verse (centered) ===
        Paragraph verse = new Paragraph(
            "\"Go ye therefore, and make disciples of all nations,\nbaptizing them in the name of the Father, and of the Son,\nand of the Holy Spirit.\" — Matthew 28:19",
            FontFactory.getFont(FontFactory.TIMES_ROMAN, 10, BaseColor.DARK_GRAY)
        );
        verse.setAlignment(Element.ALIGN_CENTER);
        verse.setSpacingAfter(20);
        doc.add(verse);

        // === Title ===
        Paragraph title = new Paragraph("Certificate of Baptism", FontFactory.getFont(FontFactory.TIMES_ROMAN, 26, bluePrimary));
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8);
        doc.add(title);

        // === Decorative line (via canvas, positioned below title) ===
        // We use a simple line character instead
        Paragraph line = new Paragraph("─────────────────────────", FontFactory.getFont(FontFactory.HELVETICA, 10, blueAccent));
        line.setAlignment(Element.ALIGN_CENTER);
        line.setSpacingAfter(15);
        doc.add(line);

        // === Candidate Name (centered, large) ===
        String fullName = candidate.getFullName() != null ? candidate.getFullName().toUpperCase() : "—";
        Paragraph name = new Paragraph(fullName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, bluePrimary));
        name.setAlignment(Element.ALIGN_CENTER);
        name.setSpacingAfter(5);
        doc.add(name);

        // === Candidate ID ===
        String candidateId = candidate.getId() != null ? "Candidate ID: CAN-" + String.format("%04d", candidate.getId()) : "";
        if (!candidateId.isEmpty()) {
            Paragraph cid = new Paragraph(candidateId, FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.DARK_GRAY));
            cid.setAlignment(Element.ALIGN_CENTER);
            cid.setSpacingAfter(20);
            doc.add(cid);
        }

        // === Program Title ===
        Paragraph program = new Paragraph("Baptism Preparation Program", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, bluePrimary));
        program.setAlignment(Element.ALIGN_CENTER);
        program.setSpacingAfter(15);
        doc.add(program);

        // === Baptism Info ===
        Paragraph harmony = new Paragraph("In harmony with the command of our Lord and Savior Jesus Christ,", FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK));
        harmony.setAlignment(Element.ALIGN_CENTER);
        doc.add(harmony);

        String baptismDateStr = baptism.getBaptismDate() != null
            ? baptism.getBaptismDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
            : "—";
        String baptismLocation = baptism.getLocation() != null ? " at " + baptism.getLocation() : "";
        Paragraph bapInfo = new Paragraph(
            "was baptized by immersion" + baptismLocation + " on the " + baptismDateStr,
            FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK)
        );
        bapInfo.setAlignment(Element.ALIGN_CENTER);
        doc.add(bapInfo);
        doc.add(Chunk.NEWLINE);

        // === Fellowship ===
        Paragraph fellowshipTitle = new Paragraph("RECEIVED INTO CHURCH FELLOWSHIP", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, bluePrimary));
        fellowshipTitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(fellowshipTitle);

        String churchFullName = church != null ? church.getChurchName() : "this church";
        String fellowshipDate = baptism.getBaptismDate() != null
            ? baptism.getBaptismDate().format(DateTimeFormatter.ofPattern("d 'of' MMMM yyyy"))
            : "on —";
        Paragraph fellowship = new Paragraph(
            "by " + churchFullName + " on " + fellowshipDate,
            FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK)
        );
        fellowship.setAlignment(Element.ALIGN_CENTER);
        doc.add(fellowship);
        doc.add(Chunk.NEWLINE);
        doc.add(Chunk.NEWLINE);

        // === Membership Status ===
        Paragraph membershipStatus = new Paragraph("Membership Status: Active Member", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, bluePrimary));
        membershipStatus.setAlignment(Element.ALIGN_CENTER);
        doc.add(membershipStatus);
        doc.add(Chunk.NEWLINE);

        // === Certificate Info ===
        String certNumber = baptism.getCertificateNumber() != null ? baptism.getCertificateNumber() : "—";
        Paragraph certInfo = new Paragraph(
            "Certificate No: " + certNumber,
            FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.DARK_GRAY)
        );
        certInfo.setAlignment(Element.ALIGN_CENTER);
        doc.add(certInfo);

        String issuedOn = baptism.getBaptismDate() != null
            ? baptism.getBaptismDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
            : "—";
        Paragraph issued = new Paragraph(
            "Issued on: " + issuedOn,
            FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.DARK_GRAY)
        );
        issued.setAlignment(Element.ALIGN_CENTER);
        doc.add(issued);
        doc.add(Chunk.NEWLINE);
        doc.add(Chunk.NEWLINE);

        // === QR Code (bottom-right) ===
        if (certNumber != null && !certNumber.equals("—")) {
            try {
                String verifyUrl = "https://church-app.com/verify/" + certNumber;
                byte[] qrBytes = QrCodeGenerator.generateQrCode(verifyUrl, 100, 100);
                Image qrImage = Image.getInstance(qrBytes);
                qrImage.scaleToFit(60, 60);
                float qrX = pageWidth - 100;
                float qrY = 100;
                qrImage.setAbsolutePosition(qrX, qrY);
                canvas.addImage(qrImage);

                Phrase verifyLabel = new Phrase("Scan to verify", FontFactory.getFont(FontFactory.HELVETICA, 7, BaseColor.DARK_GRAY));
                ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, verifyLabel, qrX + 30, qrY - 8, 0);
            } catch (Exception e) {
                // QR code generation failed
            }
        }

        // === SIGNATURE SECTION ===
        float sigY = 190;
        float centerSigX = pageWidth / 2 - 85;

        // Signature line (centered)
        canvas.setColorStroke(BaseColor.BLACK);
        canvas.setLineWidth(0.5);
        canvas.moveTo(centerSigX, sigY);
        canvas.lineTo(centerSigX + 170, sigY);
        canvas.stroke();

        Phrase sigLabel = new Phrase("Head of District", FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY));
        ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, sigLabel, pageWidth / 2, sigY - 15, 0);

        if (baptism.isCertificateSigned()) {
            // Embed the Head of District's actual signature image
            boolean signatureEmbedded = false;
            if (signerEmail != null) {
                try {
                    User signer = userRepository.findByEmail(signerEmail).orElse(null);
                    if (signer != null && signer.getSignaturePath() != null && !signer.getSignaturePath().isEmpty()) {
                        Path sigPath = Paths.get(signer.getSignaturePath());
                        if (Files.exists(sigPath)) {
                            Image sigImage = Image.getInstance(sigPath.toAbsolutePath().toString());
                            sigImage.scaleToFit(120, 35);
                            float sigXPos = pageWidth / 2 - 60;
                            float sigYPos = sigY + 5;
                            sigImage.setAbsolutePosition(sigXPos, sigYPos);
                            canvas.addImage(sigImage);
                            signatureEmbedded = true;
                        }
                    }
                } catch (Exception e) {
                    // Signature embedding failed
                }
            }

            // Signer name and title
            if (signerEmail != null) {
                User signer = userRepository.findByEmail(signerEmail).orElse(null);
                if (signer != null) {
                    String signerName = signer.getFullName() != null ? signer.getFullName() : signer.getEmail();
                    Phrase signerNamePhrase = new Phrase(signerName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK));
                    ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, signerNamePhrase, pageWidth / 2, sigY - 30, 0);

                    Phrase signerTitle = new Phrase("Head of District", FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY));
                    ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, signerTitle, pageWidth / 2, sigY - 42, 0);
                }
            }

            Phrase signedDate = new Phrase("Signed: " + (baptism.getSignedAt() != null
                ? baptism.getSignedAt().format(DateTimeFormatter.ofPattern("MMM d, yyyy"))
                : ""), FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.DARK_GRAY));
            ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, signedDate, pageWidth / 2, sigY - 54, 0);
        } else {
            Phrase pending = new Phrase("Pending Signature", FontFactory.getFont(FontFactory.HELVETICA, 8, bluePrimary));
            ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, pending, pageWidth / 2, sigY - 30, 0);
        }
    }

    private void drawThemedBorder(Document doc, PdfContentByte canvas, BaseColor primary, BaseColor accent) {
        float pageWidth = doc.getPageSize().getWidth();
        float pageHeight = doc.getPageSize().getHeight();

        canvas.setColorStroke(primary);
        canvas.setLineWidth(2);
        canvas.rectangle(30, 30, pageWidth - 60, pageHeight - 60);
        canvas.stroke();

        canvas.setColorStroke(accent);
        canvas.setLineWidth(0.5);
        canvas.rectangle(40, 40, pageWidth - 80, pageHeight - 80);
        canvas.stroke();
    }

    public List<BaptismResponse> getBaptismWithCertificateStatus(Long candidateId) {
        return baptismRepository.findByCandidateId(candidateId)
                .stream()
                .filter(b -> b.isBaptized())
                .map(this::toResponse)
                .toList();
    }
}
