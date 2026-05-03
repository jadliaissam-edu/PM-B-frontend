import { API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";
import type { InvitationResponseDto } from "./invitationApi";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface WorkspaceMemberResponseDto {
    id: string;
    role: WorkspaceRole;
    userId: string;
    userName: string;
    userEmail: string;
    workspaceId: string;
}

export interface InviteMemberRequestDto {
    email: string;
    workspaceId: string;
    role: WorkspaceRole;
}

export interface RoleRequest {
    role: WorkspaceRole;
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

/** Get all members of a workspace */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    const data = await request<unknown>(`/workspaceMembers/workspace/${workspaceId}`);
    return asArray<WorkspaceMemberResponseDto>(data);
}

/** Get all membership rows by user id */
export async function getWorkspaceMembershipsByUser(userId: string): Promise<WorkspaceMemberResponseDto[]> {
    const data = await request<unknown>(`/workspaceMembers/User/${userId}`);
    return asArray<WorkspaceMemberResponseDto>(data);
}

/** Invite a user to a workspace by their email address */
export async function inviteMemberByEmail(payload: InviteMemberRequestDto): Promise<InvitationResponseDto> {
    return request<InvitationResponseDto>("/workspaceMembers/invite", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/** Update the role of an existing workspace member */
export async function updateMemberRole(memberId: string, role: WorkspaceRole): Promise<WorkspaceMemberResponseDto> {
    return request<WorkspaceMemberResponseDto>(`/workspaceMembers/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({ role } satisfies RoleRequest),
    });
}

/** Remove a member from a workspace */
export async function removeMember(memberId: string): Promise<void> {
    await request<unknown>(`/workspaceMembers/${memberId}`, { method: "DELETE" });
}
