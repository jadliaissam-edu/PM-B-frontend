import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    role: "USER"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Registration failed');
            }

            // Successfully registered, optionally store token if we want auto-login
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
            }

            // Redirect to login or home
            navigate("/login");
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] px-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] right-[-100px] pointer-events-none"
                 style={{ background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)" }} />
            <div className="absolute w-[300px] h-[300px] rounded-full bottom-[-80px] left-[-60px] pointer-events-none"
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

                <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Create account</h1>
                <p className="text-sm text-white/40 mb-6">Design your workflow with precision</p>

                {error && (
                    <div className="mb-4 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                First name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                                className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                                Last name
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                required
                                className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                            Email address
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

                    <div>
                        <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #534AB7, #3C3489)" }}
                    >
                        {loading ? "Creating account..." : "Create account →"}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-white/[0.08]" />
                    <span className="text-xs text-white/25">or</span>
                    <div className="flex-1 h-px bg-white/[0.08]" />
                </div>

                <p className="text-center text-sm text-white/35">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[#1D9E75] font-medium hover:opacity-80 transition-opacity">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}