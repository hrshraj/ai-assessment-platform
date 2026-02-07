const API_BASE_URL = 'http://localhost:8080/api';

const AuthService = {
    /**
     * Register a new user (Recruiter or Candidate)
     * @param {Object} userData - User registration data
     * @param {string} userData.fullName
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {string} userData.role - "RECRUITER" or "CANDIDATE"
     * @param {string|null} userData.companyName - null for candidates
     * @param {string|null} userData.githubProfile - null for recruiters
     */
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = errorText;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData || errorText;
                } catch (e) {
                    // Not JSON, use as is
                }
                throw new Error(errorMessage || `Registration failed with status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Registration Error:', error);
            throw error;
        }
    },

    /**
     * Login a user
     * @param {string} email 
     * @param {string} password 
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = errorText;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData || errorText;
                } catch (e) { }
                throw new Error(errorMessage || `Login failed with status: ${response.status}`);
            }

            const data = await response.json();
            // Store token and role
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_role', data.role);
            }
            return data;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    },

    getToken: () => localStorage.getItem('auth_token'),
    getRole: () => localStorage.getItem('user_role'),
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
    }
};

export default AuthService;
