import { X, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import type { ListeRequestDto, ListeResponseDto, ListType } from "../api/ListeApi";

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
                    background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)",
                    borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left", padding: "9px 10px 9px 12px",
                }}
            >
                <span style={{ color: selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)", fontSize: 13 }}>
                    {selected?.label ?? placeholder ?? "Select…"}
                </span>
                <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60,
                    background: "#131316", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    maxHeight: 180, overflowY: "auto"
                }}>
                    {options.map(o => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{
                                width: "100%", background: o.value === value ? "rgba(255,255,255,0.06)" : "none",
                                border: "none", padding: "9px 12px", textAlign: "left",
                                fontSize: 13, color: "rgba(255,255,255,0.75)", cursor: "pointer",
                                transition: "background 0.12s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = o.value === value ? "rgba(255,255,255,0.06)" : "none")}
                        >
                            {o.label}
                        </button>
                    ))}
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
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(2px)",
                    zIndex: 50,
                }}
            />

            {/* Modal */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 51,
                width: 420,
                background: "#0d0d0f",
                border: "0.5px solid rgba(255,255,255,0.09)",
                borderRadius: 14,
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                padding: "24px 24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
            }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>
                        New List
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 6,
                            color: "rgba(255,255,255,0.35)",
                            transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                        Name
                    </label>
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="e.g. Sprint 1, Backlog…"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `0.5px solid ${error && !name.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.09)"}`,
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                            Folder
                        </label>
                        <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder…" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                            Sprint
                        </label>
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

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "0.5px solid rgba(255,255,255,0.09)",
                            borderRadius: 7,
                            padding: "7px 16px",
                            fontSize: 12,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.45)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            background: loading ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
                            border: "0.5px solid rgba(255,255,255,0.14)",
                            borderRadius: 7,
                            padding: "7px 18px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: loading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)"; }}
                        onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
                    >
                        {loading ? "Creating…" : "Create List"}
                    </button>
                </div>
            </div>
        </>
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
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 50 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 51, width: 420, background: "#0d0d0f", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.7)", padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>Edit List</span>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "monospace" }}>#{listeId.slice(-8)}</span>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: "rgba(255,255,255,0.35)", transition: "background 0.15s, color 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}><X size={14} /></button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Name</label>
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="e.g. Sprint 1, Backlog…" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${error && !name.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.09)"}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "rgba(255,255,255,0.85)", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" }} onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")} />
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Folder</label>
                        <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder…" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Sprint</label>
                        <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select Sprint…" />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 }}>Order</label>
                    <input type="number" min={0} value={order} onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "rgba(255,255,255,0.85)", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" }} onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")} />
                </div>

                {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -8 }}>{error}</span>}
                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button onClick={onClose} style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ background: loading ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.14)", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 600, color: loading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s" }} onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)"; }} onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}>{loading ? "Saving…" : "Save Changes"}</button>
                </div>
            </div>
        </>
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
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 50 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 51, width: 400, gap: 20, padding: "28px 24px 22px", background: "#0d0d0f", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(226,75,74,0.12)", border: "0.5px solid rgba(226,75,74,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Trash2 size={15} style={{ color: "#E24B4A" }} />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600 }}>Delete List</span>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: "rgba(255,255,255,0.35)", transition: "background 0.15s, color 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}><X size={14} /></button>
                </div>

                <div style={{ background: "rgba(226,75,74,0.07)", border: "0.5px solid rgba(226,75,74,0.2)", borderRadius: 9, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertTriangle size={14} style={{ color: "#E24B4A", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>This action cannot be undone</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                            You are about to permanently delete <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>"{liste.name}"</span>. All associated tasks will be removed.
                        </span>
                    </div>
                </div>

                {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -8 }}>{error}</span>}
                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button onClick={onClose} style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}>Cancel</button>
                    <button onClick={handleDelete} disabled={loading} style={{ background: loading ? "rgba(226,75,74,0.3)" : "rgba(226,75,74,0.85)", border: "0.5px solid rgba(226,75,74,0.5)", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#E24B4A"; }} onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(226,75,74,0.85)"; }}><Trash2 size={12} />{loading ? "Deleting…" : "Delete List"}</button>
                </div>
            </div>
        </>
    );
}

export default ListeAdd;