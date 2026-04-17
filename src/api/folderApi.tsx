import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface FolderRequestDto {
    name: string;
    isHidden: boolean;
    spaceId: string;
}

export interface FolderResponseDto {
    id?: string;
    spaceId?: string;
    name: string;
    isHidden?: boolean;
}

interface RawFolder {
    id?: string;
    folderId?: string;
    spaceId?: string;
    name?: string;
    folderName?: string;
    isHidden?: boolean;
    hidden?: boolean;
    space?: { id?: string };
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

function normalizeFolder(raw: RawFolder): FolderResponseDto {
    return {
        id: raw.id ?? raw.folderId,
        spaceId: raw.spaceId ?? raw.space?.id,
        name: raw.name ?? raw.folderName ?? "Folder",
        isHidden: raw.isHidden ?? raw.hidden ?? false,
    };
}

function normalizeFolders(value: unknown): FolderResponseDto[] {
    return asArray<RawFolder>(value).map(normalizeFolder);
}

function dedupeFolders(folders: FolderResponseDto[]): FolderResponseDto[] {
    const seen = new Set<string>();
    return folders.filter((folder) => {
        const key = folder.id || `${folder.spaceId || "no-space"}:${folder.name.trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function getAllFolders(): Promise<FolderResponseDto[]> {
    const data = await request<unknown>("/folders");
    return dedupeFolders(normalizeFolders(data));
}

export async function getFolderById(folderId: string): Promise<FolderResponseDto> {
    const data = await request<RawFolder>(`/folders/${folderId}`);
    return normalizeFolder(data);
}

export async function getFoldersBySpace(spaceId: string): Promise<FolderResponseDto[]> {
    const endpoints = [
        `/folders/space/${spaceId}`,
        `/folders?spaceId=${encodeURIComponent(spaceId)}`,
        "/folders",
    ];

    for (const endpoint of endpoints) {
        try {
            const data = await request<unknown>(endpoint);
            const folders = dedupeFolders(normalizeFolders(data));

            if (endpoint === "/folders") {
                const hasSpaceInfo = folders.some((folder) => Boolean(folder.spaceId));
                if (hasSpaceInfo) {
                    return folders.filter((folder) => folder.spaceId === spaceId);
                }
            }

            return folders;
        } catch {
            // Try next fallback endpoint.
        }
    }

    return [];
}

export async function createFolder(payload: FolderRequestDto): Promise<FolderResponseDto> {
    return request<FolderResponseDto>("/folders", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateFolder(folderId: string, payload: FolderRequestDto): Promise<FolderResponseDto> {
    return request<FolderResponseDto>(`/folders/${folderId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteFolder(folderId: string): Promise<void> {
    await request<unknown>(`/folders/${folderId}`, {
        method: "DELETE",
    });
}
