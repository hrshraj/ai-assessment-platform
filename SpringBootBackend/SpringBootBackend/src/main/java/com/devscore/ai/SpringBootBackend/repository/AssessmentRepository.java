package com.devscore.ai.SpringBootBackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.User;

public interface AssessmentRepository extends JpaRepository<Assessment , String > {
    List<Assessment> findByRecruiterOrderByCreatedAtDesc(User recruiter);
}
