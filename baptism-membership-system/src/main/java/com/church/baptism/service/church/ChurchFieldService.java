package com.church.baptism.service.church;

import com.church.baptism.dto.request.ChurchFieldRequest;
import com.church.baptism.dto.response.ChurchFieldResponse;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.Union;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.UnionRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChurchFieldService {

    private final ChurchFieldRepository repository;
    private final UnionRepository unionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ChurchFieldService(ChurchFieldRepository repository, UnionRepository unionRepository,
                              UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.unionRepository = unionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ChurchFieldResponse create(ChurchFieldRequest request) {
        Union union = unionRepository.findById(request.unionId)
                .orElseThrow(() -> new RuntimeException("Union not found"));
        ChurchField field = new ChurchField(request.name, union);
        field.setCode(request.code);
        field.setAddress(request.address);
        field.setPhone(request.phone);
        field.setEmail(request.email);
        field = repository.save(field);

        // Create HEAD_OF_FIELD account if requested
        if (request.createHeadAccount && request.headEmail != null && request.headPassword != null) {
            User head = new User();
            head.setFullName(request.headFullName != null ? request.headFullName : request.name + " Head");
            head.setEmail(request.headEmail);
            head.setPhone(request.headPhone);
            head.setPassword(passwordEncoder.encode(request.headPassword));
            head.setRole(Role.HEAD_OF_FIELD);
            head.setUnion(union);
            head.setField(field);
            userRepository.save(head);
        }

        return mapToResponse(field);
    }

    public List<ChurchFieldResponse> getAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ChurchFieldResponse> getByUnion(Long unionId) {
        return repository.findByUnionId(unionId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ChurchFieldResponse getById(Long id) {
        return mapToResponse(repository.findById(id).orElseThrow(() -> new RuntimeException("Field not found")));
    }

    public ChurchFieldResponse update(Long id, ChurchFieldRequest request) {
        ChurchField field = repository.findById(id).orElseThrow(() -> new RuntimeException("Field not found"));
        if (request.unionId != null) {
            Union union = unionRepository.findById(request.unionId)
                    .orElseThrow(() -> new RuntimeException("Union not found"));
            field.setUnion(union);
        }
        field.setName(request.name);
        field.setCode(request.code);
        field.setAddress(request.address);
        field.setPhone(request.phone);
        field.setEmail(request.email);
        return mapToResponse(repository.save(field));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private ChurchFieldResponse mapToResponse(ChurchField field) {
        ChurchFieldResponse r = new ChurchFieldResponse();
        r.setId(field.getId());
        r.setName(field.getName());
        r.setCode(field.getCode());
        r.setAddress(field.getAddress());
        r.setPhone(field.getPhone());
        r.setEmail(field.getEmail());
        r.setActive(field.isActive());
        if (field.getUnion() != null) {
            r.setUnionId(field.getUnion().getId());
            r.setUnionName(field.getUnion().getName());
        }
        return r;
    }
}
