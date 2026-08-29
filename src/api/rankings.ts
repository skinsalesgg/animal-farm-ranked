import { API_URL } from "../config";
import type { AggregatedItem, Tier } from "../lib/types";

export type CommunityResponse = {
  submissionCount: number;
  aggregated: AggregatedItem[];
};

export type SubmissionSummary = {
  id: string;
  displayName: string | null;
  createdAt: string;
};

export type SubmissionsListResponse = {
  submissions: SubmissionSummary[];
};

export type SubmissionResponse = {
  id: string;
  listId: string;
  displayName: string | null;
  createdAt: string;
  placements: Array<{ itemId: string; tier: Tier }>;
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

export const rankingsApi = {
  getCommunity(listId: string) {
    return request<CommunityResponse>(`/rankings/${listId}/community`);
  },

  getSubmission(listId: string, id: string) {
    return request<SubmissionResponse>(`/rankings/${listId}/submissions/${id}`);
  },

  listSubmissions(listId: string, limit = 20) {
    return request<SubmissionsListResponse>(
      `/rankings/${listId}/submissions?limit=${limit}`,
    );
  },

  createSubmission(
    listId: string,
    input: {
      placements: Array<{ itemId: string; tier: Tier }>;
      displayName: string;
      website?: string;
    },
  ) {
    return request<{ id: string }>(`/rankings/${listId}/submissions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateSubmission(
    listId: string,
    id: string,
    input: {
      placements: Array<{ itemId: string; tier: Tier }>;
      displayName?: string | null;
    },
  ) {
    return request<SubmissionResponse>(`/rankings/${listId}/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};
