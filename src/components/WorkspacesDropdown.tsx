import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { WorkspaceResponseDto } from "../api/workspaceApi.tsx";

interface WorkspacesDropdownProps {
    workspaces: WorkspaceResponseDto[];
    activeWorkspace: WorkspaceResponseDto | null;
    onSelect: (workspace: WorkspaceResponseDto) => void;
    onCreateClick?: () => void;
    onEditClick?: (workspace: WorkspaceResponseDto) => void;
    onDeleteClick?: (workspace: WorkspaceResponseDto) => void;
}

export default function WorkspacesDropdown({
    workspaces,
    activeWorkspace,
    onSelect,
    onCreateClick,
    onEditClick,
    onDeleteClick,
}: WorkspacesDropdownProps) {
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

    const canManage = Boolean(onEditClick && onDeleteClick);

    return (
        <div ref={ref} style={{ padding: "0 12px 16px", position: "relative" }}>
            <div id="ws-dropdown-trigger" className="ws-selector" onClick={() => setOpen((v) => !v)}>
                <div
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        background: "linear-gradient(135deg, #534AB7, #3C3489)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}
                >
                    {activeWorkspace?.name.charAt(0).toUpperCase() || "W"}
                </div>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeWorkspace?.name || "No Workspace"}
                </span>
                <ChevronDown
                    size={13}
                    style={{
                        opacity: 0.5,
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                />
            </div>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 12,
                        right: 12,
                        background: "#1a1a1f",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                        zIndex: 100,
                        overflow: "hidden",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.25)",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            padding: "10px 12px 6px",
                        }}
                    >
                        My Workspaces
                    </p>

                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {workspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                onMouseEnter={() => setHoveredId(workspace.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    background: hoveredId === workspace.id ? "rgba(255,255,255,0.04)" : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div
                                    onClick={() => {
                                        onSelect(workspace);
                                        setOpen(false);
                                    }}
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        background:
                                            workspace.id === activeWorkspace?.id
                                                ? "linear-gradient(135deg, #534AB7, #3C3489)"
                                                : "rgba(255,255,255,0.08)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#fff",
                                        flexShrink: 0,
                                    }}
                                >
                                    {workspace.name.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    onClick={() => {
                                        onSelect(workspace);
                                        setOpen(false);
                                    }}
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: workspace.id === activeWorkspace?.id ? "#a89ef5" : "rgba(255,255,255,0.7)",
                                        fontWeight: workspace.id === activeWorkspace?.id ? 500 : 400,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {workspace.name}
                                </span>

                                {canManage && hoveredId === workspace.id && (
                                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditClick?.(workspace);
                                                setOpen(false);
                                            }}
                                            title="Edit workspace"
                                            style={{
                                                background: "rgba(83,74,183,0.15)",
                                                border: "none",
                                                borderRadius: 6,
                                                padding: "3px 6px",
                                                cursor: "pointer",
                                                color: "#a89ef5",
                                                display: "flex",
                                            }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteClick?.(workspace);
                                                setOpen(false);
                                            }}
                                            title="Delete workspace"
                                            style={{
                                                background: "rgba(226,75,74,0.12)",
                                                border: "none",
                                                borderRadius: 6,
                                                padding: "3px 6px",
                                                cursor: "pointer",
                                                color: "#E24B4A",
                                                display: "flex",
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {workspaces.length === 0 && (
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 12px" }}>
                                No workspaces yet.
                            </p>
                        )}
                    </div>

                    {onCreateClick && (
                        <>
                            <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                            <button
                                id="ws-create-btn"
                                onClick={() => {
                                    onCreateClick();
                                    setOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "9px 12px 10px",
                                    color: "#a89ef5",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    fontFamily: "'DM Sans', sans-serif",
                                    textAlign: "left",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(83,74,183,0.1)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                            >
                                <Plus size={14} /> New Workspace
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
