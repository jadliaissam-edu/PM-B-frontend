const API_BASE_URL = "/api";

export type ListType = "SPRINT" | "PHASE";

export interface ListeRequestDto {
    name: string;
    type: ListType;
    order: number;
    folderId?: string;
    sprintId?: string;
}

export interface ListeResponseDto {
    id: string;
    name: string;
    type: ListType;
    order: number;
    folderId?: string;
    sprintId?: string;
    sprintName?: string;
}

export interface Page<T> {
    content: T[];
    pageable: any;
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: any;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("accessToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
            ...(init?.headers ?? {}),
        },
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        const message = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data as T;
}

export async function createListe(payload: ListeRequestDto): Promise<ListeResponseDto> {
    return request<ListeResponseDto>("/listes", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateListe(id: string, payload: ListeRequestDto): Promise<ListeResponseDto> {
    return request<ListeResponseDto>(`/listes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteListe(id: string): Promise<void> {
    await request<void>(`/listes/${id}`, {
        method: "DELETE",
    });
}

export async function getListeById(id: string): Promise<ListeResponseDto> {
    return request<ListeResponseDto>(`/listes/${id}`);
}

export async function getListesByFolder(folderId: string): Promise<ListeResponseDto[]> {
    return request<ListeResponseDto[]>(`/listes/folder/${folderId}`);
}

export async function getListesBySprint(sprintId: string): Promise<ListeResponseDto[]> {
    return request<ListeResponseDto[]>(`/listes/sprint/${sprintId}`);
}

export async function getAllListes(page = 0, size = 10, sortBy = "name"): Promise<Page<ListeResponseDto>> {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
    });
    return request<Page<ListeResponseDto>>(`/listes?${params.toString()}`);
}
