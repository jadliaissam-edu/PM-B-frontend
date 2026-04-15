import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Loader2, LogOut, Settings } from "lucide-react";
import { logout } from "../api/authApi";

export interface SidebarNavItem {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
}

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    navItems: SidebarNavItem[];
    workspaceDropdown?: ReactNode;
    userName: string;
    userAvatar: string;
}

function SidebarAvatar({ initials, size = 28, color = "#534AB7" }: { initials: string; size?: number; color?: string }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: color + "33",
                border: `1.5px solid ${color}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.35,
                fontWeight: 600,
                color,
                flexShrink: 0,
            }}
        >
            {initials}
        </div>
    );
}

interface LogoutConfirmModalProps {
    isLoading: boolean;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

function LogoutConfirmModal({ isLoading, onConfirm, onClose }: LogoutConfirmModalProps) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
            }}
            onClick={() => {
                if (!isLoading) onClose();
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a",
                    border: "0.5px solid rgba(226,75,74,0.22)",
                    borderRadius: 18,
                    padding: "24px 28px",
                    width: 360,
                    maxWidth: "calc(100vw - 30px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: "rgba(226,75,74,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <LogOut size={16} style={{ color: "#E24B4A" }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 700 }}>Confirmer la deconnexion</h2>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                    Voulez-vous vraiment vous deconnecter ?
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "0.5px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            background: "#E24B4A",
                            border: "none",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                        Se deconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({
    collapsed,
    onToggleCollapse,
    navItems,
    workspaceDropdown,
    userName,
    userAvatar,
}: SidebarProps) {
    const sidebarWidth = collapsed ? 64 : 240;
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            const refreshToken = localStorage.getItem("refreshToken") || undefined;
            await logout({ refreshToken });
        } catch (error) {
            console.error("Logout request failed", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("activeWorkspaceId");
            setShowLogoutConfirm(false);
            navigate("/login", { replace: true });
            setIsLoggingOut(false);
        }
    };

    return (
        <div
            style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                transition: "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)",
                flexShrink: 0,
            }}
        >
        <aside
            style={{
                width: sidebarWidth,
                background: "#111114",
                borderRight: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
                overflow: "hidden",
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 10,
            }}
        >
            <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            flexShrink: 0,
                            background: "linear-gradient(135deg, #534AB7, #1D9E75)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <rect x="2" y="2" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                            <rect x="10" y="2" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="10" width="6" height="6" rx="2" fill="white" opacity="0.5" />
                            <rect x="10" y="10" width="6" height="6" rx="2" fill="white" opacity="0.9" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", whiteSpace: "nowrap" }}>
                            AgileFlow
                        </span>
                    )}
                </div>

                <button
                    onClick={onToggleCollapse}
                    style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.3)",
                        cursor: "pointer",
                        display: "flex",
                        padding: 4,
                        borderRadius: 6,
                        flexShrink: 0,
                    }}
                >
                    {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>
            </div>

            {!collapsed && workspaceDropdown}

            <div style={{ padding: "0 8px", flex: 1, minHeight: 0, overflowY: "auto" }}>
                {!collapsed && (
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.25)",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            padding: "0 8px 8px",
                        }}
                    >
                        Menu
                    </p>
                )}

                {navItems.map((item) => (
                    <div
                        key={item.label}
                        className={`nav-item ${item.active ? "active" : ""}`}
                        style={{ justifyContent: collapsed ? "center" : "flex-start", marginBottom: 2 }}
                        onClick={item.onClick}
                        onKeyDown={(e) => {
                            if (!item.onClick) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                item.onClick();
                            }
                        }}
                        role={item.onClick ? "button" : undefined}
                        tabIndex={item.onClick ? 0 : -1}
                    >
                        <item.icon size={17} style={{ flexShrink: 0 }} />
                        {!collapsed && (
                            <>
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.badge && (
                                    <span
                                        style={{
                                            background: "rgba(83,74,183,0.3)",
                                            color: "#a89ef5",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            borderRadius: 99,
                                            padding: "1px 7px",
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ padding: "12px 8px 20px", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div className="nav-item" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                    <Settings size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Settings</span>}
                </div>

                {!collapsed && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 0" }}>
                        <SidebarAvatar initials={userAvatar} size={30} color="#534AB7" />
                        <div style={{ overflow: "hidden", flex: 1 }}>
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#fff",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {userName}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Admin</p>
                        </div>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            title="Deconnexion"
                            disabled={isLoggingOut}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: "0.5px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.7)",
                                cursor: isLoggingOut ? "not-allowed" : "pointer",
                                opacity: isLoggingOut ? 0.6 : 1,
                            }}
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </div>
        </aside>

        {showLogoutConfirm && (
            <LogoutConfirmModal
                isLoading={isLoggingOut}
                onConfirm={handleLogout}
                onClose={() => setShowLogoutConfirm(false)}
            />
        )}
        </div>
    );
}
