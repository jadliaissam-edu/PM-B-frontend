import { X, Trash2, Calendar, Target, ChevronDown, Rocket } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SprintRequestDto, SprintResponseDto } from "../api/sprintApi";

export type { SprintRequestDto, SprintResponseDto };

interface SelectOption { value: string; label: string }

interface SprintFormProps {
    onSubmit: (data: SprintRequestDto) => Promise<void> | void;
    onClose: () => void;
    folders: SelectOption[];
    defaults?: Partial<SprintRequestDto>;
}

const theme = {
    primary: "#534AB7",
    destructive: "#E24B4A",
    textMain: "rgba(255,255,255,0.95)",
    textMuted: "rgba(255,255,255,0.45)",
    bgModal: "#111114",
    border: "rgba(255,255,255,0.06)",
    inputBg: "rgba(255,255,255,0.03)",
};

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(12px)",
    zIndex: 1300,
    display: "flex", alignItems: "center", justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
    background: theme.bgModal,
    border: `1px solid ${theme.border}`,
    borderRadius: 24,
    width: 500,
    maxWidth: "calc(100vw - 32px)",
    padding: "40px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.8)",
    display: "flex", flexDirection: "column", gap: 32,
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
};

const inputStyle: React.CSSProperties = {
    background: theme.inputBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    color: theme.textMain,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: theme.textMuted,
    marginBottom: 10,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
};

function Select({ options, value, onChange, label }: {
    options: SelectOption[];
    value: string;
    onChange: (v: string) => void;
    label: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <label style={labelStyle}>{label}</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    ...inputStyle,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", borderColor: open ? theme.primary : theme.border
                }}
            >
                <span style={{ color: selected ? theme.textMain : theme.textMuted }}>{selected ? selected.label : "Select parent folder"}</span>
                <ChevronDown size={18} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
            </button>
            {open && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8,
                    background: "#16161a", border: `1px solid ${theme.border}`,
                    borderRadius: 16, zIndex: 100, overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}>
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {options.map(o => (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    padding: "12px 16px", fontSize: 14, cursor: "pointer",
                                    color: o.value === value ? "#fff" : "rgba(255,255,255,0.7)",
                                    background: o.value === value ? theme.primary : "transparent"
                                }}
                            >
                                {o.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SprintAdd({ onSubmit, onClose, folders, defaults }: SprintFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [goal, setGoal] = useState(defaults?.goal || "");
    const [folderId, setFolderId] = useState(defaults?.folderId || "");
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(defaults?.startDate?.split('T')[0] || today);
    const [endDate, setEndDate] = useState(defaults?.endDate?.split('T')[0] || today);
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId && startDate && endDate && new Date(startDate) <= new Date(endDate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({ 
                name: name.trim(), 
                goal: goal.trim(), 
                startDate: `${startDate}T00:00:00`, 
                endDate: `${endDate}T23:59:59`, 
                folderId, 
                isActive: true 
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", padding: 8, borderRadius: "50%" }}><X size={20} /></button>

                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>New Sprint</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
                        Sprints help your team focus on a set of tasks to deliver within a specific timeframe.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint Name</label>
                        <input
                            autoFocus
                            style={inputStyle}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Sprint 1, Q2 Launch"
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint Goal</label>
                        <div style={{ position: "relative" }}>
                            <Target size={18} style={{ position: "absolute", top: 16, left: 18, color: theme.textMuted }} />
                            <textarea
                                style={{ ...inputStyle, paddingLeft: 48, minHeight: 80, resize: "none" }}
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                placeholder="What's the main objective of this sprint?"
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 20 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Start Date</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>End Date</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <Select label="Parent Folder" options={folders} value={folderId} onChange={setFolderId} />

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button 
                            type="submit"
                            disabled={loading || !isValid}
                            style={{
                                flex: 1, padding: "18px", borderRadius: 16, border: "none",
                                background: theme.primary, color: "#fff", fontWeight: 800, fontSize: 16,
                                cursor: (loading || !isValid) ? "not-allowed" : "pointer",
                                opacity: (loading || !isValid) ? 0.6 : 1,
                                boxShadow: `0 12px 32px ${theme.primary}44`
                            }}
                        >
                            {loading ? "Creating..." : "Create Sprint"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function SprintUpdate({ sprintId, onSubmit, onClose, folders, defaults }: SprintFormProps & { sprintId: string }) {
    const today = new Date().toISOString().split('T')[0];
    const [name, setName] = useState(defaults?.name || "");
    const [goal, setGoal] = useState(defaults?.goal || "");
    const [folderId, setFolderId] = useState(defaults?.folderId || "");
    const [startDate, setStartDate] = useState(defaults?.startDate?.split('T')[0] || today);
    const [endDate, setEndDate] = useState(defaults?.endDate?.split('T')[0] || today);
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId && startDate && endDate && new Date(startDate) <= new Date(endDate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({ 
                name: name.trim(), 
                goal: goal.trim(), 
                startDate: startDate.includes('T') ? startDate : `${startDate}T00:00:00`, 
                endDate: endDate.includes('T') ? endDate : `${endDate}T23:59:59`, 
                folderId, 
                isActive: defaults?.isActive ?? true 
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", padding: 8, borderRadius: "50%" }}><X size={20} /></button>

                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Edit Sprint</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted }}>Update sprint details, goals, or timeframes.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint Name</label>
                        <input
                            autoFocus
                            style={inputStyle}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint Goal</label>
                        <div style={{ position: "relative" }}>
                            <Target size={18} style={{ position: "absolute", top: 16, left: 18, color: theme.textMuted }} />
                            <textarea
                                style={{ ...inputStyle, paddingLeft: 48, minHeight: 80, resize: "none" }}
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 20 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Start Date</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>End Date</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <Select label="Parent Folder" options={folders} value={folderId} onChange={setFolderId} />

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button 
                            type="submit"
                            disabled={loading || !isValid}
                            style={{
                                flex: 1, padding: "18px", borderRadius: 16, border: "none",
                                background: theme.primary, color: "#fff", fontWeight: 800, fontSize: 16,
                                cursor: (loading || !isValid) ? "not-allowed" : "pointer",
                                opacity: (loading || !isValid) ? 0.6 : 1,
                                boxShadow: `0 12px 32px ${theme.primary}44`
                            }}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function SprintDelete({ sprint, onDelete, onClose }: { sprint: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width: 420 }} onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 24, background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={28} style={{ color: theme.destructive }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Delete Sprint</h3>
                        <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                            Permanently delete <strong style={{ color: "white" }}>{sprint.name}</strong>? This will remove all associated lists and tasks. This action is irreversible.
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "16px", borderRadius: 16, border: `1px solid ${theme.border}`, background: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try { await onDelete(sprint.id); onClose(); } finally { setLoading(false); }
                        }}
                        disabled={loading}
                        style={{
                            flex: 1.2, padding: "16px", borderRadius: 16, border: "none",
                            background: theme.destructive, color: "#fff", fontWeight: 800,
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        {loading ? "Deleting..." : "Confirm Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}
