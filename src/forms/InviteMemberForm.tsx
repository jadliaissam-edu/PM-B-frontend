import { useState } from "react";
import { X, Send, Mail, Shield, UserPlus, Loader2 } from "lucide-react";
import { inviteMemberByEmail, type WorkspaceRole } from "../api/workspaceMemberApi";

interface InviteMemberFormProps {
    workspaceId: string;
    onSubmit: (successMessage: string) => void;
    onClose: () => void;
}

export default function InviteMemberForm({ workspaceId, onSubmit, onClose }: InviteMemberFormProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<WorkspaceRole>("MEMBER");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await inviteMemberByEmail({
                email: email.trim(),
                workspaceId,
                role
            });

            const message = response.message || "Invitation sent successfully.";
            setSuccessMessage(message);

            // Petit delai pour laisser le feedback visible avant fermeture de la modale.
            window.setTimeout(() => {
                onSubmit(message);
            }, 900);
        } catch (err) {
            setSuccessMessage(null);
            setError(err instanceof Error ? err.message : "Failed to send invitation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const roles: { value: WorkspaceRole; label: string; desc: string }[] = [
        { value: "MEMBER", label: "Member", desc: "Can create tasks, spaces, and folders." },
        { value: "ADMIN", label: "Admin", desc: "Full access including workspace settings." },
        { value: "GUEST", label: "Viewer", desc: "Can only view and comment on tasks." }
    ];

    const fieldLabelStyle = {
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-faint)",
        marginBottom: 10,
        textTransform: "uppercase" as const,
        letterSpacing: "0.8px"
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 420, width: "100%", padding: 0, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
                {/* Header */}
                <div style={{
                    padding: "18px 24px",
                    background: "var(--accent-soft)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "var(--accent-soft)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <UserPlus size={20} style={{ color: "var(--accent)" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'Syne', sans-serif", color: "var(--text-main)" }}>Invite Member</h2>
                            <p style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 1 }}>Add someone to your workspace</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                    {successMessage && (
                        <div style={{
                            background: "var(--success-soft)",
                            border: "1px solid var(--success-border)",
                            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                            color: "var(--success)", fontSize: 12, display: "flex", alignItems: "center", gap: 10
                        }}>
                            <Shield size={16} />
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                            color: "#ef4444", fontSize: 12, display: "flex", alignItems: "center", gap: 10
                        }}>
                            <Shield size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        <label style={fieldLabelStyle}>
                            Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                            <input
                                autoFocus
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                style={{
                                    width: "100%", padding: "12px 16px 12px 44px",
                                    background: "var(--bg-main)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 12, color: "var(--text-main)", fontSize: 14, outline: "none"
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={fieldLabelStyle}>
                            Workspace Role
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {roles.map((r) => (
                                <div
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                                        background: role === r.value ? "var(--accent-soft)" : "var(--bg-hover)",
                                        border: `1px solid ${role === r.value ? "var(--accent)" : "var(--border)"}`,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: role === r.value ? "var(--accent)" : "var(--text-main)" }}>{r.label}</span>
                                        {role === r.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />}
                                    </div>
                                    <p style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 3, marginBottom: 0 }}>{r.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: 12,
                                        border: "1px solid var(--border)",
                                        background: "transparent", color: "var(--text-main)", fontWeight: 600, fontSize: 13, cursor: "pointer"
                                    }}
                                >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !email.trim() || Boolean(successMessage)}
                            style={{
                                flex: 2, padding: "12px", borderRadius: 12,
                                background: "var(--accent)", color: "#fff", fontWeight: 600,
                                fontSize: 13,
                                border: "none", cursor: (isSubmitting || !email.trim() || Boolean(successMessage)) ? "not-allowed" : "pointer",
                                opacity: (isSubmitting || !email.trim() || Boolean(successMessage)) ? 0.6 : 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                            }}
                        >
                            {isSubmitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                            {isSubmitting ? "Sending Invitation..." : successMessage ? "Invitation Sent" : "Send Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}