import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/authApi";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialEmail = searchParams.get("email") || "";
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: initialEmail,
        password: "",
        confirmPassword: "",
        mfaEnabled: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Les mots de passe ne correspondent pas");
        }

        setLoading(true);

        try {
            const data = await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: "USER",
                mfaEnabled: formData.mfaEnabled
            });
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
            }
            navigate("/login");
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription");
        } finally {
            setLoading(false);
        }
    };

    const theme = localStorage.getItem("orbyte-theme") || "dark";
    const isDark = theme === "dark";

    return (
        <div data-theme={theme} className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]`}>
            {/* Ambient background glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1D9E75]/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#534AB7]/10 blur-[100px] pointer-events-none" />

            <div className={`relative z-10 w-full max-w-[440px] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 bg-[var(--bg-card)] shadow-[0_20px_50px_rgba(0,0,0,0.1)]`}>
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1D9E75] to-[#534AB7] shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                            <rect x="2" y="2" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                            <rect x="10" y="2" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="10" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="10" y="10" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                        </svg>
                    </div>
                    <span className={`font-bold text-2xl tracking-tighter text-[var(--text-main)]`}>Orbyte</span>
                </div>

                <div className="text-center mb-8">
                    <h1 className={`text-2xl font-bold tracking-tight mb-2 font-syne text-[var(--text-main)]`}>
                        Créer un compte
                    </h1>
                    <p className={`text-base text-[var(--text-sub)]`}>
                        Rejoignez la révolution de la gestion
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                    </div>
                )}

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 text-[var(--text-faint)]`}>Prénom</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Jane"
                                required
                                className={`w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-[var(--bg-hover)] text-[var(--text-main)] placeholder-[var(--text-faint)] hover:border-[var(--border-hov)] focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/20`}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 text-[var(--text-faint)]`}>Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Smith"
                                required
                                className={`w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-[var(--bg-hover)] text-[var(--text-main)] placeholder-[var(--text-faint)] hover:border-[var(--border-hov)] focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/20`}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 text-[var(--text-faint)]`}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="jane@company.com"
                            required
                            className={`w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-[var(--bg-hover)] text-[var(--text-main)] placeholder-[var(--text-faint)] hover:border-[var(--border-hov)] focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/20`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 text-[var(--text-faint)]`}>Mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className={`w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-[var(--bg-hover)] text-[var(--text-main)] placeholder-[var(--text-faint)] hover:border-[var(--border-hov)] focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/20`}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 text-[var(--text-faint)]`}>Confirmation</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className={`w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-[var(--bg-hover)] text-[var(--text-main)] placeholder-[var(--text-faint)] hover:border-[var(--border-hov)] focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/20`}
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border border-[var(--border)] transition-colors bg-[var(--bg-hover)]`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="mfaEnabled"
                                checked={formData.mfaEnabled}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#1D9E75] focus:ring-[#1D9E75]"
                            />
                            <div className="flex flex-col">
                                <span className={`text-sm font-semibold text-[var(--text-sub)]`}>Sécurité MFA</span>
                                <span className={`text-[10px] text-[var(--text-faint)]`}>Activer l'authentification à deux facteurs.</span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-3 rounded-xl text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-xl shadow-[#1D9E75]/20 hover:translate-y-[-2px] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1D9E75 0%, #534AB7 100%)" }}
                    >
                        {loading ? "Création..." : "Créer le compte"}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className={`text-sm text-[var(--text-faint)]`}>
                        Déjà un compte ?{" "}
                        <Link to="/login" className="text-[#534AB7] font-bold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @font-face {
                    font-family: 'Syne';
                    src: url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
                }
                .font-syne { font-family: 'Syne', sans-serif; }
            `}</style>
        </div>
    );
}