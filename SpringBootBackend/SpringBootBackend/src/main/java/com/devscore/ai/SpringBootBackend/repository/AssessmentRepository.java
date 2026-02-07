package com.devscore.ai.SpringBootBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devscore.ai.SpringBootBackend.entity.Assessment;

public interface AssessmentRepository extends JpaRepository<Assessment , String > {

}
