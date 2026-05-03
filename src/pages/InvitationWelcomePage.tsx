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

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(140deg, #0f1117 0%, #151823 45%, #121923 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 760,
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(17, 20, 31, 0.8)",
                    boxShadow: "0 35px 90px rgba(0,0,0,0.42)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "26px 28px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "linear-gradient(110deg, rgba(83,74,183,0.24), rgba(29,158,117,0.08))",
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
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", margin: 0 }}>Orbyte Workspace</p>
                        <h1 style={{ fontSize: 24, margin: "3px 0 0", fontWeight: 800 }}>Welcome to your invitation space</h1>
                    </div>
                </div>

                <div style={{ padding: "28px" }}>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>
                        Vous avez recu une invitation workspace via email.
                        Les invitations internes sont visibles dans la topbar, a cote de l'icone notifications.
                    </p>

                    {inviteeEmail ? (
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
                            Email invite: <strong style={{ color: "#fff" }}>{inviteeEmail}</strong>
                        </p>
                    ) : null}

                    {workspaceId ? (
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 4 }}>
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
                                }}
                            >
                                Login
                            </Link>
                        ) : (
                            <Link
                                to={`/invite/register${inviteeEmail ? `?email=${encodeURIComponent(inviteeEmail)}` : ""}${workspaceId ? `${inviteeEmail ? "&" : "?"}workspaceId=${encodeURIComponent(workspaceId)}` : ""}`}
                                style={{
                                    textDecoration: "none",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontSize: 13,
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
