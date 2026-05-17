import { X, Calendar, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import AskAIButton from "./AskAIButton";

// ─── Types ────────────────────────────────────────────────────────────────────

import type { TaskRequestDto, TaskResponseDto, TaskStatus, Priority } from "../api/taskApi";

export type { TaskRequestDto, TaskResponseDto };

interface SelectOption { value: string; label: string }

interface TaskFormProps {
    onSubmit: (data: TaskRequestDto) => Promise<void> | void;
    onClose: () => void;
    listes?: SelectOption[];
    sprints?: SelectOption[];
    assignees?: SelectOption[];
    defaults?: Partial<TaskRequestDto> & { spaceId?: string; folderId?: string };
    spaces?: any[];
    folders?: any[];
    rawListes?: any[];
}

interface TaskUpdateProps extends TaskFormProps {
    taskId: string;
}

interface TaskDeleteProps {
    task: { id: string; title: string };
    onDelete: (id: string) => Promise<void> | void;
    onClose: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
    { value: "TO_DO",     label: "To Do",     color: "#6B7280" },
    { value: "IN_DEV",    label: "In Dev",    color: "#3B82F6" },
    { value: "IN_TEST",   label: "In Test",   color: "#F59E0B" },
    { value: "IN_REVIEW", label: "In Review", color: "#A855F7" },
    { value: "DONE",      label: "Done",      color: "#22C55E" },
];

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
    { value: "URGENT", label: "Urgent", color: "#E24B4A", dot: "#E24B4A" },
    { value: "HIGH",   label: "High",   color: "#F97316", dot: "#F97316" },
    { value: "MEDIUM", label: "Medium", color: "#F59E0B", dot: "#F59E0B" },
    { value: "LOW",    label: "Low",    color: "var(--text-faint)", dot: "#6B7280" },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    color: "var(--text-main)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-faint)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 10,
    display: "block",
};

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    zIndex: 1300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 24,
    width: 520,
    maxWidth: "calc(100vw - 32px)",
    padding: "40px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    maxHeight: "90vh",
    overflowY: "auto",
};

// ─── Shared Select ────────────────────────────────────────────────────────────

function Select({ options, value, onChange, placeholder }: {
    options: SelectOption[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    ...inputStyle,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left",
                    borderColor: open ? "var(--accent)" : "var(--border)",
                }}
            >
                <span style={{ color: selected ? "var(--text-main)" : "var(--text-faint)" }}>
                    {selected?.label ?? placeholder ?? "Select…"}
                </span>
                <ChevronDown
                    size={18}
                    style={{
                        color: "var(--text-faint)",
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform 0.25s",
                    }}
                />
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 60,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {options.map(o => (
                            <button
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    width: "100%",
                                    background: o.value === value ? "var(--accent)" : "none",
                                    border: "none",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    fontSize: 14,
                                    color: o.value === value ? "#fff" : "var(--text-sub)",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "var(--bg-hover)"; }}
                                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "none"; }}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Shared form body ─────────────────────────────────────────────────────────

function TaskFormBody({
    title, setTitle,
    description, setDescription,
    status, setStatus,
    priority, setPriority,
    dueDate, setDueDate,
    listeId, setListeId,
    sprintId, setSprintId,
    assigneeId, setAssigneeId,
    assigneeIds = [], setAssigneeIds,
    listes, sprints, assignees,
    error,
    loading = false,
    spaceId = "",
    setSpaceId,
    folderId = "",
    setFolderId,
    spaces = [],
    folders = [],
    rawListes = []
}: {
    title: string; setTitle: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    status: TaskStatus; setStatus: (v: TaskStatus) => void;
    priority: Priority; setPriority: (v: Priority) => void;
    dueDate: string; setDueDate: (v: string) => void;
    listeId: string; setListeId: (v: string) => void;
    sprintId: string; setSprintId: (v: string) => void;
    assigneeId: string; setAssigneeId: (v: string) => void;
    assigneeIds?: string[]; setAssigneeIds?: (v: string[]) => void;
    listes: SelectOption[]; sprints: SelectOption[]; assignees: SelectOption[];
    error: string | null;
    loading?: boolean;
    spaceId?: string;
    setSpaceId?: (v: string) => void;
    folderId?: string;
    setFolderId?: (v: string) => void;
    spaces?: any[];
    folders?: any[];
    rawListes?: any[];
}) {
    const currentPriority = PRIORITIES.find(p => p.value === priority)!;
    const currentStatus   = STATUSES.find(s => s.value === status)!;

    const filteredFolders = (folders && spaceId)
        ? folders.filter((f: any) => f.spaceId === spaceId)
        : folders;

    const filteredListes = (rawListes && folderId)
        ? rawListes.filter((l: any) => l.folderId === folderId)
        : rawListes;

    const spaceOptions = (spaces || []).map((s: any) => ({ value: s.id!, label: s.spaceName ?? s.name ?? "Unnamed Space" }));
    const folderOptions = filteredFolders.map((f: any) => ({ value: f.id!, label: f.name ?? f.folderName ?? "Unnamed Folder" }));
    const listOptions = (rawListes && rawListes.length > 0)
        ? filteredListes.map((l: any) => ({ value: l.id!, label: l.name }))
        : listes;

    return (
        <>
            {/* Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>Title</label>
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Task title…"
                    style={{
                        ...inputStyle,
                        borderColor: error && !title.trim() ? "var(--error)" : "var(--border)",
                    }}
                    onFocus={e  => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e   => (e.target.style.borderColor = "var(--border)")}
                />
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                    <AskAIButton 
                        entityName={title} 
                        entityType="task" 
                        onGenerationComplete={(text) => setDescription(text)}
                        isLoading={loading}
                    />
                </div>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 90, lineHeight: 1.5, fontFamily: "inherit" }}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                />
            </div>

            {/* Status + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Status</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {STATUSES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setStatus(s.value)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: status === s.value ? "var(--accent-soft)" : "none",
                                    border: `0.5px solid ${status === s.value ? "var(--border-hov)" : "transparent"}`,
                                    borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all 0.13s",
                                }}
                                onMouseEnter={e => { if (status !== s.value) e.currentTarget.style.background = "var(--bg-hover)"; }}
                                onMouseLeave={e => { if (status !== s.value) e.currentTarget.style.background = "none"; }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: status === s.value ? "var(--text-main)" : "var(--text-faint)" }}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {PRIORITIES.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPriority(p.value)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: priority === p.value ? "var(--accent-soft)" : "none",
                                    border: `0.5px solid ${priority === p.value ? "var(--border-hov)" : "transparent"}`,
                                    borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all 0.13s",
                                }}
                                onMouseEnter={e => { if (priority !== p.value) e.currentTarget.style.background = "var(--bg-hover)"; }}
                                onMouseLeave={e => { if (priority !== p.value) e.currentTarget.style.background = "none"; }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: 2, background: p.dot, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: priority === p.value ? p.color : "var(--text-faint)" }}>
                                    {p.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, marginTop: -6 }}>
                <span style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 5,
                    background: "var(--bg-hover)",
                    border: "0.5px solid var(--border)",
                    color: currentStatus.color,
                }}>
                    {currentStatus.label}
                </span>
                <span style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 5,
                    background: "var(--bg-hover)",
                    border: "0.5px solid var(--border)",
                    color: currentPriority.color,
                }}>
                    {currentPriority.label}
                </span>
            </div>

            {/* Due Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>Due Date</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Calendar size={18} style={{ position: "absolute", left: 16, color: "var(--text-faint)", pointerEvents: "none" }} />
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 46, colorScheme: "inherit" }}
                        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                    />
                </div>
            </div>

            <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />

            {/* Space + Folder Selectors */}
            {spaceOptions.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={labelStyle}>Space</label>
                        <Select
                            options={spaceOptions}
                            value={spaceId}
                            onChange={v => {
                                if (setSpaceId) setSpaceId(v);
                                if (setFolderId) setFolderId("");
                                setListeId("");
                            }}
                            placeholder="Select space…"
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={labelStyle}>Folder</label>
                        <Select
                            options={folderOptions}
                            value={folderId}
                            onChange={v => {
                                if (setFolderId) setFolderId(v);
                                setListeId("");
                            }}
                            placeholder="Select folder…"
                        />
                    </div>
                </div>
            )}

            {/* List + Sprint */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>List</label>
                    <Select options={listOptions} value={listeId} onChange={setListeId} placeholder="Select list…" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Sprint</label>
                    <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select sprint…" />
                </div>
            </div>

            {/* Assignee */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={labelStyle}>Assignees</label>
                {setAssigneeIds ? (
                    <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                            {assigneeIds.map(id => {
                                const option = assignees.find(o => o.value === id);
                                return (
                                    <div key={id} style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        background: "var(--accent-soft)", border: "1px solid var(--border)",
                                        borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "var(--accent)"
                                    }}>
                                        <span>{option?.label ?? id}</span>
                                        <button type="button" onClick={() => setAssigneeIds(assigneeIds.filter(x => x !== id))} style={{
                                            background: "none", border: "none", color: "var(--text-faint)",
                                            cursor: "pointer", display: "flex", alignItems: "center", padding: 0
                                        }}><X size={14} /></button>
                                    </div>
                                );
                            })}
                            {assigneeIds.length === 0 && (
                                <span style={{ color: "var(--text-faint)", fontSize: 13 }}>No assignees selected</span>
                            )}
                        </div>
                        <Select
                            options={assignees.filter(o => !assigneeIds.includes(o.value))}
                            value=""
                            onChange={v => {
                                if (v && !assigneeIds.includes(v)) {
                                    setAssigneeIds([...assigneeIds, v]);
                                    setAssigneeId(v);
                                }
                            }}
                            placeholder="Add assignee…"
                        />
                    </>
                ) : (
                    <Select options={assignees} value={assigneeId} onChange={setAssigneeId} placeholder="Assign to…" />
                )}
            </div>

            {error && <span style={{ fontSize: 12, color: "var(--error)", marginTop: -6 }}>{error}</span>}
        </>
    );
}

// ─── TaskAdd ──────────────────────────────────────────────────────────────────

export function TaskAdd({ onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {}, spaces = [], folders = [], rawListes = [] }: TaskFormProps) {
    const [title,      setTitle]      = useState(defaults.title      ?? "");
    const [description,setDescription]= useState(defaults.description ?? "");
    const [status,     setStatus]     = useState<TaskStatus>((defaults.status   as TaskStatus) ?? "TO_DO");
    const [priority,   setPriority]   = useState<Priority> ((defaults.priority  as Priority)  ?? "MEDIUM");
    const [dueDate,    setDueDate]    = useState(defaults.dueDate    ?? "");
    const [spaceId,    setSpaceId]    = useState(defaults.spaceId    ?? "");
    const [folderId,   setFolderId]   = useState(defaults.folderId   ?? "");
    const [listeId,    setListeId]    = useState(defaults.listeId    ?? "");
    const [sprintId,   setSprintId]   = useState(defaults.sprintId   ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [assigneeIds, setAssigneeIds] = useState<string[]>(defaults.assigneeIds ?? (defaults.assigneeId ? [defaults.assigneeId] : []));
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    useEffect(() => {
        if (defaults.spaceId) setSpaceId(defaults.spaceId);
        if (defaults.folderId) setFolderId(defaults.folderId);
        if (defaults.listeId) {
            setListeId(defaults.listeId);
            const listObj = rawListes.find(l => l.id === defaults.listeId);
            if (listObj && listObj.folderId) {
                setFolderId(listObj.folderId);
                const folderObj = folders.find(f => f.id === listObj.folderId);
                if (folderObj && folderObj.spaceId) {
                    setSpaceId(folderObj.spaceId);
                }
            }
        } else if (defaults.folderId) {
            const folderObj = folders.find(f => f.id === defaults.folderId);
            if (folderObj && folderObj.spaceId) {
                setSpaceId(folderObj.spaceId);
            }
        }
    }, [defaults.spaceId, defaults.folderId, defaults.listeId, rawListes, folders]);

    async function handleSubmit() {
        if (!title.trim()) { setError("Title is required"); return; }
        if (!listeId)      { setError("List is required");  return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                status, priority,
                dueDate:    dueDate    ? new Date(dueDate).toISOString() : null,
                listeId,
                sprintId:   sprintId   || null,
                assigneeId: assigneeIds[0] || null,
                assigneeIds: assigneeIds.length > 0 ? assigneeIds : null,
            });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifySelf: "space-between", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-main)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>
                        New Task
                    </span>
                    <CloseButton onClose={onClose} />
                </div>

                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, assigneeIds, setAssigneeIds, listes, sprints, assignees, error, loading, spaceId, setSpaceId, folderId, setFolderId, spaces, folders, rawListes }} />

                <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create Task" loadingLabel="Creating…" />
            </div>
        </div>
    );
}

// ─── TaskUpdate ───────────────────────────────────────────────────────────────

export function TaskUpdate({ taskId, onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {}, spaces = [], folders = [], rawListes = [] }: TaskUpdateProps) {
    const [title,      setTitle]      = useState(defaults.title      ?? "");
    const [description,setDescription]= useState(defaults.description ?? "");
    const [status,     setStatus]     = useState<TaskStatus>((defaults.status   as TaskStatus) ?? "TO_DO");
    const [priority,   setPriority]   = useState<Priority> ((defaults.priority  as Priority)  ?? "MEDIUM");
    const [dueDate,    setDueDate]    = useState(defaults.dueDate    ?? "");
    const [spaceId,    setSpaceId]    = useState(defaults.spaceId    ?? "");
    const [folderId,   setFolderId]   = useState(defaults.folderId   ?? "");
    const [listeId,    setListeId]    = useState(defaults.listeId    ?? "");
    const [sprintId,   setSprintId]   = useState(defaults.sprintId   ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [assigneeIds, setAssigneeIds] = useState<string[]>(defaults.assigneeIds ?? (defaults.assigneeId ? [defaults.assigneeId] : []));
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    useEffect(() => {
        if (defaults.spaceId) setSpaceId(defaults.spaceId);
        if (defaults.folderId) setFolderId(defaults.folderId);
        if (defaults.listeId) {
            setListeId(defaults.listeId);
            const listObj = rawListes.find(l => l.id === defaults.listeId);
            if (listObj && listObj.folderId) {
                setFolderId(listObj.folderId);
                const folderObj = folders.find(f => f.id === listObj.folderId);
                if (folderObj && folderObj.spaceId) {
                    setSpaceId(folderObj.spaceId);
                }
            }
        } else if (defaults.folderId) {
            const folderObj = folders.find(f => f.id === defaults.folderId);
            if (folderObj && folderObj.spaceId) {
                setSpaceId(folderObj.spaceId);
            }
        }
    }, [defaults.spaceId, defaults.folderId, defaults.listeId, rawListes, folders]);

    async function handleSubmit() {
        if (!title.trim()) { setError("Title is required"); return; }
        if (!listeId)      { setError("List is required");  return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                status, priority,
                dueDate:    dueDate    ? new Date(dueDate).toISOString() : null,
                listeId,
                sprintId:   sprintId   || null,
                assigneeId: assigneeIds[0] || null,
                assigneeIds: assigneeIds.length > 0 ? assigneeIds : null,
            });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "var(--text-main)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>
                            Edit Task
                        </span>
                        <span style={{ color: "var(--text-faint)", fontSize: 12, fontFamily: "monospace" }}>
                            #{taskId.slice(-8)}
                        </span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, assigneeIds, setAssigneeIds, listes, sprints, assignees, error, loading, spaceId, setSpaceId, folderId, setFolderId, spaces, folders, rawListes }} />

                <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Save Changes" loadingLabel="Saving…" />
            </div>
        </div>
    );
}

// ─── TaskDelete ───────────────────────────────────────────────────────────────

export function TaskDelete({ task, onDelete, onClose }: TaskDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    async function handleDelete() {
        setError(null); setLoading(true);
        try {
            await onDelete(task.id);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width: 400, gap: 20, padding: "28px 24px 22px" }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "var(--error-soft)",
                            border: "0.5px solid var(--error)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            opacity: 0.6,
                        }}>
                            <Trash2 size={15} style={{ color: "var(--error)" }} />
                        </div>
                        <span style={{ color: "var(--text-main)", fontSize: 14, fontWeight: 600 }}>Delete Task</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                {/* Warning */}
                <div style={{
                    background: "var(--error-soft)",
                    border: "0.5px solid var(--error)",
                    borderRadius: 9,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    opacity: 0.85,
                }}>
                    <AlertTriangle size={14} style={{ color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>
                            This action cannot be undone
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.5 }}>
                            You are about to permanently delete{" "}
                            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>"{task.title}"</span>.
                            All associated data will be removed.
                        </span>
                    </div>
                </div>

                {error && <span style={{ fontSize: 12, color: "var(--error)", marginTop: -8 }}>{error}</span>}

                <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "0.5px solid var(--border)",
                            borderRadius: 7, padding: "7px 16px",
                            fontSize: 12, fontWeight: 500,
                            color: "var(--text-sub)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hov)"; e.currentTarget.style.color = "var(--text-main)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";     e.currentTarget.style.color = "var(--text-sub)";  }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        style={{
                            background: loading ? "var(--error-soft)" : "var(--error)",
                            border: "0.5px solid var(--error)",
                            borderRadius: 7, padding: "7px 18px",
                            fontSize: 12, fontWeight: 600,
                            color: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: 6,
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        <Trash2 size={12} />
                        {loading ? "Deleting…" : "Delete Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
    return (
        <button
            onClick={onClose}
            style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                color: "var(--text-faint)", transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-main)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none";            e.currentTarget.style.color = "var(--text-faint)"; }}
        >
            <X size={18} />
        </button>
    );
}

function FormActions({ onClose, onSubmit, loading, submitLabel, loadingLabel }: {
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
    submitLabel: string;
    loadingLabel: string;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "0.5px solid var(--border)",
                    borderRadius: 12, padding: "12px 20px",
                    fontSize: 14, fontWeight: 600,
                    color: "var(--text-sub)",
                    cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hov)"; e.currentTarget.style.color = "var(--text-main)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";     e.currentTarget.style.color = "var(--text-sub)";  }}
            >
                Cancel
            </button>
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    background: loading ? "var(--accent-soft)" : "var(--accent)",
                    border: "0.5px solid var(--accent)",
                    borderRadius: 12, padding: "12px 24px",
                    fontSize: 14, fontWeight: 700,
                    color: loading ? "var(--accent)" : "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? loadingLabel : submitLabel}
            </button>
        </div>
    );
}

// ─── Default export (backward compat) ────────────────────────────────────────

export default TaskAdd;