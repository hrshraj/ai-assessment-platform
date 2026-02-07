import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform-1.onrender.com/api/recruiter';

const RecruiterService = {
    /**
     * Create assessment from job description text (JSON body)
     */
    createAssessment: async (data) => {
        const token = AuthService.getToken();
        try {
            let body;
            if (data instanceof FormData) {
                const file = data.get('file');
                const title = data.get('title') || 'Untitled Assessment';
                const text = file ? await file.text() : '';
                body = JSON.stringify({ jobDescription: text, title });
            } else {
                body = JSON.stringify(data);
            }

            const response = await fetch(`${API_BASE_URL}/create-assessment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Creation failed with status: ${response.status}`);
            }

            const result = await response.json();
            return `Assessment created successfully! ID: ${result.assessmentId}`;
        } catch (error) {
            console.error('Create Assessment Error:', error);
            throw error;
        }
    },

    /**
     * Get all assessments created by this recruiter
     */
    getAssessments: async () => {
        const token = AuthService.getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/assessments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error(`Failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Get Assessments Error:', error);
            throw error;
        }
    },

    /**
     * Get assessment leaderboard
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
     */
    getIntegrityReport: async (submissionId) => {
        const token = AuthService.getToken();
        try {
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
