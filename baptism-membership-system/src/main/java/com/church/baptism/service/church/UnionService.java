package com.church.baptism.service.church;

import com.church.baptism.dto.request.UnionRequest;
import com.church.baptism.dto.response.UnionResponse;
import com.church.baptism.entity.church.Union;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.church.UnionRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UnionService {

    private final UnionRepository repository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UnionService(UnionRepository repository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UnionResponse create(UnionRequest request) {
        Union union = new Union(request.name);
        union.setCode(request.code);
        union.setAddress(request.address);
        union.setPhone(request.phone);
        union.setEmail(request.email);
        union = repository.save(union);

        // Create HEAD_OF_RUM account if requested
        if (request.createHeadAccount && request.headEmail != null && request.headPassword != null) {
            User head = new User();
            head.setFullName(request.headFullName != null ? request.headFullName : request.name + " Head");
            head.setEmail(request.headEmail);
            head.setPhone(request.headPhone);
            head.setPassword(passwordEncoder.encode(request.headPassword));
            head.setRole(Role.HEAD_OF_RUM);
            head.setUnion(union);
            userRepository.save(head);
        }

        return mapToResponse(union);
    }

    public List<UnionResponse> getAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public UnionResponse getById(Long id) {
        return mapToResponse(repository.findById(id).orElseThrow(() -> new RuntimeException("Union not found")));
    }

    public UnionResponse update(Long id, UnionRequest request) {
        Union union = repository.findById(id).orElseThrow(() -> new RuntimeException("Union not found"));
        union.setName(request.name);
        union.setCode(request.code);
        union.setAddress(request.address);
        union.setPhone(request.phone);
        union.setEmail(request.email);
        return mapToResponse(repository.save(union));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private UnionResponse mapToResponse(Union union) {
        UnionResponse r = new UnionResponse();
        r.setId(union.getId());
        r.setName(union.getName());
        r.setCode(union.getCode());
        r.setAddress(union.getAddress());
        r.setPhone(union.getPhone());
        r.setEmail(union.getEmail());
        r.setActive(union.isActive());
        return r;
    }
}
