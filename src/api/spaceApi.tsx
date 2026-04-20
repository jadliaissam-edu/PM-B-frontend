import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface SpaceRequestDto {
    name: string;
    description?: string;
    color: string;
    isPrivate: boolean;
    workspaceId: string;
}

export interface SpaceResponseDto {
    id: string;
    spaceName: string;
    description?: string;
    color?: string;
    isPrivate: boolean;
    workspaceid?: string;
    workspaceName?: string;
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

export async function getSpacesByWorkspace(workspaceId: string): Promise<SpaceResponseDto[]> {
    const data = await request<unknown>(`/spaces/workspace/${workspaceId}`);
    return asArray<SpaceResponseDto>(data);
}

export async function getAllSpaces(page = 0, size = 50): Promise<SpaceResponseDto[]> {
    const data = await request<unknown>(`/spaces?page=${page}&size=${size}`);
    return asArray<SpaceResponseDto>(data);
}

export async function getSpaceById(spaceId: string): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>(`/spaces/${spaceId}`);
}

export async function createSpace(payload: SpaceRequestDto): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>("/spaces", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateSpace(spaceId: string, payload: SpaceRequestDto): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>(`/spaces/${spaceId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteSpace(spaceId: string): Promise<void> {
    await request<unknown>(`/spaces/${spaceId}`, {
        method: "DELETE",
    });
}