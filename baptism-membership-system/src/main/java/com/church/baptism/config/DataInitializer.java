package com.church.baptism.config;

import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.baptism.BaptismEvent;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.church.Union;
import com.church.baptism.entity.cohort.Cohort;
import com.church.baptism.entity.cohort.CohortMember;
import com.church.baptism.entity.elder.FirstChurchElder;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.lesson.LessonAttempt;
import com.church.baptism.entity.lesson.LessonQuestion;
import com.church.baptism.entity.member.Member;
import com.church.baptism.entity.notification.Notification;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismEventRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.church.UnionRepository;
import com.church.baptism.repository.cohort.CohortMemberRepository;
import com.church.baptism.repository.cohort.CohortRepository;
import com.church.baptism.repository.elder.FirstChurchElderRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.lesson.LessonAttemptRepository;
import com.church.baptism.repository.lesson.LessonQuestionRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.member.MemberRepository;
import com.church.baptism.repository.notification.NotificationRepository;
import com.church.baptism.repository.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true", matchIfMissing = false)
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UnionRepository unionRepository;
    private final ChurchFieldRepository fieldRepository;
    private final DistrictRepository districtRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final InstructorRepository instructorRepository;
    private final CandidateRepository candidateRepository;
    private final FirstChurchElderRepository elderRepository;
    private final CohortRepository cohortRepository;
    private final CohortMemberRepository cohortMemberRepository;
    private final LessonRepository lessonRepository;
    private final LessonQuestionRepository questionRepository;
    private final LessonAttemptRepository attemptRepository;
    private final BaptismEventRepository eventRepository;
    private final BaptismRepository baptismRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UnionRepository unionRepository, ChurchFieldRepository fieldRepository,
            DistrictRepository districtRepository, ChurchRepository churchRepository,
            UserRepository userRepository, InstructorRepository instructorRepository,
            CandidateRepository candidateRepository, FirstChurchElderRepository elderRepository,
            CohortRepository cohortRepository, CohortMemberRepository cohortMemberRepository,
            LessonRepository lessonRepository, LessonQuestionRepository questionRepository,
            LessonAttemptRepository attemptRepository, BaptismEventRepository eventRepository,
            BaptismRepository baptismRepository, MemberRepository memberRepository,
            NotificationRepository notificationRepository, PasswordEncoder passwordEncoder
    ) {
        this.unionRepository = unionRepository;
        this.fieldRepository = fieldRepository;
        this.districtRepository = districtRepository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
        this.instructorRepository = instructorRepository;
        this.candidateRepository = candidateRepository;
        this.elderRepository = elderRepository;
        this.cohortRepository = cohortRepository;
        this.cohortMemberRepository = cohortMemberRepository;
        this.lessonRepository = lessonRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.eventRepository = eventRepository;
        this.baptismRepository = baptismRepository;
        this.memberRepository = memberRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        long userCount = userRepository.count();
        boolean hasDemoData = userRepository.findByEmail("head.rum@sda.rw").isPresent();
        boolean hasLessons = lessonRepository.count() > 10;
        if (userCount > 5 && hasDemoData && hasLessons) {
            log.info("Demo data already exists ({} users, {} lessons), skipping initialization.", userCount, lessonRepository.count());
            return;
        }
        log.info("Starting demo data initialization... Current user count: {}, lessons: {}", userCount, lessonRepository.count());

        Union union = unionRepository.findById(1L).orElseGet(() -> {
            Union u = new Union();
            u.setName("Rwanda Union Mission");
            u.setCode("RUM");
            u.setEmail("info@rwanda-sda.org");
            u.setPhone("+250788000000");
            return unionRepository.save(u);
        });

        Map<String, ChurchField> fields = createFields(union);
        Map<String, District> districts = createDistricts(fields);
        List<Church> churches = createChurches(districts);
        Map<String, User> leadershipUsers = createLeadershipUsers(union, fields, districts);
        linkPastorsToChurches(churches, leadershipUsers);
        List<User> pastorUsers = createPastorUsers(churches, leadershipUsers);
        List<Church> allChurches = new ArrayList<>(churches);
        allChurches.addAll(churchRepository.findAll());
        List<Instructor> instructors = createInstructors(allChurches);
        List<User> instructorUsers = createInstructorUsers(instructors);
        List<FirstChurchElder> elders = createElders(allChurches);
        List<Candidate> candidates = createCandidates(allChurches, instructors);
        List<Cohort> cohorts = createCohorts(allChurches, instructors, candidates);
        createLessons(candidates, instructors);
        List<BaptismEvent> events = createBaptismEvents();
        createBaptisms(candidates, events);
        createNotifications(pastorUsers, instructorUsers, candidates);

        log.info("Demo data initialization complete! Total users: {}", userRepository.count());
    }

    private Map<String, ChurchField> createFields(Union union) {
        Map<String, ChurchField> map = new LinkedHashMap<>();
        String[] names = {"Central Rwanda Field", "East Central Rwanda Field", "North Rwanda Field",
                "North-East Rwanda Field", "North-West Rwanda Field", "South Rwanda Field",
                "South-East Rwanda Field", "West Rwanda Field"};
        for (String name : names) {
            Optional<ChurchField> existing = fieldRepository.findByUnionId(union.getId())
                    .stream().filter(f -> f.getName().equals(name)).findFirst();
            if (existing.isPresent()) {
                map.put(name, existing.get());
            } else {
                ChurchField f = new ChurchField();
                f.setName(name);
                f.setUnion(union);
                f.setCode(name.substring(0, 3).toUpperCase());
                map.put(name, fieldRepository.save(f));
            }
        }
        return map;
    }

    private Map<String, District> createDistricts(Map<String, ChurchField> fields) {
        Map<String, District> map = new LinkedHashMap<>();
        Map<String, String> districtToField = new LinkedHashMap<>();
        districtToField.put("Kigali Central District", "Central Rwanda Field");
        districtToField.put("Remera District", "Central Rwanda Field");
        districtToField.put("Kicukiro District", "Central Rwanda Field");
        districtToField.put("Gisenyi District", "North-West Rwanda Field");
        districtToField.put("Musanze District", "North Rwanda Field");
        districtToField.put("Huye District", "South Rwanda Field");
        districtToField.put("Muhanga District", "South Rwanda Field");
        districtToField.put("Rubavu District", "North-West Rwanda Field");
        districtToField.put("Rusizi District", "South-West Rwanda Field");
        districtToField.put("Rwamagana District", "East Central Rwanda Field");
        districtToField.put("Nyagatare District", "North-East Rwanda Field");
        districtToField.put("Gatsibo District", "North-East Rwanda Field");

        for (Map.Entry<String, String> entry : districtToField.entrySet()) {
            String distName = entry.getKey();
            String fieldName = entry.getValue();
            Optional<District> existing = districtRepository.findAll().stream()
                    .filter(d -> d.getName().equals(distName)).findFirst();
            if (existing.isPresent()) {
                map.put(distName, existing.get());
            } else {
                ChurchField field = fields.get(fieldName);
                if (field == null) field = fields.values().iterator().next();
                District d = new District();
                d.setName(distName);
                d.setCode(distName.substring(0, 3).toUpperCase());
                d.setField(field);
                map.put(distName, districtRepository.save(d));
            }
        }
        return map;
    }

    private List<Church> createChurches(Map<String, District> districts) {
        List<Church> result = new ArrayList<>();
        Map<String, String[]> churchData = new LinkedHashMap<>();
        churchData.put("Kigali Central SDA Church", new String[]{"Kigali Central District", "Kigali", "+250788101001"});
        churchData.put("Kimironko SDA Church", new String[]{"Kigali Central District", "Kimironko", "+250788101002"});
        churchData.put("Remera SDA Church", new String[]{"Remera District", "Remera", "+250788101003"});
        churchData.put("Kicukiro SDA Church", new String[]{"Kicukiro District", "Kicukiro", "+250788101004"});
        churchData.put("Gikondo SDA Church", new String[]{"Kicukiro District", "Gikondo", "+250788101005"});
        churchData.put("Gisozi SDA Church", new String[]{"Kigali Central District", "Gisozi", "+250788101006"});
        churchData.put("Nyamirambo SDA Church", new String[]{"Kigali Central District", "Nyamirambo", "+250788101007"});
        churchData.put("Kimisagara SDA Church", new String[]{"Kigali Central District", "Kimisagara", "+250788101008"});
        churchData.put("Kabuga SDA Church", new String[]{"Rwamagana District", "Kabuga", "+250788101009"});
        churchData.put("Kacyiru SDA Church", new String[]{"Kigali Central District", "Kacyiru", "+250788101010"});
        churchData.put("Gisenyi Central SDA Church", new String[]{"Gisenyi District", "Gisenyi", "+250788101011"});
        churchData.put("Musanze SDA Church", new String[]{"Musanze District", "Musanze", "+250788101012"});
        churchData.put("Huye SDA Church", new String[]{"Huye District", "Huye", "+250788101013"});
        churchData.put("Muhanga SDA Church", new String[]{"Muhanga District", "Muhanga", "+250788101014"});
        churchData.put("Rubavu SDA Church", new String[]{"Rubavu District", "Rubavu", "+250788101015"});
        churchData.put("Rusizi SDA Church", new String[]{"Rusizi District", "Rusizi", "+250788101016"});
        churchData.put("Rwamagana SDA Church", new String[]{"Rwamagana District", "Rwamagana", "+250788101017"});
        churchData.put("Nyagatare SDA Church", new String[]{"Nyagatare District", "Nyagatare", "+250788101018"});

        for (Map.Entry<String, String[]> entry : churchData.entrySet()) {
            String churchName = entry.getKey();
            Optional<Church> existing = churchRepository.findAll().stream()
                    .filter(c -> c.getChurchName().equals(churchName)).findFirst();
            if (existing.isPresent()) {
                result.add(existing.get());
            } else {
                String distName = entry.getValue()[0];
                District district = districts.get(distName);
                if (district == null) district = districts.values().iterator().next();
                Church c = new Church();
                c.setChurchName(churchName);
                c.setDistrict(district);
                c.setAddress(entry.getValue()[1]);
                c.setPhone(entry.getValue()[2]);
                c.setEmail(churchName.toLowerCase().replace(" ", ".").replace("sda", "") + "@sda.rw");
                result.add(churchRepository.save(c));
            }
        }
        return result;
    }

    private Map<String, User> createLeadershipUsers(Union union, Map<String, ChurchField> fields, Map<String, District> districts) {
        Map<String, User> map = new LinkedHashMap<>();
        String defaultPass = passwordEncoder.encode("demo123");

        if (userRepository.findByEmail("head.rum@sda.rw").isEmpty()) {
            User rum = new User();
            rum.setFullName("Jean-Pierre Ndayisaba");
            rum.setEmail("head.rum@sda.rw");
            rum.setPhone("+250788100001");
            rum.setRole(Role.HEAD_OF_RUM);
            rum.setPassword(defaultPass);
            rum.setUnion(union);
            rum.setField(fields.values().iterator().next());
            rum.setEnabled(true);
            rum.setEmailVerified(true);
            map.put("HEAD_OF_RUM", userRepository.save(rum));
        } else {
            map.put("HEAD_OF_RUM", userRepository.findByEmail("head.rum@sda.rw").get());
        }

        String[][] fieldHeads = {
                {"Emmanuel Hakizimana", "head.central@sda.rw", "+250788100010", "Central Rwanda Field"},
                {"Alice Uwimana", "head.eastcentral@sda.rw", "+250788100011", "East Central Rwanda Field"},
                {"David Mugabo", "head.north@sda.rw", "+250788100012", "North Rwanda Field"},
                {"Grace Uwera", "head.northeast@sda.rw", "+250788100013", "North-East Rwanda Field"},
                {"Samuel Niyonzima", "head.northwest@sda.rw", "+250788100014", "North-West Rwanda Field"},
                {"Marie Claire Mukamana", "head.south@sda.rw", "+250788100015", "South Rwanda Field"},
                {"Jean Baptiste Habimana", "head.southeast@sda.rw", "+250788100016", "South-East Rwanda Field"},
                {"Ange Irukera", "head.west@sda.rw", "+250788100017", "West Rwanda Field"}
        };
        for (String[] fh : fieldHeads) {
            if (userRepository.findByEmail(fh[1]).isEmpty()) {
                User u = new User();
                u.setFullName(fh[0]);
                u.setEmail(fh[1]);
                u.setPhone(fh[2]);
                u.setRole(Role.HEAD_OF_FIELD);
                u.setPassword(defaultPass);
                u.setUnion(union);
                u.setField(fields.get(fh[3]));
                u.setEnabled(true);
                u.setEmailVerified(true);
                userRepository.save(u);
            }
        }

        String[][] districtHeads = {
                {"Jean Bosco Rugema", "head.kigalicentral@sda.rw", "+250788100100", "Kigali Central District"},
                {"Epiphanie Nyirahabimana", "head.remera@sda.rw", "+250788100101", "Remera District"},
                {"Felix Twahirwa", "head.kicukiro@sda.rw", "+250788100102", "Kicukiro District"},
                {"Chantal Uwimana", "head.gisenyi@sda.rw", "+250788100103", "Gisenyi District"},
                {"Patrick Nkurunziza", "head.musanze@sda.rw", "+250788100104", "Musanze District"},
                {"Immaculee Kayitesi", "head.huye@sda.rw", "+250788100105", "Huye District"},
                {"Celestin Gakumba", "head.muhanga@sda.rw", "+250788100106", "Muhanga District"},
                {"Jeanne d'Arc Mukamuciza", "head.rubavu@sda.rw", "+250788100107", "Rubavu District"},
                {"Aimable Niyongira", "head.rusizi@sda.rw", "+250788100108", "Rusizi District"},
                {"Bernadette Mukamana", "head.rwamagana@sda.rw", "+250788100109", "Rwamagana District"},
                {"Dieudonné Niyomwungere", "head.nyagatare@sda.rw", "+250788100110", "Nyagatare District"},
                {"Esperance Musabende", "head.gatsibo@sda.rw", "+250788100111", "Gatsibo District"}
        };
        for (String[] dh : districtHeads) {
            if (userRepository.findByEmail(dh[1]).isEmpty()) {
                User u = new User();
                u.setFullName(dh[0]);
                u.setEmail(dh[1]);
                u.setPhone(dh[2]);
                u.setRole(Role.HEAD_OF_DISTRICT);
                u.setPassword(defaultPass);
                District dist = districts.get(dh[3]);
                if (dist != null) {
                    u.setDistrict(dist);
                    u.setField(dist.getField());
                    u.setUnion(union);
                }
                u.setEnabled(true);
                u.setEmailVerified(true);
                userRepository.save(u);
            }
        }
        return map;
    }

    private void linkPastorsToChurches(List<Church> churches, Map<String, User> leadership) {
        for (Church c : churches) {
            if (c.getPastor() == null) {
                String pastorEmail = "pastor." + c.getChurchName().toLowerCase().replace(" ", "").replace("sda", "") + "@sda.rw";
                Optional<User> existingPastor = userRepository.findByEmail(pastorEmail);
                if (existingPastor.isPresent()) {
                    c.setPastor(existingPastor.get());
                    churchRepository.save(c);
                }
            }
        }
    }

    private List<User> createPastorUsers(List<Church> churches, Map<String, User> leadership) {
        List<User> pastors = new ArrayList<>();
        String defaultPass = passwordEncoder.encode("demo123");
        String[] pastorNames = {
                "Pasteur Jean-Pierre Habimana", "Pasteur Tharcisse Muvunyi", "Pasteur Marie Goreth Uwimana",
                "Pasteur Celestin Ndayisaba", "Pasteur Esperance Nyirahabimana", "Pasteur Jean d'Arc Mukamana",
                "Pasteur Innocent Nzeyimana", "Pasteur Chantal Uwase", "Pasteur Dieudonné Habimana",
                "Pasteur Bernadette Uwimana", "Pasteur Patrick Ndayisaba", "Pasteur Immaculee Uwera",
                "Pasteur Samuel Mugabo", "Pasteur Grace Nyiraneza", "Pasteur Felix Uwimana",
                "Pasteur Ange Iribagiza", "Pasteur David Niyonzima", "Pasteur Alice Mukamana"
        };

        for (int i = 0; i < churches.size() && i < pastorNames.length; i++) {
            Church c = churches.get(i);
            if (c.getPastor() != null) {
                pastors.add(c.getPastor());
                continue;
            }
            String email = "pastor." + c.getChurchName().toLowerCase().replace(" ", "").replace("sda", "") + "@sda.rw";
            if (userRepository.findByEmail(email).isPresent()) {
                pastors.add(userRepository.findByEmail(email).get());
                continue;
            }
            User u = new User();
            u.setFullName(pastorNames[i]);
            u.setEmail(email);
            u.setPhone("+2507882000" + String.format("%02d", i));
            u.setRole(Role.PASTOR);
            u.setPassword(defaultPass);
            u.setChurch(c);
            if (c.getDistrict() != null) {
                u.setDistrict(c.getDistrict());
                if (c.getDistrict().getField() != null) u.setField(c.getDistrict().getField());
                u.setUnion(c.getDistrict().getField().getUnion());
            }
            u.setEnabled(true);
            u.setEmailVerified(true);
            u = userRepository.save(u);
            c.setPastor(u);
            churchRepository.save(c);
            pastors.add(u);
        }
        return pastors;
    }

    private List<Instructor> createInstructors(List<Church> churches) {
        List<Instructor> result = new ArrayList<>();
        String[][] instructorData = {
                {"Jean Claude Nshimiyimana", "0788300101", "10 years", "Biblical Studies"},
                {"Claudine Uwimana", "0788300102", "8 years", "Theology"},
                {"Eric Niyonzima", "0788300103", "5 years", "Pastoral Ministry"},
                {"Francoise Mukamana", "0788300104", "12 years", "Christian Education"},
                {"Gilbert Habimana", "0788300105", "7 years", "Spiritual Formation"},
                {"Helene Uwera", "0788300106", "6 years", "Bible Studies"},
                {"Ignace Ndayisaba", "0788300107", "9 years", "Evangelism"},
                {"Josiane Nyirahabimana", "0788300108", "4 years", "Youth Ministry"},
                {"Kevin Mugabo", "0788300109", "3 years", "Church History"},
                {"Liliane Uwimana", "0788300110", "11 years", "Christian Leadership"},
                {"Marc Nkurunziza", "0788300111", "8 years", "Missionary Studies"},
                {"Nadine Iribagiza", "0788300112", "5 years", "Family Ministry"},
                {"Olivier Twahirwa", "0788300113", "6 years", "Health Ministry"},
                {"Patricia Mukamuciza", "0788300114", "10 years", "Religious Education"},
                {"Roger Niyongira", "0788300115", "7 years", "Public Health"},
                {"Sophie Gakumba", "0788300116", "4 years", "Community Development"},
                {"Thierry Hakizimana", "0788300117", "9 years", "Spiritual Counseling"},
                {"Valerie Kayitesi", "0788300118", "3 years", "Music Ministry"},
                {"Wilfried Nzeyimana", "0788300119", "5 years", "Biblical Archaeology"},
                {"Yvette Musabende", "0788300120", "8 years", "Theological Education"}
        };

        int idx = 0;
        for (Church church : churches) {
            int count = 0;
            int maxPerChurch = 2 + (ThreadLocalRandom.current().nextInt(0, 2));
            while (count < maxPerChurch && idx < instructorData.length) {
                String email = "instructor." + instructorData[idx][0].toLowerCase().replace(" ", "").replace(".", "") + "@sda.rw";
                if (userRepository.findByEmail(email).isPresent()) {
                    Optional<Instructor> existing = instructorRepository.findByEmail(email);
                    if (existing.isPresent()) result.add(existing.get());
                    idx++;
                    count++;
                    continue;
                }
                User u = new User();
                u.setFullName(instructorData[idx][0]);
                u.setEmail(email);
                u.setPhone("+250" + instructorData[idx][1]);
                u.setRole(Role.INSTRUCTOR);
                u.setPassword(passwordEncoder.encode("demo123"));
                u.setChurch(church);
                if (church.getDistrict() != null) {
                    u.setDistrict(church.getDistrict());
                    if (church.getDistrict().getField() != null) u.setField(church.getDistrict().getField());
                }
                u.setEnabled(true);
                u.setEmailVerified(true);
                u = userRepository.save(u);

                Instructor instructor = new Instructor();
                instructor.setFullName(instructorData[idx][0]);
                instructor.setEmail(email);
                instructor.setPhone("+250" + instructorData[idx][1]);
                instructor.setYearsOfService(Integer.parseInt(instructorData[idx][2].replace(" years", "")));
                instructor.setQualification(instructorData[idx][3]);
                instructor.setChurch(church);
                instructor = instructorRepository.save(instructor);
                result.add(instructor);
                idx++;
                count++;
            }
        }
        return result;
    }

    private List<User> createInstructorUsers(List<Instructor> instructors) {
        List<User> users = new ArrayList<>();
        for (Instructor i : instructors) {
            Optional<User> u = userRepository.findByEmail(i.getEmail());
            u.ifPresent(users::add);
        }
        return users;
    }

    private List<FirstChurchElder> createElders(List<Church> churches) {
        List<FirstChurchElder> result = new ArrayList<>();
        String[] elderNames = {
                "Jean-Pierre Niyonsaba", "Marie Goreth Uwimana", "Tharcisse Muvunyi",
                "Esperance Nyirahabimana", "Celestin Ndayisaba", "Chantal Uwase",
                "Innocent Nzeyimana", "Bernadette Mukamana", "Dieudonné Habimana",
                "Immaculee Uwera", "Samuel Mugabo", "Grace Nyiraneza",
                "Felix Uwimana", "Ange Iribagiza", "David Niyonzima",
                "Alice Mukamana", "Patrick Twahirwa", "Nadine Kayitesi"
        };

        for (int i = 0; i < churches.size() && i < elderNames.length; i++) {
            Church c = churches.get(i);
            String email = "elder." + c.getChurchName().toLowerCase().replace(" ", "").replace("sda", "") + "@sda.rw";
            if (elderRepository.findByEmail(email).isPresent()) {
                result.add(elderRepository.findByEmail(email).get());
                continue;
            }
            FirstChurchElder elder = new FirstChurchElder();
            elder.setFullName(elderNames[i]);
            elder.setEmail(email);
            elder.setPhone("+2507884000" + String.format("%02d", i));
            elder.setChurch(c);
            result.add(elderRepository.save(elder));
        }
        return result;
    }

    private List<Candidate> createCandidates(List<Church> churches, List<Instructor> instructors) {
        List<Candidate> result = new ArrayList<>();
        String[] firstNamesMale = {"Jean", "Emmanuel", "David", "Samuel", "Patrick", "Eric", "Gilbert", "Ignace", "Kevin", "Marc",
                "Olivier", "Roger", "Thierry", "Wilfried", "Claude", "Felix", "Aimable", "Dieudonné", "Celestin", "Jean Bosco"};
        String[] firstNamesFemale = {"Marie", "Claudine", "Francoise", "Helene", "Josiane", "Liliane", "Nadine", "Patricia", "Sophie", "Valerie",
                "Yvette", "Grace", "Chantal", "Esperance", "Bernadette", "Immaculee", "Alice", "Ange", "Epiphanie", "Jeanne d'Arc"};
        String[] lastNames = {"Nshimiyimana", "Uwimana", "Niyonzima", "Mukamana", "Habimana", "Uwera", "Ndayisaba", "Nyirahabimana",
                "Mugabo", "Iribagiza", "Twahirwa", "Mukamuciza", "Niyongira", "Kayitesi", "Gakumba", "Hakizimana",
                "Nkurunziza", "Nzeyimana", "Musabende", "Uwase"};

        Candidate.CandidateStatus[] statuses = {
                Candidate.CandidateStatus.REGISTERED,
                Candidate.CandidateStatus.IN_PROGRESS,
                Candidate.CandidateStatus.IN_PROGRESS,
                Candidate.CandidateStatus.IN_PROGRESS,
                Candidate.CandidateStatus.READY_FOR_BAPTISM,
                Candidate.CandidateStatus.APPROVED_FOR_BAPTISM,
                Candidate.CandidateStatus.BAPTIZED,
                Candidate.CandidateStatus.BAPTIZED,
                Candidate.CandidateStatus.COURSE_COMPLETED,
                Candidate.CandidateStatus.CERTIFICATE_SIGNED
        };

        String[] referralSources = {"Church Member", "Friend", "Radio Program", "Social Media", "Community Event", "Family", "Neighbor", "Pastor Invitation"};

        int candidateIdx = 0;
        for (Church church : churches) {
            List<Instructor> churchInstructors = instructors.stream()
                    .filter(i -> i.getChurch().getId().equals(church.getId()))
                    .toList();
            if (churchInstructors.isEmpty()) continue;

            int numCandidates = 15 + ThreadLocalRandom.current().nextInt(0, 11);
            for (int i = 0; i < numCandidates; i++) {
                boolean isMale = ThreadLocalRandom.current().nextBoolean();
                String firstName = isMale ? firstNamesMale[candidateIdx % firstNamesMale.length] : firstNamesFemale[candidateIdx % firstNamesFemale.length];
                String lastName = lastNames[candidateIdx % lastNames.length];
                String fullName = firstName + " " + lastName;
                candidateIdx++;

                String email = "candidate." + fullName.toLowerCase().replace(" ", "").replace("'", "") + "@sda.rw";
                Optional<Candidate> existingCandidate = candidateRepository.findByEmail(email).stream().findFirst();
                if (existingCandidate.isPresent()) {
                    result.add(existingCandidate.get());
                    continue;
                }

                Instructor instructor = churchInstructors.get(candidateIdx % churchInstructors.size());
                Candidate.CandidateStatus status = statuses[candidateIdx % statuses.length];

                Candidate c = new Candidate();
                c.setFullName(fullName);
                c.setEmail(email);
                c.setPhone("+25078850" + String.format("%06d", candidateIdx));
                c.setGender(isMale ? "Male" : "Female");
                c.setDateOfBirth(LocalDate.of(1990 + ThreadLocalRandom.current().nextInt(0, 15),
                        1 + ThreadLocalRandom.current().nextInt(0, 12),
                        1 + ThreadLocalRandom.current().nextInt(0, 28)));
                c.setAddress(church.getDistrict() != null ? church.getDistrict().getName() : "Kigali");
                c.setReferralSource(referralSources[candidateIdx % referralSources.length]);
                c.setChurch(church);
                c.setInstructor(instructor);
                c.setStatus(status);
                c.setInstructorApproved(status == Candidate.CandidateStatus.READY_FOR_BAPTISM
                        || status == Candidate.CandidateStatus.APPROVED_FOR_BAPTISM
                        || status == Candidate.CandidateStatus.BAPTIZED
                        || status == Candidate.CandidateStatus.COURSE_COMPLETED
                        || status == Candidate.CandidateStatus.CERTIFICATE_SIGNED);
                c.setCreatedAt(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(30, 180)));
                result.add(candidateRepository.save(c));
            }
        }
        return result;
    }

    private List<Cohort> createCohorts(List<Church> churches, List<Instructor> instructors, List<Candidate> candidates) {
        List<Cohort> result = new ArrayList<>();
        String[] cohortNames = {"January 2026 Cohort", "March 2026 Cohort", "April Evening Cohort",
                "Youth Cohort", "Adult Cohort", "Weekend Cohort"};
        int cohortIdx = 0;

        for (Instructor instructor : instructors) {
            int numCohorts = 2 + ThreadLocalRandom.current().nextInt(0, 3);
            for (int i = 0; i < numCohorts && cohortIdx < cohortNames.length; i++) {
                String code = "Cohort-" + String.format("%03d", cohortIdx + 1);
                if (cohortRepository.existsByCohortCode(code)) {
                    cohortIdx++;
                    continue;
                }
                Cohort cohort = new Cohort();
                cohort.setCohortName(cohortNames[cohortIdx % cohortNames.length]);
                cohort.setCohortCode(code);
                cohort.setLanguage("en");
                cohort.setCapacity(20 + ThreadLocalRandom.current().nextInt(0, 11));
                cohort.setStatus(Cohort.CohortStatus.ACTIVE);
                cohort.setStartDate(LocalDate.now().minusMonths(ThreadLocalRandom.current().nextInt(1, 6)));
                cohort.setEndDate(LocalDate.now().plusMonths(ThreadLocalRandom.current().nextInt(1, 4)));
                cohort.setInstructor(instructor);
                cohort.setChurch(instructor.getChurch());
                cohort = cohortRepository.save(cohort);

                List<Candidate> instructorCandidates = candidates.stream()
                        .filter(c -> c.getInstructor() != null && c.getInstructor().getId().equals(instructor.getId()))
                        .toList();
                int enrolled = 0;
                for (Candidate candidate : instructorCandidates) {
                    if (enrolled >= cohort.getCapacity()) break;
                    if (cohortMemberRepository.existsByCohortIdAndCandidateId(cohort.getId(), candidate.getId())) continue;
                    CohortMember member = new CohortMember();
                    member.setCohort(cohort);
                    member.setCandidate(candidate);
                    member.setStatus(ThreadLocalRandom.current().nextDouble() > 0.2
                            ? CohortMember.EnrollmentStatus.APPROVED : CohortMember.EnrollmentStatus.ENROLLED);
                    member.setEnrolledAt(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(10, 90)));
                    if (member.getStatus() == CohortMember.EnrollmentStatus.APPROVED) {
                        member.setApprovedAt(member.getEnrolledAt().plusDays(1));
                    }
                    cohortMemberRepository.save(member);
                    enrolled++;
                }
                result.add(cohort);
                cohortIdx++;
            }
        }
        return result;
    }

    private void createLessons(List<Candidate> candidates, List<Instructor> instructors) {
        String[][] lessonData = {
                {"Introduction to the Bible", "An overview of the Bible, its structure, and divine inspiration.", "60", "60"},
                {"Knowing Jesus Christ", "Understanding the life, ministry, and teachings of Jesus.", "75", "70"},
                {"Salvation Through Faith", "Exploring the doctrine of salvation by grace through faith.", "65", "65"},
                {"Prayer and Christian Life", "The role of prayer in daily Christian living.", "50", "55"},
                {"The Ten Commandments", "Understanding God's moral law and its relevance today.", "70", "70"},
                {"Sabbath Observance", "The meaning and practice of the seventh-day Sabbath.", "55", "60"},
                {"Stewardship", "Managing God's gifts: time, talents, and resources.", "45", "50"},
                {"Spiritual Gifts", "Discovering and using spiritual gifts for ministry.", "60", "65"},
                {"Christian Lifestyle", "Living a Christ-centered life in a modern world.", "55", "60"},
                {"Church Membership and Baptism", "The meaning of baptism and church membership commitments.", "80", "70"}
        };

        String[][] questionBank = {
                {"What is the Bible?", "God's inspired word", "A history book", "A novel", "A science book"},
                {"Who wrote the Gospel of John?", "John the Apostle", "Paul", "Peter", "Matthew"},
                {"What is salvation?", "Deliverance from sin through faith", "Good works only", "Church attendance", "Baptism only"},
                {"How should Christians pray?", "With sincerity and faith", "Only in church", "Only at night", "Never"},
                {"How many commandments are there?", "Ten", "Five", "Twelve", "Seven"},
                {"Which day is the Sabbath?", "Saturday", "Sunday", "Monday", "Friday"},
                {"What does stewardship mean?", "Managing God's resources", "Saving money", "Giving to charity", "Working hard"},
                {"What is a spiritual gift?", "A divinely given ability", "A talent show", "A physical gift", "Money"},
                {"What is baptism?", "An outward sign of inward faith", "A bath", "A ceremony only", "A birthday"},
                {"Who is the head of the church?", "Jesus Christ", "The pastor", "The elder", "The pope"}
        };

        int lessonIdx = 0;
        for (Candidate candidate : candidates) {
            if (candidate.getInstructor() == null) continue;
            if (lessonRepository.findByCandidateId(candidate.getId()).size() >= 10) continue;
            List<Instructor> instructorsForCandidate = instructors.stream()
                    .filter(i -> i.getId().equals(candidate.getInstructor().getId()))
                    .toList();
            if (instructorsForCandidate.isEmpty()) continue;
            Instructor instructor = instructorsForCandidate.get(0);

            double progressRoll = ThreadLocalRandom.current().nextDouble();
            int lessonsToCreate = progressRoll < 0.15 ? 2 : progressRoll < 0.35 ? 4 : progressRoll < 0.6 ? 7 : 10;

            for (int i = 0; i < Math.min(lessonsToCreate, lessonData.length); i++) {
                Lesson lesson = new Lesson();
                lesson.setLessonTitle(lessonData[i][0]);
                lesson.setLessonDate(LocalDate.now().minusWeeks(10 - i));
                lesson.setNotes(lessonData[i][1]);
                lesson.setRequiredScore(Integer.parseInt(lessonData[i][2]));
                lesson.setLessonOrder(i + 1);
                lesson.setMaxAttempts(3);
                lesson.setCandidate(candidate);
                lesson.setInstructor(instructor);
                lesson.setCategory("Baptism Preparation");
                lesson.setDurationMinutes(Integer.parseInt(lessonData[i][3]));
                lesson.setDescription(lessonData[i][1]);

                boolean completed = i < lessonsToCreate - 1 || (lessonsToCreate == 10 && ThreadLocalRandom.current().nextDouble() > 0.3);
                lesson.setCompleted(completed);
                lesson.setStatus(completed ? Lesson.LessonStatus.COMPLETED : (i == lessonsToCreate - 1 ? Lesson.LessonStatus.IN_PROGRESS : Lesson.LessonStatus.COMPLETED));
                lesson.setCompletionPercentage(completed ? 100 : (i == lessonsToCreate - 1 ? 50 : 100));
                if (completed) {
                    lesson.setObtainedScore(lesson.getRequiredScore() + ThreadLocalRandom.current().nextInt(5, 25));
                    lesson.setCompletedAt(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(1, 60)));
                }
                lesson.setStartedAt(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(10, 90)));
                lesson = lessonRepository.save(lesson);

                String[] q = questionBank[i % questionBank.length];
                LessonQuestion question = new LessonQuestion();
                question.setQuestion(q[0]);
                question.setCorrectAnswer(q[1]);
                question.setOptions(List.of(q[1], q[2], q[3], q[4]));
                question.setOrderIndex(0);
                question.setLesson(lesson);
                questionRepository.save(question);

                if (completed) {
                    LessonAttempt attempt = new LessonAttempt();
                    attempt.setLesson(lesson);
                    attempt.setCandidate(candidate);
                    attempt.setAttemptNumber(1);
                    attempt.setScore(lesson.getObtainedScore());
                    attempt.setPassed(true);
                    attempt.setStartedAt(lesson.getStartedAt());
                    attempt.setCompletedAt(lesson.getCompletedAt());
                    attemptRepository.save(attempt);
                }
            }
        }
    }

    private List<BaptismEvent> createBaptismEvents() {
        List<BaptismEvent> result = new ArrayList<>();
        Object[][] events = {
                {"Kigali Central Baptism - March 2026", LocalDate.of(2026, 3, 15), "Kigali Central SDA Church", "Pasteur Jean-Pierre Habimana", BaptismEvent.BaptismEventStatus.COMPLETED},
                {"Easter Baptism - April 2026", LocalDate.of(2026, 4, 18), "Remera SDA Church", "Pasteur Tharcisse Muvunyi", BaptismEvent.BaptismEventStatus.COMPLETED},
                {"Youth Baptism - June 2026", LocalDate.of(2026, 6, 20), "Kicukiro SDA Church", "Pasteur Marie Goreth Uwimana", BaptismEvent.BaptismEventStatus.PLANNED},
                {"Independence Day Baptism - July 2026", LocalDate.of(2026, 7, 4), "Gisozi SDA Church", "Pasteur Celestin Ndayisaba", BaptismEvent.BaptismEventStatus.PLANNED},
                {"End of Year Baptism - December 2026", LocalDate.of(2026, 12, 19), "Kimironko SDA Church", "Pasteur Esperance Nyirahabimana", BaptismEvent.BaptismEventStatus.PLANNED}
        };

        for (Object[] e : events) {
            Optional<BaptismEvent> existing = eventRepository.findAllByOrderByEventDateDesc().stream()
                    .filter(ev -> ev.getEventName().equals(e[0])).findFirst();
            if (existing.isPresent()) {
                result.add(existing.get());
                continue;
            }
            BaptismEvent event = new BaptismEvent();
            event.setEventName((String) e[0]);
            event.setEventDate((LocalDate) e[1]);
            event.setLocation((String) e[2]);
            event.setOfficiatingPastor((String) e[3]);
            event.setDescription("Annual baptism event organized by the church.");
            event.setStatus((BaptismEvent.BaptismEventStatus) e[4]);
            result.add(eventRepository.save(event));
        }
        return result;
    }

    private void createBaptisms(List<Candidate> candidates, List<BaptismEvent> events) {
        List<Candidate> baptized = candidates.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED
                        || c.getStatus() == Candidate.CandidateStatus.COURSE_COMPLETED
                        || c.getStatus() == Candidate.CandidateStatus.CERTIFICATE_SIGNED)
                .toList();

        int order = 1;
        for (Candidate candidate : baptized) {
            if (baptismRepository.findByCandidateId(candidate.getId()).size() > 0) continue;
            BaptismEvent event = events.get(ThreadLocalRandom.current().nextInt(0, Math.min(2, events.size())));
            Baptism b = new Baptism();
            b.setBaptismDate(event.getEventDate());
            b.setLocation(event.getLocation());
            b.setOfficiatingPastor(event.getOfficiatingPastor());
            b.setWitnessName("Witness " + order);
            b.setSponsorName("Sponsor " + order);
            b.setBaptismOrder(order);
            b.setCertificateNumber("BAPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            b.setCandidate(candidate);
            b.setEvent(event);
            b.setRequestedAt(LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(30, 120)));
            b.setApproved(true);

            if (candidate.getStatus() == Candidate.CandidateStatus.BAPTIZED
                    || candidate.getStatus() == Candidate.CandidateStatus.CERTIFICATE_SIGNED) {
                b.setBaptized(true);
                b.setRequestStatus(Baptism.BaptismRequestStatus.BAPTIZED);
                b.setConfirmedAt(b.getRequestedAt().plusDays(5));
            } else {
                b.setRequestStatus(Baptism.BaptismRequestStatus.PENDING);
            }

            baptismRepository.save(b);
            Member member = new Member();
            member.setCandidate(candidate);
            member.setBaptismDate(b.getBaptismDate());
            member.setLocalChurch(candidate.getChurch() != null ? candidate.getChurch().getChurchName() : null);
            member.setStatus(Member.MemberStatus.ACTIVE);
            memberRepository.save(member);
            order++;
        }
    }

    private void createNotifications(List<User> pastors, List<User> instructors, List<Candidate> candidates) {
        List<User> allUsers = new ArrayList<>();
        allUsers.addAll(pastors);
        allUsers.addAll(instructors);
        userRepository.findByRole(Role.HEAD_OF_RUM).forEach(allUsers::add);
        userRepository.findByRole(Role.HEAD_OF_FIELD).forEach(allUsers::add);
        userRepository.findByRole(Role.HEAD_OF_DISTRICT).forEach(allUsers::add);

        String[][] notifTemplates = {
                {"New Lesson Available", "A new lesson has been assigned to your cohort.", "NEW_LESSON"},
                {"Baptism Event Available", "A new baptism event has been scheduled. Register now!", "BAPTISM_EVENT_AVAILABLE"},
                {"Cohort Enrollment Approved", "Your enrollment in the cohort has been approved.", "SYSTEM"},
                {"Instructor Assigned", "You have been assigned a new instructor.", "INSTRUCTOR_ASSIGNED"},
                {"Lesson Completed", "Congratulations! You have completed a lesson.", "PROGRESS_UPDATE"},
                {"Baptism Request Approved", "Your baptism request has been approved.", "BAPTISM_APPROVAL"},
                {"Certificate Generated", "Your baptism certificate has been generated.", "BAPTISM_CERTIFICATE_READY"},
                {"Church Announcement", "New announcement from your church leadership.", "CHURCH_ANNOUNCEMENT"},
                {"Progress Update", "Your course progress has been updated.", "PROGRESS_UPDATE"},
                {"New Cohort Available", "A new cohort is now accepting enrollments.", "SYSTEM"}
        };

        int idx = 0;
        for (User user : allUsers) {
            if (user == null) continue;
            int numNotifs = 3 + ThreadLocalRandom.current().nextInt(0, 6);
            for (int i = 0; i < numNotifs; i++) {
                String[] template = notifTemplates[idx % notifTemplates.length];
                Notification n = new Notification();
                n.setUser(user);
                n.setTitle(template[0]);
                n.setMessage(template[1]);
                n.setType(NotificationType.valueOf(template[2]));
                n.setRead(ThreadLocalRandom.current().nextDouble() > 0.4);
                notificationRepository.save(n);
                idx++;
            }
        }
    }
}
