import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform.onrender.com/api/candidate';

const CandidateService = {
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
    }
};

export default CandidateService;
