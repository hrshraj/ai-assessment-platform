import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform-1.onrender.com/api/candidate';

const CandidateService = {
    /**
     * Get all available assessments for browsing
     * @returns {Promise<Array>} List of AssessmentListDto
     */
    getAssessments: async () => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/assessments`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to fetch assessments: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get Assessments Error:', error);
            throw error;
        }
    },

    /**
     * Start an assessment
     * @param {string} assessmentId
     * @returns {Promise<Object>} TestResponseDto
     */
    startTest: async (assessmentId) => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/test/${assessmentId}/start`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to start test: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Start Test Error:', error);
            throw error;
        }
    },

    /**
     * Submit assessment results
     * @param {Object} submissionData - SubmissionRequest
     * @returns {Promise<string>} Submission ID message
     */
    submitTest: async (submissionData) => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Submission failed: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Submit Test Error:', error);
            throw error;
        }
    },

    /**
     * Get candidate's submission history
     * @returns {Promise<Array>} List of submissions with scores, status, feedback
     */
    getSubmissions: async () => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/submissions`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to fetch submissions: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get Submissions Error:', error);
            throw error;
        }
    }
};

export default CandidateService;
