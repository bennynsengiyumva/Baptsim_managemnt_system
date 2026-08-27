package com.church.baptism.service.church;

import com.church.baptism.dto.request.DistrictRequest;
import com.church.baptism.dto.response.DistrictResponse;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.entity.church.DistrictAssignment;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.DistrictAssignmentRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistrictService {

    private final DistrictRepository repository;
    private final ChurchFieldRepository fieldRepository;
    private final UserRepository userRepository;
    private final DistrictAssignmentRepository districtAssignmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DistrictService(DistrictRepository repository, ChurchFieldRepository fieldRepository,
                           UserRepository userRepository, DistrictAssignmentRepository districtAssignmentRepository,
                           PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
        this.districtAssignmentRepository = districtAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public DistrictResponse create(DistrictRequest request) {
        ChurchField field = fieldRepository.findById(request.fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));
        District district = new District(request.name, field);
        district.setCode(request.code);
        district.setAddress(request.address);
        district.setPhone(request.phone);
        district.setEmail(request.email);
        district = repository.save(district);

        // Create HEAD_OF_DISTRICT account if requested
        if (request.createHeadAccount && request.headEmail != null && request.headPassword != null) {
            User head = new User();
            head.setFullName(request.headFullName != null ? request.headFullName : request.name + " Head");
            head.setEmail(request.headEmail);
            head.setPhone(request.headPhone);
            head.setPassword(passwordEncoder.encode(request.headPassword));
            head.setRole(Role.HEAD_OF_DISTRICT);
            head.setUnion(field.getUnion());
            head.setField(field);
            head.setDistrict(district);
            userRepository.save(head);

            // Auto-assign as head of district
            DistrictAssignment assignment = new DistrictAssignment();
            assignment.setDistrict(district);
            assignment.setPastor(head);
            assignment.setStartDate(LocalDate.now());
            assignment.setStatus(DistrictAssignment.AssignmentStatus.ACTIVE);
            assignment.setPerformedBy("System");
            districtAssignmentRepository.save(assignment);
        }

        return mapToResponse(district);
    }

    public List<DistrictResponse> getAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<DistrictResponse> getByField(Long fieldId) {
        return repository.findByFieldId(fieldId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public DistrictResponse getById(Long id) {
        return mapToResponse(repository.findById(id).orElseThrow(() -> new RuntimeException("District not found")));
    }

    public DistrictResponse update(Long id, DistrictRequest request) {
        District district = repository.findById(id).orElseThrow(() -> new RuntimeException("District not found"));
        if (request.fieldId != null) {
            ChurchField field = fieldRepository.findById(request.fieldId)
                    .orElseThrow(() -> new RuntimeException("Field not found"));
            district.setField(field);
        }
        district.setName(request.name);
        district.setCode(request.code);
        district.setAddress(request.address);
        district.setPhone(request.phone);
        district.setEmail(request.email);
        return mapToResponse(repository.save(district));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private DistrictResponse mapToResponse(District district) {
        DistrictResponse r = new DistrictResponse();
        r.setId(district.getId());
        r.setName(district.getName());
        r.setCode(district.getCode());
        r.setAddress(district.getAddress());
        r.setPhone(district.getPhone());
        r.setEmail(district.getEmail());
        r.setActive(district.isActive());
        if (district.getField() != null) {
            r.setFieldId(district.getField().getId());
            r.setFieldName(district.getField().getName());
        }
        // Include head info from active assignment
        DistrictAssignment activeAssignment = districtAssignmentRepository.findByDistrictIdAndStatus(
                district.getId(), DistrictAssignment.AssignmentStatus.ACTIVE)
                .stream().findFirst().orElse(null);
        if (activeAssignment != null && activeAssignment.getPastor() != null) {
            User head = activeAssignment.getPastor();
            r.setHeadUserId(head.getId());
            r.setHeadUserName(head.getFullName());
            r.setHeadUserEmail(head.getEmail());
            r.setHeadUserPhone(head.getPhone());
        }
        return r;
    }
}
