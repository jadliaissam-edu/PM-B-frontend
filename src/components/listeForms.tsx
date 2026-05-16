import { X, ChevronDown, AlertTriangle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import type { ListeRequestDto, ListeResponseDto, ListType } from "../api/listeApi";

export type { ListeRequestDto, ListeResponseDto };

interface SelectOption { value: string; label: string }

interface ListeFormProps {
    onSubmit: (data: ListeRequestDto) => Promise<void> | void;
    onClose: () => void;
    defaultOrder?: number;
    folders?: SelectOption[];
    sprints?: SelectOption[];
    defaults?: Partial<ListeRequestDto>;
}

interface ListeUpdateProps extends ListeFormProps {
    listeId: string;
}

interface ListeDeleteProps {
    liste: { id: string; name: string };
    onDelete: (id: string) => Promise<void> | void;
    onClose: () => void;
}

const LIST_TYPES: { value: ListType; label: string; description: string }[] = [
    { value: "SPRINT", label: "Sprint", description: "Sprint tasks" },
    { value: "PHASE",  label: "Phase",  description: "Project phase" },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

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

// ─── Shared Sub-components ────────────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
    return (
        <button
            onClick={onClose}
            style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                color: "var(--text-faint)", transition: "all 0.15s",
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 12, padding: "12px 24px",
                    color: "var(--text-sub)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hov)"; e.currentTarget.style.color = "var(--text-main)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";     e.currentTarget.style.color = "var(--text-sub)"; }}
            >
                Cancel
            </button>
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    background: loading ? "var(--accent-soft)" : "var(--accent)",
                    border: "none", borderRadius: 12, padding: "12px 28px",
                    color: loading ? "var(--accent)" : "#fff",
                    fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? loadingLabel : submitLabel}
            </button>
        </div>
    );
}

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
                <span style={{ color: selected ? "var(--text-main)" : "var(--text-faint)", fontSize: 15 }}>
                    {selected?.label ?? placeholder ?? "Select…"}
                </span>
                <ChevronDown
                    size={18}
                    style={{
                        color: "var(--text-faint)",
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform 0.25s",
                        flexShrink: 0,
                    }}
                />
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 60,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {options.map(o => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    width: "100%",
                                    background: o.value === value ? "var(--accent)" : "none",
                                    border: "none", padding: "12px 16px", textAlign: "left",
                                    fontSize: 14,
                                    color: o.value === value ? "#fff" : "var(--text-sub)",
                                    cursor: "pointer", transition: "all 0.15s",
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

// ─── Type Selector (shared) ───────────────────────────────────────────────────

function TypeSelector({ type, setType }: { type: ListType; setType: (v: ListType) => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {LIST_TYPES.map(t => {
                    const selected = type === t.value;
                    return (
                        <button
                            key={t.value}
                            onClick={() => setType(t.value)}
                            style={{
                                background: selected ? "var(--accent-soft)" : "var(--bg-hover)",
                                border: `0.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: 8,
                                padding: "10px 8px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 3,
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border-hov)"; }}
                            onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                            <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "var(--accent)" : "var(--text-sub)" }}>
                                {t.label}
                            </span>
                            <span style={{ fontSize: 10, color: selected ? "var(--accent)" : "var(--text-faint)", opacity: selected ? 0.8 : 1 }}>
                                {t.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── ListeAdd ─────────────────────────────────────────────────────────────────

export function ListeAdd({ onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeFormProps) {
    const [name,     setName]     = useState(defaults.name     || "");
    const [type,     setType]     = useState<ListType>(defaults.type || "SPRINT");
    const [order,    setOrder]    = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required");   return; }
        if (!folderId)    { setError("Folder is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({ name: name.trim(), type, order, folderId: folderId || undefined, sprintId: sprintId || undefined });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "var(--text-main)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>New List</span>
                        <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Organize tasks within a folder or sprint</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={labelStyle}>Name</label>
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="e.g. Sprint 1, Backlog…"
                        style={{
                            ...inputStyle,
                            borderColor: error && !name.trim() ? "var(--error)" : "var(--border)",
                        }}
                        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={e  => (e.target.style.borderColor = error && !name.trim() ? "var(--error)" : "var(--border)")}
                    />
                </div>

                {/* Type */}
                <TypeSelector type={type} setType={setType} />

                {/* Folder + Sprint */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Folder</label>
                        <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder…" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint</label>
                        <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select Sprint…" />
                    </div>
                </div>

                {/* Order */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Order</label>
                    <input
                        type="number"
                        min={0}
                        value={order}
                        onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                    />
                </div>

                {error && <span style={{ fontSize: 12, color: "var(--error)", marginTop: -8 }}>{error}</span>}

                <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />

                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create List" loadingLabel="Creating…" />
            </div>
        </div>
    );
}

// ─── ListeUpdate ──────────────────────────────────────────────────────────────

export function ListeUpdate({ onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeUpdateProps) {
    const [name,     setName]     = useState(defaults.name     || "");
    const [type,     setType]     = useState<ListType>(defaults.type || "SPRINT");
    const [order,    setOrder]    = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required");   return; }
        if (!folderId)    { setError("Folder is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({ name: name.trim(), type, order, folderId: folderId || undefined, sprintId: sprintId || undefined });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "var(--text-main)", fontSize: 16, fontWeight: 700, letterSpacing: 0.1 }}>Edit List</span>
                        <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Update list settings and associations</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={labelStyle}>Name</label>
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="e.g. Sprint 1, Backlog…"
                        style={{
                            ...inputStyle,
                            borderColor: error && !name.trim() ? "var(--error)" : "var(--border)",
                        }}
                        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={e  => (e.target.style.borderColor = error && !name.trim() ? "var(--error)" : "var(--border)")}
                    />
                </div>

                {/* Type */}
                <TypeSelector type={type} setType={setType} />

                {/* Folder + Sprint */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Folder</label>
                        <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder…" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Sprint</label>
                        <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select Sprint…" />
                    </div>
                </div>

                {/* Order */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Order</label>
                    <input
                        type="number"
                        min={0}
                        value={order}
                        onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                    />
                </div>

                {error && <span style={{ fontSize: 12, color: "var(--error)", marginTop: -8 }}>{error}</span>}

                <div style={{ height: "0.5px", background: "var(--border)", margin: "0 -24px" }} />

                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Save Changes" loadingLabel="Saving…" />
            </div>
        </div>
    );
}

// ─── ListeDelete ──────────────────────────────────────────────────────────────

export function ListeDelete({ liste, onDelete, onClose }: ListeDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    async function handleDelete() {
        setError(null); setLoading(true);
        try {
            await onDelete(liste.id);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width: 420, padding: 32 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--error)" }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Delete List</span>
                    </div>
                    <p style={{ color: "var(--text-sub)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                        Are you sure you want to delete{" "}
                        <span style={{ color: "var(--text-main)", fontWeight: 500 }}>"{liste.name}"</span>?
                        This will also remove all tasks within this list.
                    </p>
                    {error && <p style={{ color: "var(--error)", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "0.5px solid var(--border)",
                            borderRadius: 10, padding: "8px 20px",
                            fontSize: 13, fontWeight: 500,
                            color: "var(--text-sub)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hov)"; e.currentTarget.style.color = "var(--text-main)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";     e.currentTarget.style.color = "var(--text-sub)"; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        style={{
                            background: loading ? "var(--error-soft)" : "var(--error)",
                            border: "0.5px solid var(--error)",
                            borderRadius: 10, padding: "8px 20px",
                            fontSize: 13, fontWeight: 600,
                            color: loading ? "var(--error)" : "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Deleting…" : "Delete List"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ListeAdd;