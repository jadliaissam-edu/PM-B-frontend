import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/authApi";
import logoImage from "../assets/images/Logo.png";

export default function InviteRegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const invitedEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        mfaEnabled: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!invitedEmail) {
            setError("Invitation invalide: email manquant.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: invitedEmail,
                password: formData.password,
                role: "USER",
                mfaEnabled: formData.mfaEnabled,
            });

            navigate(`/login?email=${encodeURIComponent(invitedEmail)}`);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const theme = localStorage.getItem("orbyte-theme") || "dark";

    return (
        <div data-theme={theme} className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4 relative overflow-hidden transition-colors duration-300">
            <div
                className="absolute w-[500px] h-[500px] rounded-full top-[-100px] right-[-100px] pointer-events-none opacity-40 dark:opacity-100"
                style={{ background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)" }}
            />
            <div
                className="absolute w-[300px] h-[300px] rounded-full bottom-[-80px] left-[-60px] pointer-events-none opacity-40 dark:opacity-100"
                style={{ background: "radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)" }}
            />

            <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-10 shadow-xl">
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden">
                        <img src={logoImage} alt="Orbyte" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-lg text-[var(--text-main)] tracking-tight">Orbyte</span>
                </div>

                <h1 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight mb-1">Create account</h1>
                <p className="text-sm text-[var(--text-sub)] mb-2">You were invited to join a workspace.</p>
                <p className="text-xs text-[var(--text-faint)] mb-6">Invited email: {invitedEmail || "Unknown"}</p>

                {error && (
                    <div className="mb-4 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                                First name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                                className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                                Last name
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                required
                                className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--accent)] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--accent)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--accent)] transition-all"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-[var(--text-sub)]">
                        <input
                            type="checkbox"
                            name="mfaEnabled"
                            checked={formData.mfaEnabled}
                            onChange={handleChange}
                            className="h-4 w-4 accent-[#1D9E75]"
                        />
                        Enable MFA on this account
                    </label>

                    <button
                        type="submit"
                        disabled={loading || !invitedEmail}
                        className="w-full mt-6 py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#534AB7]/20"
                        style={{ background: "linear-gradient(135deg, #534AB7, #3C3489)" }}
                    >
                        {loading ? "Creating account..." : "Create account →"}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-faint)]">or</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <p className="text-center text-sm text-[var(--text-sub)]">
                    Already have an account?{" "}
                    <Link to={`/login${invitedEmail ? `?email=${encodeURIComponent(invitedEmail)}` : ""}`} className="text-[#1D9E75] font-medium hover:opacity-80 transition-opacity">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
