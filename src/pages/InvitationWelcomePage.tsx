import { Link, useSearchParams } from "react-router-dom";
import logoImage from "../assets/images/Logo.png";

function getCurrentSessionEmail(): string | null {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { email?: string };
        return parsed.email?.toLowerCase() ?? null;
    } catch {
        return null;
    }
}

export default function InvitationWelcomePage() {
    const [searchParams] = useSearchParams();

    const inviteeEmail = (searchParams.get("email") || "").toLowerCase();
    const workspaceId = searchParams.get("workspaceId") || "";
    const hasAccount = (searchParams.get("hasAccount") || "").toLowerCase() === "true";
    const currentSessionEmail = getCurrentSessionEmail();
    const isSameSession = Boolean(hasAccount && inviteeEmail && currentSessionEmail === inviteeEmail);

    const theme = localStorage.getItem("orbyte-theme") || "dark";

    return (
        <div
            data-theme={theme}
            style={{
                minHeight: "100vh",
                background: "var(--bg-main)",
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.3s ease, color 0.3s ease",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 760,
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    boxShadow: "0 35px 90px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "26px 28px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "linear-gradient(110deg, rgba(83,74,183,0.1), rgba(29,158,117,0.05))",
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                        }}
                    >
                        <img
                            src={logoImage}
                            alt="Orbyte"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    <div>
                        <p style={{ fontSize: 14, color: "var(--text-sub)", margin: 0 }}>Orbyte Workspace</p>
                        <h1 style={{ fontSize: 24, margin: "3px 0 0", fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Welcome to your invitation space</h1>
                    </div>
                </div>

                <div style={{ padding: "28px" }}>
                    <p style={{ fontSize: 15, color: "var(--text-sub)", lineHeight: 1.65 }}>
                        Vous avez reçu une invitation workspace via email.
                        Les invitations internes sont visibles dans la topbar, à côté de l'icône notifications.
                    </p>

                    {inviteeEmail ? (
                        <p style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 8 }}>
                            Email invité: <strong style={{ color: "var(--text-main)" }}>{inviteeEmail}</strong>
                        </p>
                    ) : null}

                    {workspaceId ? (
                        <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
                            Workspace ID: {workspaceId}
                        </p>
                    ) : null}

                    <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {hasAccount && isSameSession ? (
                            <Link
                                to="/workspace"
                                style={{
                                    textDecoration: "none",
                                    background: "linear-gradient(135deg, #1D9E75, #147557)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontSize: 13,
                                    boxShadow: "0 4px 12px rgba(29,158,117,0.2)",
                                }}
                            >
                                Continuer avec la session actuelle
                            </Link>
                        ) : null}

                        {hasAccount ? (
                            <Link
                                to={`/login${inviteeEmail ? `?email=${encodeURIComponent(inviteeEmail)}` : ""}`}
                                style={{
                                    textDecoration: "none",
                                    background: "linear-gradient(135deg, #534AB7, #3C3489)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontSize: 13,
                                    boxShadow: "0 4px 12px rgba(83,74,183,0.2)",
                                }}
                            >
                                Login
                            </Link>
                        ) : (
                            <Link
                                to={`/invite/register${inviteeEmail ? `?email=${encodeURIComponent(inviteeEmail)}` : ""}${workspaceId ? `${inviteeEmail ? "&" : "?"}workspaceId=${encodeURIComponent(workspaceId)}` : ""}`}
                                style={{
                                    textDecoration: "none",
                                    background: "var(--bg-hover)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-main)",
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontSize: 13,
                                    transition: "all 0.2s",
                                }}
                            >
                                Create your account to accept the invitation
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
