import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

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

export default function Sidebar({
    collapsed,
    onToggleCollapse,
    navItems,
    workspaceDropdown,
    userName,
    userAvatar,
}: SidebarProps) {
    const sidebarWidth = collapsed ? 64 : 240;

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
                        <div style={{ overflow: "hidden" }}>
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
                    </div>
                )}
            </div>
        </aside>
        </div>
    );
}
