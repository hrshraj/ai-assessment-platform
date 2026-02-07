import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform.onrender.com/api/recruiter';

const RecruiterService = {
    /**
     * Create assessment via AiRequest DTO
     * @param {Object} aiRequest - Contains 'jobDescription' and 'questionCount'
     */
    createAssessment: async (formData) => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/create-assessment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type is set automatically for FormData
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Creation failed with status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Create Assessment Error:', error);
            throw error;
        }
    },

    /**
     * Get assessment leaderboard
     * @param {string} assessmentId 
     * @returns {Promise<Array>} List<LeaderboardEntry>
     */
    getLeaderboard: async (assessmentId) => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/leaderboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Leaderboard Fetch Error:', error);
            throw error;
        }
    },

    /**
     * Get integrity report for a submission
     * @param {string} submissionId 
     * @returns {Promise<Object>} IntegrityReportDTO
     */
    getIntegrityReport: async (submissionId) => {
        const token = AuthService.getToken();
        try {
            // Endpoint assumed based on requirement context
            const response = await fetch(`${API_BASE_URL}/submission/${submissionId}/integrity`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch integrity report: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Integrity Report Fetch Error:', error);
            throw error;
        }
    }
};

export default RecruiterService;
