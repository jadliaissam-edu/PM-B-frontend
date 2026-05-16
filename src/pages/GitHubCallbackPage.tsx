import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

/**
 * GitHubCallbackPage — Page désactivée
 *
 * L'authentification via "GitHub App" (OAuth flow) a été supprimée.
 * L'accès aux dépôts privés se fait désormais via un Personal Access Token (PAT)
 * saisit directement dans le formulaire d'ajout de dépôt sur la page IA.
 *
 * Cette page redirige automatiquement vers /ai.
 */
export default function GitHubCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirection automatique vers la page IA après 2 secondes
        const timer = setTimeout(() => navigate("/ai"), 2000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0d0d10",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
                @keyframes fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>

            <div className="fade-in" style={{
                textAlign: "center",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(226,75,74,0.2)",
                borderRadius: 24,
                padding: "48px 56px",
                maxWidth: 440,
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: "rgba(226,75,74,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    border: "1px solid rgba(226,75,74,0.25)",
                }}>
                    <XCircle size={28} color="#E24B4A" />
                </div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 20, fontWeight: 700,
                    color: "#fff", margin: "0 0 10px",
                }}>
                    Flux OAuth désactivé
                </h1>

                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 20px" }}>
                    L'authentification via GitHub App a été supprimée.<br />
                    Pour accéder aux dépôts privés, utilisez un{" "}
                    <strong style={{ color: "#a89ef5" }}>Personal Access Token (PAT)</strong>{" "}
                    directement dans le formulaire d'ajout de dépôt.
                </p>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                    Redirection vers la page IA...
                </p>

                <button
                    onClick={() => navigate("/ai")}
                    style={{
                        marginTop: 20,
                        background: "linear-gradient(135deg, #534AB7, #3C3489)",
                        border: "none", borderRadius: 12,
                        padding: "11px 28px", color: "#fff",
                        fontSize: 14, fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Retour à l'IA
                </button>
            </div>
        </div>
    );
}
