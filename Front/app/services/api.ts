const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  role?: string;
}

interface AuthResponse {
  access?: string;
  refresh?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role?: string;
  };
  detail?: string;
  error?: string;
  username?: string | string[];
  email?: string | string[];
  password?: string | string[];
  password2?: string | string[];
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('API Login Response:', result, 'Status:', response.status);

      if (response.ok && result.access) {
        localStorage.setItem('accessToken', result.access);
        localStorage.setItem('refreshToken', result.refresh);

        const userResponse = await fetch(`${API_BASE_URL}/me/`, {
          headers: {
            'Authorization': `Bearer ${result.access}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error. Please try again.' };
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('API Register Response:', result, 'Status:', response.status);

      if (response.ok && result.access) {
        localStorage.setItem('accessToken', result.access);
        localStorage.setItem('refreshToken', result.refresh);
        localStorage.setItem('user', JSON.stringify(result.user));
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Network error. Please try again.' };
    }
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');

    if (refreshToken && accessToken) {
      try {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  }
};