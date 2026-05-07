import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Mail, Plus, Search, UserPlus, X } from "lucide-react";
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
}

export default function WorkspaceTopBar({ userName: _userName, userAvatar: _userAvatar, onInvite }: WorkspaceTopBarProps) {
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
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                background: "#0d0d0f",
                flexShrink: 0,
            }}
        >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: 12, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input className="search-input" placeholder="Search tasks, projects..." />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button 
                    onClick={onInvite}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(124, 58, 237, 0.1)",
                        border: "1px solid rgba(124, 58, 237, 0.2)",
                        borderRadius: 7, padding: "5px 10px",
                        color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124, 58, 237, 0.15)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"}
                >
                    <UserPlus size={13} />
                    Invite
                </button>
                
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

                <div style={{ position: "relative" }}>
                    <button
                        className="icon-btn"
                        style={{ position: "relative" }}
                        onClick={() => setShowInvitations((v) => !v)}
                    >
                        <Mail size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
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
                                    background: "#1D9E75",
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    lineHeight: "16px",
                                    textAlign: "center",
                                    border: "1px solid #0d0d0f",
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
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "#16161a",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                                zIndex: 50,
                                padding: 12,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <p style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Invitations</p>
                                <button
                                    onClick={loadInvitations}
                                    style={{
                                        background: "transparent",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: 6,
                                        color: "rgba(255,255,255,0.7)",
                                        padding: "4px 8px",
                                        fontSize: 11,
                                        cursor: "pointer",
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>

                            {isLoadingInvitations ? (
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "14px 4px" }}>Chargement des invitations...</p>
                            ) : invitations.length === 0 ? (
                                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, padding: "14px 4px" }}>Aucune invitation pour le moment.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {invitations.map((inv) => {
                                        const isPending = inv.status === "PENDING";
                                        const isActioning = actionInProgressId === inv.id;
                                        return (
                                            <div
                                                key={inv.id}
                                                style={{
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: 10,
                                                    padding: 10,
                                                    background: "rgba(255,255,255,0.02)",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                                    <div>
                                                        <p style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{inv.workspaceName}</p>
                                                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>
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
                                                                    ? "rgba(245,158,11,0.15)"
                                                                    : inv.status === "ACCEPTED"
                                                                    ? "rgba(29,158,117,0.15)"
                                                                    : "rgba(255,255,255,0.12)",
                                                            color:
                                                                inv.status === "PENDING"
                                                                    ? "#fbbf24"
                                                                    : inv.status === "ACCEPTED"
                                                                    ? "#6ee7b7"
                                                                    : "rgba(255,255,255,0.75)",
                                                            height: 18,
                                                        }}
                                                    >
                                                        {inv.status}
                                                    </span>
                                                </div>

                                                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 6 }}>
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
                                                                background: "rgba(29,158,117,0.15)",
                                                                border: "1px solid rgba(29,158,117,0.35)",
                                                                borderRadius: 8,
                                                                color: "#7df0c8",
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
                                                                background: "rgba(239,68,68,0.12)",
                                                                border: "1px solid rgba(239,68,68,0.3)",
                                                                borderRadius: 8,
                                                                color: "#fca5a5",
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

                <button className="icon-btn" style={{ position: "relative" }}>
                    <Bell size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                    <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#E24B4A", border: "1.5px solid #0d0d0f" }} />
                </button>
                <button className="icon-btn">
                    <Plus size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
            </div>
        </header>
    );
}
