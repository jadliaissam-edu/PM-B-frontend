import { X, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
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
    { value: "PHASE", label: "Phase", description: "Project phase" },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

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

// ─── Shared Sub-components ────────────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
    return (
        <button
            onClick={onClose}
            style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                color: "rgba(255,255,255,0.35)", transition: "all 0.15s",
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
                onClick={onClose}
                style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "12px 24px", color: "rgba(255,255,255,0.6)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
            >
                Cancel
            </button>
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    background: loading ? `${submitColor}99` : submitColor,
                    border: "none", borderRadius: 12, padding: "12px 28px",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: `0 8px 24px ${submitColor}44`, transition: "all 0.2s",
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
                style={inputStyle}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: selected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)", fontSize: 14 }}>
                        {selected?.label ?? placeholder ?? "Select…"}
                    </span>
                    <ChevronDown size={18} style={{ color: "rgba(255,255,255,0.3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
                </div>
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 60,
                    background: "#16161a", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {options.map(o => (
                            <button
                                key={o.value}
                                type="button"
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


export function ListeAdd({ onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeFormProps) {
    const [name, setName] = useState(defaults.name || "");
    const [type, setType] = useState<ListType>(defaults.type || "SPRINT");
    const [order, setOrder] = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required"); return; }
        if (!folderId) { setError("Folder is required"); return; }
        setError(null);
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(),
                type,
                order,
                folderId: folderId || undefined,
                sprintId: sprintId || undefined
            });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>New List</span>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Organize tasks within a folder or sprint</span>
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
                            borderColor: error && !name.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.06)",
                        }}
                    />
                </div>

                {/* Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                        Type
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                        {LIST_TYPES.map(t => {
                            const selected = type === t.value;
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setType(t.value)}
                                    style={{
                                        background: selected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                                        border: `0.5px solid ${selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}`,
                                        borderRadius: 8,
                                        padding: "10px 8px",
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 3,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
                                        {t.label}
                                    </span>
                                    <span style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                                        {t.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Parent (Folder or Sprint) */}
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
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                        Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={order}
                        onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "0.5px solid rgba(255,255,255,0.09)",
                            borderRadius: 8,
                            padding: "9px 12px",
                            fontSize: 13,
                            color: "rgba(255,255,255,0.85)",
                            outline: "none",
                            width: "100%",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                        }}
                        onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                    />
                </div>

                {/* Error */}
                {error && (
                    <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -8 }}>{error}</span>
                )}

                {/* Divider */}
                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                <FormActions
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitLabel="Create List"
                    loadingLabel="Creating…"
                    submitColor="#534AB7"
                />
            </div>
        </div>
    );
}

export function ListeUpdate({ listeId, onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeUpdateProps) {
    const [name, setName] = useState(defaults.name || "");
    const [type, setType] = useState<ListType>(defaults.type || "SPRINT");
    const [order, setOrder] = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required"); return; }
        if (!folderId) { setError("Folder is required"); return; }
        setError(null);
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(),
                type,
                order,
                folderId: folderId || undefined,
                sprintId: sprintId || undefined
            });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>Edit List</span>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Update list settings and associations</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

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
                            borderColor: error && !name.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.06)",
                        }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                        {LIST_TYPES.map(t => {
                            const selected = type === t.value;
                            return (
                                <button key={t.value} onClick={() => setType(t.value)} style={{ background: selected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "10px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>{t.label}</span>
                                    <span style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{t.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

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

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Order</label>
                    <input type="number" min={0} value={order} onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "rgba(255,255,255,0.85)", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" }} onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")} />
                </div>

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                <FormActions
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitLabel="Save Changes"
                    loadingLabel="Saving…"
                    submitColor="#534AB7"
                />
            </div>
        </div>
    );
}

export function ListeDelete({ liste, onDelete, onClose }: ListeDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#E24B4A" }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Delete List</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
                        Are you sure you want to delete <span style={{ color: "#fff", fontWeight: 500 }}>"{liste.name}"</span>? This will also remove all tasks within this list.
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "0.5px solid rgba(255,255,255,0.09)",
                            borderRadius: 10, padding: "8px 20px",
                            fontSize: 13, fontWeight: 500,
                            color: "rgba(255,255,255,0.45)",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        style={{
                            background: "#E24B4A",
                            border: "none",
                            borderRadius: 10, padding: "8px 20px",
                            fontSize: 13, fontWeight: 600,
                            color: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: "0 8px 20px rgba(226,75,74,0.3)", transition: "all 0.2s",
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
