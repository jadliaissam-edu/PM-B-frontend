const API_BASE_URL = "/api";

export interface SpaceRequestDto {
    name: string;
    color?: string;
    isPrivate: boolean;
    workspaceId: string;
}

export interface SpaceResponseDto {
    id: string;
    spaceName: string;
    color?: string;
    isPrivate: boolean;
    workspaceid?: string;
    workspaceName?: string;
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

export async function addSpace(payload: SpaceRequestDto): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>("/spaces", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateSpace(id: string, payload: SpaceRequestDto): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>(`/spaces/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteSpace(id: string): Promise<void> {
    await request<void>(`/spaces/${id}`, {
        method: "DELETE",
    });
}

export async function getSpaceById(id: string): Promise<SpaceResponseDto> {
    return request<SpaceResponseDto>(`/spaces/${id}`);
}

export async function getAllSpaces(page = 0, size = 10, sortBy = "name"): Promise<Page<SpaceResponseDto>> {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
    });
    return request<Page<SpaceResponseDto>>(`/spaces?${params.toString()}`);
}

export async function getSpacesByWorkspace(workspaceId: string): Promise<SpaceResponseDto[]> {
    return request<SpaceResponseDto[]>(`/spaces/workspace/${workspaceId}`);
}
