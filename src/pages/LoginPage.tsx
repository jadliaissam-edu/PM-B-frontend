import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { login, verifyMfa } from "../api/authApi";
import { login, verifyMfa } from "../api/authApi.js";
export default function LoginPage() {
    const navigate = useNavigate();
    // Etat du formulaire de la premiere etape (email + password).
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    // Etat de la deuxieme etape MFA (challenge + OTP).
    const [mfaData, setMfaData] = useState({
        challengeToken: "",
        otp: "",
        destination: "",
        expiresInSeconds: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Indique si on est dans l'etape OTP.
    const isMfaStep = Boolean(mfaData.challengeToken);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // On garde uniquement les chiffres pour eviter les erreurs de saisie.
        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
        setMfaData(prev => ({ ...prev, otp: onlyDigits }));
    };

    const storeAuthAndRedirect = (data: any) => {
        // Stockage des tokens finaux et du profil user apres login complet.
        if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        // alert("Login successful! Redirecting to dashboard...");

        // Redirection apres authentification.
        navigate("/");
    };

    const handleFirstStepSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await login(formData);
            console.log("Login response:", data);

            // Si le backend demande la MFA, on passe sur l'ecran OTP.
            if (data.mfaRequired && data.challengeToken) {
                setMfaData({
                    challengeToken: data.challengeToken,
                    otp: "",
                    destination: data.mfaDestination || "votre email",
                    expiresInSeconds: data.mfaExpiresInSeconds || 0
                });
                return;
            }

            // Sinon on termine le login classique.
            storeAuthAndRedirect(data);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // On valide le code OTP avec le challenge recu a l'etape 1.
            const data = await verifyMfa({
                challengeToken: mfaData.challengeToken,
                otp: mfaData.otp
            });
            console.log("MFA verify response:", data);

            // Une verification OTP valide renvoie les tokens finaux.
            storeAuthAndRedirect(data);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const resetMfaStep = () => {
        // Permet de revenir a l'etape email/password.
        setMfaData({
            challengeToken: "",
            otp: "",
            destination: "",
            expiresInSeconds: 0
        });
        setError("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] left-[-100px] pointer-events-none"
                 style={{ background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)" }} />
            <div className="absolute w-[300px] h-[300px] rounded-full bottom-[-80px] right-[-60px] pointer-events-none"
                 style={{ background: "radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)" }} />

            <div className="relative z-10 w-full max-w-sm bg-[#16161a] border border-white/[0.08] rounded-2xl p-10">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                         style={{ background: "linear-gradient(135deg, #534AB7, #1D9E75)" }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <rect x="2" y="2" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                            <rect x="10" y="2" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="10" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="10" y="10" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">AgileFlow</span>
                </div>

                <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                    {isMfaStep ? "Verify your identity" : "Welcome back"}
                </h1>
                <p className="text-sm text-white/40 mb-6">
                    {isMfaStep
                        ? `Enter the 6-digit code sent to ${mfaData.destination}`
                        : "Sign in to your workspace"}
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {!isMfaStep ? (
                    <form className="space-y-4" onSubmit={handleFirstStepSubmit}>
                        <div>
                            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@company.com"
                                required
                                className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                            />
                        </div>

                        <div className="text-right mt-2 mb-6">
                            <a href="#" className="text-xs text-[#534AB7] hover:opacity-80 transition-opacity">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #534AB7, #3C3489)" }}
                        >
                            {loading ? "Signing in..." : "Sign in →"}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleMfaSubmit}>
                        <div>
                            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                OTP Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="otp"
                                value={mfaData.otp}
                                onChange={handleOtpChange}
                                placeholder="123456"
                                minLength={6}
                                maxLength={6}
                                required
                                className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#1D9E75]/70 transition-colors tracking-[0.25em]"
                            />
                        </div>

                        {mfaData.expiresInSeconds > 0 && (
                            <p className="text-xs text-white/40">
                                Code valid for about {mfaData.expiresInSeconds} seconds.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || mfaData.otp.length !== 6}
                            className="w-full py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #1D9E75, #147557)" }}
                        >
                            {loading ? "Verifying..." : "Verify OTP →"}
                        </button>

                        <button
                            type="button"
                            onClick={resetMfaStep}
                            disabled={loading}
                            className="w-full py-3 rounded-[10px] border border-white/10 text-white/75 text-sm transition-colors hover:bg-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            Back to password step
                        </button>
                    </form>
                )}

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-white/[0.08]" />
                    <span className="text-xs text-white/25">or</span>
                    <div className="flex-1 h-px bg-white/[0.08]" />
                </div>

                <p className="text-center text-sm text-white/35">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-[#1D9E75] font-medium hover:opacity-80 transition-opacity">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}