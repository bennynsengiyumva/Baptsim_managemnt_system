package com.church.baptism.service.ai;

import com.church.baptism.dto.request.ai.ChatRequest;
import com.church.baptism.dto.request.ai.EscalationRequest;
import com.church.baptism.dto.response.ai.AiChatMessageResponse;
import com.church.baptism.dto.response.ai.AiChatResponse;
import com.church.baptism.dto.response.ai.HumanSupportMessageResponse;
import com.church.baptism.entity.ai.AiChat;
import com.church.baptism.entity.ai.AiChatMessage;
import com.church.baptism.entity.ai.HumanSupportMessage;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.cohort.Cohort;
import com.church.baptism.entity.cohort.CohortMember;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.ai.AiChatMessageRepository;
import com.church.baptism.repository.ai.AiChatRepository;
import com.church.baptism.repository.ai.HumanSupportMessageRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.cohort.CohortMemberRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {

    private final AiChatRepository chatRepository;
    private final AiChatMessageRepository messageRepository;
    private final HumanSupportMessageRepository humanSupportRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LessonRepository lessonRepository;
    private final BaptismRepository baptismRepository;
    private final CohortMemberRepository cohortMemberRepository;
    private final CandidateRepository candidateRepository;

    private static final Map<String, List<String>> KNOWLEDGE_BASE = new LinkedHashMap<>();

    static {
        KNOWLEDGE_BASE.put("lesson|course|complete.*lesson|how.*complete|finish.*course", List.of(
            "To complete a lesson, go to **My Courses** from the sidebar. Open the lesson, read all sections and documents, then check the 'I have read and understood' box. Finally, start and complete the assessment. Your progress will be updated automatically after completion.",
            "You can complete lessons by navigating to **My Courses**. Each lesson has content to read followed by an assessment. Complete all sections and pass the assessment with the required score to mark the lesson as completed."
        ));

        KNOWLEDGE_BASE.put("assessment|quiz|test|exam|score|passing", List.of(
            "Each lesson includes an assessment at the end. You must read the course content first, then answer all questions. The passing score is set by your instructor (typically 70%). You have multiple attempts if needed. Your best score is recorded.",
            "Assessments are available at the end of each lesson. Read the content, check the confirmation box, then start the assessment. Answer all questions and submit. You need to meet the passing score to complete the lesson."
        ));

        KNOWLEDGE_BASE.put("baptism|baptize|baptised|baptized", List.of(
            "To request baptism, go to **Events** in the sidebar. You'll see upcoming baptism events. Click 'Request Baptism' on an event to submit your request. Your request will be reviewed by the First Church Elder and then forwarded for approval.",
            "Baptism requests can be submitted through the **Events** page. Browse available baptism events and submit a request. After approval, you'll be scheduled for baptism. You can track your baptism status on the **Baptism** page."
        ));

        KNOWLEDGE_BASE.put("certificate|download.*cert|get.*cert", List.of(
            "Your certificate is available for download on the **My Certificates** page once your baptism is recorded and the certificate is signed by the Head of District. Go to **My Certificates** and click the download icon to get your PDF certificate.",
            "Certificates are generated automatically after your baptism is recorded. Visit **My Certificates** to download your signed certificate. Make sure your baptism has been completed and the certificate signed before trying to download."
        ));

        KNOWLEDGE_BASE.put("progress|how.*much|percentage|status|where.*stand", List.of(
            "You can check your progress on the **Dashboard**. It shows your course completion percentage, baptism status, and readiness checklist. For detailed progress, visit **My Courses** to see each lesson's status.",
            "Your progress is displayed on the Dashboard. You'll see your course completion percentage, baptism readiness, and assigned instructor. Each lesson in My Courses also shows its individual status."
        ));

        KNOWLEDGE_BASE.put("instructor|teacher|assigned|who.*instructor", List.of(
            "Your assigned instructor is shown on your Dashboard in the 'My Instructor' card. Your instructor manages your courses and grades. If you need to contact them, you can use the 'Contact Someone' feature in this assistant.",
            "The instructor assigned to you is displayed on your Dashboard. They are responsible for creating and managing your lessons. You can contact them through the support escalation feature if needed."
        ));

        KNOWLEDGE_BASE.put("grade|grading|result|best.*score", List.of(
            "View your grades on the **My Grades** page. It shows your best score for each course, attempts used, and whether you passed. Your instructor can also view and manage your grades.",
            "Grades are available on the **My Grades** page. Each course shows your best score, passing requirement, and attempt count. You can retake assessments to improve your score."
        ));

        KNOWLEDGE_BASE.put("request|status|track|where.*request", List.of(
            "Track your baptism request status on the **Baptism** page. The status flows through: Request Pending -> Approved -> Baptism Scheduled -> Baptism Completed -> Certificate Generated -> Certificate Signed -> Transferred to CMS.",
            "You can track all your requests on the relevant pages. Baptism requests are tracked on the **Baptism** page, and your overall status is shown on the Dashboard."
        ));

        KNOWLEDGE_BASE.put("transfer|cms|membership.*transfer", List.of(
            "CMS (Church Management System) transfer happens after your baptism is complete, certificate is signed, and all lessons are completed. The Head of District initiates the transfer. You can check your status on the Dashboard.",
            "Transfer to CMS is the final step in your membership preparation. It requires: baptism completed, certificate signed, and all 10 courses completed. The Head of District handles the transfer process."
        ));

        KNOWLEDGE_BASE.put("event|schedule|date|when.*baptism", List.of(
            "Upcoming baptism events are listed on the **Events** page. You can view event details including dates and locations. Submit a request for an event to register for baptism.",
            "Check the **Events** page for upcoming baptism events. Each event shows the date, location, and available slots. You can request to be part of an event from that page."
        ));

        KNOWLEDGE_BASE.put("dashboard|navigate|home|main.*page", List.of(
            "Your Dashboard is the main page you see after login. It shows your progress, baptism status, instructor info, upcoming events, and recent notifications. Use the sidebar to navigate to different sections.",
            "The Dashboard provides an overview of your journey. From there you can access courses, grades, baptism, and certificates. The sidebar provides quick navigation to all features."
        ));

        KNOWLEDGE_BASE.put("help|support|contact|question|assist", List.of(
            "I'm here to help! Ask me about courses, assessments, baptism, certificates, grades, or any other aspect of the system. If I can't help, you can escalate to contact an Instructor, First Church Elder, or Pastor.",
            "You can ask me anything about the system. I can help with course completion, baptism requests, certificate downloads, grade viewing, and more. If needed, I can also help you contact the right person."
        ));

        KNOWLEDGE_BASE.put("contact|message|reach|talk|speak", List.of(
            "If you need to contact someone, I can help you send a message to an Instructor, First Church Elder, or Pastor. Just let me know who you'd like to contact and what your question is about.",
            "You can reach church leaders through the support feature. Select 'No, Contact Someone' after receiving my response, and choose who you'd like to contact."
        ));

        KNOWLEDGE_BASE.put("course.*10|all.*course|complete.*all|ten.*course|10.*course", List.of(
            "You need to complete all 10 courses to be eligible for CMS transfer. Courses are assigned by your instructor and should be taken in order. Check **My Courses** to see your assigned courses and their order.",
            "There are 10 courses in total for baptism preparation. Complete them in order as assigned by your instructor. Your progress toward completing all courses is shown on the Dashboard."
        ));

        KNOWLEDGE_BASE.put("repent|repentance|sin|forgive|forgiveness|salvation", List.of(
            "Repentance is a central theme in our baptism preparation. It means turning away from sin and turning to God. Jesus calls us to repentance (Acts 2:38), and through repentance we receive forgiveness and new life in Christ.",
            "Repentance is the foundation of our faith journey. It involves acknowledging our sins, feeling godly sorrow, and committing to change. Through repentance, we receive God's forgiveness and are prepared for new life in Christ."
        ));

        KNOWLEDGE_BASE.put("bible|scripture|verse|reading|word.*god", List.of(
            "The Bible is central to our faith and baptism preparation. Regular Bible reading strengthens your spiritual growth. Your courses include Bible study materials. The Word of God is a lamp to our feet (Psalm 119:105).",
            "Scripture reading is essential for spiritual growth. Your lessons include Bible-based content. I encourage you to read your Bible daily and reflect on God's Word as part of your preparation."
        ));

        KNOWLEDGE_BASE.put("prayer|pray|worship|spiritual", List.of(
            "Prayer is vital for your spiritual growth. Maintain a regular prayer life as part of your baptism preparation. Pray for guidance, strength, and understanding as you go through your courses.",
            "A strong prayer life is essential for spiritual preparation. Set aside time each day for prayer and worship. This will strengthen your relationship with God as you prepare for baptism."
        ));

        KNOWLEDGE_BASE.put("member|membership|join|become.*member", List.of(
            "Full membership in the church requires completing baptism preparation. This includes: completing all 10 courses, being baptized, receiving your certificate, and being transferred to CMS. Each step prepares you for meaningful membership.",
            "To become a full member, you need to complete the baptism preparation process. This involves courses, baptism, certificate, and CMS transfer. Each step is designed to help you grow in faith and understanding."
        ));

        // === NEW KNOWLEDGE BASE ENTRIES ===

        // Course material and study
        KNOWLEDGE_BASE.put("course.*material|study.*guide|course.*content|reading.*material|lesson.*content", List.of(
            "Course materials are available within each lesson. When you open a lesson in **My Courses**, you'll find the reading content, notes, and any uploaded documents. Read through all content before attempting the assessment.",
            "Each lesson contains study materials including written content, notes, and downloadable documents. Access them through **My Courses** by opening the lesson. Make sure to read everything before taking the assessment."
        ));

        // Retake / retry assessment
        KNOWLEDGE_BASE.put("retake|retry|second.*attempt|third.*attempt|again|try.*again", List.of(
            "If you didn't pass an assessment, you can retry it! Each lesson allows multiple attempts (typically up to 3). Go to **My Courses**, find the lesson, and click 'Retry Assessment' or 'Continue'. Your best score will be recorded.",
            "Don't worry if you didn't pass on the first try. You have multiple attempts for each assessment. Visit **My Courses** and select the lesson to retake the assessment. Focus on the areas where you struggled."
        ));

        // Course schedule / timing
        KNOWLEDGE_BASE.put("course.*schedule|when.*start|how.*long|duration|deadline|time.*limit", List.of(
            "Course schedules are set by your instructor. Check **My Courses** for your assigned lessons and their order. There's typically no strict deadline, but it's best to complete them as soon as possible to progress toward baptism.",
            "Your courses are self-paced within your cohort timeline. Check **My Courses** for your assigned lessons. Your instructor may set specific timelines, so contact them if you have questions about deadlines."
        ));

        // Baptism preparation / requirements
        KNOWLEDGE_BASE.put("baptism.*preparation|prepare.*baptism|baptism.*requirements|what.*need.*baptism|ready.*baptism", List.of(
            "To prepare for baptism, you need to: 1) Complete all assigned courses, 2) Submit a baptism request through the Events page, 3) Get approved by the First Church Elder, 4) Be scheduled for baptism, 5) Complete the baptism ceremony, 6) Receive your signed certificate.",
            "Baptism preparation involves completing your coursework and submitting a request. Make sure all courses are completed, then go to **Events** to find an upcoming baptism event and submit your request."
        ));

        // Baptism dress / what to bring
        KNOWLEDGE_BASE.put("baptism.*dress|what.*wear|what.*bring|baptism.*clothes|white.*garment", List.of(
            "For your baptism ceremony, wear modest white clothing. Bring a change of clothes as you'll get wet during the immersion. Your church may provide specific guidance. Contact your Pastor or First Church Elder for details.",
            "Baptism by immersion requires white clothing that can get wet. Bring a towel and change of clothes. Your Pastor will guide you on the specific requirements for your baptism ceremony."
        ));

        // Godparent / sponsor / witness
        KNOWLEDGE_BASE.put("godparent|sponsor|witness|sponsor.*name|witness.*name", List.of(
            "When submitting your baptism request, you can optionally provide a sponsor name and witness name. These are people who will support you in your faith journey. They don't need to be formally registered in the system.",
            "Sponsors and witnesses are optional when submitting a baptism request. They're individuals who will support your spiritual growth. You can add their names when registering for a baptism event."
        ));

        // Certificate validity / verification
        KNOWLEDGE_BASE.put("certificate.*valid|verify.*certificate|certificate.*number|check.*certificate|certificate.*legit", List.of(
            "Your certificate includes a unique certificate number and QR code for verification. Anyone can verify a certificate by visiting the verification page and entering the certificate number. The QR code links directly to the verification page.",
            "Certificates can be verified using the certificate number or QR code. Visit the public verification page at /verify-certificate to check if a certificate is valid and view its details."
        ));

        // Lost certificate / correction
        KNOWLEDGE_BASE.put("lost.*certificate|certificate.*lost|wrong.*name|name.*correct|certificate.*error|fix.*certificate", List.of(
            "If you've lost your certificate, you can re-download it from **My Certificates**. If there's an error in your name or details, contact the Head of District to request a correction. They can regenerate the certificate with the correct information.",
            "For lost certificates, simply download again from **My Certificates**. For name corrections or errors, reach out to the Head of District who can update and regenerate your certificate."
        ));

        // Church service / location / time
        KNOWLEDGE_BASE.put("church.*service|service.*time|church.*location|church.*address|where.*church|sabbath.*school", List.of(
            "Church service times and locations vary by congregation. Contact your local church or Pastor for service schedules. Your baptism preparation courses include information about church life and fellowship.",
            "For church service times and locations, please contact your local church directly. Your Pastor or First Church Elder can provide specific details about worship schedules and Sabbath School times."
        ));

        // Pastor name / contact
        KNOWLEDGE_BASE.put("pastor.*name|who.*pastor|contact.*pastor|pastor.*contact|reach.*pastor", List.of(
            "Your assigned Pastor is listed on the baptism event details. You can also find Pastor contact information through your church or by asking the First Church Elder. They're available to guide you in your spiritual journey.",
            "To contact your Pastor, check the baptism event details or ask your First Church Elder. They can provide the Pastor's contact information and help schedule a meeting."
        ));

        // Prayer request
        KNOWLEDGE_BASE.put("prayer.*request|request.*prayer|need.*prayer|pray.*for", List.of(
            "Prayer requests can be shared with your Pastor, First Church Elder, or instructor. They'll be happy to pray with you and for you. You can also use the support feature to send a prayer request to church leadership.",
            "If you'd like someone to pray with you, reach out to your Pastor, First Church Elder, or instructor. You can send a message through the support feature in this assistant."
        ));

        // Tithing / offering
        KNOWLEDGE_BASE.put("tithe|tithing|offering|give|donation|financial", List.of(
            "Tithing and offerings are part of our stewardship as Christians. Tithes (10% of income) support the church's mission. Offerings are additional gifts. Give cheerfully as the Lord prospers you (2 Corinthians 9:7).",
            "Tithing is returning 10% of your income to God through the church. Offerings are additional gifts above the tithe. Both are acts of worship and support the church's ministry. Speak to your Pastor for more details."
        ));

        // Sabbath
        KNOWLEDGE_BASE.put("sabbath|saturday|worship.*day|seventh.*day|rest.*day", List.of(
            "As Seventh-day Adventists, we worship on Saturday (the Sabbath), from Friday sunset to Saturday sunset. The Sabbath is a sign of our relationship with God (Exodus 20:8-11). It's a day for rest, worship, and fellowship.",
            "The Sabbath is observed from Friday sunset to Saturday sunset. It's a day of rest and worship, commemorating God's creation. Join your church family for Sabbath services and fellowship."
        ));

        // Ten commandments / beliefs
        KNOWLEDGE_BASE.put("ten.*commandment|commandment|belief|doctrine|fundamental.*belief", List.of(
            "Seventh-day Adventists believe in the Bible as God's Word and hold 28 fundamental beliefs. These include the Sabbath, the second coming of Christ, and the state of the dead. Your courses cover these beliefs as part of baptism preparation.",
            "Our beliefs are rooted in Scripture. During your baptism preparation courses, you'll learn about the fundamental beliefs of the Seventh-day Adventist Church. Ask your instructor for more details."
        ));

        // Second coming / jesus
        KNOWLEDGE_BASE.put("second.*come|jesus.*come|return.*jesus|advent|last.*day", List.of(
            "We believe in the literal second coming of Jesus Christ. This is a core belief of the Seventh-day Adventist Church. Jesus will return to take His faithful people to heaven. Be ready by living a life of faith and obedience.",
            "The Second Coming of Jesus is our blessed hope. It's the blessed assurance that Jesus will return personally, visibly, and literally. Live each day in readiness for His return."
        ));

        // State of the dead / soul
        KNOWLEDGE_BASE.put("state.*dead|after.*death|soul|sleep|resurrection|heaven|hell", List.of(
            "Adventists believe that at death, people enter a state of sleep (unconsciousness) until the resurrection at Christ's return. The soul is not immortal — only God has immortality. The dead will be raised at the Second Coming.",
            "According to the Bible, the dead are asleep — unconscious — until the resurrection. There's no conscious suffering or bliss between death and the resurrection. Trust in God's promise of resurrection and eternal life."
        ));

        // Health / wellness
        KNOWLEDGE_BASE.put("health|wellness|diet|vegetarian|clean.*food|temple|body.*health", List.of(
            "Seventh-day Adventists believe in caring for our bodies as temples of the Holy Spirit (1 Corinthians 6:19). Many follow a healthy lifestyle including a balanced diet, regular exercise, and avoiding harmful substances.",
            "Health is an important part of our faith. We believe in caring for our bodies through healthy eating, exercise, and avoiding harmful habits. Your health is a gift from God — take care of it!"
        ));

        // Ellen White / prophet
        KNOWLEDGE_BASE.put("ellen.*white|prophet|spirit.*prophecy|inspiration|writing", List.of(
            "Ellen G. White was one of the founders of the Seventh-day Adventist Church and a prolific writer. Her writings cover health, education, Christian living, and Bible study. They are a valuable resource for spiritual growth.",
            "Ellen G. White served as a prophet and messenger of the Lord. Her writings provide guidance on Christian living, health, education, and Bible interpretation. They complement Scripture as a source of inspiration."
        ));

        // Update profile / change password
        KNOWLEDGE_BASE.put("update.*profile|change.*password|change.*email|change.*phone|update.*email|update.*phone|edit.*profile|profile.*edit|account.*setting", List.of(
            "To update your profile, go to **Profile** from the sidebar. You can edit your personal information, update your phone number, and change your email. To change your password, go to **Settings** and select the security options.",
            "Visit your **Profile** page to update personal information. For password changes, go to **Settings**. Keep your profile up to date so the church can reach you and your certificate has correct information."
        ));

        // Two factor / 2FA / security
        KNOWLEDGE_BASE.put("two.*factor|2fa|security|login.*issue|can.*login|forgot.*password", List.of(
            "For login issues, use the 'Forgot Password' link on the login page. Two-factor authentication adds extra security to your account. If you're locked out, contact the administrator for assistance.",
            "If you forgot your password, click 'Forgot Password' on the login page. For 2FA or other security issues, contact the system administrator for help."
        ));

        // Attendance
        KNOWLEDGE_BASE.put("attendance|attend|present|absent|mark.*attendance", List.of(
            "Attendance is tracked for cohort sessions and classes. Your instructor marks attendance for each session. Regular attendance helps you stay on track with your courses and progress toward baptism.",
            "Your instructor tracks attendance for classes and sessions. Attend regularly to stay on track. If you miss a session, contact your instructor to catch up on what you missed."
        ));

        // Notification / alert
        KNOWLEDGE_BASE.put("notification|alert|bell|unread|mark.*read", List.of(
            "Notifications keep you informed about your progress, new lessons, and baptism updates. Check the bell icon in the top navigation for unread notifications. Click a notification to mark it as read.",
            "Your notifications appear in the bell icon at the top of the page. Click to see recent updates. Unread notifications are marked with a blue dot. Click any notification to mark it as read."
        ));

        // Language / translate / kinyarwanda
        KNOWLEDGE_BASE.put("language|translate|kinyarwanda|french|english|change.*language", List.of(
            "The system supports English and Kinyarwanda. You can change your language using the dropdown in the top navigation bar. Your language preference is saved automatically.",
            "Switch between English and Kinyarwanda using the language selector in the top navigation. Some course materials may also be available in both languages."
        ));

        // Download / export / pdf
        KNOWLEDGE_BASE.put("download|export|pdf|print|save.*file", List.of(
            "You can download certificates and reports as PDF files. On the relevant page, click the download button to save the file. Reports can also be exported as Excel files for your records.",
            "PDF downloads are available for certificates and reports. Click the download button on the page to save your file. You can also print directly from the download."
        ));
    }

    @Transactional
    public AiChatResponse startChat(Long candidateId) {
        log.info("AI_CHAT_STARTED: candidateId={}", candidateId);
        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        AiChat chat = new AiChat();
        chat.setCandidate(candidate);
        chat.setTitle("New Conversation");
        chat.setStatus("ACTIVE");
        chat = chatRepository.save(chat);

        AiChatMessage welcome = new AiChatMessage();
        welcome.setChat(chat);
        welcome.setRole("assistant");
        welcome.setContent("Hello! I'm your AI Assistant. I can help you with:\n\n" +
                "- Course lessons and assessments\n" +
                "- Baptism preparation and requests\n" +
                "- Certificate downloads\n" +
                "- Grades and progress\n" +
                "- System navigation\n" +
                "- Frequently asked questions\n\n" +
                "What would you like to know?");
        messageRepository.save(welcome);

        chat.setMessageCount(1);
        chatRepository.save(chat);

        return toChatResponse(chat, List.of(welcome));
    }

    @Transactional
    public AiChatResponse sendMessage(Long candidateId, ChatRequest request) {
        log.info("AI_REQUEST_RECEIVED: candidateId={}, message={}", candidateId, truncate(request.getMessage(), 100));

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        AiChat chat;
        if (request.getChatId() != null) {
            chat = chatRepository.findById(request.getChatId())
                    .orElseThrow(() -> new RuntimeException("Chat not found"));
            if (!chat.getCandidate().getId().equals(candidateId)) {
                throw new RuntimeException("Unauthorized access to chat");
            }
        } else {
            chat = new AiChat();
            chat.setCandidate(candidate);
            chat.setTitle(truncate(request.getMessage(), 50));
            chat.setStatus("ACTIVE");
            chat = chatRepository.save(chat);
        }

        AiChatMessage userMsg = new AiChatMessage();
        userMsg.setChat(chat);
        userMsg.setRole("user");
        userMsg.setContent(request.getMessage());
        messageRepository.save(userMsg);

        String aiResponse;
        try {
            log.info("AI_PROCESSING_STARTED: candidateId={}, chatId={}", candidateId, chat.getId());
            aiResponse = generateResponse(candidateId, request.getMessage());
            log.info("AI_RESPONSE_GENERATED: candidateId={}, chatId={}, responseLength={}", candidateId, chat.getId(), aiResponse.length());
        } catch (Exception e) {
            log.error("AI_RESPONSE_FAILED: candidateId={}, chatId={}, error={}", candidateId, chat.getId(), e.getMessage(), e);
            aiResponse = "I am currently unable to answer your question. Please try again or contact your Instructor, First Church Elder, or Pastor for assistance.";
        }

        AiChatMessage assistantMsg = new AiChatMessage();
        assistantMsg.setChat(chat);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(aiResponse);
        messageRepository.save(assistantMsg);

        chat.setMessageCount(chat.getMessageCount() + 2);
        chatRepository.save(chat);

        log.info("AI_RESPONSE_SENT: candidateId={}, chatId={}", candidateId, chat.getId());
        List<AiChatMessage> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.getId());
        return toChatResponse(chat, messages);
    }

    @Transactional
    public AiChatResponse satisfactionFeedback(Long candidateId, Long chatId, boolean satisfied) {
        AiChat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        if (!chat.getCandidate().getId().equals(candidateId)) {
            throw new RuntimeException("Unauthorized access to chat");
        }

        List<AiChatMessage> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        if (!messages.isEmpty()) {
            AiChatMessage lastAssistant = messages.stream()
                    .filter(m -> "assistant".equals(m.getRole()))
                    .reduce((a, b) -> b)
                    .orElse(null);
            if (lastAssistant != null) {
                lastAssistant.setSatisfied(satisfied);
                messageRepository.save(lastAssistant);
            }
        }

        if (!satisfied) {
            return toChatResponse(chat, messages);
        }

        chat.setStatus("RESOLVED");
        chatRepository.save(chat);
        return toChatResponse(chat, messages);
    }

    @Transactional
    public HumanSupportMessageResponse escalate(Long candidateId, EscalationRequest request) {
        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        Role role;
        try {
            role = Role.valueOf(request.getRecipientRole());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid recipient role: " + request.getRecipientRole());
        }

        User recipient = userRepository.findByRole(role).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No user found with role: " + request.getRecipientRole()));

        HumanSupportMessage supportMsg = new HumanSupportMessage();
        supportMsg.setCandidate(candidate);
        supportMsg.setRecipient(recipient);
        supportMsg.setRecipientRole(request.getRecipientRole());
        supportMsg.setSubject(request.getSubject());
        supportMsg.setMessage(request.getMessage());
        supportMsg.setStatus("SENT");
        supportMsg.setAiChatId(request.getChatId());
        supportMsg = humanSupportRepository.save(supportMsg);

        try {
            notificationService.sendToUser(
                recipient.getId(),
                "New message from " + candidate.getFullName(),
                request.getSubject(),
                Notification.NotificationType.SYSTEM
            );
        } catch (Exception ignored) {
        }

        return HumanSupportMessageResponse.builder()
                .id(supportMsg.getId())
                .recipientName(recipient.getFullName())
                .recipientRole(request.getRecipientRole())
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(supportMsg.getStatus())
                .createdAt(supportMsg.getCreatedAt())
                .build();
    }

    public List<AiChatResponse> getChatHistory(Long candidateId) {
        List<AiChat> chats = chatRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
        return chats.stream().map(chat -> {
            List<AiChatMessage> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.getId());
            return toChatResponse(chat, messages);
        }).toList();
    }

    public List<HumanSupportMessageResponse> getSupportHistory(Long candidateId) {
        return humanSupportRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId)
                .stream()
                .map(msg -> HumanSupportMessageResponse.builder()
                        .id(msg.getId())
                        .recipientName(msg.getRecipient() != null ? msg.getRecipient().getFullName() : "Unknown")
                        .recipientRole(msg.getRecipientRole())
                        .subject(msg.getSubject())
                        .message(msg.getMessage())
                        .status(msg.getStatus())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .toList();
    }

    private String generateResponse(Long candidateId, String userMessage) {
        String lower = userMessage.toLowerCase().trim();

        // My courses/lessons - fetch real data
        if (containsAny(lower, "my course", "my lesson", "my class", "enrolled", "what course", "what lesson")) {
            return handleMyCourses(candidateId);
        }

        // My baptism status - fetch real data
        if (containsAny(lower, "my baptism", "baptism status", "when is my baptism", "my request", "my baptism status")) {
            return handleMyBaptismStatus(candidateId);
        }

        // My certificates - fetch real data
        if (containsAny(lower, "my certificate", "do i have", "certificate status", "is my certificate")) {
            return handleMyCertificates(candidateId);
        }

        // My cohort - fetch real data
        if (containsAny(lower, "my cohort", "what cohort", "my group", "my instructor", "who is my instructor")) {
            return handleMyCohort(candidateId);
        }

        // My grades - fetch real data
        if (containsAny(lower, "my grade", "my score", "my mark", "what grade", "my progress")) {
            return handleMyGrades(candidateId);
        }

        // Profile related
        if (containsAny(lower, "profile", "picture", "photo", "avatar")) {
            return "To upload or update your profile picture:\n1. Go to your Profile page\n2. Click on the avatar/picture area\n3. Select a new photo\n4. Save changes\n\nA profile picture is required before your certificate can be signed.";
        }

        // Knowledge base matching (existing)
        for (Map.Entry<String, List<String>> entry : KNOWLEDGE_BASE.entrySet()) {
            String[] patterns = entry.getKey().split("\\|");
            for (String pattern : patterns) {
                if (containsWord(lower, pattern.trim())) {
                    List<String> responses = entry.getValue();
                    return responses.get(new Random().nextInt(responses.size()));
                }
            }
        }

        if (containsAny(lower, "hello", "hi", "hey", "good morning", "good afternoon", "good evening")) {
            return "Hello! How can I help you today? I can assist with courses, baptism, certificates, grades, and more.";
        }

        if (containsAny(lower, "thank", "thanks", "appreciate")) {
            return "You're welcome! Is there anything else I can help you with?";
        }

        if (containsAny(lower, "bye", "goodbye", "see you")) {
            return "Goodbye! Feel free to come back anytime if you have more questions. God bless you!";
        }

        if (containsAny(lower, "who are you", "what are you", "your name")) {
            return "I'm the AI Assistant for the Church Baptism & Membership Preparation System. I'm here to help you navigate the system and answer questions about your preparation journey.";
        }

        if (containsAny(lower, "contact", "speak", "talk", "talk to", "help me", "need help", "someone", "person", "human")) {
            return "I understand you'd like to speak with someone directly. You can contact an Instructor, First Church Elder, or Pastor for personal guidance. Would you like me to connect you? Select 'No, Contact Someone' below to send a message.";
        }

        return "I do not have enough information to answer that question. You may contact an Instructor, First Church Elder, or Pastor for assistance. Select 'No, Contact Someone' below to send a message to a church leader.";
    }

    private String handleMyCourses(Long candidateId) {
        List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(candidateId);
        if (lessons.isEmpty()) {
            return "You are not currently enrolled in any courses. Contact your instructor or First Church Elder to get enrolled in baptism preparation classes.";
        }
        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        long total = lessons.size();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("You have %d lessons (%d completed, %d remaining).\n\n", total, completed, total - completed));
        for (Lesson l : lessons) {
            String status = l.isCompleted() ? "Completed" : l.getStatus().toString().replace("_", " ");
            sb.append(String.format("- %s: %s\n", l.getLessonTitle(), status));
        }
        if (completed == total && total > 0) {
            sb.append("\nAll lessons completed! You may be eligible for baptism. Contact your First Church Elder.");
        }
        return sb.toString();
    }

    private String handleMyBaptismStatus(Long candidateId) {
        List<Baptism> baptisms = baptismRepository.findByCandidateId(candidateId);
        if (baptisms.isEmpty()) {
            return "You have not submitted a baptism request yet. Go to the Events page to view upcoming baptism events and submit a request.";
        }
        Baptism latest = baptisms.get(baptisms.size() - 1);
        StringBuilder sb = new StringBuilder();
        sb.append("Your Baptism Information:\n\n");
        sb.append(String.format("Status: %s\n", formatEnum(latest.getRequestStatus().name())));
        sb.append(String.format("Date: %s\n", latest.getBaptismDate()));
        if (latest.getLocation() != null) {
            sb.append(String.format("Location: %s\n", latest.getLocation()));
        }
        if (latest.getEvent() != null) {
            sb.append(String.format("Event: %s\n", latest.getEvent().getEventName()));
        }
        if (latest.isCertificateSigned()) {
            sb.append(String.format("Certificate Number: %s\n", latest.getCertificateNumber()));
        }
        return sb.toString();
    }

    private String handleMyCertificates(Long candidateId) {
        List<Baptism> baptisms = baptismRepository.findByCandidateId(candidateId);
        boolean hasSignedCert = baptisms.stream().anyMatch(Baptism::isCertificateSigned);
        if (!hasSignedCert) {
            boolean hasBaptism = baptisms.stream().anyMatch(Baptism::isBaptized);
            if (!hasBaptism) {
                return "You don't have a certificate yet. Complete your baptism first, then your certificate will be generated.";
            }
            Baptism latest = baptisms.get(baptisms.size() - 1);
            if (latest.getRequestStatus() == Baptism.BaptismRequestStatus.CERTIFICATE_GENERATED) {
                return "Your certificate has been generated but is not yet signed by the Head of District. Please wait for signing, then you can download it from My Certificates.";
            }
            return "Your certificate is being processed. It will be available after your baptism is recorded and the certificate is signed by the Head of District.";
        }
        Baptism signed = baptisms.stream().filter(Baptism::isCertificateSigned).findFirst().orElse(null);
        StringBuilder sb = new StringBuilder();
        sb.append("Certificate Status:\n\n");
        sb.append("Your certificate is signed and ready for download.\n");
        if (signed != null) {
            sb.append(String.format("Certificate Number: %s\n", signed.getCertificateNumber()));
            sb.append(String.format("Signed at: %s\n", signed.getSignedAt()));
        }
        sb.append("\nGo to My Certificates to download your PDF certificate.");
        return sb.toString();
    }

    private String handleMyCohort(Long candidateId) {
        List<CohortMember> memberships = cohortMemberRepository.findByCandidateId(candidateId);
        if (memberships.isEmpty()) {
            return "You are not currently assigned to any cohort. Contact your instructor or First Church Elder to be added to a cohort.";
        }
        CohortMember membership = memberships.get(memberships.size() - 1);
        Cohort cohort = membership.getCohort();
        StringBuilder sb = new StringBuilder();
        sb.append("Your Cohort Information:\n\n");
        sb.append(String.format("Cohort: %s\n", cohort.getCohortName()));
        if (cohort.getCohortCode() != null) {
            sb.append(String.format("Code: %s\n", cohort.getCohortCode()));
        }
        sb.append(String.format("Status: %s\n", formatEnum(cohort.getStatus().name())));
        sb.append(String.format("Your enrollment: %s\n", formatEnum(membership.getStatus().name())));
        if (cohort.getInstructor() != null) {
            sb.append(String.format("Instructor: %s\n", cohort.getInstructor().getFullName()));
            if (cohort.getInstructor().getPhone() != null) {
                sb.append(String.format("Instructor Phone: %s\n", cohort.getInstructor().getPhone()));
            }
        }
        return sb.toString();
    }

    private String handleMyGrades(Long candidateId) {
        List<Lesson> lessons = lessonRepository.findByCandidateId(candidateId);
        if (lessons.isEmpty()) {
            return "You don't have any grades yet. You are not currently enrolled in any courses.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Your Grades:\n\n");
        for (Lesson l : lessons) {
            String gradeInfo;
            if (l.isCompleted()) {
                gradeInfo = String.format("Score: %d/%d (Passed)", l.getObtainedScore(), l.getRequiredScore());
            } else if (l.getStatus() == Lesson.LessonStatus.IN_PROGRESS) {
                gradeInfo = String.format("Status: In Progress (Completion: %d%%)", l.getCompletionPercentage());
            } else {
                gradeInfo = "Not started";
            }
            sb.append(String.format("- %s: %s\n", l.getLessonTitle(), gradeInfo));
        }
        long passed = lessons.stream().filter(Lesson::isCompleted).count();
        sb.append(String.format("\nSummary: %d/%d lessons passed", passed, lessons.size()));
        return sb.toString();
    }

    private String formatEnum(String enumValue) {
        return Arrays.stream(enumValue.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                .collect(java.util.stream.Collectors.joining(" "));
    }

    private boolean containsWord(String text, String word) {
        return Pattern.compile("\\b" + Pattern.quote(word) + "\\b").matcher(text).find();
    }

    private boolean containsAny(String text, String... words) {
        for (String word : words) {
            if (text.contains(word)) return true;
        }
        return false;
    }

    private String truncate(String text, int maxLen) {
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen) + "...";
    }

    private AiChatResponse toChatResponse(AiChat chat, List<AiChatMessage> messages) {
        return AiChatResponse.builder()
                .id(chat.getId())
                .title(chat.getTitle())
                .status(chat.getStatus())
                .messageCount(chat.getMessageCount())
                .createdAt(chat.getCreatedAt())
                .messages(messages.stream().map(m -> AiChatMessageResponse.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .satisfied(m.getSatisfied())
                        .escalated(m.getEscalated())
                        .createdAt(m.getCreatedAt())
                        .build()).toList())
                .build();
    }
}
