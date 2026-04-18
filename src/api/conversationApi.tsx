import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface ConversationRequestDto {
    title?: string;
}

export interface ConversationResponseDto {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMessageRequestDto {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ConversationMessageResponseDto {
    id: string;
    role: string;
    content: string;
    createdAt: string;
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

export async function createConversation(payload?: ConversationRequestDto): Promise<ConversationResponseDto> {
    return request<ConversationResponseDto>("/conversations", {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
    });
}

export async function getMyConversations(): Promise<ConversationResponseDto[]> {
    return request<ConversationResponseDto[]>("/conversations");
}

export async function getConversationMessages(conversationId: string, limit?: number): Promise<ConversationMessageResponseDto[]> {
    const query = typeof limit === "number" && limit > 0 ? `?limit=${limit}` : "";
    return request<ConversationMessageResponseDto[]>(`/conversations/${conversationId}/messages${query}`);
}

export async function addConversationMessage(
    conversationId: string,
    payload: ConversationMessageRequestDto,
): Promise<ConversationMessageResponseDto> {
    return request<ConversationMessageResponseDto>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateConversationTitle(
    conversationId: string,
    payload: ConversationRequestDto,
): Promise<ConversationResponseDto> {
    return request<ConversationResponseDto>(`/conversations/${conversationId}/title`, {
        method: "PUT",
        body: JSON.stringify(payload ?? {}),
    });
}

export async function deleteConversation(conversationId: string): Promise<void> {
    await request<unknown>(`/conversations/${conversationId}`, {
        method: "DELETE",
    });
}