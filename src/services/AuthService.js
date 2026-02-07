const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const handleResponse = async (response) => {
    const text = await response.text();

    if (!response.ok) {
        let message = text;
        try {
            const json = JSON.parse(text);
            message = json.message || JSON.stringify(json);
        } catch (_) { }
        throw new Error(message || `HTTP Error: ${response.status}`);
    }

    return text ? JSON.parse(text) : {};
};

const AuthService = {

    register: async (userData) => {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/register`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            }
        );

        return handleResponse(response);
    },

    login: async (email, password) => {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            }
        );

        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_role', data.role);
        }

        return data;
    },

    getToken: () => localStorage.getItem('auth_token'),
    getRole: () => localStorage.getItem('user_role'),

    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
    }
};

export default AuthService;
