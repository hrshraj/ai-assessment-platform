import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform-1.onrender.com/api/candidate';
const PUBLIC_API_URL = 'https://ai-assessment-platform-1.onrender.com/api/public';

const CandidateService = {
    /**
     * Get all available assessments (public endpoint)
     */
    getAssessments: async () => {
        try {
            const response = await fetch(`${PUBLIC_API_URL}/assessments`);
            if (!response.ok) throw new Error(`Failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Get Assessments Error:', error);
            throw error;
        }
    },

    /**
     * Start an assessment
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

            return await response.json();
        } catch (error) {
            console.error('Submit Test Error:', error);
            throw error;
        }
    },

    /**
     * Get candidate's past submissions
     */
    getSubmissions: async () => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/submissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error(`Failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Get Submissions Error:', error);
            throw error;
        }
    }
};

export default CandidateService;
