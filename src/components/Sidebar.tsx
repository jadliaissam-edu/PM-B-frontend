import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Loader2, LogOut, Settings } from "lucide-react";
import { logout } from "../api/authApi";
import logoImage from "../assets/images/Logo.png";

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
    resourcesPanel?: ReactNode;
    userName: string;
    userAvatar: string;
}

const SIDEBAR_STORAGE_KEY = "sidebar-expanded-width";
const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_DEFAULT_WIDTH = 272;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 420;

function clampSidebarWidth(width: number): number {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
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
    resourcesPanel,
    userName,
    userAvatar,
}: SidebarProps) {
    const [expandedWidth, setExpandedWidth] = useState(() => {
        if (typeof window === "undefined") return SIDEBAR_DEFAULT_WIDTH;

        const storedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
        const parsedWidth = storedWidth ? Number.parseInt(storedWidth, 10) : SIDEBAR_DEFAULT_WIDTH;

        if (!Number.isFinite(parsedWidth)) return SIDEBAR_DEFAULT_WIDTH;
        return clampSidebarWidth(parsedWidth);
    });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{ clientX: number; width: number } | null>(null);
    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : expandedWidth;
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(expandedWidth));
    }, [expandedWidth]);

    const handleResizeStart = useCallback(
        (event: ReactMouseEvent<HTMLDivElement>) => {
            if (collapsed) return;

            event.preventDefault();
            resizeStartRef.current = {
                clientX: event.clientX,
                width: expandedWidth,
            };
            setIsResizing(true);
        },
        [collapsed, expandedWidth],
    );

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!resizeStartRef.current) return;

            const deltaX = event.clientX - resizeStartRef.current.clientX;
            const nextWidth = clampSidebarWidth(resizeStartRef.current.width + deltaX);
            setExpandedWidth(nextWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeStartRef.current = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizing]);

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
                transition: isResizing ? "none" : "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)",
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
                transition: isResizing ? "none" : "width 0.25s cubic-bezier(.4,0,.2,1)",
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={logoImage}
                            alt="Orbyte"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    {!collapsed && (
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", whiteSpace: "nowrap" }}>
                            Orbyte
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

                {!collapsed && resourcesPanel}
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

            {!collapsed && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize sidebar"
                    onMouseDown={handleResizeStart}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: 8,
                        cursor: "col-resize",
                        zIndex: 20,
                        display: "flex",
                        justifyContent: "center",
                        background: isResizing ? "rgba(255,255,255,0.04)" : "transparent",
                    }}
                >
                    <div
                        style={{
                            width: 2,
                            margin: "8px 0",
                            borderRadius: 99,
                            background: isResizing ? "rgba(168,158,245,0.6)" : "rgba(255,255,255,0.12)",
                        }}
                    />
                </div>
            )}
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
