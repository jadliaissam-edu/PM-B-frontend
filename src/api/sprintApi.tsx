import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";
import { createListe, getListesByFolder } from "./listeApi";

export interface SprintRequestDto {
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
    isActive: boolean;
    folderId?: string;
}

export interface SprintResponseDto {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
    isActive?: boolean;
    folderId?: string;
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

export async function getAllSprints(page = 0, size = 50): Promise<SprintResponseDto[]> {
    const data = await request<unknown>(`/sprints?page=${page}&size=${size}`);
    return asArray<SprintResponseDto>(data);
}

export async function getSprintById(sprintId: string): Promise<SprintResponseDto> {
    return request<SprintResponseDto>(`/sprints/${sprintId}`);
}

export async function createSprint(payload: SprintRequestDto): Promise<SprintResponseDto> {
    return request<SprintResponseDto>("/sprints", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateSprint(sprintId: string, payload: SprintRequestDto): Promise<SprintResponseDto> {
    return request<SprintResponseDto>(`/sprints/${sprintId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteSprint(sprintId: string): Promise<void> {
    await request<unknown>(`/sprints/${sprintId}`, {
        method: "DELETE",
    });
}

export async function getSprintsByFolder(folderId: string): Promise<SprintResponseDto[]> {
    const listes = await getListesByFolder(folderId);
    const sprintIds = Array.from(new Set(listes.map((liste) => liste.sprintId).filter(Boolean) as string[]));

    if (sprintIds.length === 0) {
        return [];
    }

    const loadedSprints = await Promise.all(
        sprintIds.map(async (sprintId) => {
            try {
                return await getSprintById(sprintId);
            } catch {
                const linkedListe = listes.find((liste) => liste.sprintId === sprintId);
                return {
                    id: sprintId,
                    name: linkedListe?.sprintName || "Sprint",
                } as SprintResponseDto;
            }
        }),
    );

    return loadedSprints;
}

export async function createSprintInFolder(folderId: string, payload: SprintRequestDto): Promise<SprintResponseDto> {
    const sprint = await createSprint(payload);

    await createListe({
        name: `${payload.name} List`,
        type: "SPRINT",
        order: 1,
        folderId,
        sprintId: sprint.id,
    });

    return sprint;
}
