import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export type ListType = "SPRINT" | "PHASE";

export interface ListeRequestDto {
    name: string;
    type: ListType;
    order: number;
    folderId?: string | null;
    sprintId?: string | null;
}

export interface ListeResponseDto {
    id: string;
    name: string;
    type: ListType;
    order: number;
    createdAt?: string;
    folderId?: string;
    folderName?: string;
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

export async function getAllListes(page = 0, size = 10, sortBy = "name"): Promise<any> {
    return request<unknown>(`/listes?page=${page}&size=${size}&sortBy=${sortBy}`);
}

export async function getListeById(id: string): Promise<ListeResponseDto> {
    return request<ListeResponseDto>(`/listes/${id}`);
}

export async function getListesByFolder(folderId: string): Promise<ListeResponseDto[]> {
    const data = await request<unknown>(`/listes/folder/${folderId}`);
    return asArray<ListeResponseDto>(data);
}

export async function getListesBySprint(sprintId: string): Promise<ListeResponseDto[]> {
    const data = await request<unknown>(`/listes/sprint/${sprintId}`);
    return asArray<ListeResponseDto>(data);
}

export async function createListe(payload: ListeRequestDto): Promise<ListeResponseDto> {
    return request<ListeResponseDto>("/listes", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateListe(listeId: string, payload: ListeRequestDto): Promise<ListeResponseDto> {
    return request<ListeResponseDto>(`/listes/${listeId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteListe(listeId: string): Promise<void> {
    await request<unknown>(`/listes/${listeId}`, {
        method: "DELETE",
    });
}
