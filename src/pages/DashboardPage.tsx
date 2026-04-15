import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, CheckSquare, Inbox, BarChart2, ChevronRight,
    Plus,
    TrendingUp, Clock, Folders, Target, MoreHorizontal,
    Circle, Zap, Star, ArrowUpRight, Loader2, Trash2, X, Check,
    CalendarDays,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import ViewNavBar from "../components/ViewNavBar";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import {
    getWorkspacesByUser,
    getSpacesByWorkspace,
    getFoldersBySpace,
    getSprintsByFolder,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
} from "../api/workspaceApi";
import type {
    WorkspaceResponseDto,
    SpaceResponseDto,
    FolderResponseDto,
    SprintResponseDto,
    TaskResponseDto,
} from "../api/workspaceApi";

// ============================================================================
// STATIC CONFIG
// ============================================================================

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CheckSquare, label: "My Tasks", badge: 5 },
    { icon: Inbox, label: "Inbox", badge: 3 },
    { icon: BarChart2, label: "Reporting" },
];

const priorityColors: Record<string, string> = {
    urgent: "#E24B4A",
    high: "#EF9F27",
    medium: "#534AB7",
    low: "#1D9E75",
};

// ============================================================================
// HELPERS
// ============================================================================

/** Returns sprint elapsed percentage based on start/end dates */
function computeSprintProgress(sprint: SprintResponseDto | null): number {
    if (!sprint || !sprint.startDate || !sprint.endDate) return 0;
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
}

/** Format a date string to short locale format */
function formatDate(dateStr?: string): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

function ProgressBar({ value, color }: { value: number; color: string }) {
    return (
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
                height: "100%", width: `${value}%`, borderRadius: 99,
                background: `linear-gradient(90deg, ${color}, ${color}99)`,
                transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
            }} />
        </div>
    );
}

// ============================================================================
// WORKSPACE FORM MODAL
// ============================================================================

interface WorkspaceFormModalProps {
    mode: "create" | "edit";
    initialName?: string;
    initialSlug?: string;
    onSubmit: (name: string, slug: string) => Promise<void>;
    onClose: () => void;
}

function WorkspaceFormModal({ mode, initialName = "", initialSlug = "", onSubmit, onClose }: WorkspaceFormModalProps) {
    const [name, setName] = useState(initialName);
    const [slug, setSlug] = useState(initialSlug);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNameChange = (val: string) => {
        setName(val);
        if (mode === "create") {
            setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) {
            setError("Name and slug are required.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(name.trim(), slug.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 18, padding: "28px 32px", width: 420, maxWidth: "calc(100vw - 40px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {mode === "create" ? "Create Workspace" : "Edit Workspace"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 4, borderRadius: 8 }}
                    >
                        <X size={17} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                            Workspace Name
                        </label>
                        <input
                            id="ws-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. My Team"
                            autoFocus
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                                borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#fff",
                                fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(83,74,183,0.6)")}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                    </div>

                    <div style={{ marginBottom: 22 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                            Slug
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
                                /
                            </span>
                            <input
                                id="ws-slug-input"
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                                placeholder="my-team"
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                                    borderRadius: 10, padding: "10px 14px 10px 24px", fontSize: 14, color: "#fff",
                                    fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "rgba(83,74,183,0.6)")}
                                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>
                            Only lowercase letters, numbers, and hyphens.
                        </p>
                    </div>

                    {error && (
                        <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 14, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                            {error}
                        </p>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                                borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.6)",
                                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            id="ws-form-submit-btn"
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                background: "linear-gradient(135deg, #534AB7, #3C3489)", border: "none",
                                borderRadius: 10, padding: "9px 20px", color: "#fff",
                                fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7,
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {mode === "create" ? "Create" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// DELETE CONFIRM MODAL
// ============================================================================

interface DeleteConfirmModalProps {
    workspaceName: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

function DeleteConfirmModal({ workspaceName, onConfirm, onClose }: DeleteConfirmModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to delete workspace.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a", border: "0.5px solid rgba(226,75,74,0.2)",
                    borderRadius: 18, padding: "28px 32px", width: 380, maxWidth: "calc(100vw - 40px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(226,75,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={17} style={{ color: "#E24B4A" }} />
                    </div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                        Delete Workspace
                    </h2>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
                    Are you sure you want to delete <span style={{ color: "#fff", fontWeight: 600 }}>"{workspaceName}"</span>? This action cannot be undone.
                </p>
                {error && (
                    <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 14, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                        {error}
                    </p>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Cancel
                    </button>
                    <button
                        id="ws-delete-confirm-btn"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        style={{ background: "#E24B4A", border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7, opacity: isDeleting ? 0.7 : 1 }}
                    >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function WorkspacePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // ── Core data ──
    const [isLoading, setIsLoading] = useState(true);
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [spaces, setSpaces] = useState<SpaceResponseDto[]>([]);
    const [user, setUser] = useState({ name: "User", avatar: "US" });

    // ── Sprint chain state ──
    const [, setFolders] = useState<FolderResponseDto[]>([]);
    const [sprints, setSprints] = useState<SprintResponseDto[]>([]);
    const [sprintLoading, setSprintLoading] = useState(false);

    // ── Deadlines — structure ready for TaskResponseDto (pending backend Tasks) ──
    const [deadlines] = useState<TaskResponseDto[]>([]);

    // ── Modal state ──
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [workspaceCreateFeedback, setWorkspaceCreateFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // ── Computed stats ──
    // Active Projects = number of spaces in active workspace (live from API)
    const activeProjectsCount = spaces.length;

    // Pick the most recent sprint: prefer one currently active (start <= now <= end),
    // otherwise fall back to the last in the array.
    const now = Date.now();
    const activeSprint: SprintResponseDto | null =
        sprints.find((s) => {
            if (!s.startDate || !s.endDate) return false;
            return new Date(s.startDate).getTime() <= now && now <= new Date(s.endDate).getTime();
        }) ?? sprints[sprints.length - 1] ?? null;

    const sprintProgress = computeSprintProgress(activeSprint);

    // ── Initial load ──
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser({
                    name: parsed.firstName || "User",
                    avatar: ((parsed.firstName?.[0] || "") + (parsed.lastName?.[0] || "")).toUpperCase() || "US",
                });
            }
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
        }

        const loadInitialData = async () => {
            try {
                const wsData = await getWorkspacesByUser();
                setWorkspaces(wsData);
                if (wsData.length > 0) {
                    const savedWorkspaceId = localStorage.getItem("activeWorkspaceId");
                    const savedWorkspace = wsData.find((workspace) => workspace.id === savedWorkspaceId);
                    setActiveWorkspace(savedWorkspace ?? wsData[0]);
                }
            } catch (error) {
                console.error("Failed to load workspaces", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem("activeWorkspaceId", activeWorkspace.id);
        }
    }, [activeWorkspace]);

    useEffect(() => {
        if (!workspaceCreateFeedback) return;
        const timer = window.setTimeout(() => setWorkspaceCreateFeedback(null), 3500);
        return () => window.clearTimeout(timer);
    }, [workspaceCreateFeedback]);

    // ── Load spaces when active workspace changes ──
    useEffect(() => {
        if (!activeWorkspace) {
            setSpaces([]);
            setFolders([]);
            setSprints([]);
            return;
        }
        const loadSpaces = async () => {
            try {
                const spacesData = await getSpacesByWorkspace(activeWorkspace.id);
                setSpaces(spacesData);
            } catch (error) {
                console.error("Failed to fetch spaces", error);
                setSpaces([]);
            }
        };
        loadSpaces();
    }, [activeWorkspace]);

    // ── Load folders for first space, then sprints for first folder ──
    useEffect(() => {
        if (spaces.length === 0) {
            setFolders([]);
            setSprints([]);
            return;
        }

        const loadSprintChain = async () => {
            setSprintLoading(true);
            try {
                // Step 1: get folders of first space
                const foldersData = await getFoldersBySpace(spaces[0].id);
                setFolders(foldersData);

                if (foldersData.length === 0) {
                    setSprints([]);
                    return;
                }

                if (!foldersData[0].id) {
                    setSprints([]);
                    return;
                }

                // Step 2: get sprints of first folder
                const sprintsData = await getSprintsByFolder(foldersData[0].id);
                setSprints(sprintsData);
            } catch (error) {
                console.error("Failed to load sprint chain", error);
                setFolders([]);
                setSprints([]);
            } finally {
                setSprintLoading(false);
            }
        };

        loadSprintChain();
    }, [spaces]);

    // ── Workspace CRUD handlers ──
    const handleCreateWorkspace = async (name: string, slug: string) => {
        try {
            const created = await createWorkspace({ name, slug });
            setWorkspaces((prev) => [...prev, created]);
            setActiveWorkspace(created);
            setWorkspaceCreateFeedback({
                type: "success",
                message: `Workspace \"${created.name}\" created successfully.`,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create workspace.";
            setWorkspaceCreateFeedback({ type: "error", message });
            throw error;
        }
    };

    const handleUpdateWorkspace = async (name: string, slug: string) => {
        if (!editingWorkspace) return;
        const updated = await updateWorkspace(editingWorkspace.id, { name, slug });
        setWorkspaces((prev) => prev.map((ws) => (ws.id === updated.id ? updated : ws)));
        if (activeWorkspace?.id === updated.id) setActiveWorkspace(updated);
    };

    const handleDeleteWorkspace = async () => {
        if (!deletingWorkspace) return;
        await deleteWorkspace(deletingWorkspace.id);
        const remaining = workspaces.filter((ws) => ws.id !== deletingWorkspace.id);
        setWorkspaces(remaining);
        if (activeWorkspace?.id === deletingWorkspace.id) {
            setActiveWorkspace(remaining.length > 0 ? remaining[0] : null);
        }
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    // ── Dynamic stats cards ──
    const stats = [
        {
            label: "Tasks In Progress",
            value: 0,
            icon: Zap,
            color: "#534AB7",
            bg: "rgba(83,74,183,0.12)",
            delta: "Pending Tasks API",
        },
        {
            label: "Active Projects",
            // Live value from API: number of spaces in active workspace
            value: activeProjectsCount,
            icon: Folders,
            color: "#1D9E75",
            bg: "rgba(29,158,117,0.12)",
            delta: activeProjectsCount > 0 ? `${activeProjectsCount} space${activeProjectsCount > 1 ? "s" : ""} in workspace` : "No spaces yet",
        },
        {
            label: "Completion Rate",
            value: "0%",
            icon: Target,
            color: "#EF9F27",
            bg: "rgba(239,159,39,0.12)",
            delta: "Pending Tasks API",
        },
        {
            label: "Team Velocity",
            value: "0",
            icon: TrendingUp,
            color: "#D4537E",
            bg: "rgba(212,83,126,0.12)",
            delta: "Pending Tasks API",
        },
    ];

    const sidebarNavItems = navItems.map((item) => {
        if (item.label === "Dashboard") {
            return {
                ...item,
                active: location.pathname === "/workspace",
                onClick: () => navigate("/workspace"),
            };
        }

        if (item.label === "My Tasks") {
            return {
                ...item,
                active: location.pathname === "/workspace/my-tasks",
                onClick: () => navigate("/workspace/my-tasks"),
            };
        }

        return item;
    });

    return (
        <Layout
            sidebar={(
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                    navItems={sidebarNavItems}
                    workspaceDropdown={
                        <WorkspacesDropdown
                            workspaces={workspaces}
                            activeWorkspace={activeWorkspace}
                            onSelect={setActiveWorkspace}
                            onCreateClick={() => setShowCreateModal(true)}
                            onEditClick={(ws) => setEditingWorkspace(ws)}
                            onDeleteClick={(ws) => setDeletingWorkspace(ws)}
                        />
                    }
                    userName={user.name}
                    userAvatar={user.avatar}
                />
            )}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background 0.18s, color 0.18s; color: rgba(255,255,255,0.45); font-size: 14px; font-weight: 400; white-space: nowrap; overflow: hidden; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
        .nav-item.active { background: rgba(83,74,183,0.18); color: #a89ef5; }
        .stat-card { background: #16161a; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; transition: border-color 0.2s, transform 0.2s; cursor: default; }
        .stat-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .project-card { background: #16161a; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
        .project-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-2px); }
        .deadline-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); transition: background 0.15s; cursor: pointer; }
        .deadline-row:hover { background: rgba(255,255,255,0.025); border-radius: 8px; padding-left: 6px; }
        .deadline-row:last-child { border-bottom: none; }
        .search-input { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 14px 8px 38px; font-size: 13px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; width: 240px; transition: border-color 0.2s, width 0.3s; }
        .search-input:focus { border-color: rgba(83,74,183,0.5); width: 300px; }
        .search-input::placeholder { color: rgba(255,255,255,0.25); }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.18s, border-color 0.18s; }
        .icon-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
        .view-nav-tab { height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .view-nav-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.04); }
        .ws-selector { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor: pointer; transition: background 0.18s; font-size: 13px; color: rgba(255,255,255,0.7); }
        .ws-selector:hover { background: rgba(255,255,255,0.06); }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

            <Content>
                <WorkspaceTopBar userName={user.name} userAvatar={user.avatar} />
            <ViewNavBar />

                {workspaceCreateFeedback && (
                    <div
                        style={{
                            position: "fixed",
                            top: 24,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 1200,
                            minWidth: 260,
                            maxWidth: 560,
                            width: "fit-content",
                            padding: "12px 16px",
                            borderRadius: 12,
                            border: workspaceCreateFeedback.type === "success"
                                ? "1px solid rgba(0,255,174,0.55)"
                                : "1px solid rgba(255,96,96,0.62)",
                            background: workspaceCreateFeedback.type === "success"
                                ? "linear-gradient(180deg, rgba(8,46,38,0.95), rgba(5,30,25,0.95))"
                                : "linear-gradient(180deg, rgba(66,20,20,0.95), rgba(41,12,12,0.95))",
                            color: workspaceCreateFeedback.type === "success" ? "#D7FFF2" : "#FFE4E4",
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: "0.1px",
                            backdropFilter: "blur(8px)",
                            boxShadow: workspaceCreateFeedback.type === "success"
                                ? "0 14px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,174,0.18)"
                                : "0 14px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,96,96,0.2)",
                            textAlign: "center",
                            pointerEvents: "none",
                        }}
                    >
                        {workspaceCreateFeedback.message}
                    </div>
                )}

                {/* CONTENT */}
                <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
                    {isLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.5)" }}>
                            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 16, color: "#534AB7" }} />
                            <p>Loading dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Welcome */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                                <div>
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
                                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                    </p>
                                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                                        {greeting}, {user.name}
                                    </h1>
                                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                                        {activeWorkspace
                                            ? <>Workspace: <span style={{ color: "#a89ef5", fontWeight: 500 }}>{activeWorkspace.name}</span></>
                                            : "No workspace selected."
                                        }
                                    </p>
                                </div>
                                <button style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: "linear-gradient(135deg, #534AB7, #3C3489)",
                                    border: "none", borderRadius: 10, padding: "10px 18px",
                                    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>
                                    <Plus size={15} /> New Task
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
                                {stats.map((s) => (
                                    <div key={s.label} className="stat-card">
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <s.icon size={17} style={{ color: s.color }} />
                                            </div>
                                            <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                                        </div>
                                        <p style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</p>
                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</p>
                                        <p style={{ fontSize: 11, color: s.color, marginTop: 8, fontWeight: 500 }}>{s.delta}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

                                {/* Recent Projects (Spaces) */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Recent Projects</h2>
                                        <button style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                            View all <ChevronRight size={12} />
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {spaces.map((space) => {
                                            const c = space.color?.startsWith("#") ? space.color : "#534AB7";
                                            return (
                                                <div key={space.id} className="project-card">
                                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: c + "22", border: `1px solid ${c}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <Folders size={17} style={{ color: c }} />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{space.spaceName}</p>
                                                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{space.isPrivate ? "Private Space" : "Public Space"}</p>
                                                            </div>
                                                        </div>
                                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                                                            <MoreHorizontal size={15} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                                                        <Avatar initials={space.spaceName.charAt(0).toUpperCase()} size={24} color={c} />
                                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Pending Tasks API</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {spaces.length === 0 && (
                                            <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                                                No spaces found in this workspace.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right column */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {/* Upcoming Deadlines — structure ready for TaskResponseDto */}
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Upcoming Deadlines</h2>
                                            <span style={{ fontSize: 11, background: "rgba(226,75,74,0.15)", color: "#E24B4A", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>
                                                {deadlines.length} pending
                                            </span>
                                        </div>
                                        <div style={{ background: "#16161a", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "8px 16px" }}>
                                            {deadlines.length > 0
                                                ? deadlines.map((task) => (
                                                    // Structure ready: will use task.id, task.title, task.status, task.description
                                                    <div key={task.id} className="deadline-row">
                                                        <Circle size={15} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                                                        <div style={{ flex: 1, overflow: "hidden" }}>
                                                            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {task.title}
                                                            </p>
                                                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                                                                {task.status ?? "—"}
                                                            </p>
                                                        </div>
                                                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 99, background: priorityColors["medium"] + "22", color: priorityColors["medium"], flexShrink: 0 }}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                ))
                                                : (
                                                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                                                        <Clock size={20} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
                                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No deadlines yet.</p>
                                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>Will populate from Tasks API.</p>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>

                                    {/* Sprint Progress — live from SprintController via folder chain */}
                                    <div style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.15), rgba(29,158,117,0.1))", border: "0.5px solid rgba(83,74,183,0.25)", borderRadius: 16, padding: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Star size={14} style={{ color: "#EF9F27" }} />
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Sprint Progress</p>
                                            </div>
                                            {sprintLoading && <Loader2 size={13} className="animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />}
                                        </div>

                                        {activeSprint ? (
                                            <>
                                                <ProgressBar value={sprintProgress} color="#534AB7" />
                                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "flex-start" }}>
                                                    <div>
                                                        <p style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{activeSprint.name}</p>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                                                            <CalendarDays size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                                                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                                                                {formatDate(activeSprint.startDate)} → {formatDate(activeSprint.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: 13, color: "#a89ef5", fontWeight: 700 }}>{sprintProgress}%</span>
                                                </div>
                                                {sprints.length > 1 && (
                                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
                                                        +{sprints.length - 1} other sprint{sprints.length - 1 > 1 ? "s" : ""} in this folder
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "8px 0" }}>
                                                {sprintLoading
                                                    ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Loading sprints…</p>
                                                    : (
                                                        <>
                                                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No sprint found.</p>
                                                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>
                                                                Create a folder + sprint to see progress.
                                                            </p>
                                                        </>
                                                    )
                                                }
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </main>
            </Content>

            {/* CREATE WORKSPACE MODAL */}
            {showCreateModal && (
                <WorkspaceFormModal
                    mode="create"
                    onSubmit={handleCreateWorkspace}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* EDIT WORKSPACE MODAL */}
            {editingWorkspace && (
                <WorkspaceFormModal
                    mode="edit"
                    initialName={editingWorkspace.name}
                    initialSlug={editingWorkspace.slug}
                    onSubmit={handleUpdateWorkspace}
                    onClose={() => setEditingWorkspace(null)}
                />
            )}

            {/* DELETE CONFIRM MODAL */}
            {deletingWorkspace && (
                <DeleteConfirmModal
                    workspaceName={deletingWorkspace.name}
                    onConfirm={handleDeleteWorkspace}
                    onClose={() => setDeletingWorkspace(null)}
                />
            )}
        </Layout>
    );
}