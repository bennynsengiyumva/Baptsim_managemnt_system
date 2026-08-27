package com.church.baptism.controller;

import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final ChurchRepository churchRepository;
    private final DistrictRepository districtRepository;
    private final ChurchFieldRepository churchFieldRepository;

    public SearchController(CandidateRepository candidateRepository,
                            UserRepository userRepository,
                            ChurchRepository churchRepository,
                            DistrictRepository districtRepository,
                            ChurchFieldRepository churchFieldRepository) {
        this.candidateRepository = candidateRepository;
        this.userRepository = userRepository;
        this.churchRepository = churchRepository;
        this.districtRepository = districtRepository;
        this.churchFieldRepository = churchFieldRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<Map<String, Object>>>> search(@RequestParam("q") String query) {
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();

        String lowerQuery = query.toLowerCase();

        results.put("candidates", candidateRepository.findAll().stream()
                .filter(c -> matchesCandidate(c, lowerQuery))
                .limit(20)
                .map(this::toCandidateResult)
                .collect(Collectors.toList()));

        results.put("users", userRepository.findAll().stream()
                .filter(u -> matchesUser(u, lowerQuery))
                .limit(20)
                .map(this::toUserResult)
                .collect(Collectors.toList()));

        results.put("churches", churchRepository.findAll().stream()
                .filter(c -> matchesChurch(c, lowerQuery))
                .limit(20)
                .map(this::toChurchResult)
                .collect(Collectors.toList()));

        results.put("districts", districtRepository.findAll().stream()
                .filter(d -> matchesDistrict(d, lowerQuery))
                .limit(20)
                .map(this::toDistrictResult)
                .collect(Collectors.toList()));

        results.put("fields", churchFieldRepository.findAll().stream()
                .filter(f -> matchesField(f, lowerQuery))
                .limit(20)
                .map(this::toFieldResult)
                .collect(Collectors.toList()));

        return ResponseEntity.ok(results);
    }

    private boolean matchesCandidate(Candidate c, String query) {
        return (c.getFullName() != null && c.getFullName().toLowerCase().contains(query))
                || (c.getEmail() != null && c.getEmail().toLowerCase().contains(query));
    }

    private boolean matchesUser(User u, String query) {
        return (u.getFullName() != null && u.getFullName().toLowerCase().contains(query))
                || (u.getEmail() != null && u.getEmail().toLowerCase().contains(query));
    }

    private boolean matchesChurch(Church c, String query) {
        return c.getChurchName() != null && c.getChurchName().toLowerCase().contains(query);
    }

    private boolean matchesDistrict(District d, String query) {
        return d.getName() != null && d.getName().toLowerCase().contains(query);
    }

    private boolean matchesField(ChurchField f, String query) {
        return f.getName() != null && f.getName().toLowerCase().contains(query);
    }

    private Map<String, Object> toCandidateResult(Candidate c) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", c.getId());
        result.put("type", "candidate");
        result.put("name", c.getFullName());
        result.put("subtitle", c.getEmail());
        result.put("url", "/candidates/" + c.getId());
        return result;
    }

    private Map<String, Object> toUserResult(User u) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", u.getId());
        result.put("type", "user");
        result.put("name", u.getFullName());
        result.put("subtitle", u.getEmail());
        result.put("url", "/users/" + u.getId());
        return result;
    }

    private Map<String, Object> toChurchResult(Church c) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", c.getId());
        result.put("type", "church");
        result.put("name", c.getChurchName());
        result.put("subtitle", c.getAddress());
        result.put("url", "/churches/" + c.getId());
        return result;
    }

    private Map<String, Object> toDistrictResult(District d) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", d.getId());
        result.put("type", "district");
        result.put("name", d.getName());
        result.put("subtitle", d.getCode());
        result.put("url", "/districts/" + d.getId());
        return result;
    }

    private Map<String, Object> toFieldResult(ChurchField f) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", f.getId());
        result.put("type", "field");
        result.put("name", f.getName());
        result.put("subtitle", f.getCode());
        result.put("url", "/fields/" + f.getId());
        return result;
    }
}
