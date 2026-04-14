function getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

const API_BASE_URL = "/api";


async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    if (response.status === 204) {
        return {} as T;
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || `Erreur API: ${response.statusText}`);
    }
    return data;
}

// ============================================================================
// TYPES DTO
// ============================================================================

export interface WorkspaceResponseDto {
    id: string;
    name: string;
    slug: string;
    ownerName: string;
}

export interface WorkspaceRequestDto {
    name: string;
    slug: string;
}

export interface WorkspaceMemberResponseDto {
    id: string;
    userId: string;
    role: string;
}

export interface SpaceResponseDto {
    id: string;
    spaceName: string;
    color: string;
    isPrivate: boolean;
    workspaceid: string;
    workspaceName: string;
}

export interface FolderResponseDto {
    id: string;
    name: string;
}

export interface SprintResponseDto {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
}

export interface ListeResponseDto {
    id: string;
    name: string;
}

export interface TaskResponseDto {
    id: string;
    title: string;
    description?: string;
    status?: string;
}

// ============================================================================
// WORKSPACE API
// ============================================================================

export async function getWorkspacesByUser(): Promise<WorkspaceResponseDto[]> {
    return fetchWithAuth<WorkspaceResponseDto[]>(`${API_BASE_URL}/workspaces`);
}

export async function getWorkspaceById(workspaceId: string): Promise<WorkspaceResponseDto> {
    return fetchWithAuth<WorkspaceResponseDto>(`${API_BASE_URL}/workspaces/${workspaceId}`);
}

export async function createWorkspace(body: WorkspaceRequestDto): Promise<WorkspaceResponseDto> {
    return fetchWithAuth<WorkspaceResponseDto>(`${API_BASE_URL}/workspaces`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function updateWorkspace(workspaceId: string, body: WorkspaceRequestDto): Promise<WorkspaceResponseDto> {
    return fetchWithAuth<WorkspaceResponseDto>(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
    await fetchWithAuth<void>(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: "DELETE",
    });
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    return fetchWithAuth<WorkspaceMemberResponseDto[]>(`${API_BASE_URL}/workspaceMembers/workspace/${workspaceId}`);
}

// ============================================================================
// SPACE API
// ============================================================================

export async function getSpacesByWorkspace(workspaceId: string): Promise<SpaceResponseDto[]> {
    return fetchWithAuth<SpaceResponseDto[]>(`${API_BASE_URL}/spaces/workspace/${workspaceId}`);
}

export async function getSpaceById(spaceId: string): Promise<SpaceResponseDto> {
    return fetchWithAuth<SpaceResponseDto>(`${API_BASE_URL}/spaces/${spaceId}`);
}

// ============================================================================
// FOLDER API
// ============================================================================

export async function getFoldersBySpace(spaceId: string): Promise<FolderResponseDto[]> {
    return fetchWithAuth<FolderResponseDto[]>(`${API_BASE_URL}/folders/space/${spaceId}`);
}

export async function getFolderById(folderId: string): Promise<FolderResponseDto> {
    return fetchWithAuth<FolderResponseDto>(`${API_BASE_URL}/folders/${folderId}`);
}

// ============================================================================
// SPRINT API
// ============================================================================

export async function getSprintsByFolder(folderId: string): Promise<SprintResponseDto[]> {
    return fetchWithAuth<SprintResponseDto[]>(`${API_BASE_URL}/sprints/folder/${folderId}`);
}

export async function getSprintById(sprintId: string): Promise<SprintResponseDto> {
    return fetchWithAuth<SprintResponseDto>(`${API_BASE_URL}/sprints/${sprintId}`);
}

// ============================================================================
// LIST API
// ============================================================================

export async function getListsByFolder(folderId: string): Promise<ListeResponseDto[]> {
    // Note: the backend uses 'listes' mappings
    return fetchWithAuth<ListeResponseDto[]>(`${API_BASE_URL}/listes/folder/${folderId}`);
}

export async function getListById(listId: string): Promise<ListeResponseDto> {
    return fetchWithAuth<ListeResponseDto>(`${API_BASE_URL}/listes/${listId}`);
}

// ============================================================================
// TASK API
// ============================================================================

export async function getTasksBySprint(sprintId: string): Promise<TaskResponseDto[]> {
    return fetchWithAuth<TaskResponseDto[]>(`${API_BASE_URL}/tasks/sprint/${sprintId}`);
}

export async function getTasksByList(listId: string): Promise<TaskResponseDto[]> {
    return fetchWithAuth<TaskResponseDto[]>(`${API_BASE_URL}/tasks/list/${listId}`);
}

export async function getTaskById(taskId: string): Promise<TaskResponseDto> {
    return fetchWithAuth<TaskResponseDto>(`${API_BASE_URL}/tasks/${taskId}`);
}