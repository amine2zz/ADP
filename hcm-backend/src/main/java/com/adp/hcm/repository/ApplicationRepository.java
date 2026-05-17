package com.adp.hcm.repository;

import com.adp.hcm.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobOfferId(Long jobOfferId);
    Optional<Application> findByTrackingToken(String token);
    List<Application> findByApplicantEmail(String email);
}
