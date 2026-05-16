import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface NotificationResponseDto {
    id: string;
    title: string;
    message: string;
    type: string;
    read?: boolean;
    isRead?: boolean;
    createdAt: string;
    userId: string;
}

export interface NotificationRequestDto {
    title: string;
    message: string;
    type: string;
    userId: string;
}

/** Normalize backend field: could be `read` or `isRead` */
function normalizeNotification(n: any): any {
    if (!n) return n;
    return {
        ...n,
        read: n.read ?? n.isRead ?? false,
    };
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

async function request(path: string, init?: RequestInit): Promise<any> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
            ...(init?.headers ?? {}),
        },
    });

    // Handle 204 No Content
    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Request failed: ${response.status}`);
    }
    return data;
}

/** GET /api/notifications/user/{userId} */
export async function getNotificationsByUser(userId: string): Promise<NotificationResponseDto[]> {
    const data = await request(`/notifications/user/${userId}`);
    return asArray(data).map(normalizeNotification);
}

/** GET /api/notifications/user/{userId}/unread */
export async function getUnreadNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const data = await request(`/notifications/user/${userId}/unread`);
    return asArray(data).map(normalizeNotification);
}

/** PATCH /api/notifications/{id}/read */
export async function markNotificationAsRead(id: string): Promise<NotificationResponseDto> {
    const data = await request(`/notifications/${id}/read`, { method: "PATCH" });
    return normalizeNotification(data);
}

/** PATCH /api/notifications/user/{userId}/read-all */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    await request(`/notifications/user/${userId}/read-all`, { method: "PATCH" });
}

/** DELETE /api/notifications/{id} */
export async function deleteNotification(id: string): Promise<void> {
    await request(`/notifications/${id}`, { method: "DELETE" });
}

/** POST /api/notifications */
export async function createNotification(payload: NotificationRequestDto): Promise<NotificationResponseDto> {
    const data = await request("/notifications", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return normalizeNotification(data);
}
