package com.devscore.ai.SpringBootBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devscore.ai.SpringBootBackend.entity.Question;

public interface QuestionRepository extends JpaRepository < Question , String> {

}
