package com.church.baptism.service.elder;

import com.church.baptism.dto.request.FirstChurchElderRequest;
import com.church.baptism.dto.response.FirstChurchElderResponse;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.elder.FirstChurchElder;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.elder.FirstChurchElderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FirstChurchElderService {

    private final FirstChurchElderRepository repository;
    private final ChurchRepository churchRepository;

    public FirstChurchElderService(FirstChurchElderRepository repository, ChurchRepository churchRepository) {
        this.repository = repository;
        this.churchRepository = churchRepository;
    }

    @Transactional
    public FirstChurchElderResponse create(FirstChurchElderRequest request) {
        if (repository.existsByEmail(request.email)) {
            throw new RuntimeException("Email already exists");
        }
        Church church = churchRepository.findById(request.churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));
        FirstChurchElder elder = new FirstChurchElder();
        elder.setFullName(request.fullName);
        elder.setEmail(request.email);
        elder.setPhone(request.phone);
        elder.setChurch(church);
        return mapToResponse(repository.save(elder));
    }

    public List<FirstChurchElderResponse> getAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<FirstChurchElderResponse> getByChurch(Long churchId) {
        return repository.findByChurchId(churchId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public FirstChurchElderResponse getById(Long id) {
        return mapToResponse(repository.findById(id).orElseThrow(() -> new RuntimeException("First church elder not found")));
    }

    @Transactional
    public FirstChurchElderResponse update(Long id, FirstChurchElderRequest request) {
        FirstChurchElder elder = repository.findById(id).orElseThrow(() -> new RuntimeException("First church elder not found"));
        elder.setFullName(request.fullName);
        elder.setPhone(request.phone);
        if (request.churchId != null) {
            Church church = churchRepository.findById(request.churchId)
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            elder.setChurch(church);
        }
        return mapToResponse(repository.save(elder));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private FirstChurchElderResponse mapToResponse(FirstChurchElder elder) {
        FirstChurchElderResponse r = new FirstChurchElderResponse();
        r.setId(elder.getId());
        r.setFullName(elder.getFullName());
        r.setEmail(elder.getEmail());
        r.setPhone(elder.getPhone());
        r.setActive(elder.isActive());
        if (elder.getChurch() != null) {
            r.setChurchId(elder.getChurch().getId());
            r.setChurchName(elder.getChurch().getChurchName());
        }
        return r;
    }
}
