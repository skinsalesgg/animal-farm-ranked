import { API_URL } from "../config";

export type AdminSessionResponse = {
  configured: boolean;
  authenticated: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export const adminApi = {
  getSession() {
    return request<AdminSessionResponse>("/admin/session");
  },

  login(username: string, password: string) {
    return request<{ ok: true }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request<{ ok: true }>("/admin/logout", {
      method: "POST",
    });
  },
};
