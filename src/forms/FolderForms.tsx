import { X, Trash2, AlertTriangle, ChevronDown, Folder, EyeOff, Layout } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { FolderRequestDto, FolderResponseDto } from "../api/folderApi";

export type { FolderRequestDto, FolderResponseDto };

interface SelectOption { value: string; label: string }

interface FolderFormProps {
    onSubmit: (data: FolderRequestDto) => Promise<void> | void;
    onClose: () => void;
    spaces: SelectOption[];
    defaults?: Partial<FolderRequestDto>;
}

// ─── Shared Style Tokens ──────────────────────────────────────────────────────

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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
    background: theme.bgModal,
    border: `1px solid ${theme.border}`,
    borderRadius: 24,
    width: 480,
    maxWidth: "calc(100vw - 32px)",
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

// ─── Components ───────────────────────────────────────────────────────────────

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
                    borderColor: open ? theme.primary : theme.border
                }}
            >
                <span style={{ color: selected ? theme.textMain : theme.textMuted }}>{selected ? selected.label : "Select parent space"}</span>
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

function Toggle({ label, sublabel, checked, onChange, icon: Icon }: { label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void; icon?: any }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                background: "rgba(255,255,255,0.02)", padding: "16px 20px", borderRadius: 20, 
                cursor: "pointer", border: `1px solid ${checked ? theme.primary : theme.border}`,
                transition: "all 0.2s"
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{label}</span>
                    {Icon && <Icon size={16} style={{ color: checked ? theme.primary : theme.textMuted }} />}
                </div>
                {sublabel && <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>{sublabel}</p>}
            </div>
            <div
                style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: checked ? theme.primary : "rgba(255,255,255,0.1)",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background 0.3s"
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: checked ? 23 : 3,
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                }} />
            </div>
        </div>
    );
}

export function FolderAdd({ onSubmit, onClose, spaces, defaults }: FolderFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [spaceId, setSpaceId] = useState(defaults?.spaceId || "");
    const [isHidden, setIsHidden] = useState(defaults?.isHidden || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !spaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), isHidden, spaceId });
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
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>New Folder</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>Folders help group related project lists and sprints together for better organization.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Folder Name</label>
                        <input
                            autoFocus
                            style={inputStyle}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Marketing Assets"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 90, resize: "none" }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What is this folder used for?"
                        />
                    </div>

                    <Select
                        label="Parent Space"
                        options={spaces}
                        value={spaceId}
                        onChange={setSpaceId}
                    />

                    <Toggle
                        label="Hidden folder"
                        sublabel="Hide this folder from other workspace members"
                        checked={isHidden}
                        onChange={setIsHidden}
                        icon={EyeOff}
                    />

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button 
                            type="submit"
                            disabled={loading || !name.trim() || !spaceId}
                            style={{
                                flex: 2, padding: "18px", borderRadius: 16, border: "none",
                                background: theme.primary, color: "#fff", fontWeight: 800, fontSize: 16,
                                cursor: (loading || !name.trim() || !spaceId) ? "not-allowed" : "pointer",
                                opacity: (loading || !name.trim() || !spaceId) ? 0.6 : 1,
                                boxShadow: `0 12px 32px ${theme.primary}44`
                            }}
                        >
                            {loading ? "Creating..." : "Create Folder"}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}

export function FolderUpdate({ folderId, onSubmit, onClose, spaces, defaults }: FolderFormProps & { folderId: string }) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [spaceId, setSpaceId] = useState(defaults?.spaceId || "");
    const [isHidden, setIsHidden] = useState(defaults?.isHidden || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !spaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), isHidden, spaceId });
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
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Edit Folder</h2>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textMuted }}>Update folder name or change its parent space.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={labelStyle}>Folder Name</label>
                        <input
                            autoFocus
                            style={inputStyle}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 90, resize: "none" }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <Select
                        label="Parent Space"
                        options={spaces}
                        value={spaceId}
                        onChange={setSpaceId}
                    />

                    <Toggle
                        label="Hidden folder"
                        checked={isHidden}
                        onChange={setIsHidden}
                    />

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
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

export function FolderDelete({ folder, onDelete, onClose }: { folder: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width: 420 }} onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 24, background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={28} style={{ color: theme.destructive }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>Delete Folder</h3>
                        <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                            Permanently delete <strong style={{ color: "white" }}>{folder.name}</strong>? All lists and tasks within will be removed. This cannot be undone.
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "16px", borderRadius: 16, border: `1px solid ${theme.border}`, background: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try { await onDelete(folder.id); onClose(); } finally { setLoading(false); }
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
