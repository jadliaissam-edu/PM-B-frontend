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

export interface SpaceResponseDto {
    id: string;
    spaceName: string;
    color?: string;
    isPrivate: boolean;
    workspaceid?: string;
    workspaceName?: string;
}

export interface FolderResponseDto {
    id: string;
    name: string;
    isHidden?: boolean;
}

export interface SprintResponseDto {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
}

export interface TaskResponseDto {
    id: string;
    title: string;
    status?: string;
}

interface ListeResponseDto {
    sprintId?: string;
    sprintName?: string;
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

export async function getSpacesByWorkspace(workspaceId: string): Promise<SpaceResponseDto[]> {
    const data = await request<unknown>(`/spaces/workspace/${workspaceId}`);
    return asArray<SpaceResponseDto>(data);
}

export async function getFoldersBySpace(spaceId: string): Promise<FolderResponseDto[]> {
    // Backend does not expose a single stable folder-by-space endpoint yet.
    // Try common route variants and fall back to all folders.
    const endpoints = [
        `/folders/space/${spaceId}`,
        `/folders?spaceId=${encodeURIComponent(spaceId)}`,
        "/folders",
    ];

    for (const endpoint of endpoints) {
        try {
            const data = await request<unknown>(endpoint);
            return asArray<FolderResponseDto>(data);
        } catch {
            // Continue to next fallback endpoint.
        }
    }

    return [];
}

export async function getSprintsByFolder(folderId: string): Promise<SprintResponseDto[]> {
    // Backend currently exposes list-by-folder, which contains sprint references.
    const data = await request<unknown>(`/listes/folder/${folderId}`);
    const listes = asArray<ListeResponseDto>(data);
    const bySprintId = new Map<string, SprintResponseDto>();

    for (const liste of listes) {
        if (!liste.sprintId) continue;
        if (!bySprintId.has(liste.sprintId)) {
            bySprintId.set(liste.sprintId, {
                id: liste.sprintId,
                name: liste.sprintName || "Sprint",
            });
        }
    }

    return Array.from(bySprintId.values());
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
