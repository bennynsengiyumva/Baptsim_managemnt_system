package com.church.baptism.repository.user;

import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);

    List<User> findByFieldId(Long fieldId);

    List<User> findFirstByUnionIdAndRole(Long unionId, Role role);

    List<User> findFirstByFieldIdAndRole(Long fieldId, Role role);

    List<User> findFirstByDistrictIdAndRole(Long districtId, Role role);
}