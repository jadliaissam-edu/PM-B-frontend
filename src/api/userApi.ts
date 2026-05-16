import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface UserProfileResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    bio?: string;
    avatarUrl?: string;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
            ...(init?.headers ?? {}),
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Request failed: ${response.status}`);
    }
    return data as T;
}

export async function getProfile(): Promise<UserProfileResponse> {
    return request<UserProfileResponse>("/users/profile");
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<UserProfileResponse> {
    return request<UserProfileResponse>("/users/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
    });
}

export async function findUserByEmail(email: string): Promise<UserProfileResponse> {
    return request<UserProfileResponse>(`/users/email/${encodeURIComponent(email)}`);
}
