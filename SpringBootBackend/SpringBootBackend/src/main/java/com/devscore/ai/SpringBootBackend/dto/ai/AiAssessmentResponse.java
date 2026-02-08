package com.devscore.ai.SpringBootBackend.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiAssessmentResponse(
    String id,
    @JsonProperty("mcq_count") Integer mcqCount,
    @JsonProperty("mcq_questions") List<AiQuestion> mcqQuestions,
    @JsonProperty("subjective_questions") List<AiQuestion> subjectiveQuestions,
    @JsonProperty("coding_questions") List<AiQuestion> codingQuestions
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AiQuestion(
        String id,
        String question,
        String title,
        @JsonProperty("problem_statement") String problemStatement,
        String type,
        List<Map<String, Object>> options,
        @JsonProperty("correct_answer") String correctAnswer,
        @JsonProperty("test_cases") List<Map<String, Object>> testCases,
        @JsonProperty("starter_code") String starterCode,
        @JsonProperty("language_options") List<String> languageOptions,
        List<String> constraints,

        // Rubric for subjective
        Map<String, Object> rubric,
        @JsonProperty("expected_answer_points") List<String> expectedAnswerPoints
    ) {
        /** Returns the best available question text */
        public String getQuestionText() {
            if (problemStatement != null && !problemStatement.isBlank()) return problemStatement;
            if (question != null && !question.isBlank()) return question;
            if (title != null && !title.isBlank()) return title;
            return "No question text available";
        }
    }
}