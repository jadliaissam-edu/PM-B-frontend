import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Mail, Plus, Search, UserPlus, Users, X } from "lucide-react";
import {
    acceptInvitation,
    declineInvitation,
    getMyInvitations,
    type InvitationResponseDto,
} from "../api/invitationApi";

interface WorkspaceTopBarProps {
    userName: string;
    userAvatar: string;
    onInvite?: () => void;
    onNotificationsClick?: () => void;
    onSearch?: (query: string) => void;
}

export default function WorkspaceTopBar({ 
    userName: _userName, 
    userAvatar: _userAvatar, 
    onInvite,
    onNotificationsClick,
    onSearch,
}: WorkspaceTopBarProps) {
    const [showInvitations, setShowInvitations] = useState(false);
    const [invitations, setInvitations] = useState<InvitationResponseDto[]>([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
    const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

    const pendingCount = useMemo(
        () => invitations.filter((inv) => inv.status === "PENDING").length,
        [invitations]
    );

    const loadInvitations = async () => {
        setIsLoadingInvitations(true);
        try {
            const data = await getMyInvitations();
            setInvitations(data);
        } catch {
            setInvitations([]);
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    useEffect(() => {
        loadInvitations();
    }, []);

    const handleAccept = async (invitationId: string) => {
        setActionInProgressId(invitationId);
        try {
            await acceptInvitation(invitationId);
            await loadInvitations();
        } finally {
            setActionInProgressId(null);
        }
    };

    const handleDecline = async (invitationId: string) => {
        setActionInProgressId(invitationId);
        try {
            await declineInvitation(invitationId);
            await loadInvitations();
        } finally {
            setActionInProgressId(null);
        }
    };

    const formatDate = (value?: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <header
            style={{
                height: 48,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                background: "var(--bg-card)",
                flexShrink: 0,
            }}
        >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: 12, color: "var(--text-faint)", pointerEvents: "none" }} />
                <input 
                    className="search-input" 
                    placeholder="Search tasks, projects..." 
                    onChange={(e) => onSearch?.(e.target.value)}
                />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button 
                    onClick={onInvite}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent)",
                        borderRadius: 7, padding: "5px 10px",
                        color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    <Users size={13} />
                    Invite
                </button>
                
                <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

                <div style={{ position: "relative" }}>
                    <button
                        className="icon-btn"
                        style={{ position: "relative" }}
                        onClick={() => setShowInvitations((v) => !v)}
                    >
                        <Mail size={15} />
                        {pendingCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: -4,
                                    right: -4,
                                    minWidth: 16,
                                    height: 16,
                                    borderRadius: 99,
                                    padding: "0 4px",
                                    background: "var(--success)",
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    lineHeight: "16px",
                                    textAlign: "center",
                                    border: "2px solid var(--bg-card)",
                                }}
                            >
                                {pendingCount > 9 ? "9+" : pendingCount}
                            </span>
                        )}
                    </button>

                    {showInvitations && (
                        <div
                            style={{
                                position: "absolute",
                                top: 42,
                                right: 0,
                                width: 380,
                                maxHeight: 420,
                                overflowY: "auto",
                                borderRadius: 12,
                                border: "1px solid var(--border)",
                                background: "var(--bg-card)",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                                zIndex: 50,
                                padding: 12,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <p style={{ color: "var(--text-main)", fontSize: 13, fontWeight: 700 }}>Invitations</p>
                                <button
                                    onClick={loadInvitations}
                                    style={{
                                        background: "transparent",
                                        border: "1px solid var(--border)",
                                        borderRadius: 6,
                                        color: "var(--text-sub)",
                                        padding: "4px 8px",
                                        fontSize: 11,
                                        cursor: "pointer",
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>

                            {isLoadingInvitations ? (
                                <p style={{ color: "var(--text-faint)", fontSize: 12, padding: "14px 4px" }}>Chargement des invitations...</p>
                            ) : invitations.length === 0 ? (
                                <p style={{ color: "var(--text-faint)", fontSize: 12, padding: "14px 4px" }}>Aucune invitation pour le moment.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {invitations.map((inv) => {
                                        const isPending = inv.status === "PENDING";
                                        const isActioning = actionInProgressId === inv.id;
                                        return (
                                            <div
                                                key={inv.id}
                                                style={{
                                                    border: "1px solid var(--border)",
                                                    borderRadius: 10,
                                                    padding: 10,
                                                    background: "var(--bg-main)",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ color: "var(--text-main)", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.workspaceName}</p>
                                                        <p style={{ color: "var(--text-sub)", fontSize: 11, marginTop: 2 }}>
                                                            Invite par {inv.inviterName} · role {inv.role}
                                                        </p>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            borderRadius: 99,
                                                            padding: "2px 8px",
                                                            background:
                                                                inv.status === "PENDING"
                                                                    ? "var(--warning-soft)"
                                                                    : inv.status === "ACCEPTED"
                                                                    ? "var(--success-soft)"
                                                                    : "var(--bg-hover)",
                                                            color:
                                                                inv.status === "PENDING"
                                                                    ? "var(--warning)"
                                                                    : inv.status === "ACCEPTED"
                                                                    ? "var(--success)"
                                                                    : "var(--text-sub)",
                                                            height: 18,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {inv.status}
                                                    </span>
                                                </div>

                                                <div style={{ color: "var(--text-faint)", fontSize: 10, marginTop: 6 }}>
                                                    {formatDate(inv.createdAt)}
                                                </div>

                                                {isPending && (
                                                    <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                                                        <button
                                                            onClick={() => handleAccept(inv.id)}
                                                            disabled={isActioning}
                                                            style={{
                                                                flex: 1,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 6,
                                                                background: "var(--success-soft)",
                                                                border: "1px solid var(--success)",
                                                                borderRadius: 8,
                                                                color: "var(--success)",
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                padding: "6px 8px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <Check size={12} />
                                                            Accepter
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(inv.id)}
                                                            disabled={isActioning}
                                                            style={{
                                                                flex: 1,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 6,
                                                                background: "var(--error-soft)",
                                                                border: "1px solid var(--error)",
                                                                borderRadius: 8,
                                                                color: "var(--error)",
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                padding: "6px 8px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <X size={12} />
                                                            Refuser
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button 
                    className="icon-btn" 
                    style={{ position: "relative" }}
                    onClick={onNotificationsClick}
                >
                    <Bell size={15} />
                    <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "var(--error)", border: "2px solid var(--bg-card)" }} />
                </button>
            </div>
        </header>

    );
}