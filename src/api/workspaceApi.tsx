import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface WorkspaceRequestDto {
    name: string;
    slug: string;
}

export interface WorkspaceResponseDto {
    id: string;
    name: string;
    slug: string;
    ownerName?: string;
}

function asArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const nested = record.content ?? record.items ?? record.data;
        if (Array.isArray(nested)) return nested as T[];
    }
    return [];
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
        const message = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data as T;
}

export async function getWorkspacesByUser(): Promise<WorkspaceResponseDto[]> {
    const data = await request<unknown>("/workspaces");
    return asArray<WorkspaceResponseDto>(data);
}

export async function createWorkspace(payload: WorkspaceRequestDto): Promise<WorkspaceResponseDto> {
    return request<WorkspaceResponseDto>("/workspaces", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateWorkspace(workspaceId: string, payload: WorkspaceRequestDto): Promise<WorkspaceResponseDto> {
    return request<WorkspaceResponseDto>(`/workspaces/${workspaceId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
    await request<unknown>(`/workspaces/${workspaceId}`, {
        method: "DELETE",
    });
}
