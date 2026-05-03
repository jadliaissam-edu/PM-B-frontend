import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface InvitationResponseDto {
    id: string;
    inviteeEmail: string;
    role: WorkspaceRole;
    status: InvitationStatus;
    createdAt: string;
    respondedAt?: string | null;
    workspaceId: string;
    workspaceName: string;
    inviterName: string;
    message?: string;
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

export async function getMyInvitations(): Promise<InvitationResponseDto[]> {
    const data = await request<unknown>("/invitations/my");
    return Array.isArray(data) ? (data as InvitationResponseDto[]) : [];
}

export async function acceptInvitation(invitationId: string): Promise<InvitationResponseDto> {
    return request<InvitationResponseDto>(`/invitations/${invitationId}/accept`, {
        method: "POST",
    });
}

export async function declineInvitation(invitationId: string): Promise<InvitationResponseDto> {
    return request<InvitationResponseDto>(`/invitations/${invitationId}/decline`, {
        method: "POST",
    });
}
