import  { useState, useRef, useEffect } from "react";
import {
    LayoutDashboard, CheckSquare, Inbox, BarChart2, ChevronDown,
    ChevronLeft, ChevronRight, Settings, Plus, Pencil, Trash2, Loader2
} from "lucide-react";
import type { WorkspaceResponseDto } from "../api/workspaceApi";

// ============================================================================
// CONFIG
// ============================================================================

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: CheckSquare, label: "My Tasks", badge: 5 },
    { icon: Inbox, label: "Inbox", badge: 3 },
    { icon: BarChart2, label: "Reporting" },
];

// ============================================================================
// PROPS
// ============================================================================

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    workspaces: WorkspaceResponseDto[];
    activeWorkspace: WorkspaceResponseDto | null;
    onSelectWorkspace: (ws: WorkspaceResponseDto) => void;
    onCreateWorkspace: () => void;
    onEditWorkspace: (ws: WorkspaceResponseDto) => void;
    onDeleteWorkspace: (ws: WorkspaceResponseDto) => void;
    user: { name: string; avatar: string };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Avatar({ initials, size = 28, color = "#534AB7" }: { initials: string; size?: number; color?: string }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color + "33", border: `1.5px solid ${color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.35, fontWeight: 600, color,
            flexShrink: 0,
        }}>{initials}</div>
    );
}

interface MyWorkspacesDropdownProps {
    workspaces: WorkspaceResponseDto[];
    activeWorkspace: WorkspaceResponseDto | null;
    onSelect: (ws: WorkspaceResponseDto) => void;
    onCreateClick: () => void;
    onEditClick: (ws: WorkspaceResponseDto) => void;
    onDeleteClick: (ws: WorkspaceResponseDto) => void;
}

function MyWorkspacesDropdown({
    workspaces, activeWorkspace, onSelect, onCreateClick, onEditClick, onDeleteClick,
}: MyWorkspacesDropdownProps) {
    const [open, setOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ padding: "0 12px 16px", position: "relative" }}>
            <div id="ws-dropdown-trigger" className="ws-selector" onClick={() => setOpen((v) => !v)}>
                <div style={{
                    width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #534AB7, #3C3489)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                    {activeWorkspace?.name.charAt(0).toUpperCase() || "W"}
                </div>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeWorkspace?.name || "No Workspace"}
                </span>
                <ChevronDown
                    size={13}
                    style={{ opacity: 0.5, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                />
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 12, right: 12,
                    background: "#1a1a1f", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    zIndex: 100, overflow: "hidden",
                }}>
                    <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "10px 12px 6px" }}>
                        My Workspaces
                    </p>

                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {workspaces.map((ws) => (
                            <div
                                key={ws.id}
                                id={`ws-item-${ws.id}`}
                                onMouseEnter={() => setHoveredId(ws.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer",
                                    background: hoveredId === ws.id ? "rgba(255,255,255,0.04)" : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div
                                    onClick={() => { onSelect(ws); setOpen(false); }}
                                    style={{
                                        width: 22, height: 22, borderRadius: 6,
                                        background: ws.id === activeWorkspace?.id ? "linear-gradient(135deg, #534AB7, #3C3489)" : "rgba(255,255,255,0.08)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                                    }}
                                >
                                    {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    onClick={() => { onSelect(ws); setOpen(false); }}
                                    style={{
                                        flex: 1, fontSize: 13,
                                        color: ws.id === activeWorkspace?.id ? "#a89ef5" : "rgba(255,255,255,0.7)",
                                        fontWeight: ws.id === activeWorkspace?.id ? 500 : 400,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}
                                >
                                    {ws.name}
                                </span>
                                {hoveredId === ws.id && (
                                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                        <button
                                            id={`ws-edit-btn-${ws.id}`}
                                            onClick={(e) => { e.stopPropagation(); onEditClick(ws); setOpen(false); }}
                                            title="Edit workspace"
                                            style={{ background: "rgba(83,74,183,0.15)", border: "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#a89ef5", display: "flex" }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            id={`ws-delete-btn-${ws.id}`}
                                            onClick={(e) => { e.stopPropagation(); onDeleteClick(ws); setOpen(false); }}
                                            title="Delete workspace"
                                            style={{ background: "rgba(226,75,74,0.12)", border: "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#E24B4A", display: "flex" }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {workspaces.length === 0 && (
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 12px" }}>No workspaces yet.</p>
                        )}
                    </div>

                    <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />

                    <button
                        id="ws-create-btn"
                        onClick={() => { onCreateClick(); setOpen(false); }}
                        style={{
                            width: "100%", background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px 10px",
                            color: "#a89ef5", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(83,74,183,0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                        <Plus size={14} /> New Workspace
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Sidebar({
    collapsed,
    onToggle,
    workspaces,
    activeWorkspace,
    onSelectWorkspace,
    onCreateWorkspace,
    onEditWorkspace,
    onDeleteWorkspace,
    user,
}: SidebarProps) {
    return (
        <>
            <style>{`
                .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background 0.18s, color 0.18s; color: rgba(255,255,255,0.45); font-size: 14px; font-weight: 400; white-space: nowrap; overflow: hidden; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
                .nav-item.active { background: rgba(83,74,183,0.18); color: #a89ef5; }
                .ws-selector { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor: pointer; transition: background 0.18s; font-size: 13px; color: rgba(255,255,255,0.7); }
                .ws-selector:hover { background: rgba(255,255,255,0.06); }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>

            <aside style={{
                width: collapsed ? 64 : 240, minWidth: collapsed ? 64 : 240,
                background: "#111114", borderRight: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex", flexDirection: "column",
                transition: "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)",
                overflow: "hidden", position: "relative", zIndex: 10,
            }}>
                {/* Logo */}
                <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg, #534AB7, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                    <button onClick={onToggle} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6, flexShrink: 0 }}>
                        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                    </button>
                </div>

                {/* Workspace Dropdown */}
                {!collapsed && (
                    <MyWorkspacesDropdown
                        workspaces={workspaces}
                        activeWorkspace={activeWorkspace}
                        onSelect={onSelectWorkspace}
                        onCreateClick={onCreateWorkspace}
                        onEditClick={onEditWorkspace}
                        onDeleteClick={onDeleteWorkspace}
                    />
                )}

                {/* Nav */}
                <div style={{ padding: "0 8px", flex: 1 }}>
                    {!collapsed && (
                        <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "0 8px 8px" }}>
                            Menu
                        </p>
                    )}
                    {navItems.map((item) => (
                        <div key={item.label} className={`nav-item ${item.active ? "active" : ""}`}
                            style={{ justifyContent: collapsed ? "center" : "flex-start", marginBottom: 2 }}>
                            <item.icon size={17} style={{ flexShrink: 0 }} />
                            {!collapsed && (
                                <>
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {item.badge && (
                                        <span style={{ background: "rgba(83,74,183,0.3)", color: "#a89ef5", fontSize: 11, fontWeight: 600, borderRadius: 99, padding: "1px 7px" }}>{item.badge}</span>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div style={{ padding: "12px 8px 20px", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <div className="nav-item" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                        <Settings size={17} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Settings</span>}
                    </div>
                    {!collapsed && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 0" }}>
                            <Avatar initials={user.avatar} size={30} color="#534AB7" />
                            <div style={{ overflow: "hidden" }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Admin</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
