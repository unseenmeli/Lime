const API_BASE_URL = 'http://127.0.0.1:8000/api';

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

function normalizeGenre(input: string) {
  const s = (input || "").trim();
  return s.startsWith("#") ? s.slice(1) : s;
}

export const authService = {
  // ---------- storage helpers ----------
  setTokens(access: string, refresh: string) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    window.dispatchEvent(new Event("auth:changed"));
  },
  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event("auth:changed"));
  },
  setUser(user: any) {
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("auth:changed"));
  },
  clearUser() {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
  },

  getAccessToken() {
    return localStorage.getItem("accessToken");
  },
  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },
  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated() {
    return !!this.getAccessToken();
  },

  // ---------- refresh flow ----------
  async refresh(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    const res = await fetch(`${API_BASE_URL}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      // refresh invalid/expired/blacklisted -> full logout
      await this.logout();
      return false;
    }

    const data = await res.json();
    // With ROTATE_REFRESH_TOKENS=True, server may return a new refresh
    const newAccess = data.access as string;
    const newRefresh = (data.refresh as string) ?? refresh;
    this.setTokens(newAccess, newRefresh);
    return true;
  },

  // ---------- auth actions ----------
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("API Login Response:", result, "Status:", response.status);

      if (response.ok && result.access) {
        this.setTokens(result.access, result.refresh);

        // fetch user using fresh access
        const userRes = await fetch(`${API_BASE_URL}/me/`, {
          headers: { Authorization: `Bearer ${result.access}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          this.setUser(userData);
        }
      }

      return result;
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Network error. Please try again." };
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("API Register Response:", result, "Status:", response.status);

      if (response.ok && result.access) {
        this.setTokens(result.access, result.refresh);
        this.setUser(result.user);
      }

      return result;
    } catch (error) {
      console.error("Registration error:", error);
      return { error: "Network error. Please try again." };
    }
  },

  async logout() {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAccessToken();

    if (refreshToken && accessToken) {
      try {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    this.clearTokens();
    this.clearUser();
  },
};

export async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = authService.getAccessToken();

  if (token) headers.set("Authorization", `Bearer ${token}`);

  // ⬇️ Only set JSON Content-Type when NOT sending FormData
  const isFormData = (init.body && typeof FormData !== "undefined" && init.body instanceof FormData);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && authService.getRefreshToken()) {
    const ok = await authService.refresh();
    if (ok) {
      const retryHeaders = new Headers(init.headers || {});
      const newToken = authService.getAccessToken();
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);

      const retryIsFormData = (init.body && typeof FormData !== "undefined" && init.body instanceof FormData);
      if (!retryIsFormData && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }

      res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: retryHeaders });
    }
  }

  return res;
}


export const userService = {
  async searchUsers(q: string) {
    const res = await fetchWithAuth(`/users/search/?q=${encodeURIComponent(q)}`, { method: "GET" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async follow(username: string) {
    const res = await fetchWithAuth(`/users/${encodeURIComponent(username)}/follow/`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async unfollow(username: string) {
    const res = await fetchWithAuth(`/users/${encodeURIComponent(username)}/follow/`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async getUser(username: string) {
  const res = await fetchWithAuth(`/users/${encodeURIComponent(username)}/`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    id: number; username: string; role: string;
    profile_picture: string | null; follower_count: number; is_following: boolean;
  }>;
},

};


export type SongDTO = {
  id: number;
  owner: { id: number; username: string; role: string } | null;
  title: string;
  description: string;
  audio: string;
  cover: string | null;
  is_public: boolean;
  duration_seconds: number | null;
  plays: number;
  created_at: string;
  genre?: string | null;
};

export const songService = {
  async listSongs(): Promise<SongDTO[]> {
    const res = await fetchWithAuth(`/songs/`, { method: "GET" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async uploadSong(params: {
    title: string;
    description?: string;
    is_public?: boolean;
    audioFile: File;
    coverFile?: File | null;
    genre?: string;
  }): Promise<SongDTO> {
    const form = new FormData();
    form.append("title", params.title);
    if (params.description) form.append("description", params.description);
    form.append("is_public", String(params.is_public ?? true));
    form.append("audio", params.audioFile);
    if (params.coverFile) form.append("cover", params.coverFile);
    if (params.genre) form.append("genre", normalizeGenre(params.genre));

    const res = await fetchWithAuth(`/songs/`, { method: "POST", body: form } as RequestInit);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSong(
    id: number,
    payload: Partial<{title: string; description: string; is_public: boolean; genre: string}>
  ) {
    const body = { ...payload };
    if (body.genre != null) body.genre = normalizeGenre(body.genre);
    const res = await fetchWithAuth(`/songs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async deleteSong(id: number) {
    const res = await fetchWithAuth(`/songs/${id}/`, {method: "DELETE"});
    if (!res.ok) throw new Error(await res.text());
  },

  async likeSong(id: number): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const res = await fetchWithAuth(`/songs/${id}/like/`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async unlikeSong(id: number): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const res = await fetchWithAuth(`/songs/${id}/unlike/`, {method: "POST"});
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async searchSongsByGenre(q: string): Promise<SongDTO[]> {
  const g = normalizeGenre(q);
  if (!g || g.includes(" ")) return []; // genres have no spaces
  const res = await fetchWithAuth(`/songs/?genre=${encodeURIComponent(g)}`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
},
};



