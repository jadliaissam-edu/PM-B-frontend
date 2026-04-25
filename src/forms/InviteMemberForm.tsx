import { useState } from "react";
import { X, Send, Mail, Shield, UserPlus, Loader2 } from "lucide-react";
import { inviteMemberByEmail, type WorkspaceRole } from "../api/workspaceMemberApi";

interface InviteMemberFormProps {
    workspaceId: string;
    onSubmit: () => void;
    onClose: () => void;
}

export default function InviteMemberForm({ workspaceId, onSubmit, onClose }: InviteMemberFormProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<WorkspaceRole>("MEMBER");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await inviteMemberByEmail({
                email: email.trim(),
                workspaceId,
                role
            });
            onSubmit();
        } catch (err) {
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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 500, width: "100%", padding: 0, overflow: "hidden" }}>
                {/* Header */}
                <div style={{
                    padding: "24px 32px",
                    background: "linear-gradient(135deg, rgba(83, 74, 183, 0.1) 0%, rgba(0, 0, 0, 0) 100%)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "rgba(83, 74, 183, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <UserPlus size={20} style={{ color: "#7c3aed" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Invite Team Member</h2>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Add someone to your workspace</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 32 }}>
                    {error && (
                        <div style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: 12, padding: "12px 16px", marginBottom: 24,
                            color: "#ef4444", fontSize: 13, display: "flex", alignItems: "center", gap: 10
                        }}>
                            <Shield size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                            Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} />
                            <input
                                autoFocus
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                style={{
                                    width: "100%", padding: "14px 16px 14px 48px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 12, color: "#fff", fontSize: 14, outline: "none"
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                            Workspace Role
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {roles.map((r) => (
                                <div
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    style={{
                                        padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                                        background: role === r.value ? "rgba(83, 74, 183, 0.1)" : "rgba(255,255,255,0.02)",
                                        border: `1px solid ${role === r.value ? "#7c3aed" : "rgba(255,255,255,0.06)"}`,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: role === r.value ? "#fff" : "rgba(255,255,255,0.7)" }}>{r.label}</span>
                                        {role === r.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />}
                                    </div>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4, marginBottom: 0 }}>{r.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: "14px", borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "transparent", color: "#fff", fontWeight: 600, cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !email.trim()}
                            style={{
                                flex: 2, padding: "14px", borderRadius: 12,
                                background: "#7c3aed", color: "#fff", fontWeight: 600,
                                border: "none", cursor: (isSubmitting || !email.trim()) ? "not-allowed" : "pointer",
                                opacity: (isSubmitting || !email.trim()) ? 0.6 : 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                            }}
                        >
                            {isSubmitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                            {isSubmitting ? "Sending Invitation..." : "Send Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
