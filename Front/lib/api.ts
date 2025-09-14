let access: string | null = null;
let refresh: string | null = null;

export function setTokens(a: string, r:string) {
    access = a;
    refresh = r;
    if (typeof window !== "undefined") {
        localStorage.setItem("access", a);
        localStorage.setItem("refresh", r);
    }
}

export function clearTokens() {
    access = null;
    refresh = null;
    if (typeof window !== "undefined") {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
    }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

async function doFetch(input: string, init: RequestInit = {}, alreadyRetried = false): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${input}`, { ...init, headers });

  if (res.status === 401 && refresh && !alreadyRetried) {
    const ok = await tryRefresh();
    if (ok) {
      return doFetch(input, init, true);
    }
  }
  return res;
}

async function tryRefresh() {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "applcation/json" },
            body: JSON.stringify({refresh}),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data.access, data.refresh ?? refresh!);
        return true;
    } catch {
        clearTokens();
        return false;
    }
}

export const api = {
    async register(payload: {
        username: string;
        email: string;
        password: string;
        password2: string;
        role: "ARTIST" | "LISTENER";
    }) {
        const res = await fetch(`${API_BASE}/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTokens(data.access, data.refresh);
        return data;
    },

    async login(username: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTokens(data.access, data.refresh);
        return data;
    },

    async me() {
        const res = await doFetch(`/auth/me/`, {method:"GET"});
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async logout() {
        const res = await doFetch(`/auth/logout/`, {
            method: "POST",
            body: JSON.stringify({refresh}),
        });
        clearTokens();
        if(!res.ok && res.status !== 205) throw new Error(await res.text());
    },
};