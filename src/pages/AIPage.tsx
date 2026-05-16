import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FolderGit2,
    Sparkles, Send, Loader2, Plus,
    X, Check, Trash2, Pencil,
    ChevronRight, ChevronDown,
    Square, SquarePen, History,
    Folder, FolderOpen, List, Zap, Target, Activity, Users, CheckCircle2,
    Clock, CalendarDays, ArrowLeft, LayoutGrid, Bell
    SquarePen, History, Bell,
    Folder, FolderOpen, List, Zap, Target, Activity, Users, User, CheckCircle2,
    Clock, CalendarDays, ArrowLeft, LayoutGrid, Eye, EyeOff, Lock
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    getWorkspacesByUser,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
} from "../api/workspaceApi";
import type { WorkspaceResponseDto } from "../api/workspaceApi";
import { analyzeRepo, validateRepo, addRepository, indexRepositories, generateEntity, getRepositories } from "../api/iaApi";
import type { GenerateEntityResponse } from "../api/iaApi";
import { IA_REPO_BASE_URL } from "../config/baseURL";
import { createTask, getTasksByListe } from "../api/taskApi";
import type { TaskResponseDto } from "../api/taskApi";
import { getAllListes, getListesByFolder } from "../api/listeApi";
import type { ListeResponseDto } from "../api/listeApi";
import { getSpacesByWorkspace } from "../api/spaceApi";
import type { SpaceResponseDto } from "../api/spaceApi";
import { getFoldersBySpace } from "../api/folderApi";
import type { FolderResponseDto } from "../api/folderApi";
import { getSprintsByFolder } from "../api/sprintApi";
import type { SprintResponseDto } from "../api/sprintApi";
import {
    addConversationMessage,
    createConversation,
    deleteConversation,
    getConversationMessages,
    getMyConversations,
    updateConversationTitle,
} from "../api/conversationApi";
import { getWorkspaceMembers } from "../api/workspaceMemberApi";
import type { WorkspaceMemberResponseDto } from "../api/workspaceMemberApi";
import type { ConversationResponseDto } from "../api/conversationApi";

import Sidebar from "../components/Sidebar";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import WorkspaceResourcesPanel from "../components/WorkspaceResourcesPanel";

// ─── Hierarchy types (mirrors DashboardPage) ──────────────────────────────────
type HierarchyType = 'space' | 'folder' | 'list' | 'sprint';
interface SelectedHierarchy { type: HierarchyType; id: string; name: string; }

// ─── Design tokens ────────────────────────────────────────────────────────────
const DC = {
    surface: "var(--bg-card)",
    surfaceEl: "var(--bg-hover)",
    border: "var(--border)",
    text: "var(--text-main)",
    textMuted: "var(--text-sub)",
    textFaint: "var(--text-faint)",
    accent: "var(--accent)",
    green: "var(--success)",
    orange: "var(--warning)",
    blue: "#3b82f6",
};

function HStatChip({ value, label, color, icon: Icon }: { value: any; label: string; color: string; icon: any }) {
    return (
        <div style={{ flex: 1, background: DC.surfaceEl, border: `1px solid ${DC.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={11} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: DC.text }}>{value}</span>
            </div>
            <p style={{ fontSize: 10, color: DC.textMuted, fontWeight: 500 }}>{label}</p>
        </div>
    );
}

function HBar({ pct, color = DC.accent }: { pct: number; color?: string }) {
    return (
        <div style={{ height: 3, background: "var(--bg-hover)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width .6s ease" }} />
        </div>
    );
}

function HCard({ icon: Icon, color, title, subtitle, progress, onClick }: any) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? DC.surfaceEl : "var(--bg-card)",
                border: `1px solid ${hov ? DC.accent + "44" : DC.border}`,
                borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                transition: "all .2s",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: DC.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            </div>
            {subtitle && <p style={{ fontSize: 10, color: DC.textFaint, marginBottom: 6 }}>{subtitle}</p>}
            {progress !== undefined && <HBar pct={progress} color={color} />}
        </div>
    );
}

function InlineHierarchyView({ hierarchy, workspaceId, onNavigate, onBack }: {
    hierarchy: SelectedHierarchy;
    workspaceId: string | undefined;
    onNavigate: (h: SelectedHierarchy) => void;
    onBack: () => void;
}) {
    const [spaces, setSpaces] = useState<SpaceResponseDto[]>([]);
    const [folders, setFolders] = useState<FolderResponseDto[]>([]);
    const [listes, setListes] = useState<ListeResponseDto[]>([]);
    const [sprints, setSprints] = useState<SprintResponseDto[]>([]);
    const [tasks, setTasks] = useState<TaskResponseDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workspaceId) return;
        setLoading(true);
        (async () => {
            try {
                if (hierarchy.type === "space") {
                    const fds = await getFoldersBySpace(hierarchy.id);
                    setFolders(fds);
                    const [spRes, liRes] = await Promise.all([
                        Promise.all(fds.map(f => getSprintsByFolder(f.id!))),
                        Promise.all(fds.map(f => getListesByFolder(f.id!))),
                    ]);
                    const allLi = liRes.flat();
                    setListes(allLi);
                    setSprints(spRes.flat());
                    const taskArrays = await Promise.all(allLi.map(l => getTasksByListe(l.id).catch(() => [] as TaskResponseDto[])));
                    setTasks(taskArrays.flat());
                } else if (hierarchy.type === "folder") {
                    const [fSprints, fListes] = await Promise.all([
                        getSprintsByFolder(hierarchy.id),
                        getListesByFolder(hierarchy.id),
                    ]);
                    setSprints(fSprints);
                    setListes(fListes);
                    const taskArrays = await Promise.all(fListes.map(l => getTasksByListe(l.id).catch(() => [] as TaskResponseDto[])));
                    setTasks(taskArrays.flat());
                } else if (hierarchy.type === "list") {
                    const t = await getTasksByListe(hierarchy.id).catch(() => [] as TaskResponseDto[]);
                    setTasks(t);
                } else if (hierarchy.type === "sprint") {
                    // tasks linked via sprintId
                    // we load all listes then tasks and filter
                    setTasks([]);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [hierarchy.id, hierarchy.type, workspaceId]);

    const icons: Record<string, any> = { space: Folder, folder: FolderOpen, list: List, sprint: Zap };
    const colors: Record<string, string> = { space: DC.accent, folder: DC.orange, list: DC.blue, sprint: DC.green };
    const HIcon = icons[hierarchy.type] || Folder;
    const hColor = colors[hierarchy.type] || DC.accent;

    const done = tasks.filter(t => t.status === "DONE").length;
    const active = tasks.filter(t => ["IN_DEV", "IN_TEST", "IN_REVIEW"].includes(t.status)).length;
    const compPct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-main)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
                <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "5px 10px", color: "var(--text-sub)", fontSize: 12, cursor: "pointer" }}>
                    <ArrowLeft size={13} /> Retour au chat
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: hColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <HIcon size={15} style={{ color: hColor }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: DC.text, fontFamily: "'Syne',sans-serif" }}>{hierarchy.name}</p>
                        <p style={{ fontSize: 10, color: DC.textFaint, textTransform: "capitalize" }}>{hierarchy.type}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: DC.textFaint, gap: 10 }}>
                        <Loader2 size={18} className="animate-spin" /> Chargement...
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Stats */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <HStatChip value={tasks.length} label="Tâches" color={DC.accent} icon={List} />
                            <HStatChip value={active} label="En cours" color={DC.blue} icon={Activity} />
                            <HStatChip value={`${compPct}%`} label="Complété" color={DC.green} icon={Target} />
                            <HStatChip value={done} label="Terminé" color={DC.green} icon={CheckCircle2} />
                        </div>

                        {/* Space → Folders */}
                        {hierarchy.type === "space" && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: DC.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Folders ({folders.length})</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                                    {folders.map(f => {
                                        const ft = tasks.filter(t => { const l = listes.find(li => li.id === t.listeId); return l?.folderId === f.id; });
                                        const fd = ft.filter(t => t.status === "DONE").length;
                                        return <HCard key={f.id} icon={FolderOpen} color={DC.orange} title={f.name} subtitle={`${ft.length} tâches`} progress={ft.length > 0 ? Math.round((fd / ft.length) * 100) : 0} onClick={() => onNavigate({ type: "folder", id: f.id!, name: f.name })} />;
                                    })}
                                    {folders.length === 0 && <p style={{ fontSize: 12, color: DC.textFaint }}>Aucun folder.</p>}
                                </div>
                            </div>
                        )}

                        {/* Folder → Lists + Sprints */}
                        {hierarchy.type === "folder" && (
                            <>
                                {listes.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: DC.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Lists ({listes.length})</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                                            {listes.map(l => {
                                                const lt = tasks.filter(t => t.listeId === l.id);
                                                const ld = lt.filter(t => t.status === "DONE").length;
                                                return <HCard key={l.id} icon={List} color={DC.blue} title={l.name} subtitle={`${lt.length} tâches`} progress={lt.length > 0 ? Math.round((ld / lt.length) * 100) : 0} onClick={() => onNavigate({ type: "list", id: l.id!, name: l.name })} />;
                                            })}
                                        </div>
                                    </div>
                                )}
                                {sprints.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: DC.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Sprints ({sprints.length})</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                                            {sprints.map(s => <HCard key={s.id} icon={Zap} color={s.isActive ? DC.green : DC.orange} title={s.name} subtitle={`${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}`} progress={(() => { if (!s.startDate || !s.endDate) return 0; const st = new Date(s.startDate).getTime(), en = new Date(s.endDate).getTime(), now = Date.now(); if (now <= st) return 0; if (now >= en) return 100; return Math.round(((now - st) / (en - st)) * 100); })()} onClick={() => onNavigate({ type: "sprint", id: s.id!, name: s.name })} />)}
                                        </div>
                                    </div>
                                )}
                                {listes.length === 0 && sprints.length === 0 && <p style={{ fontSize: 12, color: DC.textFaint }}>Aucune liste ou sprint.</p>}
                            </>
                        )}

                        {/* List / Sprint → Tasks */}
                        {(hierarchy.type === "list" || hierarchy.type === "sprint") && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: DC.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Tâches ({tasks.length})</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {tasks.length === 0 && <p style={{ fontSize: 12, color: DC.textFaint }}>Aucune tâche.</p>}
                                    {tasks.map(t => {
                                        const statusColors: Record<string, string> = { TO_DO: "#818cf8", IN_DEV: DC.blue, IN_TEST: DC.orange, IN_REVIEW: "#ec4899", DONE: DC.green };
                                        const sc = statusColors[t.status] || DC.textFaint;
                                        return (
                                            <div key={t.id} style={{ background: DC.surfaceEl, border: `1px solid ${DC.border}`, borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc, flexShrink: 0 }} />
                                                <span style={{ flex: 1, fontSize: 12, color: DC.text, fontWeight: 500 }}>{t.title}</span>
                                                <span style={{ fontSize: 10, color: sc, background: sc + "18", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>{t.status?.replace("_", " ")}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MODALS (Identiques au Dashboard)
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
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                                    borderRadius: 10, padding: "10px 14px 10px 24px", fontSize: 14, color: "#fff",
                                    fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>
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

interface ConversationDeleteConfirmModalProps {
    conversationTitle: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

function ConversationDeleteConfirmModal({ conversationTitle, onConfirm, onClose }: ConversationDeleteConfirmModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Suppression impossible.");
        } finally {
            setIsDeleting(false);
        }
    };

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
                if (!isDeleting) onClose();
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
                        <Trash2 size={16} style={{ color: "#E24B4A" }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 700 }}>
                        Confirmer la suppression
                    </h2>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                    Voulez-vous vraiment supprimer la conversation <span style={{ color: "#fff", fontWeight: 600 }}>"{conversationTitle || "Nouvelle conversation"}"</span> ?
                </p>

                {error && (
                    <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 12, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "0.5px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.7 : 1,
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        style={{
                            background: "#E24B4A",
                            border: "none",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// REPO FORM MODAL
// ============================================================================

interface RepoFormModalProps {
    mode: "add" | "edit";
    initialData?: { owner: string; repo: string; branch: string; is_private?: boolean };
    onSubmit: (owner: string, repo: string, branch: string, isPrivate: boolean, githubToken?: string) => Promise<void>;
    onClose: () => void;
}

function RepoFormModal({ mode, initialData, onSubmit, onClose }: RepoFormModalProps) {
    const [owner, setOwner] = useState(initialData?.owner || "");
    const [repo, setRepo] = useState(initialData?.repo || "");
    const [branch, setBranch] = useState(initialData?.branch || "main");
    const [isPrivate, setIsPrivate] = useState(initialData?.is_private ?? false);
    // Le PAT n'est JAMAIS persisté : il vit uniquement dans cet état local le temps de la soumission
    const [githubToken, setGithubToken] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const inputStyle: React.CSSProperties = {
        width: "100%", background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
        padding: 10, color: "white", outline: "none", boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!owner.trim() || !repo.trim()) { setError("Owner et nom du dépôt sont requis."); return; }
        if (isPrivate && !githubToken.trim()) { setError("Un Personal Access Token est requis pour les dépôts privés."); return; }
        
        setIsSubmitting(true);
        try {
            await onSubmit(owner.trim(), repo.trim(), branch.trim(), isPrivate, isPrivate ? githubToken.trim() : undefined);
        } finally {
            if (isSubmitting) setIsSubmitting(false); // In case it wasn't unmounted
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: "#16161a", border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 18, padding: "28px 32px", width: 440, maxWidth: "calc(100vw - 32px)",
                maxHeight: "90vh", overflowY: "auto",
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {mode === "add" ? "Ajouter un dépôt" : "Modifier le dépôt"}
                    </h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Owner */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>GitHub Owner</label>
                        <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="ex : facebook" style={inputStyle} />
                    </div>
                    {/* Repo */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>Nom du dépôt</label>
                        <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="ex : react" style={inputStyle} />
                    </div>
                    {/* Branch */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>Branche</label>
                        <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" style={inputStyle} />
                    </div>

                    {/* Visibilité Public / Privé */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase" }}>Visibilité</label>
                        <div style={{ display: "flex", gap: 10 }}>
                            {[{ label: "Public", value: false }, { label: "Privé", value: true }].map(opt => (
                                <button
                                    key={String(opt.value)} type="button"
                                    onClick={() => { setIsPrivate(opt.value); if (!opt.value) setGithubToken(""); }}
                                    style={{
                                        flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        border: isPrivate === opt.value ? "1.5px solid #a89ef5" : "1px solid rgba(255,255,255,0.1)",
                                        background: isPrivate === opt.value ? "rgba(108,99,255,0.18)" : "rgba(255,255,255,0.03)",
                                        color: isPrivate === opt.value ? "#a89ef5" : "rgba(255,255,255,0.5)",
                                        transition: "all 0.2s",
                                    }}
                                >{opt.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Champ PAT — affiché uniquement si dépôt privé */}
                    {isPrivate && (
                        <div style={{
                            marginBottom: 18, padding: "14px 16px",
                            background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.2)",
                            borderRadius: 12,
                        }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(168,158,245,0.8)", marginBottom: 6, textTransform: "uppercase" }}>
                                GitHub Personal Access Token
                            </label>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, lineHeight: 1.5 }}>
                                Requis pour accéder aux dépôts privés. Le token sera chiffré avant stockage — il ne sera jamais visible après soumission.
                            </p>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showToken ? "text" : "password"}
                                    value={githubToken}
                                    onChange={e => setGithubToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    autoComplete="off"
                                    style={{ ...inputStyle, paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(v => !v)}
                                    style={{
                                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                    title={showToken ? "Masquer" : "Afficher"}
                                >{showToken ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 14, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={isSubmitting} style={{
                        width: "100%", background: "linear-gradient(135deg, #534AB7, #3C3489)",
                        border: "none", borderRadius: 10, padding: 12, color: "white",
                        fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: 14,
                        opacity: isSubmitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}>
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {mode === "add" ? "Ajouter le dépôt" : "Enregistrer les modifications"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// AI CONFIRM CARD — carte de confirmation d'entité générée par l'IA
// ============================================================================

const ENTITY_ICONS: Record<string, JSX.Element> = {
    task: <CheckCircle2 size={24} color="#a89ef5" />,
    workspace: <LayoutGrid size={24} color="#a89ef5" />,
    space: <Folder size={24} color="#a89ef5" />,
    sprint: <Zap size={24} color="#a89ef5" />,
    liste: <List size={24} color="#a89ef5" />,
    folder: <FolderOpen size={24} color="#a89ef5" />,
};

const ENTITY_LABELS: Record<string, string> = {
    task: "Tâche",
    workspace: "Workspace",
    space: "Space",
    sprint: "Sprint",
    liste: "Liste",
};

const FIELD_LABELS: Record<string, string> = {
    title: "Titre",
    name: "Nom",
    description: "Description",
    status: "Statut",
    priority: "Priorité",
    dueDate: "Échéance",
    listeId: "ID Liste",
    sprintId: "ID Sprint",
    assigneeId: "Membre Assigné",
    workspaceId: "ID Workspace",
    spaceId: "ID Space",
    startDate: "Début",
    endDate: "Fin",
    slug: "Slug",
};

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: "#E24B4A",
    HIGH: "#F97316",
    MEDIUM: "#EAB308",
    LOW: "#22C55E",
};

const STATUS_COLORS: Record<string, string> = {
    TO_DO: "#6B7280",
    IN_PROGRESS: "#3B82F6",
    DONE: "#22C55E",
    CANCELLED: "#E24B4A",
};

interface AIConfirmCardProps {
    generated: GenerateEntityResponse;
    workspaceId?: string;
    onAccept: (editedEntity: any) => Promise<void>;
    onReject: () => void;
}

function AIConfirmCard({ generated, workspaceId, onAccept, onReject }: AIConfirmCardProps) {
    const navigate = useNavigate();
    const isArray = Array.isArray(generated.entity);
    const [localEntity, setLocalEntity] = useState<any>(() => {
        const initItem = (base: any) => {
            if (generated.intent === "task") return { spaceId: "", folderId: "", listeId: "", sprintId: "", ...base };
            if (generated.intent === "liste") return { spaceId: "", folderId: "", type: "SPRINT", ...base };
            if (generated.intent === "sprint") return { spaceId: "", folderId: "", ...base };
            if (generated.intent === "folder") return { spaceId: "", ...base };
            return base;
        };

        if (isArray) {
            return (generated.entity as any[]).map(item => initItem(item || {}));
        }
        return initItem(generated.entity ?? {});
    });
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [acceptedData, setAcceptedData] = useState<any>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    const currentItem = isArray && editingItemIndex !== null ? localEntity[editingItemIndex] : localEntity;

    const [listesOptions, setListesOptions] = useState<any[]>([]);
    const [sprintsOptions, setSprintsOptions] = useState<any[]>([]);
    const [spacesOptions, setSpacesOptions] = useState<any[]>([]);
    const [foldersOptions, setFoldersOptions] = useState<any[]>([]);
    const [membersOptions, setMembersOptions] = useState<WorkspaceMemberResponseDto[]>([]);

    useEffect(() => {
        if (!workspaceId) {
            setSpacesOptions([]);
            setMembersOptions([]);
            return;
        }
        import("../api/spaceApi").then(api => api.getSpacesByWorkspace(workspaceId).then(res => setSpacesOptions(res || []))).catch(() => { });
        getWorkspaceMembers(workspaceId).then(res => setMembersOptions(res || [])).catch(() => { });
    }, [workspaceId]);

    useEffect(() => {
        if (!currentItem || !currentItem.spaceId) {
            setFoldersOptions([]);
            return;
        }
        import("../api/folderApi").then(api => api.getFoldersBySpace(currentItem.spaceId).then(res => setFoldersOptions(res || []))).catch(() => { });
    }, [currentItem?.spaceId]);

    useEffect(() => {
        if (!currentItem || !currentItem.folderId) {
            setListesOptions([]);
            setSprintsOptions([]);
            return;
        }
        import("../api/listeApi").then(api => api.getListesByFolder(currentItem.folderId).then(res => setListesOptions(res || []))).catch(() => { });
        import("../api/sprintApi").then(api => api.getSprintsByFolder(currentItem.folderId).then(res => setSprintsOptions(res || []))).catch(() => { });
    }, [currentItem?.folderId]);

    const handleChange = (key: string, value: any) => {
        setLocalEntity((prev: any) => {
            if (isArray && editingItemIndex !== null) {
                const nextArr = [...prev];
                const nextItem = { ...nextArr[editingItemIndex], [key]: value };
                if (key === "spaceId") {
                    nextItem.folderId = "";
                    nextItem.listeId = "";
                    nextItem.sprintId = "";
                }
                if (key === "folderId") {
                    nextItem.listeId = "";
                    nextItem.sprintId = "";
                }
                nextArr[editingItemIndex] = nextItem;
                return nextArr;
            } else {
                const next = { ...prev, [key]: value };
                if (key === "spaceId") {
                    next.folderId = "";
                    next.listeId = "";
                    next.sprintId = "";
                }
                if (key === "folderId") {
                    next.listeId = "";
                    next.sprintId = "";
                }
                return next;
            }
        });
    };

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);
        try {
            const data = await onAccept(localEntity);
            if (data !== undefined) {
                setAcceptedData(data);
            }
            setAccepted(true);
        } catch (e: any) {
            setError(e.message || "Erreur lors de la création.");
        } finally {
            setIsAccepting(false);
        }
    };

    const icon = ENTITY_ICONS[generated.intent] ?? <Zap size={24} color="#a89ef5" />;
    const label = ENTITY_LABELS[generated.intent] ?? generated.intent;

    if (accepted) {
        // Cas batch
        if (acceptedData?.type === "batch") {
            return (
                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <CheckCircle2 size={18} color="#22C55E" />
                        <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 600 }}>
                            {acceptedData.count} {label}(s) créé(e)(s) avec succès !
                        </span>
                    </div>
                    {acceptedData.results.map((r: any, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", paddingLeft: 8, marginBottom: 2 }}>
                            • {r.name || r.id}
                        </div>
                    ))}
                    {acceptedData.errors.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#E24B4A" }}>
                            {acceptedData.errors.length} erreur(s) : {acceptedData.errors.join(", ")}
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20, display: "flex", alignItems: "center" }}><CheckCircle2 size={20} color="#22C55E" /></span>
                    <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 600 }}>
                        {label} créé(e) avec succès !
                    </span>
                </div>
                {acceptedData && acceptedData.type !== "task" && acceptedData.type !== "workspace" && (
                    <button
                        onClick={() => {
                            localStorage.setItem("pendingSelectedHierarchy", JSON.stringify({
                                type: acceptedData.type,
                                id: acceptedData.id,
                                name: acceptedData.name
                            }));
                            navigate("/workspace");
                        }}
                        style={{
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.4)",
                            borderRadius: 8, padding: "6px 14px",
                            color: "#22C55E", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                        className="btn-voir-entity"
                        data-type={acceptedData.type}
                        data-id={acceptedData.id}
                        data-name={acceptedData.name}
                    >
                        Voir
                    </button>
                )}
                {acceptedData && acceptedData.type === "task" && acceptedData.listOrSprintId && (
                    <button
                        onClick={() => {
                            localStorage.setItem("pendingSelectedHierarchy", JSON.stringify({
                                type: acceptedData.listOrSprintType,
                                id: acceptedData.listOrSprintId,
                                name: acceptedData.listOrSprintName
                            }));
                            navigate("/workspace");
                        }}
                        style={{
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.4)",
                            borderRadius: 8, padding: "6px 14px",
                            color: "#22C55E", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                        className="btn-voir-entity"
                        data-type={acceptedData.listOrSprintType}
                        data-id={acceptedData.listOrSprintId}
                        data-name={acceptedData.listOrSprintName}
                    >
                        Voir
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{
            background: "rgba(83,74,183,0.08)",
            border: "1px solid rgba(83,74,183,0.3)",
            borderRadius: 16, padding: "18px 20px",
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: 480,
        }}>
            <style>{`
                .ai-form-select option {
                    background-color: #2B274F;
                    color: white;
                }
            `}</style>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a89ef5" }}>
                        IA — Créer un(e) {label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        {generated.explanation}
                    </div>
                </div>
            </div>

            {/* Editable Fields — or batch summary */}
            {/* Editable Fields — or batch summary */}
            {isArray && editingItemIndex === null ? (
                <div style={{
                    background: "rgba(0,0,0,0.25)", borderRadius: 10,
                    padding: "14px 16px", marginBottom: 14,
                }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                        {(localEntity as any[]).length} {label}(s) à créer (cliquez pour modifier) :
                    </div>
                    {(localEntity as any[]).map((item: any, i: number) => (
                        <div key={i} onClick={() => setEditingItemIndex(i)} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", marginBottom: 6,
                            background: "rgba(83,74,183,0.1)", borderRadius: 8,
                            fontSize: 13, color: "rgba(255,255,255,0.85)",
                            cursor: "pointer", transition: "background 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(83,74,183,0.2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(83,74,183,0.1)"}
                        >
                            <span style={{ color: "#a89ef5", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                            <span>{item.title || item.name || JSON.stringify(item)}</span>
                            {item.priority && (
                                <span style={{
                                    marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 6,
                                    background: "rgba(83,74,183,0.2)", color: "#a89ef5",
                                }}>{item.priority}</span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", marginLeft: 4 }}><Pencil size={14} color="rgba(255,255,255,0.4)" /></span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    background: "rgba(0,0,0,0.25)", borderRadius: 10,
                    padding: "16px", marginBottom: 14,
                }}>
                    {isArray && editingItemIndex !== null && (
                        <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <button
                                onClick={() => setEditingItemIndex(null)}
                                style={{
                                    background: "transparent", border: "none", color: "#a89ef5",
                                    fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0
                                }}
                            >
                                ← Retour à la liste
                            </button>
                            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                                Édition de l'élément #{editingItemIndex + 1}
                            </div>
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                        {Object.entries(currentItem)
                    .filter(([key]) => {
                        if (key === "workspaceId") return false;

                        // Cacher les listes et sprints si on ne crée pas de tâche
                        if (generated.intent !== "task" && (key === "listeId" || key === "sprintId")) {
                            return false;
                        }

                        // Cacher le folder si on crée un workspace, un space ou un folder
                        if ((generated.intent === "workspace" || generated.intent === "space" || generated.intent === "folder") && key === "folderId") {
                            return false;
                        }

                        // Cacher le space si on crée un workspace
                        if (generated.intent === "workspace" && key === "spaceId") {
                            return false;
                        }

                        return true;
                    })
                    .map(([key, value]) => {
                        const fieldLabel = FIELD_LABELS[key] ?? key;
                        const val = value as string;

                        let inputElement;

                        const inputStyle = {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px", padding: "6px 10px",
                            color: "white", fontSize: "13px",
                            width: "100%", fontFamily: "'DM Sans', sans-serif"
                        };

                        if (key === "status") {
                            inputElement = (
                                <select className="ai-form-select" value={val} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="TO_DO">À faire (TO_DO)</option>
                                    <option value="IN_DEV">En dev (IN_DEV)</option>
                                    <option value="IN_TEST">En test (IN_TEST)</option>
                                    <option value="IN_REVIEW">En revue (IN_REVIEW)</option>
                                    <option value="DONE">Terminé (DONE)</option>
                                </select>
                            );
                        } else if (key === "priority") {
                            inputElement = (
                                <select className="ai-form-select" value={val} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="LOW">Basse (LOW)</option>
                                    <option value="MEDIUM">Moyenne (MEDIUM)</option>
                                    <option value="HIGH">Haute (HIGH)</option>
                                    <option value="URGENT">Urgente (URGENT)</option>
                                </select>
                            );
                        } else if (key === "listeId") {
                            inputElement = (
                                <select className="ai-form-select" value={val || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="">-- Sélectionner une Liste --</option>
                                    {listesOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            );
                        } else if (key === "sprintId") {
                            inputElement = (
                                <select className="ai-form-select" value={val || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="">-- Sélectionner un Sprint --</option>
                                    {sprintsOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            );
                        } else if (key === "spaceId") {
                            inputElement = (
                                <select className="ai-form-select" value={val || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="">-- Sélectionner un Space --</option>
                                    {spacesOptions.map(s => <option key={s.id} value={s.id}>{s.spaceName || s.name}</option>)}
                                </select>
                            );
                        } else if (key === "folderId") {
                            inputElement = (
                                <select className="ai-form-select" value={val || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="">-- Sélectionner un Folder --</option>
                                    {foldersOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            );
                        } else if (key === "type" && generated.intent === "liste") {
                            inputElement = (
                                <select className="ai-form-select" value={val || "SPRINT"} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="SPRINT">Sprint</option>
                                    <option value="PHASE">Phase</option>
                                </select>
                            );
                        } else if (key === "description") {
                            inputElement = <textarea value={val || ""} onChange={e => handleChange(key, e.target.value)} style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} />;
                        } else if (key === "assigneeId") {
                            inputElement = (
                                <select className="ai-form-select" value={val || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                                    <option value="">-- Non assignée --</option>
                                    {membersOptions.map(m => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.userName} ({m.role})
                                        </option>
                                    ))}
                                </select>
                            );
                        } else {
                            const isDate = key.toLowerCase().includes("date");
                            let formattedVal = val;
                            if (isDate && val && val.length === 10) {
                                // yyyy-MM-dd -> yyyy-MM-ddT00:00
                                formattedVal = `${val}T00:00`;
                            }
                            inputElement = <input type={isDate ? "datetime-local" : "text"} value={formattedVal || ""} onChange={e => handleChange(key, e.target.value)} style={inputStyle} />;
                        }

                        return (
                            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                    {fieldLabel}
                                </span>
                                {inputElement}
                            </div>
                        );
                    })}
            </div>
                </div>
            )}
            {error && (
                <div style={{
                    fontSize: 12, color: "#E24B4A", marginBottom: 10,
                    background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8
                }}>
                    {error}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
                <button
                    onClick={onReject}
                    disabled={isAccepting}
                    style={{
                        flex: 1, background: "rgba(255,255,255,0.05)",
                        border: "0.5px solid rgba(255,255,255,0.12)",
                        borderRadius: 10, padding: "9px 0", color: "rgba(255,255,255,0.55)",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                >
                    <X size={13} /> Refuser
                </button>
                <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    style={{
                        flex: 1, background: "linear-gradient(135deg, #534AB7, #3C3489)",
                        border: "none", borderRadius: 10, padding: "9px 0", color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: isAccepting ? "not-allowed" : "pointer",
                        opacity: isAccepting ? 0.7 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                >
                    {isAccepting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Confirmer
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// PAGE IA
// ============================================================================

const navItems = [
    { icon: LayoutGrid, label: "Dashboard" },
    { icon: Sparkles, label: "Ask AI" },
    { icon: Bell, label: "Notifications" },
];

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
    role: ChatRole;
    content: string;
    timestamp: string | Date;
    generated?: GenerateEntityResponse;  // si l'IA a genere une entite
}

const INITIAL_VISIBLE_MESSAGES = 20;
const MESSAGE_BATCH_SIZE = 20;

function normalizeChatRole(role: string): ChatRole {
    if (role === "assistant" || role === "system") {
        return role;
    }
    return "user";
}

function buildConversationTitleFromMessage(message: string): string {
    const singleLine = message.replace(/\s+/g, " ").trim();
    if (!singleLine) {
        return "Nouvelle conversation";
    }

    if (singleLine.length <= 60) {
        return singleLine;
    }

    return `${singleLine.slice(0, 57)}...`;
}

export default function AIPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState({ id: "", name: "User", avatar: "US" });
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    // ── Inline hierarchy view ──
    const [selectedHierarchy, setSelectedHierarchy] = useState<SelectedHierarchy | null>(null);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [actionTypeState, setActionTypeState] = useState<"chat" | "generate">("chat");

    // State pour les modales de workspace
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceResponseDto | null>(null);

    const [repoList, setRepoList] = useState<{ owner: string; repo: string; branch: string; is_private: boolean }[]>([]);
    const [activeRepoIndex, setActiveRepoIndex] = useState(0);
    const [conversations, setConversations] = useState<ConversationResponseDto[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageFetchLimit, setMessageFetchLimit] = useState(INITIAL_VISIBLE_MESSAGES);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(false);
    const [isConversationLoading, setIsConversationLoading] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showRepoModal, setShowRepoModal] = useState(false);
    const [editingRepoIndex, setEditingRepoIndex] = useState<number | null>(null);
    const [deletingRepoIndex, setDeletingRepoIndex] = useState<number | null>(null);
    const [isReposExpanded, setIsReposExpanded] = useState(true);
    const [deletingConversation, setDeletingConversation] = useState<ConversationResponseDto | null>(null);
    const [acceptedCards, setAcceptedCards] = useState<Set<number>>(new Set());
    const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastRequestRef = useRef<{ input: string; actionType: "chat" | "generate" } | null>(null);
    const wasAbortedRef = useRef(false);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        const el = messagesScrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
    }, []);

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Ajustement dynamique de la hauteur du textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "24px"; // Hauteur de base
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight > 24 ? `${scrollHeight}px` : "24px";
        }
    }, [input]);

    const toChatMessages = (conversationMessages: { role: string; content: string; createdAt: string }[]): ChatMessage[] => {
        return conversationMessages.map((msg) => ({
            role: normalizeChatRole(msg.role),
            content: msg.content,
            timestamp: msg.createdAt,
        }));
    };

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser({
                    id:     parsed.id || "",
                    name:   parsed.firstName || "User",
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
                    const savedWorkspace = wsData.find((ws) => ws.id === savedWorkspaceId);
                    setActiveWorkspace(savedWorkspace ?? wsData[0]);
                }

                const savedConversationId = localStorage.getItem("activeConversationId");
                const existingConversations = await getMyConversations();

                // Charger les dépôts depuis le backend
                try {
                    const storedUserStr = localStorage.getItem("user");
                    if (storedUserStr) {
                        const parsedUser = JSON.parse(storedUserStr);
                        if (parsedUser.id) {
                            const userRepos = await getRepositories(parsedUser.id);
                            setRepoList(userRepos.map(r => ({
                                owner: r.repoOwner,
                                repo: r.repoName,
                                branch: r.branch,
                                is_private: r.isPrivate
                            })));
                        }
                    }
                } catch (e) {
                    console.error("Failed to load repositories", e);
                }


                let selectedConversation = existingConversations.find((conv) => conv.id === savedConversationId)
                    ?? existingConversations[0];

                if (!selectedConversation) {
                    selectedConversation = await createConversation({ title: "Nouvelle conversation" });
                }

                setConversations(existingConversations);

                setConversationId(selectedConversation.id);

                setIsConversationLoading(true);
                const conversationMessages = await getConversationMessages(selectedConversation.id, INITIAL_VISIBLE_MESSAGES);
                setMessages(toChatMessages(conversationMessages));
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(conversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
            } catch (error) {
                console.error("Failed to load workspaces", error);
            } finally {
                setIsConversationLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem("activeWorkspaceId", activeWorkspace.id);
        }
    }, [activeWorkspace]);

    // Gérer les actions de navigation depuis les autres pages (?new=1 / ?history=1)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("new") === "1") {
            handleCreateConversation();
            navigate("/ai", { replace: true });
        } else if (params.get("history") === "1") {
            setIsConversationPanelOpen(true);
            navigate("/ai", { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    useEffect(() => {
        if (conversationId) {
            localStorage.setItem("activeConversationId", conversationId);
        }
    }, [conversationId]);


    // Workspace CRUD handlers
    const handleCreateWorkspace = async (name: string, slug: string) => {
        const created = await createWorkspace({ name, slug });
        setWorkspaces((prev) => [...prev, created]);
        setActiveWorkspace(created);
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



    const refreshConversations = async () => {
        const updatedConversations = await getMyConversations();
        setConversations(updatedConversations);
        return updatedConversations;
    };

    const handleSelectConversation = async (targetConversationId: string) => {
        if (!targetConversationId || targetConversationId === conversationId || isConversationLoading) {
            return;
        }

        setIsConversationLoading(true);
        try {
            const conversationMessages = await getConversationMessages(targetConversationId, INITIAL_VISIBLE_MESSAGES);
            setConversationId(targetConversationId);
            setMessages(toChatMessages(conversationMessages));
            setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
            setHasMoreMessages(conversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConversationLoading(false);
        }
    };

    const handleCreateConversation = async () => {
        try {
            const createdConversation = await createConversation({ title: "Nouvelle conversation" });
            setConversationId(createdConversation.id);
            setMessages([]);
            setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
            setHasMoreMessages(false);
            setIsConversationPanelOpen(true);

            await refreshConversations();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteConversation = async (conversationToDeleteId: string) => {
        if (!conversationToDeleteId) return;

        try {
            await deleteConversation(conversationToDeleteId);

            let updatedConversations = await getMyConversations();
            if (updatedConversations.length === 0) {
                const createdConversation = await createConversation({ title: "Nouvelle conversation" });
                setConversations([]);
                setConversationId(createdConversation.id);
                setMessages([]);
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(false);
                return;
            }

            setConversations(updatedConversations);

            if (conversationId === conversationToDeleteId || !conversationId) {
                const nextConversation = updatedConversations[0];
                setConversationId(nextConversation.id);
                setIsConversationLoading(true);

                const nextConversationMessages = await getConversationMessages(nextConversation.id, INITIAL_VISIBLE_MESSAGES);
                setMessages(toChatMessages(nextConversationMessages));
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(nextConversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
                setIsConversationLoading(false);
            }
        } catch (error) {
            console.error(error);
            setIsConversationLoading(false);
        }
    };

    const promptDeleteConversation = (conversationToDeleteId: string) => {
        const targetConversation = conversations.find((conv) => conv.id === conversationToDeleteId);
        if (!targetConversation) {
            return;
        }

        setDeletingConversation(targetConversation);
    };

    const handleShowMoreMessages = async () => {
        if (!conversationId || isConversationLoading) {
            return;
        }

        const nextLimit = messageFetchLimit + MESSAGE_BATCH_SIZE;

        setIsConversationLoading(true);
        try {
            const conversationMessages = await getConversationMessages(conversationId, nextLimit);
            setMessages(toChatMessages(conversationMessages));
            setMessageFetchLimit(nextLimit);
            setHasMoreMessages(conversationMessages.length >= nextLimit);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConversationLoading(false);
        }
    };

    const [statusText, setStatusText] = useState("");

    const handleStop = () => {
        if (!isTyping) return;
        wasAbortedRef.current = true;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsTyping(false);
        setStatusText("");
        setErrorFeedback(null);
        setMessages(prev => ([
            ...prev,
            { role: "assistant", content: "Orbyte IA a ete interrompu.", timestamp: new Date() },
        ]));
    };

    const handleRetry = () => {
        if (isTyping || !lastRequestRef.current) return;
        setErrorFeedback(null);
        handleSend(lastRequestRef.current.actionType, lastRequestRef.current.input);
    };

    // Detect if user wants to generate an entity
    const isGenerateIntent = (query: string): boolean => {
        const lower = query.toLowerCase();
        const generateKeywords = ["génère", "genere", "crée", "cree", "create", "generate", "ajoute", "add", "nouvelle tâche", "new task"];
        return generateKeywords.some(kw => lower.includes(kw));
    };

    const handleConfirmEntity = async (generated: GenerateEntityResponse): Promise<any> => {
        if (!generated.entity) throw new Error("Aucune entité à créer.");

        // ── Helpers ──────────────────────────────────────────────────────────
        const cleanEntity = (raw: any) => {
            const e = { ...raw };
            if (e.spaceId === "") delete e.spaceId;
            if (e.folderId === "") delete e.folderId;
            if (e.listeId === "") delete e.listeId;
            if (e.sprintId === "") delete e.sprintId;
            return e;
        };

        const callEndpoint = async (endpoint: string, body: any) => {
            const url = endpoint.replace("POST ", "").replace(/^\/api/, "/api");
            const backendBase = (window as any).BACKEND_API_BASE || "http://localhost:8080";
            const resp = await fetch(`${backendBase}${url}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify(body),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.message || `Erreur ${resp.status}`);
            }
            return resp.json();
        };

        const createSingleEntity = async (entity: any): Promise<any> => {
            entity = cleanEntity(entity);
            switch (generated.intent) {
                case "task": {
                    if (!entity.listeId) {
                        const page = await getAllListes(0, 1);
                        if (page.content && page.content.length > 0) {
                            entity.listeId = page.content[0].id;
                        } else {
                            throw new Error("Veuillez d'abord créer une Liste pour pouvoir y ajouter des tâches.");
                        }
                    }
                    const res = await createTask(entity);
                    return { type: "task", id: res.id, name: res.title, listOrSprintId: entity.listeId || entity.sprintId };
                }
                case "workspace": {
                    const ws = await createWorkspace(entity);
                    setWorkspaces(prev => [...prev, ws]);
                    return { type: "workspace", id: ws.id, name: ws.name };
                }
                case "space": {
                    if (!entity.workspaceId && activeWorkspace) entity.workspaceId = activeWorkspace.id;
                    const data = await callEndpoint(generated.endpoint!, entity);
                    return { type: "space", id: data.id, name: data.spaceName || data.name };
                }
                case "folder": {
                    if (!entity.spaceId && activeWorkspace) {
                        const spaces = await import("../api/spaceApi").then(m => m.getSpacesByWorkspace(activeWorkspace.id));
                        if (spaces.length > 0) entity.spaceId = spaces[0].id;
                        else throw new Error("Veuillez d'abord créer un Space pour pouvoir y ajouter cet élément.");
                    }
                    const data = await callEndpoint(generated.endpoint!, entity);
                    return { type: "folder", id: data.id, name: data.name };
                }
                case "sprint":
                case "liste": {
                    if (!entity.folderId) {
                        const folders = await import("../api/folderApi").then(m => m.getAllFolders());
                        if (folders.length > 0) entity.folderId = folders[0].id || folders[0].folderId;
                        else throw new Error("Veuillez d'abord créer un Dossier (Folder) pour pouvoir y ajouter cette liste.");
                    }
                    const data = await callEndpoint(generated.endpoint!, entity);
                    return { type: generated.intent === "liste" ? "list" : "sprint", id: data.id, name: data.name };
                }
                default:
                    throw new Error(`Intent inconnu : ${generated.intent}`);
            }
        };

        // ── Batch (tableau) ───────────────────────────────────────────────────
        if (Array.isArray(generated.entity)) {
            const results: any[] = [];
            const errors: string[] = [];
            for (const item of generated.entity) {
                try {
                    const r = await createSingleEntity(item);
                    results.push(r);
                } catch (e: any) {
                    errors.push(e.message || "Erreur inconnue");
                }
            }
            return { type: "batch", results, errors, count: results.length };
        }

        // ── Entité unique ────────────────────────────────────────────────────
        return createSingleEntity(generated.entity);
    };

    const handleSend = async (actionType: "chat" | "generate" = "chat", forcedInput?: string) => {
        const rawInput = forcedInput ?? input;
        if (!rawInput.trim() || isTyping) return;

        const userInput = rawInput.trim();
        const isFirstMessageInConversation = messages.length === 0;
        const nextConversationTitle = buildConversationTitleFromMessage(userInput);

        if (!forcedInput) setInput("");
        setIsTyping(true);
        setActionTypeState(actionType);
        setStatusText("Initialisation...");
        setErrorFeedback(null);
        lastRequestRef.current = { input: userInput, actionType };
        wasAbortedRef.current = false;
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const userMsg: ChatMessage = { role: "user", content: userInput, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);

        try {
            let currentConversationId = conversationId;

            if (!currentConversationId) {
                setStatusText("Création de la session...");
                const createdConversation = await createConversation({ title: "Nouvelle conversation" });
                currentConversationId = createdConversation.id;
                setConversationId(createdConversation.id);
            }

            if (isFirstMessageInConversation) {
                await updateConversationTitle(currentConversationId, { title: nextConversationTitle })
                    .catch(e => console.error("Erreur titre:", e));
            }

            await addConversationMessage(currentConversationId, { role: "user", content: userInput })
                .catch(e => console.error("Erreur addMessage:", e));

            // --- ROUTE GENERATE ---
            if (actionType === "generate") {
                setStatusText("Analyse de l'intention...");
                const generated = await generateEntity({
                    user_query: userInput,
                    context: {
                        workspaceId: activeWorkspace?.id,
                        members: activeWorkspace?.id ? await getWorkspaceMembers(activeWorkspace.id).then(m => m.map(mem => ({ id: mem.userId, name: mem.userName }))) : []
                    },
                    repositories: repoList.length > 0 ? repoList : undefined,
                    user_id: user.id || "anonymous",
                });

                let assistantContent = generated.explanation;
                if (generated.intent === "unknown") {
                    assistantContent = generated.explanation;
                }

                const assistantMsg: ChatMessage = {
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                    generated: generated.intent !== "unknown" ? generated : undefined,
                };
                setMessages(prev => [...prev, assistantMsg]);

                await addConversationMessage(currentConversationId, { role: "assistant", content: assistantContent })
                    .catch(() => { });
                await refreshConversations();
                return;
            }

            // --- ROUTE RAG (analyse repo) ---
            if (repoList.length === 0) {
                const noRepoMsg: ChatMessage = {
                    role: "assistant",
                    content: "Veuillez ajouter au moins un dépôt GitHub pour utiliser l'analyse de code.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, noRepoMsg]);
                return;
            }

            setStatusText("Synchronisation du code GitHub...");
            const res = await analyzeRepo({
                repositories: repoList,
                user_query:   userInput,
                user_id:      user.id || "anonymous",
            });

            setStatusText("Génération de la réponse...");
            const assistantMsg: ChatMessage = { role: "assistant", content: res.response, timestamp: new Date() };
            setMessages(prev => [...prev, assistantMsg]);

            await addConversationMessage(currentConversationId, { role: "assistant", content: res.response });
            await refreshConversations();

        } catch (err: any) {
            if (wasAbortedRef.current || err?.name === "AbortError") {
                wasAbortedRef.current = false;
                return;
            }
            console.error("ERREUR CRITIQUE handleSend:", err);
            setStatusText("Erreur lors de l'analyse.");
            setErrorFeedback("Une erreur s'est produite. Veuillez reessayer plus tard.");
            setMessages(prev => ([
                ...prev,
                { role: "assistant", content: "Une erreur s'est produite. Veuillez reessayer plus tard.", timestamp: new Date() },
            ]));
        } finally {
            setIsTyping(false);
            setStatusText("");
            abortControllerRef.current = null;
        }
    };

    const sidebarNavItems = navItems.map((item) => {
        if (item.label === "Dashboard") {
            return {
                ...item,
                active: location.pathname === "/workspace" && !selectedHierarchy,
                onClick: () => {
                    navigate("/workspace");
                    setSelectedHierarchy(null);
                },
            };
        }
        if (item.label === "Ask AI") {
            return {
                ...item,
                active: location.pathname === "/ai",
                onClick: () => navigate("/ai"),
                subItems: [
                    {
                        label: "New Chat",
                        icon: SquarePen,
                        onClick: () => navigate("/ai?new=1"),
                    },
                    {
                        label: "History",
                        icon: History,
                        onClick: () => navigate("/ai?history=1"),
                    },
                ],
            };
        }
        if (item.label === "Notifications") {
            return {
                ...item,
                active: location.pathname === "/notifications",
                onClick: () => navigate("/notifications"),
            };
        }
        return item;
    });

    return (
        <Layout
            sidebar={
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
                    onSettingsClick={() => navigate("/settings")}
                    resourcesPanel={
                        <WorkspaceResourcesPanel
                            workspaceId={activeWorkspace?.id}
                            onSelectHierarchy={(hierarchy) => {
                                if (hierarchy) {
                                    setSelectedHierarchy(hierarchy as SelectedHierarchy);
                                }
                            }}
                        />
                    }
                />
            }
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
                
                .generate-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 18px;
                    border-radius: 12px;
                    border: 1px solid var(--accent);
                    background: var(--accent-soft);
                    color: var(--accent);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                }
                .generate-btn:hover:not(:disabled) {
                    background: var(--accent);
                    color: #fff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px var(--accent-soft);
                }
                .generate-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .generate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .ai-page-wrapper ::-webkit-scrollbar { width: 4px; }
                .ai-page-wrapper ::-webkit-scrollbar-track { background: transparent; }
                .ai-page-wrapper ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
                .ai-action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-sub); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.18s; }
                .ai-action-btn:hover { background: var(--bg-hover); color: var(--text-main); border-color: var(--border-hov); }
                .ai-action-btn.primary { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
                .ai-action-btn.primary:hover { background: var(--accent); color: #fff; }
                
                /* Markdown Styles */
                .markdown-content { font-size: 14px; line-height: 1.6; }
                .markdown-content p { margin-bottom: 12px; }
                .markdown-content p:last-child { margin-bottom: 0; }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 { color: var(--text-main); margin: 20px 0 10px; font-family: 'Syne', sans-serif; font-weight: 700; }
                .markdown-content h1 { font-size: 20px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
                .markdown-content h2 { font-size: 18px; }
                .markdown-content h3 { font-size: 16px; }
                .markdown-content code { background: var(--bg-hover); padding: 2px 5px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: var(--accent); }
                .markdown-content pre { background: var(--bg-hover); padding: 16px; border-radius: 12px; overflow-x: auto; margin: 12px 0; border: 1px solid var(--border); }
                .markdown-content pre code { background: none; padding: 0; font-size: 13px; color: var(--text-main); }
                .markdown-content ul, .markdown-content ol { margin-left: 20px; margin-bottom: 12px; color: var(--text-main); }
                .markdown-content li { margin-bottom: 6px; }
                .markdown-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                .markdown-content th, .markdown-content td { border: 1px solid var(--border); padding: 10px 12px; text-align: left; color: var(--text-main); }
                .markdown-content th { background: var(--bg-hover); color: var(--text-main); font-weight: 600; }
                .markdown-content tr:nth-child(even) { background: var(--bg-hover); }
                .markdown-content blockquote { border-left: 4px solid var(--accent); background: var(--accent-soft); padding: 10px 20px; margin: 12px 0; font-style: italic; color: var(--text-sub); }
                .markdown-content hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

                /* AI Page Layout */
                .ai-page-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; background: var(--bg-main); position: relative; }
                .ai-top-bar { display: flex; flex-direction: column; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--bg-card); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .ai-top-bar.collapsed { border-bottom: none; background: transparent; padding-top: 8px; }
                .ai-top-row { display: flex; align-items: center; gap: 8px; }
                .ai-top-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
                .ai-top-actions { display: flex; gap: 6px; margin-left: auto; flex-shrink: 0; }
                .ai-top-repos { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; align-items: center; }
                .ai-main-layout { position: relative; display: flex; flex: 1; min-height: 0; overflow: hidden; }
                .repo-chip { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 6px; 
                    padding: 4px 10px; 
                    border-radius: 8px; 
                    font-size: 11px; 
                    cursor: default; 
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
                    border: 1px solid var(--border); 
                    background: var(--bg-hover); 
                    color: var(--text-sub); 
                    position: relative; 
                    overflow: hidden; 
                    flex-shrink: 0;
                }
                .repo-chip:hover { 
                    background: var(--accent-soft); 
                    border-color: var(--accent); 
                    transform: translateY(-1px) scale(1.02);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                .repo-name { color: var(--text-main); font-weight: 600; font-size: 11px; }
                .repo-owner { color: var(--text-faint); font-weight: 300; font-size: 10px; }
                .repo-chip-icon { color: var(--accent); font-size: 12px; display: flex; align-items: center; }
                
                .repo-actions { 
                    display: flex; 
                    gap: 8px; 
                    margin-left: 4px;
                    padding-left: 8px;
                    border-left: 1px solid var(--border);
                    transform: translateX(40px);
                    opacity: 0;
                    transition: all 0.25s ease;
                }
                .repo-chip:hover .repo-actions { transform: translateX(0); opacity: 1; }
                
                .action-btn-sm {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    background: var(--bg-hover);
                }
                .action-btn-sm:hover { background: var(--bg-hover); border: 1px solid var(--border-hov); transform: scale(1.1); }
                
                .messages-scroll { flex: 1; overflow-y: auto; padding: 0; transition: padding-right 0.25s ease; }
                .messages-scroll.with-panel { padding-right: 320px; }
                .messages-inner { max-width: 760px; margin: 0 auto; padding: 28px 20px 20px; display: flex; flex-direction: column; gap: 0; }
                .msg-row { display: flex; gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
                .msg-row:last-child { border-bottom: none; }
                .msg-row.user { flex-direction: row-reverse; }
                .msg-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; font-weight: 700; color: #fff; }
                .msg-avatar.ai { background: var(--accent-gradient); }
                .msg-avatar.user-av { background: var(--bg-hover); border: 1px solid var(--border); font-size: 11px; color: var(--text-sub); }
                .msg-body { flex: 1; min-width: 0; color: var(--text-main); }
                .msg-row.user .msg-body { display: flex; flex-direction: column; align-items: flex-end; }
                .msg-name { font-size: 10px; font-weight: 600; color: var(--text-faint); margin-bottom: 4px; letter-spacing: 0.3px; }
                .msg-user-bubble { background: rgba(83,74,183,0.18); border: 0.5px solid rgba(83,74,183,0.35); border-radius: 14px 14px 4px 14px; padding: 9px 14px; max-width: 560px; font-size: 13px; line-height: 1.55; color: var(--text-main); }
                .msg-ai-content { font-size: 13px; line-height: 1.65; color: var(--text-main); padding-top: 2px; }
                .msg-meta { font-size: 10px; color: var(--text-faint); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
                .msg-row.user .msg-meta { justify-content: flex-end; }
                .input-dock { flex-shrink: 0; padding: 12px 20px 16px; background: var(--bg-main); }
                .input-dock.with-panel { padding-right: 340px; }
                .input-dock-inner { max-width: 760px; margin: 0 auto; }
                .input-box { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 6px 6px 6px 16px; transition: border-color 0.2s, box-shadow 0.2s; }
                .input-box:focus-within { border-color: rgba(168,158,245,0.4); box-shadow: 0 0 0 2px rgba(83,74,183,0.08), 0 6px 24px rgba(0,0,0,0.1); }
                .input-textarea { flex: 1; background: none; border: none; color: var(--text-main); outline: none; font-size: 13px; font-family: 'DM Sans', sans-serif; resize: none; line-height: 1.5; min-height: 22px; max-height: 140px; overflow-y: auto; }
                .input-textarea::placeholder { color: var(--text-faint); }
                .send-btn { width: 34px; height: 34px; border-radius: 10px; border: none; background: linear-gradient(135deg, #534AB7, #7c3aed); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
                .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 12px rgba(83,74,183,0.4); }
                .send-btn:active { transform: scale(0.96); }
                .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .send-hint { text-align: center; font-size: 10px; color: var(--text-faint); margin-top: 7px; }
                .suggestion-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 20px; }
                .sugg-chip { background: var(--bg-hover); border: 0.5px solid var(--border); color: var(--text-sub); padding: 6px 13px; border-radius: 99px; font-size: 12px; cursor: pointer; transition: all 0.18s; }
                .sugg-chip:hover { background: rgba(83,74,183,0.12); border-color: rgba(83,74,183,0.3); color: #c4beff; }
                .typing-dots { display: flex; gap: 4px; align-items: center; padding: 6px 0; }
                .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #a89ef5; animation: typing-pulse 1.4s ease-in-out infinite; }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                .show-more-btn { background: rgba(83,74,183,0.12); border: 0.5px solid rgba(83,74,183,0.35); color: #cfc8ff; border-radius: 99px; padding: 8px 14px; font-size: 12px; cursor: pointer; transition: background 0.18s; }
                .show-more-btn:hover { background: rgba(83,74,183,0.2); }
                .conversation-panel { position: absolute; top: 0; right: 0; width: 320px; height: 100%; background: var(--bg-card); border-left: 0.5px solid var(--border); z-index: 100; backdrop-filter: blur(10px); display: flex; flex-direction: column; transform: translateX(100%); opacity: 0; pointer-events: none; transition: transform 0.25s ease, opacity 0.25s ease; }
                .conversation-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
                .conversation-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; border-bottom: 0.5px solid var(--border); }
                .conversation-new-btn { margin: 12px 14px; background: rgba(83,74,183,0.18); border: 0.5px solid rgba(83,74,183,0.32); color: var(--text-main); border-radius: 10px; padding: 9px 12px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
                .conversation-new-btn:hover { background: rgba(83,74,183,0.26); }
                .conversation-list { flex: 1; overflow-y: auto; padding: 0 10px 12px; }
                .conversation-item { width: 100%; border: 0.5px solid var(--border); background: var(--bg-hover); border-radius: 10px; padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; text-align: left; transition: border-color 0.18s, background 0.18s; }
                .conversation-item:hover { border-color: var(--border-hov); }
                .conversation-item.active { border-color: rgba(83,74,183,0.45); background: rgba(83,74,183,0.14); }
                .conversation-item-main { flex: 1; min-width: 0; }
                .conversation-item-title { color: var(--text-main); font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .conversation-item-time { color: var(--text-faint); font-size: 11px; margin-top: 4px; }
                .conversation-delete-btn { width: 26px; height: 26px; border: none; border-radius: 8px; background: rgba(226,75,74,0.08); color: #f87171; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
                .conversation-delete-btn:hover { background: rgba(226,75,74,0.18); }
                @keyframes typing-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
                @keyframes msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .msg-row { animation: msg-in 0.25s ease-out; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                .scroll-to-bottom-btn {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: 70px;
                    width: 44px;
                    height: 44px;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #534AB7, #7c3aed);
                    color: white;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                    border: none;
                    cursor: pointer;
                    transition: transform 0.15s ease, opacity 0.2s;
                    z-index: 60;
                    opacity: 0.98;
                }
                .scroll-to-bottom-btn:hover { transform: translateX(-50%) translateY(-3px); }
                @media (max-width: 900px) {
                    .messages-scroll.with-panel { padding-right: 0; }
                    .input-dock.with-panel { padding-right: 24px; }
                    .conversation-panel { width: min(92vw, 320px); }
                }
            `}</style>

            <Content>
                <WorkspaceTopBar 
                    userName={user.name} 
                    userAvatar={user.avatar} 
                    onInvite={() => navigate("/workspace?invite=true")}
                    onNotificationsClick={() => navigate("/notifications")}
                    onSearch={(q) => setSearchQuery(q)}
                />

                <div className="ai-page-wrapper">
                    {selectedHierarchy ? (
                        <InlineHierarchyView
                            hierarchy={selectedHierarchy}
                            workspaceId={activeWorkspace?.id}
                            onNavigate={(h) => setSelectedHierarchy(h)}
                            onBack={() => setSelectedHierarchy(null)}
                        />
                    ) : (
                        <>
                            <div className={`ai-top-bar${!isReposExpanded ? ' collapsed' : ''}`}>
                                <div className="ai-top-row">
                                    <div className="ai-top-left">
                                    <div
                                        onClick={() => setIsReposExpanded(!isReposExpanded)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            cursor: "pointer",
                                            userSelect: "none",
                                            background: isReposExpanded ? "var(--bg-hover)" : "var(--accent-soft)",
                                            padding: isReposExpanded ? "6px 12px" : "4px 10px",
                                            borderRadius: isReposExpanded ? "8px" : "20px",
                                            border: isReposExpanded ? "none" : "1px solid var(--accent)",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: isReposExpanded ? "var(--accent)" : "var(--accent)" }}>
                                            {isReposExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: isReposExpanded ? "var(--text-main)" : "var(--accent)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                                            <FolderGit2 size={12} /> {isReposExpanded ? "Repositories" : "Manage Repos"}
                                        </div>
                                    </div>
                                    </div>

                                    <div className="ai-top-actions">
                                        <button className="ai-action-btn" onClick={() => navigate("/ai?history=1")}> 
                                            <History size={13} /> History
                                        </button>
                                        <button className="ai-action-btn primary" onClick={() => navigate("/ai?new=1")}>
                                            <SquarePen size={13} /> New Chat
                                        </button>
                                    </div>
                                </div>

                                {isReposExpanded && (
                                    <div className="ai-top-repos">
                                        {repoList.map((r, i) => (
                                            <div key={i} className="repo-chip">
                                                <div className="repo-chip-icon">
                                                    {r.is_private ? <Lock size={12} color="rgba(255,255,255,0.7)" /> : <FolderGit2 size={14} />}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                    <span className="repo-owner">{r.owner}</span>
                                                    <span style={{ opacity: 0.3 }}>/</span>
                                                    <span className="repo-name">{r.repo}</span>
                                                </div>
                                                <div className="repo-actions">
                                                    <div className="action-btn-sm" onClick={(e) => { e.stopPropagation(); setEditingRepoIndex(i); }}>
                                                        <Pencil size={11} style={{ color: "var(--text-sub)" }} />
                                                    </div>
                                                    <div className="action-btn-sm" onClick={(e) => { e.stopPropagation(); setDeletingRepoIndex(i); }} style={{ color: "var(--error)" }}>
                                                        <Trash2 size={11} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => setShowRepoModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 12, border: "1px dashed var(--success)", background: "var(--success-soft)", color: "var(--success)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
                                            <Plus size={13} /> Add Repo
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ai-main-layout">
                                {/* ── Messages Scroll Area ── */}
                                <div ref={messagesScrollRef} className={`messages-scroll${isConversationPanelOpen ? " with-panel" : ""}`}>
                                    <div className="messages-inner">
                                        {hasMoreMessages && (
                                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                                                <button className="show-more-btn" onClick={handleShowMoreMessages}>
                                                    Show more
                                                </button>
                                            </div>
                                        )}

                                        {messages.length === 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 56, textAlign: "center" }}>
                                                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #534AB7, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 10px 32px rgba(83,74,183,0.3)" }}>
                                                    <Sparkles size={22} color="white" />
                                                </div>
                                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-main)", marginBottom: 8, letterSpacing: "-0.3px" }}>
                                                    Bonjour, que puis-je analyser ?
                                                </h2>
                                                <p style={{ fontSize: 12, color: "var(--text-faint)", maxWidth: 360, lineHeight: 1.6 }}>
                                                    Je peux analyser votre code, suggérer des améliorations, détecter des bugs ou générer des tickets techniques.
                                                </p>
                                                <div className="suggestion-chips">
                                                    {["Explique l'architecture du projet", "Quels bugs potentiels vois-tu ?", "Génère des tickets techniques", "Revue du code en profondeur"].map(s => (
                                                        <button key={s} className="sugg-chip" onClick={() => { setInput(s); }}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map((m, i) => (
                                                <div key={`${m.timestamp}-${i}`} className={`msg-row${m.role === "user" ? " user" : ""}`}>
                                                    <div className={`msg-avatar${m.role === "user" ? " user-av" : " ai"}`}>
                                                        {m.role === "user"
                                                            ? <User size={16} color="white" />
                                                            : <Sparkles size={16} color="white" />}
                                                    </div>
                                                    <div className="msg-body">
                                                        <div className="msg-name">
                                                            {m.role === "user" ? "Vous" : "Orbyte AI"}
                                                        </div>
                                                        {m.role === "user" ? (
                                                            <div className="msg-user-bubble">{m.content}</div>
                                                        ) : (
                                                            <div className="msg-ai-content markdown-content">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                                {m.generated && m.generated.intent !== "unknown" && (
                                                                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                                                                        {(() => {
                                                                            const entities = Array.isArray(m.generated.entity)
                                                                                ? m.generated.entity
                                                                                : (m.generated.entity ? [m.generated.entity] : []);
                                                                            return entities.map((entityItem, entityIndex) => {
                                                                                const total = entities.length;
                                                                                const explanation = total > 1
                                                                                    ? `${m.generated!.explanation} (${entityIndex + 1}/${total})`
                                                                                    : m.generated!.explanation;
                                                                                const generatedItem = { ...m.generated!, entity: entityItem, explanation };
                                                                                return (
                                                                                    <AIConfirmCard
                                                                                        key={`${i}-${entityIndex}`}
                                                                                        generated={generatedItem}
                                                                                        workspaceId={activeWorkspace?.id}
                                                                                        onAccept={async (localEntity) => {
                                                                                            const res = await handleConfirmEntity({ ...generatedItem, entity: localEntity });
                                                                                            setAcceptedCards(prev => new Set(prev).add(i));
                                                                                            return res;
                                                                                        }}
                                                                                        onReject={() => {
                                                                                            setMessages(prev => prev.map((msg, msgIndex) => {
                                                                                                if (msgIndex !== i || !msg.generated) return msg;
                                                                                                const current = Array.isArray(msg.generated.entity)
                                                                                                    ? msg.generated.entity
                                                                                                    : (msg.generated.entity ? [msg.generated.entity] : []);
                                                                                                if (current.length <= 1) {
                                                                                                    return { ...msg, generated: undefined };
                                                                                                }
                                                                                                const nextEntities = current.filter((_, idx) => idx !== entityIndex);
                                                                                                return { ...msg, generated: { ...msg.generated, entity: nextEntities } };
                                                                                            }));
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="msg-meta">
                                                            <Clock size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {isConversationLoading && (
                                            <div className="msg-row">
                                                <div className="msg-avatar ai"><Loader2 size={16} color="white" className="animate-spin" /></div>
                                                <div className="msg-body">
                                                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Chargement de la conversation...</div>
                                                </div>
                                            </div>
                                        )}

                                        {isTyping && (
                                            <div className="msg-row">
                                                <div className="msg-avatar ai"><Sparkles size={16} color="white" /></div>
                                                <div className="msg-body">
                                                    <div className="typing-dots">
                                                        <span /><span /><span />
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Loader2 size={10} className="animate-spin" />
                                                        {statusText || "Analyse en cours..."}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showScrollDownBtn && (
                                    <button
                                        className="scroll-to-bottom-btn"
                                        onClick={() => scrollToBottom()}
                                        title="Descendre au bas"
                                        aria-label="Descendre au bas du chat"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                )}

                                <div className={`conversation-panel${isConversationPanelOpen ? " open" : ""}`}>
                                    <div className="conversation-panel-head">
                                        <h3 style={{ margin: 0, fontSize: 14, color: "var(--text-main)", fontFamily: "'Syne', sans-serif" }}>Historique</h3>
                                        <button
                                            onClick={() => setIsConversationPanelOpen(false)}
                                            style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", display: "flex" }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <button className="conversation-new-btn" onClick={handleCreateConversation}>
                                        <Plus size={14} /> Nouvelle conversation
                                    </button>

                                    <div className="conversation-list">
                                        {conversations.length === 0 ? (
                                            <p style={{ color: "var(--text-faint)", fontSize: 12, padding: "10px 6px" }}>Aucune conversation.</p>
                                        ) : (
                                            conversations.map((conv) => (
                                                <button
                                                    key={conv.id}
                                                    className={`conversation-item${conversationId === conv.id ? " active" : ""}`}
                                                    onClick={() => handleSelectConversation(conv.id)}
                                                >
                                                    <div className="conversation-item-main">
                                                        <div className="conversation-item-title">{conv.title || "Nouvelle conversation"}</div>
                                                        <div className="conversation-item-time">
                                                            {new Date(conv.updatedAt).toLocaleString([], {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="conversation-delete-btn"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            promptDeleteConversation(conv.id);
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Sticky Input Dock ── */}
                            <div className={`input-dock${isConversationPanelOpen ? " with-panel" : ""}`}>
                                <div className="input-dock-inner">
                                    {errorFeedback && (
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            background: "rgba(226,75,74,0.08)",
                                            border: "1px solid rgba(226,75,74,0.35)",
                                            color: "#fca5a5",
                                            borderRadius: 10,
                                            padding: "8px 12px",
                                            marginBottom: 10,
                                            fontSize: 12,
                                        }}>
                                            <span>Une erreur s'est produite. Veuillez reessayer plus tard.</span>
                                            <button
                                                onClick={handleRetry}
                                                style={{
                                                    background: "rgba(226,75,74,0.2)",
                                                    border: "1px solid rgba(226,75,74,0.5)",
                                                    color: "#fecaca",
                                                    borderRadius: 8,
                                                    padding: "6px 10px",
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Reessayer
                                            </button>
                                        </div>
                                    )}
                                    <div className="input-box">
                                        <textarea
                                            ref={textareaRef}
                                            className="input-textarea"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend("chat"); } }}
                                            placeholder="Posez une question sur votre codebase ou décrivez un élément à générer..."
                                            rows={1}
                                        />
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <button
                                                className="generate-btn"
                                                onClick={() => handleSend("generate")}
                                                disabled={isTyping || !input.trim()}
                                                title="Générer une entité"
                                            >
                                                {isTyping && actionTypeState === "generate" ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <img src="/generate_icon.png" alt="" style={{ width: 16, height: 16, filter: "drop-shadow(0 0 6px rgba(168,158,245,0.6))" }} />
                                                        Générer
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="send-btn"
                                                onClick={() => (isTyping ? handleStop() : handleSend("chat"))}
                                                disabled={!isTyping && !input.trim()}
                                                title={isTyping ? "Interrompre" : "Discuter avec le code"}
                                            >
                                                {isTyping ? <Square size={14} /> : <Send size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="send-hint">Entrée pour envoyer dans le chat · Shift+Entrée pour nouvelle ligne</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Content>

            {/* Modales de Workspace (Synchronisées avec le Dashboard) */}
            {
                showCreateModal && (
                    <WorkspaceFormModal
                        mode="create"
                        onSubmit={handleCreateWorkspace}
                        onClose={() => setShowCreateModal(false)}
                    />
                )
            }
            {
                editingWorkspace && (
                    <WorkspaceFormModal
                        mode="edit"
                        initialName={editingWorkspace.name}
                        initialSlug={editingWorkspace.slug}
                        onSubmit={handleUpdateWorkspace}
                        onClose={() => setEditingWorkspace(null)}
                    />
                )
            }
            {
                deletingWorkspace && (
                    <DeleteConfirmModal
                        workspaceName={deletingWorkspace.name}
                        onConfirm={handleDeleteWorkspace}
                        onClose={() => setDeletingWorkspace(null)}
                    />
                )
            }
            {
                showRepoModal && (
                    <RepoFormModal
                        mode="add"
                        onSubmit={async (owner, repo, branch, isPrivate, githubToken) => {
                            try {
                                await addRepository({
                                    owner, repo, branch,
                                    is_private: isPrivate,
                                    github_token: githubToken,
                                    user_id: user.id || "anonymous",
                                });
                                const newRepo = { owner, repo, branch, is_private: isPrivate };
                                setRepoList([...repoList, newRepo]);
                                setShowRepoModal(false);
                                showToast("Dépôt ajouté avec succès !", "success");
                            } catch (err: any) {
                                setShowRepoModal(false);
                                showToast("Erreur lors de l'ajout. Vérifiez vos accès.", "error");
                            }
                        }}
                        onClose={() => setShowRepoModal(false)}
                    />
                )
            }
            {
                editingRepoIndex !== null && (
                    <RepoFormModal
                        mode="edit"
                        initialData={repoList[editingRepoIndex]}
                        onSubmit={async (owner, repo, branch, isPrivate, githubToken) => {
                            try {
                                await addRepository({
                                    owner, repo, branch,
                                    is_private: isPrivate,
                                    github_token: githubToken,
                                    user_id: user.id || "anonymous",
                                });
                                const newList = [...repoList];
                                newList[editingRepoIndex] = { owner, repo, branch, is_private: isPrivate };
                                setRepoList(newList);
                                setEditingRepoIndex(null);
                                showToast("Dépôt modifié avec succès !", "success");
                            } catch (err: any) {
                                setEditingRepoIndex(null);
                                showToast("Erreur lors de la modification. Vérifiez vos accès.", "error");
                            }
                        }}
                        onClose={() => setEditingRepoIndex(null)}
                    />
                )
            }
            {
                deletingRepoIndex !== null && (
                    <DeleteConfirmModal
                        workspaceName={repoList[deletingRepoIndex].repo}
                        onConfirm={async () => {
                            const newList = repoList.filter((_, i) => i !== deletingRepoIndex);
                            setRepoList(newList);
                            if (activeRepoIndex >= newList.length) {
                                setActiveRepoIndex(Math.max(0, newList.length - 1));
                            }
                            setDeletingRepoIndex(null);
                        }}
                        onClose={() => setDeletingRepoIndex(null)}
                    />
                )
            }
            {
                deletingConversation && (
                    <ConversationDeleteConfirmModal
                        conversationTitle={deletingConversation.title || "Nouvelle conversation"}
                        onConfirm={async () => {
                            await handleDeleteConversation(deletingConversation.id);
                            setDeletingConversation(null);
                        }}
                        onClose={() => setDeletingConversation(null)}
                    />
                )
            }
            
            {toast && (
                <div style={{
                    position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
                    background: toast.type === "success" ? "rgba(52,211,153,0.9)" : "rgba(226,75,74,0.9)",
                    color: "white", padding: "12px 20px", borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8,
                    animation: "fade-in 0.3s ease-out"
                }}>
                    {toast.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                    {toast.message}
                </div>
            )}
        </Layout >
    );
}