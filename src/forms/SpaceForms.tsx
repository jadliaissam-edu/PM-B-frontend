import { X, Trash2, Shield, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SpaceRequestDto, SpaceResponseDto } from "../api/spaceApi";

export type { SpaceRequestDto, SpaceResponseDto };

interface SelectOption { value: string; label: string }

interface SpaceFormProps {
    onSubmit: (data: SpaceRequestDto) => Promise<void> | void;
    onClose: () => void;
    workspaces: SelectOption[];
    defaults?: Partial<SpaceRequestDto>;
}

const theme = {
    primary: "#534AB7",
    primaryLight: "rgba(83,74,183,0.1)",
    destructive: "#E24B4A",
    textMain: "rgba(255,255,255,0.95)",
    textMuted: "rgba(255,255,255,0.45)",
    bgModal: "#111114",
    border: "rgba(255,255,255,0.06)",
    inputBg: "rgba(255,255,255,0.03)",
    inputFocus: "rgba(83,74,183,0.25)",
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
    background: theme.bgModal,
    border: `1px solid ${theme.border}`,
    borderRadius: 24,
    width: 520,
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    padding: "40px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
    gap: 32,
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

const colorOptions = [
    "#534AB7", "#7C3AED", "#DB2777", "#E11D48", 
    "#EA580C", "#D97706", "#65A30D", "#0891B2"
];


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
                    cursor: "pointer",
                    background: open ? "rgba(255,255,255,0.05)" : theme.inputBg,
                    borderColor: open ? theme.primary : theme.border
                }}
            >
                <span style={{ color: selected ? theme.textMain : theme.textMuted }}>{selected ? selected.label : "Select workspace"}</span>
                <ChevronDown size={18} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
            </button>
            {open && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8,
                    background: "#16161a", border: `1px solid ${theme.border}`,
                    borderRadius: 16, zIndex: 100, overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                    animation: "slideDown 0.2s cubic-bezier(0,0,0.2,1)"
                }}>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {options.map(o => (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    padding: "12px 16px", fontSize: 14, cursor: "pointer",
                                    color: o.value === value ? "#fff" : "rgba(255,255,255,0.75)",
                                    background: o.value === value ? theme.primary : "transparent",
                                    transition: "all 0.15s"
                                }}
                                onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
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

export function SpaceAdd({ onSubmit, onClose, workspaces, defaults }: SpaceFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [color, setColor] = useState(defaults?.color || colorOptions[0]);
    const [isPrivate, setIsPrivate] = useState(defaults?.isPrivate || false);
    const [workspaceId, setWorkspaceId] = useState(defaults?.workspaceId || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), color, isPrivate, workspaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <X size={20} />
                </button>

                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Create a Space</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
                        A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Space name</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ 
                                width: 52, height: 52, borderRadius: 14, background: color, 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                color: "#fff", flexShrink: 0, boxShadow: `0 8px 20px ${color}33`,
                                border: "2px solid rgba(255,255,255,0.1)",
                                fontSize: 20, fontWeight: 800
                            }}>
                                {name.charAt(0).toUpperCase() || "S"}
                            </div>
                            <input
                                autoFocus
                                style={inputStyle}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Marketing, Engineering, HR"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 90, resize: "none", padding: "16px" }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Briefly describe what happens in this space..."
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <label style={labelStyle}>Space Color</label>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                            {colorOptions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 34, height: 34, borderRadius: 10, background: c,
                                        border: color === c ? "3px solid #fff" : "none",
                                        cursor: "pointer", padding: 0, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        transform: color === c ? "scale(1.15)" : "scale(1)",
                                        boxShadow: color === c ? `0 8px 16px ${c}44` : "none"
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <Select label="Workspace" options={workspaces} value={workspaceId} onChange={setWorkspaceId} />

                    <div 
                        onClick={() => setIsPrivate(!isPrivate)}
                        style={{ 
                            display: "flex", alignItems: "center", justifyContent: "space-between", 
                            background: isPrivate ? "rgba(83,74,183,0.04)" : "rgba(255,255,255,0.02)", 
                            padding: "18px 24px", borderRadius: 20, cursor: "pointer",
                            border: `1px solid ${isPrivate ? theme.primary : theme.border}`,
                            transition: "all 0.2s"
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Make Private</span>
                                {isPrivate && <Shield size={16} style={{ color: theme.primary }} />}
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>Only you and invited members have access</p>
                        </div>
                        <div
                            style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: isPrivate ? theme.primary : "rgba(255,255,255,0.1)",
                                position: "relative", transition: "background 0.3s"
                            }}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                position: "absolute", top: 3, left: isPrivate ? 23 : 3,
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button 
                            type="submit"
                            disabled={loading || !name.trim() || !workspaceId}
                            style={{
                                flex: 1, padding: "18px", borderRadius: 16, border: "none",
                                background: theme.primary, color: "#fff", fontWeight: 800, fontSize: 16,
                                cursor: (loading || !name.trim() || !workspaceId) ? "not-allowed" : "pointer",
                                opacity: (loading || !name.trim() || !workspaceId) ? 0.6 : 1,
                                boxShadow: `0 12px 32px ${theme.primary}44`,
                                transition: "all 0.2s",
                                transform: loading ? "scale(0.98)" : "none"
                            }}
                        >
                            {loading ? "Creating..." : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export function SpaceUpdate(props: SpaceFormProps & { spaceId: string }) {
    const { onSubmit, onClose, workspaces, defaults } = props;
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [color, setColor] = useState(defaults?.color || colorOptions[0]);
    const [isPrivate, setIsPrivate] = useState(defaults?.isPrivate || false);
    const [workspaceId, setWorkspaceId] = useState(defaults?.workspaceId || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), color, isPrivate, workspaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <X size={20} />
                </button>

                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Edit Space</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted }}>Update your space configuration and settings.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Space name</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ 
                                width: 52, height: 52, borderRadius: 14, background: color, 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                color: "#fff", flexShrink: 0, boxShadow: `0 8px 20px ${color}33`,
                                fontSize: 20, fontWeight: 800
                            }}>
                                {name.charAt(0).toUpperCase() || "S"}
                            </div>
                            <input
                                autoFocus
                                style={inputStyle}
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 90, resize: "none", padding: "16px" }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <label style={labelStyle}>Space Color</label>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                            {colorOptions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 32, height: 32, borderRadius: 10, background: c,
                                        border: color === c ? "3px solid #fff" : "none",
                                        cursor: "pointer", padding: 0
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <Select label="Workspace" options={workspaces} value={workspaceId} onChange={setWorkspaceId} />

                    <div 
                        onClick={() => setIsPrivate(!isPrivate)}
                        style={{ 
                            display: "flex", alignItems: "center", justifyContent: "space-between", 
                            background: "rgba(255,255,255,0.02)", padding: "18px 24px", borderRadius: 20, cursor: "pointer",
                            border: `1px solid ${isPrivate ? theme.primary : theme.border}`
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Make Private</span>
                            <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>Only invited members have access</p>
                        </div>
                        <div
                            style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: isPrivate ? theme.primary : "rgba(255,255,255,0.1)",
                                position: "relative"
                            }}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                position: "absolute", top: 3, left: isPrivate ? 23 : 3,
                                transition: "all 0.25s"
                            }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button onClick={onClose} type="button" style={{ flex: 1, padding: "18px", borderRadius: 16, border: `1px solid ${theme.border}`, background: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                        <button 
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 2, padding: "18px", borderRadius: 16, border: "none",
                                background: theme.primary, color: "#fff", fontWeight: 800, fontSize: 16,
                                cursor: loading ? "not-allowed" : "pointer"
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

export function SpaceDelete({ space, onDelete, onClose }: { space: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width: 440 }} onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={32} style={{ color: theme.destructive }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Delete Space</h3>
                        <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                            Permanently delete <strong style={{ color: "white" }}>{space.name}</strong>? This will remove all nested folders, lists, and tasks. This action is irreversible.
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "16px", borderRadius: 16, border: `1px solid ${theme.border}`, background: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Keep Space</button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try { await onDelete(space.id); onClose(); } finally { setLoading(false); }
                        }}
                        disabled={loading}
                        style={{
                            flex: 1.2, padding: "16px", borderRadius: 16, border: "none",
                            background: theme.destructive, color: "#fff", fontWeight: 800,
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: `0 8px 24px ${theme.destructive}33`
                        }}
                    >
                        {loading ? "Deleting..." : "Confirm Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}
