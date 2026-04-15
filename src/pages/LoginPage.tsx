import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, verifyMfa } from "../api/authApi";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // MFA state
    const [showMfaView, setShowMfaView] = useState(false);
    const [mfaData, setMfaData] = useState<{ challengeToken: string; mfaDestination?: string; expiresInSeconds?: number } | null>(null);
    const [otp, setOtp] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await login(formData);
            console.log("Login response:", data);

            if (data.mfaRequired) {
                setMfaData({
                    challengeToken: data.challengeToken,
                    mfaDestination: data.mfaDestination,
                    expiresInSeconds: data.mfaExpiresInSeconds
                });
                setShowMfaView(true);
            } else if (data.accessToken) {
                finalizeLogin(data);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) return;
        setError("");
        setLoading(true);

        try {
            const data = await verifyMfa({
                challengeToken: mfaData?.challengeToken,
                otp: otp.trim()
            });
            finalizeLogin(data);
        } catch (err: any) {
            setError(err.message || "Invalid or expired MFA code.");
        } finally {
            setLoading(false);
        }
    };

    const finalizeLogin = (data: any) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/workspace");
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

                {!showMfaView ? (
                    <>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Welcome back</h1>
                        <p className="text-sm text-white/40 mb-6">Sign in to your workspace</p>

                        {error && (
                            <div className="mb-4 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleLoginSubmit}>
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
                                className="w-full py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #534AB7, #3C3489)" }}
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                {loading ? "Signing in..." : "Sign in →"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Verify your identity</h1>
                        <p className="text-sm text-white/40 mb-6">
                            Enter the code sent to <span className="text-white/70 font-medium">{mfaData?.mfaDestination}</span>
                        </p>

                        {error && (
                            <div className="mb-4 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleMfaSubmit}>
                            <div>
                                <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-4 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:tracking-normal placeholder-white/10 outline-none focus:border-[#1D9E75]/70 transition-colors"
                                />
                            </div>

                            {mfaData?.expiresInSeconds && mfaData.expiresInSeconds > 0 && (
                                <p className="text-[10px] text-white/20 text-center uppercase tracking-wider">
                                    Valid for {mfaData.expiresInSeconds} seconds
                                </p>
                            )}

                            <p className="text-xs text-white/25 text-center mt-4 mb-6">
                                Didn't receive code? <button type="button" onClick={() => setShowMfaView(false)} className="text-[#534AB7] hover:underline">Try again</button>
                            </p>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #1D9E75, #146D51)" }}
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>
                        </form>
                    </>
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