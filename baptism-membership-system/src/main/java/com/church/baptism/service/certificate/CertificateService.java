package com.church.baptism.service.certificate;

import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CertificateService {

    private final BaptismRepository baptismRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, BaseColor.BLACK);
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK);
    private static final Font HEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BaseColor.BLACK);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK);
    private static final Font SMALL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
    private static final Font BOLD_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.BLACK);

    private static final String[] FUNDAMENTAL_BELIEFS = {
        "1. The Holy Scriptures: The Holy Scriptures are the written Word of God, given by divine inspiration.",
        "2. The Trinity: There is one God: Father, Son, and Holy Spirit, a unity of three coeternal Persons.",
        "3. The Father: God the Father is the Creator, Sustainer, and Sovereign of all creation.",
        "4. The Son: God the Son became incarnate in Jesus Christ to reveal God and redeem humanity.",
        "5. The Holy Spirit: God the Holy Spirit draws and convicts, regenerates and empowers.",
        "6. Creation: God created the heavens and the earth in six literal days.",
        "7. The Nature of Humanity: Humans were created in the image of God with free will.",
        "8. The Great Controversy: A cosmic conflict between Christ and Satan is being played out on earth.",
        "9. The Life, Death, and Resurrection of Christ: Christ's atoning death provides salvation for all.",
        "10. The Experience of Salvation: Salvation is by grace through faith in Christ alone.",
        "11. Growing in Christ: Believers grow in Christ through the power of the Holy Spirit.",
        "12. The Church: The church is the body of Christ called to worship and witness.",
        "13. The Remnant and Its Mission: The remnant church proclaims God's end-time message.",
        "14. Unity in the Body of Christ: The church manifests unity in diversity through Christ.",
        "15. Baptism: Baptism is by immersion and symbolizes death to sin and new life in Christ.",
        "16. The Lord's Supper: The Lord's Supper is a communion service of bread and wine.",
        "17. Spiritual Gifts and Ministries: The Holy Spirit gives spiritual gifts to all believers.",
        "18. The Gift of Prophecy: The gift of prophecy is manifest in the writings of Ellen G. White.",
        "19. The Law of God: The Ten Commandments are the transcript of God's character.",
        "20. The Sabbath: The seventh-day Sabbath is a holy day of rest and worship.",
        "21. Stewardship: God entrusts us with time, talents, and resources to manage faithfully.",
        "22. Christian Behavior: Christians are called to live lives of holiness and integrity.",
        "23. Marriage and the Family: Marriage is a divine institution between a man and a woman.",
        "24. Christ's Ministry in the Heavenly Sanctuary: Christ ministers as High Priest in heaven.",
        "25. The Second Coming of Christ: Jesus will return visibly and triumphantly.",
        "26. Death and Resurrection: Death is a sleep; resurrection is the hope of the believer.",
        "27. The Millennium and the End of Sin: The millennium is Christ's reign with the redeemed.",
        "28. The New Earth: God will create a new earth where righteousness dwells forever."
    };

    private static final String[] BAPTISMAL_VOWS = {
        "1. Do you believe there is one God: Father, Son, and Holy Spirit, a unity of three coeternal Persons?",
        "2. Do you accept the death of Jesus Christ on Calvary as the atoning sacrifice for your sins and believe that by God's grace through faith in His shed blood you are saved from sin and its penalty?",
        "3. Do you accept Jesus Christ as your Lord and personal Savior, believing that God, in Christ, has forgiven your sins and given you a new heart, and do you renounce the sinful ways of the world?",
        "4. Do you accept by faith the righteousness of Christ, your Intercessor in the heavenly sanctuary, and accept His promise of transforming grace and power to live a loving, Christ-centered life in your home and before the world?",
        "5. Do you believe that the Bible is God's inspired Word, the only rule of faith and practice for the Christian? Do you covenant to spend time regularly in prayer and Bible study?",
        "6. Do you accept the Ten Commandments as a transcript of the character of God and a revelation of His will? Is it your purpose by the power of the indwelling Christ to keep this law, including the fourth commandment, which requires the observance of the seventh day of the week as the Sabbath of the Lord and the memorial of Creation?",
        "7. Do you look forward to the soon coming of Jesus and the blessed hope, when \"this mortal shall put on immortality\"? As you prepare to meet the Lord, will you witness to His loving salvation by using your talents in personal soul-winning endeavor to help others to be ready for His glorious appearing?",
        "8. Do you accept the biblical teaching of spiritual gifts and believe that the gift of prophecy is one of the identifying marks of the remnant church?",
        "9. Do you believe in Church organization? Is it your purpose to worship God and to support the Church through your tithes and offerings and by your personal effort and influence?",
        "10. Do you believe that your body is the temple of the Holy Spirit; and will you honor God by caring for it, avoiding the use of that which is harmful, and abstaining from all unclean foods; from the use, manufacture, or sale of alcoholic beverages; from the use, manufacture, or sale of tobacco in any of its forms for human consumption; and from the misuse of or trafficking in narcotics or other drugs?",
        "11. Do you know and understand the fundamental Bible principles as taught by the Seventh-day Adventist Church? Do you purpose, by the grace of God, to fulfill His will by ordering your life in harmony with these principles?",
        "12. Do you accept the New Testament teaching of baptism by immersion and desire to be so baptized as a public expression of faith in Christ and His forgiveness of your sins?",
        "13. Do you accept and believe that the Seventh-day Adventist Church is the remnant church of Bible prophecy and that people of every nation, race, and language are invited and accepted into its fellowship? Do you desire to be a member of this local congregation of the world Church?"
    };

    public CertificateService(BaptismRepository baptismRepository, UserRepository userRepository, NotificationService notificationService) {
        this.baptismRepository = baptismRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void signCertificate(Long baptismId, String pastorEmail) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));
        if (!baptism.isBaptized()) {
            throw new RuntimeException("Cannot sign certificate for an unbaptized candidate");
        }
        baptism.setCertificateSigned(true);
        baptism.setSignedAt(LocalDateTime.now());
        baptismRepository.save(baptism);

        Candidate candidate = baptism.getCandidate();
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Certificate Signed",
                "Your baptism certificate has been digitally signed by the pastor. You can now download it.",
                NotificationType.BAPTISM_CERTIFICATE_READY)
        );
    }

    public List<BaptismResponse> getUnsignedCertificates() {
        return baptismRepository.findByBaptizedTrueAndCertificateSignedFalse()
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
        return r;
    }

    public byte[] generateCertificate(Long baptismId) {
        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            addPage1(document, baptism);
            document.newPage();
            addPage2(document);
            document.newPage();
            addPage3(document, baptism);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating certificate PDF", e);
        }
    }

    private void addPage1(Document doc, Baptism baptism) throws DocumentException {
        Candidate candidate = baptism.getCandidate();
        Church church = candidate.getChurch();

        // SDA Header
        Paragraph sdaHeader = new Paragraph("Seventh-day Adventist Church", TITLE_FONT);
        sdaHeader.setAlignment(Element.ALIGN_CENTER);
        doc.add(sdaHeader);

        Paragraph underline = new Paragraph("__________________________________________________", SMALL_FONT);
        underline.setAlignment(Element.ALIGN_CENTER);
        doc.add(underline);

        doc.add(Chunk.NEWLINE);

        Paragraph certTitle = new Paragraph("CERTIFICATE OF BAPTISM", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLUE));
        certTitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(certTitle);

        Paragraph certSubtitle = new Paragraph("This is to certify that", FontFactory.getFont(FontFactory.HELVETICA, 12));
        certSubtitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(certSubtitle);
        doc.add(Chunk.NEWLINE);

        // Personal Information Section
        Paragraph personalHeader = new Paragraph("Personal Information", HEADING_FONT);
        doc.add(personalHeader);
        doc.add(Chunk.NEWLINE);

        doc.add(makeRow("Full Name:", candidate.getFullName()));
        String dob = candidate.getDateOfBirth() != null ? candidate.getDateOfBirth().format(DateTimeFormatter.ISO_LOCAL_DATE) : "—";
        doc.add(makeRow("Date of Birth:", dob));
        doc.add(makeRow("Gender:", candidate.getGender() != null ? candidate.getGender() : "—"));
        doc.add(makeRow("Address:", candidate.getAddress() != null ? candidate.getAddress() : "—"));
        doc.add(makeRow("Contact:", candidate.getPhone() != null ? candidate.getPhone() : "—"));
        doc.add(makeRow("Email:", candidate.getEmail() != null ? candidate.getEmail() : "—"));

        doc.add(Chunk.NEWLINE);

        // Baptism Details
        Paragraph baptismHeader = new Paragraph("Details of Baptism", HEADING_FONT);
        doc.add(baptismHeader);
        doc.add(Chunk.NEWLINE);

        doc.add(makeRow("Date of Baptism:", baptism.getBaptismDate().format(DateTimeFormatter.ISO_LOCAL_DATE)));
        doc.add(makeRow("Location:", baptism.getLocation() != null ? baptism.getLocation() : "—"));
        doc.add(makeRow("Officiating Pastor:", baptism.getOfficiatingPastor() != null ? baptism.getOfficiatingPastor() : "—"));
        doc.add(makeRow("Type of Baptism:", "Immersion"));
        doc.add(makeRow("Certificate No:", baptism.getCertificateNumber() != null ? baptism.getCertificateNumber() : "—"));

        doc.add(Chunk.NEWLINE);

        // Church Details
        Paragraph churchHeader = new Paragraph("Church Details", HEADING_FONT);
        doc.add(churchHeader);
        doc.add(Chunk.NEWLINE);

        if (church != null) {
            doc.add(makeRow("Local Church:", church.getChurchName()));
            String districtName = church.getDistrict() != null ? church.getDistrict().getName() : "—";
            String fieldName = church.getDistrict() != null && church.getDistrict().getField() != null
                    ? church.getDistrict().getField().getName() : "—";
            String unionName = church.getDistrict() != null && church.getDistrict().getField() != null
                    && church.getDistrict().getField().getUnion() != null
                    ? church.getDistrict().getField().getUnion().getName() : "—";
            doc.add(makeRow("District:", districtName));
            doc.add(makeRow("Field:", fieldName));
            doc.add(makeRow("Union:", unionName));
        } else {
            doc.add(makeRow("Local Church:", "—"));
        }

        doc.add(Chunk.NEWLINE);

        // Signature line
        doc.add(new Paragraph("________________________________________", NORMAL_FONT));
        doc.add(makeRow("", baptism.getOfficiatingPastor() != null ? baptism.getOfficiatingPastor() + " — Officiating Pastor" : "Officiating Pastor"));

        doc.add(Chunk.NEWLINE);

        // Seal placeholder
        Paragraph seal = new Paragraph("[ OFFICIAL SEAL ]", FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY));
        seal.setAlignment(Element.ALIGN_RIGHT);
        doc.add(seal);
    }

    private void addPage2(Document doc) throws DocumentException {
        Paragraph title = new Paragraph("Fundamental Beliefs", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph subtitle = new Paragraph("of the Seventh-day Adventist Church", SUBTITLE_FONT);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(subtitle);

        doc.add(Chunk.NEWLINE);

        Paragraph linkPara = new Paragraph("For the full detailed version, visit: https://www.adventist.org/beliefs/", FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLUE));
        linkPara.setAlignment(Element.ALIGN_CENTER);
        doc.add(linkPara);

        doc.add(Chunk.NEWLINE);

        Paragraph header = new Paragraph("Our Beliefs in Brief", SUBTITLE_FONT);
        header.setAlignment(Element.ALIGN_CENTER);
        doc.add(header);
        doc.add(Chunk.NEWLINE);

        for (String belief : FUNDAMENTAL_BELIEFS) {
            Paragraph p = new Paragraph(belief, NORMAL_FONT);
            p.setSpacingAfter(4);
            doc.add(p);
        }

        doc.add(Chunk.NEWLINE);
        Paragraph downloadLink = new Paragraph("Click to download the full Fundamental Beliefs booklet: https://www.adventist.org/file/fundamental-beliefs.pdf", FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLUE));
        doc.add(downloadLink);
    }

    private void addPage3(Document doc, Baptism baptism) throws DocumentException {
        Paragraph title = new Paragraph("Baptismal Vows", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph subtitle = new Paragraph("The candidate shall affirm the following vows:", SUBTITLE_FONT);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(subtitle);

        doc.add(Chunk.NEWLINE);

        for (String vow : BAPTISMAL_VOWS) {
            Paragraph p = new Paragraph(vow, NORMAL_FONT);
            p.setSpacingAfter(6);
            doc.add(p);
        }

        doc.add(Chunk.NEWLINE);
        doc.add(Chunk.NEWLINE);

        Paragraph candidateLine = new Paragraph("Name of Candidate: ______________________________________________", BOLD_FONT);
        doc.add(candidateLine);
        doc.add(makeRow("", baptism.getCandidate().getFullName()));

        doc.add(Chunk.NEWLINE);

        Paragraph endStatement = new Paragraph("\"Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.\" — Matthew 28:19", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
        endStatement.setAlignment(Element.ALIGN_CENTER);
        doc.add(endStatement);
    }

    private Paragraph makeRow(String label, String value) {
        return new Paragraph(label + "  " + value, NORMAL_FONT);
    }
}
