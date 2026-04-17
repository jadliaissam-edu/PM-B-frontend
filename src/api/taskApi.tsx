import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface TaskRequestDto {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    listeId?: string;
    sprintId?: string;
    assigneeId?: string;
}

export interface TaskResponseDto {
    id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    listeId?: string;
    sprintId?: string;
    assigneeId?: string;
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

export async function getAllTasks(): Promise<TaskResponseDto[]> {
    const data = await request<unknown>("/tasks");
    return asArray<TaskResponseDto>(data);
}

export async function getTaskById(taskId: string): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${taskId}`);
}

export async function getTasksByListe(listeId: string): Promise<TaskResponseDto[]> {
    const data = await request<unknown>(`/tasks/liste/${listeId}`);
    return asArray<TaskResponseDto>(data);
}

export async function getTasksBySprint(sprintId: string): Promise<TaskResponseDto[]> {
    const data = await request<unknown>(`/tasks/sprint/${sprintId}`);
    return asArray<TaskResponseDto>(data);
}

export async function createTask(payload: TaskRequestDto): Promise<TaskResponseDto> {
    return request<TaskResponseDto>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateTask(taskId: string, payload: TaskRequestDto): Promise<TaskResponseDto> {
    return request<TaskResponseDto>(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteTask(taskId: string): Promise<void> {
    await request<unknown>(`/tasks/${taskId}`, {
        method: "DELETE",
    });
}
