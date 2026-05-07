import { X, Calendar, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

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
    defaults?: Partial<TaskRequestDto>;
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
    { value: "TO_DO", label: "To Do", color: "#6B7280" },
    { value: "IN_DEV", label: "In Dev", color: "#3B82F6" },
    { value: "IN_TEST", label: "In Test", color: "#F59E0B" },
    { value: "IN_REVIEW", label: "In Review", color: "#A855F7" },
    { value: "DONE", label: "Done", color: "#22C55E" },
];

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
    { value: "URGENT", label: "Urgent", color: "#E24B4A", dot: "#E24B4A" },
    { value: "HIGH", label: "High", color: "#F97316", dot: "#F97316" },
    { value: "MEDIUM", label: "Medium", color: "#F59E0B", dot: "#F59E0B" },
    { value: "LOW", label: "Low", color: "rgba(255,255,255,0.35)", dot: "#6B7280" },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    color: "rgba(255,255,255,0.95)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 10,
    display: "block",
};

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(12px)",
    zIndex: 1300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
    background: "#111114",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    width: 520,
    maxWidth: "calc(100vw - 32px)",
    padding: "40px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.8)",
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
                }}
            >
                <span style={{ color: selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }}>
                    {selected?.label ?? placeholder ?? "Select…"}
                </span>
                <ChevronDown size={18} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 60,
                    background: "#16161a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {options.map(o => (
                            <button
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    width: "100%", background: o.value === value ? "rgba(83,74,183,0.8)" : "none",
                                    border: "none", padding: "12px 16px", textAlign: "left",
                                    fontSize: 14, color: o.value === value ? "#fff" : "rgba(255,255,255,0.75)", cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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

// ─── Shared form body (used by both Add and Update) ───────────────────────────

function TaskFormBody({
    title, setTitle,
    description, setDescription,
    status, setStatus,
    priority, setPriority,
    dueDate, setDueDate,
    listeId, setListeId,
    sprintId, setSprintId,
    assigneeId, setAssigneeId,
    listes, sprints, assignees,
    error,
}: {
    title: string; setTitle: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    status: TaskStatus; setStatus: (v: TaskStatus) => void;
    priority: Priority; setPriority: (v: Priority) => void;
    dueDate: string; setDueDate: (v: string) => void;
    listeId: string; setListeId: (v: string) => void;
    sprintId: string; setSprintId: (v: string) => void;
    assigneeId: string; setAssigneeId: (v: string) => void;
    listes: SelectOption[]; sprints: SelectOption[]; assignees: SelectOption[];
    error: string | null;
}) {
    const currentPriority = PRIORITIES.find(p => p.value === priority)!;
    const currentStatus = STATUSES.find(s => s.value === status)!;

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
                        borderColor: error && !title.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.06)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.06)")}
                />
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>Description</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 90, lineHeight: 1.5, fontFamily: "inherit" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.06)")}
                />
            </div>

            {/* Status + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Status</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {STATUSES.map(s => (
                            <button key={s.value} onClick={() => setStatus(s.value)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: status === s.value ? "rgba(255,255,255,0.06)" : "none",
                                border: `0.5px solid ${status === s.value ? "rgba(255,255,255,0.12)" : "transparent"}`,
                                borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all 0.13s",
                            }}
                                onMouseEnter={e => { if (status !== s.value) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                onMouseLeave={e => { if (status !== s.value) e.currentTarget.style.background = "none"; }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: status === s.value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {PRIORITIES.map(p => (
                            <button key={p.value} onClick={() => setPriority(p.value)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: priority === p.value ? "rgba(255,255,255,0.06)" : "none",
                                border: `0.5px solid ${priority === p.value ? "rgba(255,255,255,0.12)" : "transparent"}`,
                                borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all 0.13s",
                            }}
                                onMouseEnter={e => { if (priority !== p.value) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                onMouseLeave={e => { if (priority !== p.value) e.currentTarget.style.background = "none"; }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: 2, background: p.dot, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: priority === p.value ? p.color : "rgba(255,255,255,0.4)" }}>{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, marginTop: -6 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.09)", color: currentStatus.color }}>{currentStatus.label}</span>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.09)", color: currentPriority.color }}>{currentPriority.label}</span>
            </div>

            {/* Due Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>Due Date</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Calendar size={18} style={{ position: "absolute", left: 16, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 46, colorScheme: "dark" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.06)")}
                    />
                </div>
            </div>

            <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

            {/* List + Sprint */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>List</label>
                    <Select options={listes} value={listeId} onChange={setListeId} placeholder="Select list…" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Sprint</label>
                    <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select sprint…" />
                </div>
            </div>

            {/* Assignee */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={labelStyle}>Assignee</label>
                <Select options={assignees} value={assigneeId} onChange={setAssigneeId} placeholder="Assign to…" />
            </div>

            {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -6 }}>{error}</span>}
        </>
    );
}

// ─── TaskAdd ──────────────────────────────────────────────────────────────────

export function TaskAdd({ onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {} }: TaskFormProps) {
    const [title, setTitle] = useState(defaults.title ?? "");
    const [description, setDescription] = useState(defaults.description ?? "");
    const [status, setStatus] = useState<TaskStatus>((defaults.status as TaskStatus) ?? "TO_DO");
    const [priority, setPriority] = useState<Priority>((defaults.priority as Priority) ?? "MEDIUM");
    const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
    const [listeId, setListeId] = useState(defaults.listeId ?? "");
    const [sprintId, setSprintId] = useState(defaults.sprintId ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!title.trim()) { setError("Title is required"); return; }
        if (!listeId) { setError("List is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                listeId,
                sprintId: sprintId || null,
                assigneeId: assigneeId || null
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
                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>New Task</span>
                    <CloseButton onClose={onClose} />
                </div>

                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, listes, sprints, assignees, error }} />

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create Task" loadingLabel="Creating…" submitColor="#534AB7" />
            </div>
        </div>
    );
}

// ─── TaskUpdate ───────────────────────────────────────────────────────────────

export function TaskUpdate({ taskId, onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {} }: TaskUpdateProps) {
    const [title, setTitle] = useState(defaults.title ?? "");
    const [description, setDescription] = useState(defaults.description ?? "");
    const [status, setStatus] = useState<TaskStatus>((defaults.status as TaskStatus) ?? "TO_DO");
    const [priority, setPriority] = useState<Priority>((defaults.priority as Priority) ?? "MEDIUM");
    const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
    const [listeId, setListeId] = useState(defaults.listeId ?? "");
    const [sprintId, setSprintId] = useState(defaults.sprintId ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!title.trim()) { setError("Title is required"); return; }
        if (!listeId) { setError("List is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                listeId,
                sprintId: sprintId || null,
                assigneeId: assigneeId || null
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
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>Edit Task</span>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "monospace" }}>#{taskId.slice(-8)}</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, listes, sprints, assignees, error }} />

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Save Changes" loadingLabel="Saving…" submitColor="#534AB7" />
            </div>
        </div>
    );
}

// ─── TaskDelete ───────────────────────────────────────────────────────────────

export function TaskDelete({ task, onDelete, onClose }: TaskDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            <div style={{
                ...modalStyle,
                width: 400,
                gap: 20,
                padding: "28px 24px 22px",
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "rgba(226,75,74,0.12)",
                            border: "0.5px solid rgba(226,75,74,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Trash2 size={15} style={{ color: "#E24B4A" }} />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600 }}>Delete Task</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                {/* Warning */}
                <div style={{
                    background: "rgba(226,75,74,0.07)",
                    border: "0.5px solid rgba(226,75,74,0.2)",
                    borderRadius: 9,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                }}>
                    <AlertTriangle size={14} style={{ color: "#E24B4A", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>This action cannot be undone</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                            You are about to permanently delete{" "}
                            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>"{task.title}"</span>.
                            All associated data will be removed.
                        </span>
                    </div>
                </div>

                {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -8 }}>{error}</span>}

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "0.5px solid rgba(255,255,255,0.09)",
                            borderRadius: 7, padding: "7px 16px",
                            fontSize: 12, fontWeight: 500,
                            color: "rgba(255,255,255,0.45)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        style={{
                            background: loading ? "rgba(226,75,74,0.3)" : "rgba(226,75,74,0.85)",
                            border: "0.5px solid rgba(226,75,74,0.5)",
                            borderRadius: 7, padding: "7px 18px",
                            fontSize: 12, fontWeight: 600,
                            color: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: 6,
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#E24B4A"; }}
                        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "rgba(226,75,74,0.85)"; }}
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
                color: "rgba(255,255,255,0.35)", transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
        >
            <X size={18} />
        </button>
    );
}

function FormActions({ onClose, onSubmit, loading, submitLabel, loadingLabel, submitColor }: {
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
    submitLabel: string;
    loadingLabel: string;
    submitColor: string;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "0.5px solid rgba(255,255,255,0.09)",
                    borderRadius: 12, padding: "12px 20px",
                    fontSize: 14, fontWeight: 600,
                    color: "rgba(255,255,255,0.45)",
                    cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
                Cancel
            </button>
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    background: loading ? `${submitColor}99` : submitColor,
                    border: "0.5px solid rgba(168,158,245,0.5)",
                    borderRadius: 12, padding: "12px 24px",
                    fontSize: 14, fontWeight: 700,
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                }}
            >
                {loading ? loadingLabel : submitLabel}
            </button>
        </div>
    );
}

// ─── Default export (backward compat) ────────────────────────────────────────

export default TaskAdd;