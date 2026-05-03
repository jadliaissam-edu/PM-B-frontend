import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutGrid, Plus, Clock,
    Folder, Target, Zap, Loader2, Trash2, X, Check,
    CalendarDays, Sparkles, Users, UserPlus, List, Kanban,
    Hash, Bell, FolderOpen, Activity, CheckCircle2,
} from "lucide-react";

import { TaskAdd, TaskUpdate, TaskDelete } from "../components/TaskForms";
import { ListeAdd, ListeUpdate, ListeDelete } from "../components/listeForms";
import InviteMemberForm from "../forms/InviteMemberForm";
import Sidebar from "../components/Sidebar";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import WorkspaceResourcesPanel from "../components/WorkspaceResourcesPanel";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import ListView from "../components/ListView";
import BoardView from "../components/BoardView";
import {
    getWorkspacesByUser, getWorkspaceById, createWorkspace, updateWorkspace, deleteWorkspace,
} from "../api/workspaceApi.tsx";

export type HierarchyType = 'workspace' | 'space' | 'folder' | 'list' | 'sprint';
export interface SelectedHierarchy { type: HierarchyType; id: string; name: string; }

import type { WorkspaceResponseDto } from "../api/workspaceApi.tsx";
import { getSpacesByWorkspace, type SpaceResponseDto } from "../api/spaceApi.tsx";
import { getFoldersBySpace, type FolderResponseDto } from "../api/folderApi.tsx";
import { getSprintsByFolder, type SprintResponseDto } from "../api/sprintApi.tsx";
import {
    createTask, updateTask, deleteTask, getTasksByListe,
    type TaskResponseDto, type TaskStatus, type TaskRequestDto,
} from "../api/taskApi.tsx";
import {
    createListe, updateListe, deleteListe, getListesByFolder,
    type ListeResponseDto, type ListeRequestDto,
} from "../api/listeApi.tsx";
import {
    getWorkspaceMembers,
    getWorkspaceMembershipsByUser,
    removeMember,
    type WorkspaceMemberResponseDto,
} from "../api/workspaceMemberApi";

// ─── Palette & tokens ────────────────────────────────────────────────────────
const C = {
    bg:        "#0a0a0f",
    surface:   "#111118",
    surfaceEl: "#18181f",
    border:    "rgba(255,255,255,0.06)",
    borderHov: "rgba(255,255,255,0.12)",
    text:      "#f0f0f8",
    textMuted: "rgba(240,240,248,0.45)",
    textFaint: "rgba(240,240,248,0.22)",
    accent:    "#6c63ff",
    accentSoft:"rgba(108,99,255,0.14)",
    accentGlow:"rgba(108,99,255,0.35)",
    green:     "#22d3a0",
    orange:    "#f59e0b",
    red:       "#f43f5e",
    pink:      "#ec4899",
    blue:      "#3b82f6",
};

const PRIORITY_COLOR: Record<string, string> = {
    urgent: C.red, high: C.orange, medium: C.accent, low: C.green,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    TO_DO:      { label: "To Do",      color: "#818cf8",     bg: "rgba(129,140,248,0.15)" },
    IN_DEV:    { label: "In Dev",     color: C.blue,       bg: "rgba(59,130,246,0.12)"  },
    IN_TEST:   { label: "In Test",    color: C.orange,     bg: "rgba(245,158,11,0.12)"  },
    IN_REVIEW: { label: "In Review",  color: C.pink,       bg: "rgba(236,72,153,0.12)"  },
    DONE:      { label: "Done",       color: C.green,      bg: "rgba(34,211,160,0.12)"  },
};

// ─── Small utilities ─────────────────────────────────────────────────────────
function fmtDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function sprintPct(s: SprintResponseDto | null) {
    if (!s?.startDate || !s?.endDate) return 0;
    const st = new Date(s.startDate).getTime(), en = new Date(s.endDate).getTime(), now = Date.now();
    if (now <= st) return 0; if (now >= en) return 100;
    return Math.round(((now - st) / (en - st)) * 100);
}

// ─── Micro components ────────────────────────────────────────────────────────
function Avatar({ name, size = 26, color = C.accent }: { name: string; size?: number; color?: string }) {
    const init = name?.slice(0, 2).toUpperCase() || "??";
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color + "22", border: `1.5px solid ${color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, color, flexShrink: 0,
            fontFamily: "'Syne', sans-serif",
        }}>{init}</div>
    );
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span style={{
            padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
            color, background: bg, letterSpacing: "0.2px",
        }}>{label}</span>
    );
}

function Bar({ pct, color = C.accent, height = 3 }: { pct: number; color?: string; height?: number }) {
    return (
        <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 99,
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                transition: "width .6s ease",
            }} />
        </div>
    );
}

function StatChip({ value, label, color, icon: Icon }: { value: string | number; label: string; color: string; icon: any }) {
    return (
        <div style={{
            flex: 1, background: C.surfaceEl, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "10px 12px",
            display: "flex", flexDirection: "column", gap: 5,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={11} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: C.text }}>{value}</span>
            </div>
            <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 500 }}>{label}</p>
        </div>
    );
}

// ─── VIEW TABS ───────────────────────────────────────────────────────────────
type ViewMode = "overview" | "list" | "board" | "members";
function ViewTabs({ active, onChange }: { active: ViewMode; onChange: (v: ViewMode) => void }) {
    const tabs: { id: ViewMode; icon: any; label: string }[] = [
        { id: "overview", icon: LayoutGrid, label: "Overview" },
        { id: "list",     icon: List,        label: "List"     },
        { id: "board",    icon: Kanban,       label: "Board"   },
        { id: "members",  icon: Users,        label: "Members" },
    ];
    return (
        <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 16, borderBottom: `1px solid ${"rgba(255,255,255,0.05)"}`, paddingBottom: 0 }}>
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                        background: "transparent",
                        color: active === t.id ? "#fff" : "rgba(255,255,255,0.42)",
                        fontSize: 12, fontWeight: active === t.id ? 600 : 400,
                        borderBottom: active === t.id ? "2px solid #6c63ff" : "2px solid transparent",
                        transition: "all .15s",
                        fontFamily: "'DM Sans', sans-serif",
                        marginBottom: -1,
                    }}
                    onMouseEnter={e => { if (active !== t.id) e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                    onMouseLeave={e => { if (active !== t.id) e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}
                >
                    <t.icon size={13} />
                    {t.label}
                </button>
            ))}
        </div>
    );
}

// ─── MEMBERS VIEW ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { c: string; bg: string }> = {
    ADMIN:  { c: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    MEMBER: { c: "#22d3a0", bg: "rgba(34,211,160,0.1)"  },
    VIEWER: { c: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
};
function MembersView({
    members,
    onInvite,
    onRemoveMember,
    deletingMemberId,
}: {
    members: WorkspaceMemberResponseDto[];
    onInvite: () => void;
    onRemoveMember: (memberId: string) => Promise<void>;
    deletingMemberId: string | null;
}) {
    if (members.length === 0) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
            <Users size={32} style={{ color: C.textFaint }} />
            <p style={{ fontSize: 12, color: C.textMuted }}>No members yet.</p>
            <button onClick={onInvite} style={{ display: "flex", alignItems: "center", gap: 6, background: C.accent, border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <UserPlus size={12} /> Invite Member
            </button>
        </div>
    );
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SectionHeader title="Members" count={members.length} />
                <button onClick={onInvite} style={{ display: "flex", alignItems: "center", gap: 5, background: C.accent, border: "none", borderRadius: 7, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    <UserPlus size={11} /> Invite
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {members.map((m) => {
                    const rc = ROLE_COLORS[m.role] ?? ROLE_COLORS.MEMBER;
                    const initials = ((m.userName?.split(" ")[0]?.[0] ?? "") + (m.userName?.split(" ")[1]?.[0] ?? "")).toUpperCase() || "??";
                    const isDeleting = deletingMemberId === m.id;
                    const canRemove = m.role !== "OWNER";
                    return (
                        <div key={m.id} style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <Avatar name={initials} size={32} color={C.accent} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }}>
                                        {m.userName}
                                    </p>
                                    <p style={{ fontSize: 10, color: C.textFaint, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.3, marginTop: 2 }}>
                                        {m.userEmail}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: rc.c, background: rc.bg, borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>{m.role}</span>
                                {canRemove && (
                                    <button
                                        onClick={() => onRemoveMember(m.id)}
                                        disabled={isDeleting}
                                        title="Remove member"
                                        style={{
                                            border: "1px solid rgba(244,63,94,0.35)",
                                            background: "rgba(244,63,94,0.12)",
                                            color: "#fda4af",
                                            borderRadius: 7,
                                            padding: "4px 7px",
                                            cursor: isDeleting ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 5,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            opacity: isDeleting ? 0.65 : 1,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Trash2 size={11} />
                                        {isDeleting ? "..." : "Remove"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── OVERVIEW panels ─────────────────────────────────────────────────────────
function WorkspaceOverview({ tasks, spaces, members, listes, folders, onSelect }: any) {
    const done    = tasks.filter((t: TaskResponseDto) => t.status === "DONE").length;
    const active  = tasks.filter((t: TaskResponseDto) => ["IN_DEV","IN_TEST","IN_REVIEW"].includes(t.status)).length;
    const compPct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    const deadlines = tasks.filter((t: TaskResponseDto) => t.dueDate && t.status !== "DONE")
        .sort((a: TaskResponseDto, b: TaskResponseDto) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 6);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 12 }}>
                <StatChip value={spaces.length}  label="Spaces"       color={C.accent} icon={Folder} />
                <StatChip value={active}          label="In Progress"  color={C.blue}   icon={Activity} />
                <StatChip value={`${compPct}%`}   label="Completion"   color={C.green}  icon={Target} />
                <StatChip value={members.length}  label="Members"      color={C.pink}   icon={Users} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
                {/* Spaces grid */}
                <div>
                    <SectionHeader title="Spaces" count={spaces.length} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
                        {spaces.map((sp: SpaceResponseDto) => {
                            const col = sp.color || C.accent;
                            const spTasks = tasks.filter((t: TaskResponseDto) => {
                                const l = listes.find((li: ListeResponseDto) => li.id === t.listeId);
                                const f = folders.find((fo: FolderResponseDto) => fo.id === l?.folderId);
                                return f?.spaceId === sp.id;
                            });
                            const spDone = spTasks.filter((t: TaskResponseDto) => t.status === "DONE").length;
                            const pct = spTasks.length > 0 ? Math.round((spDone / spTasks.length) * 100) : 0;
                            return (
                                <HierarchyCard
                                    key={sp.id}
                                    icon={Folder}
                                    color={col}
                                    title={sp.spaceName}
                                    subtitle={`${spTasks.length} tasks · ${pct}% done`}
                                    progress={pct}
                                    onClick={() => onSelect({ type: "space", id: sp.id, name: sp.spaceName })}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <DeadlinesPanel tasks={deadlines} />
                    <ActivityPanel tasks={tasks} />
                </div>
            </div>
        </div>
    );
}

function SpaceOverview({ space, folders, listes, tasks, onSelect }: any) {
    const spFolders = folders.filter((f: FolderResponseDto) => f.spaceId === space.id);
    const spTasks   = tasks.filter((t: TaskResponseDto) => {
        const l = listes.find((li: ListeResponseDto) => li.id === t.listeId);
        const f = folders.find((fo: FolderResponseDto) => fo.id === l?.folderId);
        return f?.spaceId === space.id;
    });
    const done    = spTasks.filter((t: TaskResponseDto) => t.status === "DONE").length;
    const active  = spTasks.filter((t: TaskResponseDto) => ["IN_DEV","IN_TEST","IN_REVIEW"].includes(t.status)).length;
    const compPct = spTasks.length > 0 ? Math.round((done / spTasks.length) * 100) : 0;
    const deadlines = spTasks.filter((t: TaskResponseDto) => t.dueDate && t.status !== "DONE")
        .sort((a: TaskResponseDto, b: TaskResponseDto) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 12 }}>
                <StatChip value={spFolders.length} label="Folders"     color={C.accent} icon={FolderOpen} />
                <StatChip value={active}            label="In Progress" color={C.blue}   icon={Activity} />
                <StatChip value={`${compPct}%`}     label="Completion"  color={C.green}  icon={Target} />
                <StatChip value={done}              label="Done"        color={C.green}  icon={CheckCircle2} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
                <div>
                    <SectionHeader title="Folders" count={spFolders.length} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
                        {spFolders.map((f: FolderResponseDto) => {
                            const fTasks = tasks.filter((t: TaskResponseDto) => {
                                const l = listes.find((li: ListeResponseDto) => li.id === t.listeId);
                                return l?.folderId === f.id;
                            });
                            const fd = fTasks.filter((t: TaskResponseDto) => t.status === "DONE").length;
                            return (
                                <HierarchyCard
                                    key={f.id}
                                    icon={FolderOpen}
                                    color={C.orange}
                                    title={f.name}
                                    subtitle={`${fTasks.length} tasks`}
                                    progress={fTasks.length > 0 ? Math.round((fd / fTasks.length) * 100) : 0}
                                    onClick={() => onSelect({ type: "folder", id: f.id!, name: f.name })}
                                />
                            );
                        })}
                    </div>
                </div>
                <DeadlinesPanel tasks={deadlines} />
            </div>
        </div>
    );
}

function FolderOverview({ folder, listes, tasks, sprints, onSelect }: any) {
    const fLists   = listes.filter((l: ListeResponseDto) => l.folderId === folder.id);
    const fSprints = sprints.filter((s: SprintResponseDto) => s.folderId === folder.id);
    const fTasks   = tasks.filter((t: TaskResponseDto) => {
        const l = listes.find((li: ListeResponseDto) => li.id === t.listeId);
        return l?.folderId === folder.id;
    });
    const done    = fTasks.filter((t: TaskResponseDto) => t.status === "DONE").length;
    const compPct = fTasks.length > 0 ? Math.round((done / fTasks.length) * 100) : 0;
    const activeSprint = fSprints.find((s: SprintResponseDto) => s.isActive) ?? fSprints[fSprints.length - 1] ?? null;
    const sprintPct2   = sprintPct(activeSprint);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 12 }}>
                <StatChip value={fLists.length}   label="Lists"      color={C.blue}   icon={List} />
                <StatChip value={fSprints.length} label="Sprints"    color={C.orange} icon={Zap} />
                <StatChip value={`${compPct}%`}   label="Completion" color={C.green}  icon={Target} />
                <StatChip value={fTasks.length}   label="Total Tasks" color={C.accent} icon={CheckCircle2} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Lists */}
                    <div>
                        <SectionHeader title="Lists" count={fLists.length} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
                            {fLists.map((l: ListeResponseDto) => {
                                const lt = tasks.filter((t: TaskResponseDto) => t.listeId === l.id);
                                const ld = lt.filter((t: TaskResponseDto) => t.status === "DONE").length;
                                return (
                                    <HierarchyCard
                                        key={l.id}
                                        icon={List}
                                        color={C.blue}
                                        title={l.name}
                                        subtitle={`${lt.length} tasks`}
                                        progress={lt.length > 0 ? Math.round((ld / lt.length) * 100) : 0}
                                        onClick={() => onSelect({ type: "list", id: l.id!, name: l.name })}
                                        compact
                                    />
                                );
                            })}
                        </div>
                    </div>
                    {/* Sprints */}
                    {fSprints.length > 0 && (
                        <div>
                            <SectionHeader title="Sprints" count={fSprints.length} />
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 10 }}>
                                {fSprints.map((s: SprintResponseDto) => (
                                    <HierarchyCard
                                        key={s.id}
                                        icon={Zap}
                                        color={s.isActive ? C.green : C.orange}
                                        title={s.name}
                                        subtitle={`${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}`}
                                        progress={sprintPct(s)}
                                        badge={s.isActive ? "Active" : undefined}
                                        onClick={() => onSelect({ type: "sprint", id: s.id!, name: s.name })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* Sprint progress panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {activeSprint && (
                        <div style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                            <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Active Sprint</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{activeSprint.name}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                                <CalendarDays size={11} style={{ color: C.textFaint }} />
                                <span style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(activeSprint.startDate)} → {fmtDate(activeSprint.endDate)}</span>
                            </div>
                            <Bar pct={sprintPct2} color={C.accent} height={4} />
                            <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.text, marginTop: 8 }}>{sprintPct2}%</p>
                            <p style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>time elapsed</p>
                        </div>
                    )}
                    <DeadlinesPanel tasks={fTasks.filter((t: TaskResponseDto) => t.dueDate && t.status !== "DONE").slice(0, 5)} />
                </div>
            </div>
        </div>
    );
}

function ListOverview({ liste, tasks }: any) {
    const lt    = tasks.filter((t: TaskResponseDto) => t.listeId === liste.id);
    const done  = lt.filter((t: TaskResponseDto) => t.status === "DONE").length;
    const compPct = lt.length > 0 ? Math.round((done / lt.length) * 100) : 0;
    const byStatus: Record<string, TaskResponseDto[]> = {};
    lt.forEach((t: TaskResponseDto) => { byStatus[t.status] = [...(byStatus[t.status] || []), t]; });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 12 }}>
                <StatChip value={lt.length}     label="Total"       color={C.accent} icon={List} />
                <StatChip value={`${compPct}%`} label="Completion"  color={C.green}  icon={Target} />
                <StatChip value={done}          label="Done"        color={C.green}  icon={CheckCircle2} />
                <StatChip value={lt.length - done} label="Remaining" color={C.orange} icon={Clock} />
            </div>
            {/* Status breakdown */}
            <div style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 12 }}>By Status</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(STATUS_META).map(([key, meta]) => {
                        const count = byStatus[key]?.length || 0;
                        const pct   = lt.length > 0 ? Math.round((count / lt.length) * 100) : 0;
                        return (
                            <div key={key}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, color: meta.color, fontWeight: 500 }}>{meta.label}</span>
                                    <span style={{ fontSize: 11, color: C.textMuted }}>{count} ({pct}%)</span>
                                </div>
                                <Bar pct={pct} color={meta.color} height={4} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SprintOverview({ sprint, tasks }: any) {
    const st    = tasks.filter((t: TaskResponseDto) => t.sprintId === sprint.id);
    const done  = st.filter((t: TaskResponseDto) => t.status === "DONE").length;
    const pct   = sprintPct(sprint);
    const compPct = st.length > 0 ? Math.round((done / st.length) * 100) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 12 }}>
                <StatChip value={st.length}    label="Total Tasks"  color={C.accent} icon={List} />
                <StatChip value={`${compPct}%`} label="Tasks Done"  color={C.green}  icon={Target} />
                <StatChip value={`${pct}%`}    label="Time Elapsed" color={C.orange} icon={Clock} />
                <StatChip value={done}         label="Completed"    color={C.green}  icon={CheckCircle2} />
            </div>
            <div style={{ background: `linear-gradient(135deg, ${C.accent}10, ${C.green}08)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{sprint.name}</p>
                    {sprint.isActive && <Pill label="Active" color={C.green} bg="rgba(34,211,160,0.12)" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
                    <CalendarDays size={11} style={{ color: C.textFaint }} />
                    <span style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}</span>
                </div>
                <Bar pct={pct} color={C.accent} height={4} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: C.textFaint }}>Sprint progress</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>{pct}%</span>
                </div>
            </div>
        </div>
    );
}

// ─── Shared sub-panels ───────────────────────────────────────────────────────
function SectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Syne', sans-serif" }}>{title}</span>
                {count !== undefined && (
                    <span style={{ fontSize: 10, color: C.textFaint, background: "rgba(255,255,255,0.06)", borderRadius: 99, padding: "1px 7px", fontWeight: 600 }}>{count}</span>
                )}
            </div>
            {action}
        </div>
    );
}

function HierarchyCard({ icon: Icon, color, title, subtitle, progress, badge, onClick, compact }: any) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? C.surfaceEl : C.surface,
                border: `1px solid ${hov ? C.borderHov : C.border}`,
                borderRadius: 10, padding: compact ? "10px 12px" : "12px 14px",
                cursor: "pointer", transition: "all .15s",
                transform: hov ? "translateY(-1px)" : "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={12} style={{ color }} />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                    <p style={{ fontSize: 10, color: C.textFaint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
                </div>
                {badge && <Pill label={badge} color={C.green} bg="rgba(34,211,160,0.12)" />}
            </div>
            <Bar pct={progress ?? 0} color={color} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: C.textFaint, fontWeight: 600 }}>{progress ?? 0}%</span>
            </div>
        </div>
    );
}

function DeadlinesPanel({ tasks }: { tasks: TaskResponseDto[] }) {
    return (
        <div style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: ".7px" }}>Upcoming</p>
                {tasks.length > 0 && <Pill label={`${tasks.length}`} color={C.red} bg="rgba(244,63,94,0.12)" />}
            </div>
            {tasks.length === 0
                ? <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", padding: "10px 0" }}>No upcoming deadlines</p>
                : tasks.map((t: TaskResponseDto) => {
                    const pc = PRIORITY_COLOR[t.priority?.toLowerCase() ?? "medium"] ?? C.accent;
                    return (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: pc, flexShrink: 0 }} />
                            <p style={{ flex: 1, fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                            <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0 }}>{fmtDate(t.dueDate ?? undefined)}</span>
                        </div>
                    );
                })
            }
        </div>
    );
}

function ActivityPanel({ tasks }: { tasks: TaskResponseDto[] }) {
    const recent = [...tasks]
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
        .slice(0, 5);
    return (
        <div style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10 }}>Recent Activity</p>
            {recent.length === 0
                ? <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", padding: "10px 0" }}>No recent activity</p>
                : recent.map((t: TaskResponseDto) => {
                    const sm = STATUS_META[t.status] ?? STATUS_META.TO_DO;
                    return (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                            <Pill label={sm.label} color={sm.color} bg={sm.bg} />
                            <p style={{ flex: 1, fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        </div>
                    );
                })
            }
        </div>
    );
}

// ─── WORKSPACE / LIST FORM MODALS ─────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: "22px 24px", width: 380, maxWidth: "calc(100vw - 40px)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={14} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FieldInput({ label, value, onChange, placeholder, prefix }: any) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textFaint, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</label>
            <div style={{ position: "relative" }}>
                {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.textFaint }}>{prefix}</span>}
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: "100%", background: C.surfaceEl, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: `8px 12px 8px ${prefix ? 20 : 12}px`, fontSize: 12, color: C.text,
                        fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                        transition: "border-color .2s",
                    }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                />
            </div>
        </div>
    );
}

function WorkspaceFormModal({ mode, initialName = "", initialSlug = "", onSubmit, onClose }: any) {
    const [name, setName] = useState(initialName);
    const [slug, setSlug] = useState(initialSlug);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) { setErr("Name and slug are required."); return; }
        setBusy(true); setErr(null);
        try { await onSubmit(name.trim(), slug.trim()); onClose(); }
        catch (e: any) { setErr(e.message || "An error occurred."); }
        finally { setBusy(false); }
    };

    return (
        <Modal title={mode === "create" ? "New Workspace" : "Edit Workspace"} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <FieldInput label="Name" value={name} onChange={(v: string) => { setName(v); if (mode === "create") setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} placeholder="My Team" />
                <FieldInput label="Slug" value={slug} onChange={(v: string) => setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} placeholder="my-team" prefix="/" />
                {err && <p style={{ fontSize: 11, color: C.red, background: "rgba(244,63,94,0.08)", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>{err}</p>}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onClose} style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    <button type="submit" disabled={busy} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                        {busy ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
                        {mode === "create" ? "Create" : "Save"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DeleteModal({ name, onConfirm, onClose }: any) {
    const [busy, setBusy] = useState(false);
    const [err, setErr]   = useState<string | null>(null);
    const go = async () => { setBusy(true); setErr(null); try { await onConfirm(); onClose(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };
    return (
        <Modal title="Delete Workspace" onClose={onClose}>
            <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                Delete <strong style={{ color: C.text }}>"{name}"</strong>? This cannot be undone.
            </p>
            {err && <p style={{ fontSize: 11, color: C.red, background: "rgba(244,63,94,0.08)", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>{err}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{ background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button onClick={go} disabled={busy} style={{ background: C.red, border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
                    {busy ? "Deleting…" : "Delete"}
                </button>
            </div>
        </Modal>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function WorkspacePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoading, setIsLoading]   = useState(true);
    const [viewMode, setViewMode]     = useState<ViewMode>("overview");
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [teamWorkspaces, setTeamWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [spaces, setSpaces]   = useState<SpaceResponseDto[]>([]);
    const [folders, setFolders] = useState<FolderResponseDto[]>([]);
    const [sprints, setSprints] = useState<SprintResponseDto[]>([]);
    const [listes, setListes]   = useState<ListeResponseDto[]>([]);
    const [tasks, setTasks]     = useState<TaskResponseDto[]>([]);
    const [members, setMembers] = useState<WorkspaceMemberResponseDto[]>([]);
    const [selectedHierarchy, setSelectedHierarchy] = useState<SelectedHierarchy | null>(null);
    const [user, setUser] = useState({ name: "User", avatar: "US" });
    const [collapsed, setCollapsed] = useState(false);

    const [showCreateWs, setShowCreateWs]   = useState(false);
    const [editingWs, setEditingWs]         = useState<WorkspaceResponseDto | null>(null);
    const [deletingWs, setDeletingWs]       = useState<WorkspaceResponseDto | null>(null);
    const [showTaskForm, setShowTaskForm]   = useState(false);
    const [taskCreateDefaults, setTaskCreateDefaults] = useState<Partial<TaskRequestDto> | undefined>(undefined);
    const [editingTask, setEditingTask]     = useState<TaskResponseDto | null>(null);
    const [deletingTask, setDeletingTask]   = useState<TaskResponseDto | null>(null);
    const [showListForm, setShowListForm]   = useState(false);
    const [editingList, setEditingList]     = useState<ListeResponseDto | null>(null);
    const [deletingList, setDeletingList]   = useState<ListeResponseDto | null>(null);
    const [showInviteModal, setShowInviteModal]       = useState(false);
    const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

    // ── Filtered data by hierarchy ──
    const filteredTasks = (() => {
        if (!selectedHierarchy) return tasks;
        if (selectedHierarchy.type === "space") return tasks.filter(t => {
            const l = listes.find(li => li.id === t.listeId);
            const f = folders.find(fo => fo.id === l?.folderId);
            return f?.spaceId === selectedHierarchy.id;
        });
        if (selectedHierarchy.type === "folder") return tasks.filter(t => {
            const l = listes.find(li => li.id === t.listeId);
            return l?.folderId === selectedHierarchy.id;
        });
        if (selectedHierarchy.type === "list")   return tasks.filter(t => t.listeId === selectedHierarchy.id);
        if (selectedHierarchy.type === "sprint") return tasks.filter(t => t.sprintId === selectedHierarchy.id);
        return tasks;
    })();

    const filteredListes = (() => {
        if (!selectedHierarchy) return listes;
        if (selectedHierarchy.type === "space") return listes.filter(l => {
            const f = folders.find(fo => fo.id === l.folderId);
            return f?.spaceId === selectedHierarchy.id;
        });
        if (selectedHierarchy.type === "folder") return listes.filter(l => l.folderId === selectedHierarchy.id);
        if (selectedHierarchy.type === "list")   return listes.filter(l => l.id === selectedHierarchy.id);
        return listes;
    })();

    // ── User load ──
    useEffect(() => {
        try {
            const u = localStorage.getItem("user");
            if (u) {
                const p = JSON.parse(u);
                setUser({ name: p.firstName || "User", avatar: ((p.firstName?.[0] || "") + (p.lastName?.[0] || "")).toUpperCase() || "US" });
            }
        } catch { /* ignore */ }
    }, []);

    // ── Initial load ──
    useEffect(() => {
        (async () => {
            try {
                const wsData = await getWorkspacesByUser();
                setWorkspaces(wsData);

                const currentUserId = (() => {
                    try {
                        const raw = localStorage.getItem("user");
                        if (!raw) return "";
                        const parsed = JSON.parse(raw) as { id?: string };
                        return parsed.id ?? "";
                    } catch {
                        return "";
                    }
                })();

                let teamData: WorkspaceResponseDto[] = [];
                if (currentUserId) {
                    const memberships = await getWorkspaceMembershipsByUser(currentUserId).catch(() => [] as WorkspaceMemberResponseDto[]);
                    const ownedIds = new Set(wsData.map((w) => w.id));
                    const uniqueTeamIds = Array.from(new Set(memberships.map((m) => m.workspaceId).filter((id) => !ownedIds.has(id))));

                    const resolved = await Promise.all(
                        uniqueTeamIds.map((workspaceId) => getWorkspaceById(workspaceId).catch(() => null))
                    );
                    teamData = resolved.filter((w): w is WorkspaceResponseDto => Boolean(w));
                }

                setTeamWorkspaces(teamData);

                const allWorkspaces = [...wsData, ...teamData];
                if (allWorkspaces.length > 0) {
                    const saved = localStorage.getItem("activeWorkspaceId");
                    setActiveWorkspace(allWorkspaces.find(w => w.id === saved) ?? allWorkspaces[0]);
                }
            } catch { /* ignore */ } finally { setIsLoading(false); }
        })();
    }, []);

    useEffect(() => {
        if (activeWorkspace) { localStorage.setItem("activeWorkspaceId", activeWorkspace.id); setSelectedHierarchy(null); }
    }, [activeWorkspace]);

    // ── Reload dashboard data ──
    const reloadData = useCallback(async () => {
        if (!activeWorkspace) { setSpaces([]); setFolders([]); setSprints([]); setListes([]); setTasks([]); setMembers([]); return; }
        try {
            const [spacesData, membersData] = await Promise.all([
                getSpacesByWorkspace(activeWorkspace.id),
                getWorkspaceMembers(activeWorkspace.id).catch(() => [] as WorkspaceMemberResponseDto[]),
            ]);
            setSpaces(spacesData); setMembers(membersData);
            const foldersAll = (await Promise.all(spacesData.map(s => getFoldersBySpace(s.id)))).flat();
            setFolders(foldersAll);
            if (foldersAll.length > 0) {
                const [spRes, liRes] = await Promise.all([
                    Promise.all(foldersAll.map(async f => (await getSprintsByFolder(f.id!)).map(s => ({ ...s, folderId: f.id })))),
                    Promise.all(foldersAll.map(f => getListesByFolder(f.id!))),
                ]);
                const flatSp = spRes.flat(); const flatLi = liRes.flat();
                setSprints(flatSp); setListes(flatLi);
                const tasksAll = (await Promise.all(flatLi.map(l => getTasksByListe(l.id).catch(() => [] as TaskResponseDto[])))).flat();
                setTasks(tasksAll);
            } else { setSprints([]); setListes([]); setTasks([]); }
        } catch (e) { console.error(e); }
    }, [activeWorkspace]);
    useEffect(() => { reloadData(); }, [reloadData]);

    useEffect(() => {
        setViewMode("overview");
    }, [selectedHierarchy]);

    // ── Workspace CRUD ──
    const handleCreateWs = async (name: string, slug: string) => {
        const c = await createWorkspace({ name, slug }); setWorkspaces(p => [...p, c]); setActiveWorkspace(c);
    };
    const handleUpdateWs = async (name: string, slug: string) => {
        if (!editingWs) return;
        const u = await updateWorkspace(editingWs.id, { name, slug });
        setWorkspaces(p => p.map(w => w.id === u.id ? u : w));
        if (activeWorkspace?.id === u.id) setActiveWorkspace(u);
    };
    const handleDeleteWs = async () => {
        if (!deletingWs) return;
        await deleteWorkspace(deletingWs.id);
        const rem = workspaces.filter(w => w.id !== deletingWs.id);
        setWorkspaces(rem);
        if (activeWorkspace?.id === deletingWs.id) setActiveWorkspace(rem[0] ?? teamWorkspaces[0] ?? null);
    };

    // ── Task / List CRUD ──
    const handleTaskSubmit = async (data: TaskRequestDto) => {
        if (editingTask) { await updateTask(editingTask.id, data); setEditingTask(null); }
        else { await createTask(data); setShowTaskForm(false); setTaskCreateDefaults(undefined); }
        reloadData();
    };
    const handleListSubmit = async (data: ListeRequestDto) => {
        if (editingList) { await updateListe(editingList.id, data); setEditingList(null); }
        else { await createListe(data); setShowListForm(false); }
        reloadData();
    };
    const handleTaskDelete  = async (id: string) => { await deleteTask(id); setDeletingTask(null); reloadData(); };
    const handleListDelete  = async (id: string) => { await deleteListe(id); setDeletingList(null); setSelectedHierarchy(null); reloadData(); };
    const handleStatusChange = async (task: TaskResponseDto, status: TaskStatus) => {
        setTasks(p => p.map(t => t.id === task.id ? { ...t, status } : t));
        try { await updateTask(task.id, { ...task, status }); } catch { reloadData(); }
    };

    const openTaskCreateModal = async (defaults?: Partial<TaskRequestDto>) => {
        if (folders.length === 0) await reloadData();
        setTaskCreateDefaults(defaults);
        setShowTaskForm(true);
    };

    const handleRemoveMember = async (memberId: string) => {
        setDeletingMemberId(memberId);
        try {
            await removeMember(memberId);
            await reloadData();
        } catch (error) {
            console.error(error);
        } finally {
            setDeletingMemberId(null);
        }
    };

    // ── Sidebar Nav Items ──
    const navItems = [
        { icon: LayoutGrid, label: "Dashboard" },
        { icon: Sparkles, label: "Ask AI" },
        { icon: Bell, label: "Notifications" },
    ];

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
            };
        }
        return item;
    });

    // ── Title of current level ──
    const levelTitle = selectedHierarchy ? selectedHierarchy.name : (activeWorkspace?.name ?? "Workspace");
    const levelType  = selectedHierarchy?.type ?? "workspace";

    // ── Overview rendering ──
    const renderOverview = () => {
        if (!selectedHierarchy) return <WorkspaceOverview tasks={tasks} spaces={spaces} members={members} sprints={sprints} listes={listes} folders={folders} onSelect={setSelectedHierarchy} />;
        if (selectedHierarchy.type === "space")  return <SpaceOverview  space={selectedHierarchy}  folders={folders} listes={listes} tasks={tasks} sprints={sprints} onSelect={setSelectedHierarchy} />;
        if (selectedHierarchy.type === "folder") {
            const folder = folders.find(f => f.id === selectedHierarchy.id);
            return folder ? <FolderOverview folder={folder} listes={listes} tasks={tasks} sprints={sprints} onSelect={setSelectedHierarchy} /> : null;
        }
        if (selectedHierarchy.type === "list") {
            const liste = listes.find(l => l.id === selectedHierarchy.id);
            return liste ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <ListOverview liste={liste} tasks={tasks} />
                    <div style={{ background: C.surfaceEl, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Tasks in this List</h3>
                        </div>
                        <ListView
                            lists={[liste]}
                            tasks={filteredTasks}
                            onEditTask={setEditingTask}
                            onDeleteTask={setDeletingTask}
                            onEditList={setEditingList}
                            onDeleteList={setDeletingList}
                            onAddList={() => setShowListForm(true)}
                        />
                    </div>
                </div>
            ) : null;
        }
        if (selectedHierarchy.type === "sprint") {
            const sprint = sprints.find(s => s.id === selectedHierarchy.id);
            return sprint ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <SprintOverview sprint={sprint} tasks={tasks} />
                    <div style={{ background: C.surfaceEl, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Tasks in this Sprint</h3>
                        </div>
                        <ListView
                            lists={filteredListes}
                            tasks={filteredTasks}
                            onEditTask={setEditingTask}
                            onDeleteTask={setDeletingTask}
                            onEditList={setEditingList}
                            onDeleteList={setDeletingList}
                            onAddList={() => setShowListForm(true)}
                        />
                    </div>
                </div>
            ) : null;
        }
        return null;
    };

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
                            teamWorkspaces={teamWorkspaces}
                            activeWorkspace={activeWorkspace}
                            onSelect={setActiveWorkspace}
                            onCreateClick={() => setShowCreateWs(true)}
                            onEditClick={(ws) => setEditingWs(ws)}
                            onDeleteClick={(ws) => setDeletingWs(ws)}
                        />
                    }
                    resourcesPanel={
                        <WorkspaceResourcesPanel
                            workspaceId={activeWorkspace?.id}
                            onResourcesChange={reloadData}
                            selectedHierarchy={selectedHierarchy}
                            onSelectHierarchy={setSelectedHierarchy}
                        />
                    }
                    userName={user.name}
                    userAvatar={user.avatar}
                />
            )}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 5px; height: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .nav-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s, color 0.15s; color: rgba(255,255,255,0.42); font-size: 13px; font-weight: 400; white-space: nowrap; overflow: hidden; font-family: 'DM Sans', sans-serif; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.82); }
                .nav-item.active { background: rgba(108,99,255,0.15); color: #a89ef5; }
                .ws-selector { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.75); white-space: nowrap; overflow: hidden; font-family: 'DM Sans', sans-serif; }
                .ws-selector:hover { background: rgba(255,255,255,0.05); }
                .search-input { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 12px 6px 34px; font-size: 12px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; width: 220px; transition: border-color 0.2s, width 0.3s; }
                .search-input:focus { border-color: rgba(108,99,255,0.5); width: 280px; }
                .search-input::placeholder { color: rgba(255,255,255,0.22); }
                .icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
                .icon-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
            `}</style>

            <Content>
                <WorkspaceTopBar userName={user.name} userAvatar={user.avatar} onInvite={() => setShowInviteModal(true)} />
                <ViewTabs active={viewMode} onChange={setViewMode} />

                <main style={{ flex: 1, overflowY: "auto", padding: "0px 24px 40px", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
                    {isLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
                            <Loader2 size={24} style={{ color: C.accent, animation: "spin 1s linear infinite" }} />
                            <p style={{ fontSize: 12, color: C.textMuted }}>Loading…</p>
                        </div>
                    ) : (
                        <>
                            {/* Level header */}
                            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        {levelType === "workspace" && <Hash size={13} style={{ color: C.accent }} />}
                                        {levelType === "space"     && <Folder size={13} style={{ color: C.accent }} />}
                                        {levelType === "folder"    && <FolderOpen size={13} style={{ color: C.orange }} />}
                                        {levelType === "list"      && <List size={13} style={{ color: C.blue }} />}
                                        {levelType === "sprint"    && <Zap size={13} style={{ color: C.orange }} />}
                                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.1px", margin: 0 }}>{levelTitle}</h1>
                                    </div>
                                    <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>
                                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {(levelType === 'folder' || levelType === 'space' || levelType === 'workspace') && viewMode !== 'board' && viewMode !== 'members' && (
                                        <button
                                            onClick={async () => {
                                                if (folders.length === 0) await reloadData();
                                                setShowListForm(true);
                                            }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                background: "transparent", border: `1px solid ${C.border}`,
                                                borderRadius: 8, padding: "6px 12px", color: C.textMuted,
                                                fontSize: 12, fontWeight: 500, cursor: "pointer",
                                                fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = C.surfaceEl; e.currentTarget.style.color = C.text; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
                                        >
                                            <Plus size={13} /> List
                                        </button>
                                    )}
                                    {viewMode !== 'members' && (
                                    <button
                                        onClick={() => { void openTaskCreateModal(); }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            background: C.accent, border: "none",
                                            borderRadius: 8, padding: "6px 14px", color: "#fff",
                                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                                            fontFamily: "'DM Sans', sans-serif",
                                            boxShadow: `0 4px 12px ${C.accentGlow}`,
                                        }}
                                    >
                                        <Plus size={13} /> Task
                                    </button>
                                    )}
                                </div>
                            </div>

                            {viewMode === "overview" && renderOverview()}
                            {viewMode === "list" && (
                                <ListView
                                    lists={filteredListes}
                                    tasks={filteredTasks}
                                    onEditTask={setEditingTask}
                                    onDeleteTask={setDeletingTask}
                                    onEditList={setEditingList}
                                    onDeleteList={setDeletingList}
                                    onAddList={() => setShowListForm(true)}
                                />
                            )}
                            {viewMode === "board" && (
                                <BoardView
                                    tasks={filteredTasks}
                                    onEditTask={setEditingTask}
                                    onDeleteTask={setDeletingTask}
                                    onStatusChange={handleStatusChange}
                                    onAddTask={(status) => { void openTaskCreateModal({ status }); }}
                                />
                            )}
                            {viewMode === "members" && (
                                <MembersView
                                    members={members}
                                    onInvite={() => setShowInviteModal(true)}
                                    onRemoveMember={handleRemoveMember}
                                    deletingMemberId={deletingMemberId}
                                />
                            )}
                        </>
                    )}
                </main>
            </Content>

            {/* MODALS */}
            {showCreateWs && <WorkspaceFormModal mode="create" onSubmit={handleCreateWs} onClose={() => setShowCreateWs(false)} />}
            {editingWs    && <WorkspaceFormModal mode="edit" initialName={editingWs.name} initialSlug={editingWs.slug} onSubmit={handleUpdateWs} onClose={() => setEditingWs(null)} />}
            {deletingWs   && <DeleteModal name={deletingWs.name} onConfirm={handleDeleteWs} onClose={() => setDeletingWs(null)} />}

            {showTaskForm && <TaskAdd defaults={taskCreateDefaults} listes={listes.map(l => ({ value: l.id!, label: l.name }))} sprints={sprints.map(s => ({ value: s.id!, label: s.name }))} assignees={members.map(m => ({ value: m.userId, label: `${m.userName} (${m.userEmail})` }))} onSubmit={handleTaskSubmit} onClose={() => { setShowTaskForm(false); setTaskCreateDefaults(undefined); }} />}
            {editingTask  && <TaskUpdate taskId={editingTask.id} defaults={editingTask} listes={listes.map(l => ({ value: l.id!, label: l.name }))} sprints={sprints.map(s => ({ value: s.id!, label: s.name }))} assignees={members.map(m => ({ value: m.userId, label: `${m.userName} (${m.userEmail})` }))} onSubmit={handleTaskSubmit} onClose={() => setEditingTask(null)} />}
            {deletingTask && <TaskDelete task={deletingTask} onDelete={handleTaskDelete} onClose={() => setDeletingTask(null)} />}

            {showListForm && <ListeAdd folders={folders.map(f => ({ value: f.id!, label: f.name }))} sprints={sprints.map(s => ({ value: s.id!, label: s.name }))} onSubmit={handleListSubmit} onClose={() => setShowListForm(false)} />}
            {editingList  && <ListeUpdate listeId={editingList.id} defaults={editingList} folders={folders.map(f => ({ value: f.id!, label: f.name }))} sprints={sprints.map(s => ({ value: s.id!, label: s.name }))} onSubmit={handleListSubmit} onClose={() => setEditingList(null)} />}
            {deletingList && <ListeDelete liste={deletingList} onDelete={handleListDelete} onClose={() => setDeletingList(null)} />}

            {showInviteModal && activeWorkspace && (
                <InviteMemberForm workspaceId={activeWorkspace.id} onSubmit={() => { setShowInviteModal(false); reloadData(); }} onClose={() => setShowInviteModal(false)} />
            )}
        </Layout>
    );
}