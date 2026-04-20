const API_BASE_URL = "/api";

export type TaskStatus = "TO_DO" | "IN_DEV" | "IN_TEST" | "IN_REVIEW" | "DONE";
export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface TaskRequestDto {
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: string | null;
    listeId: string;
    sprintId?: string | null;
    assigneeId?: string | null;
}

export interface TaskResponseDto {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;

    listeId: string;
    listeName: string;

    sprintId?: string | null;
    sprintName?: string | null;

    assigneeId?: string | null;
    assigneeName?: string | null;
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

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        const message = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data as T;
}

export async function createTask(payload: TaskRequestDto): Promise<TaskResponseDto> {
    return request<TaskResponseDto>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getTaskById(id: string): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${id}`);
}

export async function getAllTasks(): Promise<TaskResponseDto[]> {
    return request<TaskResponseDto[]>("/tasks");
}

export async function getTasksByListe(listeId: string): Promise<TaskResponseDto[]> {
    return request<TaskResponseDto[]>(`/tasks/liste/${listeId}`);
}

export async function getTasksBySprint(sprintId: string): Promise<TaskResponseDto[]> {
    return request<TaskResponseDto[]>(`/tasks/sprint/${sprintId}`);
}

export async function getTasksByAssignee(assigneeId: string): Promise<TaskResponseDto[]> {
    return request<TaskResponseDto[]>(`/tasks/assignee/${assigneeId}`);
}

export async function updateTask(id: string, payload: TaskRequestDto): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteTask(id: string): Promise<void> {
    await request<void>(`/tasks/${id}`, {
        method: "DELETE",
    });
}

export async function assignTask(taskId: string, assigneeId: string): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${taskId}/assign/${assigneeId}`, {
        method: "PATCH",
    });
}

export async function moveToSprint(taskId: string, sprintId: string): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${taskId}/sprint/${sprintId}`, {
        method: "PATCH",
    });
}
