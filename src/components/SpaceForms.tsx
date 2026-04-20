import { X, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SpaceRequestDto, SpaceResponseDto } from "../api/spaceApi";

export type { SpaceRequestDto, SpaceResponseDto };

interface SelectOption { value: string; label: string }

interface SpaceFormProps {
    onSubmit: (data: SpaceRequestDto) => Promise<void> | void;
    onClose: () => void;
    workspaces?: SelectOption[];
    defaults?: Partial<SpaceRequestDto>;
}

interface SpaceUpdateProps extends SpaceFormProps {
    spaceId: string;
}

interface SpaceDeleteProps {
    space: { id: string; name: string };
    onDelete: (id: string) => Promise<void> | void;
    onClose: () => void;
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
};

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(2px)",
    zIndex: 50,
};

const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 51,
    width: 440,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0d0d0f",
    border: "0.5px solid rgba(255,255,255,0.09)",
    borderRadius: 14,
    boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
    padding: "24px 24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
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
                    background: "#131316",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}>
                    {options.map(o => (
                        <button
                            type="button"
                            key={o.value}
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

// ─── Shared form body ─────────────────────────────────────────────────────────

function SpaceFormBody({
    name, setName,
    color, setColor,
    isPrivate, setIsPrivate,
    workspaceId, setWorkspaceId,
    workspaces,
    error,
}: {
    name: string; setName: (v: string) => void;
    color: string; setColor: (v: string) => void;
    isPrivate: boolean; setIsPrivate: (v: boolean) => void;
    workspaceId: string; setWorkspaceId: (v: string) => void;
    workspaces: SelectOption[];
    error: string | null;
}) {
    return (
        <>
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={labelStyle}>Space Name</label>
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g. Marketing, Development…"
                    style={{
                        ...inputStyle,
                        borderColor: error && !name.trim() ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.09)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                />
            </div>

            {/* Color */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={labelStyle}>Color Preference</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        style={{
                            width: 32, height: 32, border: "none", 
                            background: "none", cursor: "pointer", padding: 0
                        }}
                    />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                        {color.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Workspace & Privacy */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Workspace</label>
                    <Select options={workspaces} value={workspaceId} onChange={setWorkspaceId} placeholder="Select workspace…" />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={labelStyle}>Visibility</label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", height: "100%" }}>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            style={{
                                width: 16, height: 16, cursor: "pointer",
                                accentColor: "#534AB7"
                            }}
                        />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                            Private Space
                        </span>
                    </label>
                </div>
            </div>

            {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -6 }}>{error}</span>}
        </>
    );
}

// ─── SpaceAdd ─────────────────────────────────────────────────────────────────

export function SpaceAdd({ onSubmit, onClose, workspaces = [], defaults = {} }: SpaceFormProps) {
    const [name, setName]               = useState(defaults.name ?? "");
    const [color, setColor]             = useState(defaults.color ?? "#534AB7");
    const [isPrivate, setIsPrivate]     = useState(defaults.isPrivate ?? false);
    const [workspaceId, setWorkspaceId] = useState(defaults.workspaceId ?? "");
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required"); return; }
        if (!workspaceId) { setError("Workspace is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({ name: name.trim(), color, isPrivate, workspaceId });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <>
            <div onClick={onClose} style={overlayStyle} />
            <div style={modalStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>New Space</span>
                    <CloseButton onClose={onClose} />
                </div>

                <SpaceFormBody {...{ name, setName, color, setColor, isPrivate, setIsPrivate, workspaceId, setWorkspaceId, workspaces, error }} />

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create Space" loadingLabel="Creating…" submitColor="#534AB7" />
            </div>
        </>
    );
}

// ─── SpaceUpdate ──────────────────────────────────────────────────────────────

export function SpaceUpdate({ spaceId, onSubmit, onClose, workspaces = [], defaults = {} }: SpaceUpdateProps) {
    const [name, setName]               = useState(defaults.name ?? "");
    const [color, setColor]             = useState(defaults.color ?? "#534AB7");
    const [isPrivate, setIsPrivate]     = useState(defaults.isPrivate ?? false);
    const [workspaceId, setWorkspaceId] = useState(defaults.workspaceId ?? "");
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) { setError("Name is required"); return; }
        if (!workspaceId) { setError("Workspace is required"); return; }
        setError(null); setLoading(true);
        try {
            await onSubmit({ name: name.trim(), color, isPrivate, workspaceId });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <>
            <div onClick={onClose} style={overlayStyle} />
            <div style={modalStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}>Edit Space</span>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "monospace" }}>#{spaceId.slice(-8)}</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

                <SpaceFormBody {...{ name, setName, color, setColor, isPrivate, setIsPrivate, workspaceId, setWorkspaceId, workspaces, error }} />

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />
                <FormActions onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Save Changes" loadingLabel="Saving…" submitColor="#534AB7" />
            </div>
        </>
    );
}

// ─── SpaceDelete ──────────────────────────────────────────────────────────────

export function SpaceDelete({ space, onDelete, onClose }: SpaceDeleteProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setError(null); setLoading(true);
        try {
            await onDelete(space.id);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally { setLoading(false); }
    }

    return (
        <>
            <div onClick={onClose} style={overlayStyle} />
            <div style={{
                ...modalStyle,
                width: 400,
                gap: 20,
                padding: "28px 24px 22px",
            }}>
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
                        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600 }}>Delete Space</span>
                    </div>
                    <CloseButton onClose={onClose} />
                </div>

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
                            You are about to permanently delete <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>"{space.name}"</span>. All associated data will be removed.
                        </span>
                    </div>
                </div>

                {error && <span style={{ fontSize: 12, color: "#E24B4A", marginTop: -8 }}>{error}</span>}

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                        type="button"
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
                        type="button"
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
                        {loading ? "Deleting…" : "Delete Space"}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
    return (
        <button
            type="button"
            onClick={onClose}
            style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 6,
                color: "rgba(255,255,255,0.35)", transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
        >
            <X size={14} />
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
                type="button"
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
                type="button"
                onClick={onSubmit}
                disabled={loading}
                style={{
                    background: loading ? `${submitColor}99` : submitColor,
                    border: "0.5px solid rgba(168,158,245,0.5)",
                    borderRadius: 7, padding: "7px 18px",
                    fontSize: 12, fontWeight: 600,
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

export default SpaceAdd;
