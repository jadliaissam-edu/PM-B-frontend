import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Github } from "lucide-react";

/**
 * Page de callback OAuth GitHub.
 * GitHub redirige ici avec ?code=XXX après que l'utilisateur a autorisé l'app.
 * On échange ce code contre un access_token via notre backend Spring Boot.
 */
export default function GitHubCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setErrorMsg("Accès refusé par GitHub. Veuillez réessayer.");
            return;
        }

        if (!code) {
            setStatus("error");
            setErrorMsg("Code OAuth manquant dans l'URL.");
            return;
        }

        // Échanger le code contre un token via le backend
        fetch(`/api/github/oauth/exchange?code=${code}`, { method: "POST" })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                // Stocker le token GitHub dans localStorage
                localStorage.setItem("github_access_token", data.access_token);
                localStorage.setItem("github_scope", data.scope || "");
                setStatus("success");

                // Rediriger vers la page IA après 1.5s
                setTimeout(() => navigate("/ai"), 1500);
            })
            .catch(err => {
                setStatus("error");
                setErrorMsg(err.message || "Erreur lors de l'échange du token.");
            });
    }, [searchParams, navigate]);

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
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>

            <div className="fade-in" style={{
                textAlign: "center",
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: "48px 56px",
                maxWidth: 420,
            }}>
                {/* GitHub Icon */}
                <div style={{
                    width: 64, height: 64,
                    borderRadius: 18,
                    background: status === "success"
                        ? "rgba(34,197,94,0.12)"
                        : status === "error"
                            ? "rgba(226,75,74,0.12)"
                            : "rgba(83,74,183,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    border: `1px solid ${
                        status === "success" ? "rgba(34,197,94,0.25)"
                        : status === "error" ? "rgba(226,75,74,0.25)"
                        : "rgba(83,74,183,0.3)"
                    }`,
                }}>
                    {status === "loading" && <Loader2 size={28} color="#a89ef5" className="spin" />}
                    {status === "success" && <CheckCircle size={28} color="#22C55E" />}
                    {status === "error" && <XCircle size={28} color="#E24B4A" />}
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 22, fontWeight: 700,
                    color: "#fff", margin: "0 0 10px",
                }}>
                    {status === "loading" && "Connexion GitHub..."}
                    {status === "success" && "GitHub connecté ! 🎉"}
                    {status === "error" && "Connexion échouée"}
                </h1>

                <p style={{
                    fontSize: 14, color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6, margin: 0,
                }}>
                    {status === "loading" && "Échange du code d'autorisation en cours..."}
                    {status === "success" && "Vos dépôts privés sont maintenant accessibles. Redirection..."}
                    {status === "error" && errorMsg}
                </p>

                {status === "error" && (
                    <button
                        onClick={() => navigate("/ai")}
                        style={{
                            marginTop: 24,
                            background: "linear-gradient(135deg, #534AB7, #3C3489)",
                            border: "none", borderRadius: 12,
                            padding: "11px 28px", color: "#fff",
                            fontSize: 14, fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Retour à l'IA
                    </button>
                )}
            </div>
        </div>
    );
}
