import { Link } from "react-router-dom";

export default function LoginPage() {
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

                <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Welcome back</h1>
                <p className="text-sm text-white/40 mb-8">Sign in to your workspace</p>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-[#1e1e24] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#534AB7]/70 transition-colors"
                        />
                    </div>
                </div>

                <div className="text-right mt-2 mb-6">
                    <a href="#" className="text-xs text-[#534AB7] hover:opacity-80 transition-opacity">
                        Forgot password?
                    </a>
                </div>

                <button className="w-full py-3 rounded-[10px] text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99]"
                        style={{ background: "linear-gradient(135deg, #534AB7, #3C3489)" }}>
                    Sign in →
                </button>

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