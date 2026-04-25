import React, { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { theme } from "./theme";

export const inputStyle: React.CSSProperties = {
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

export const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: theme.textMuted,
    marginBottom: 10,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
};

export const FormGroup = ({ label, children, optional }: { label: string, children: React.ReactNode, optional?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>{label} {optional && <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>}</label>
        {children}
    </div>
);

export const TextField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }>((props, ref) => {
    const { hasError, style, ...rest } = props;
    return (
        <input
            ref={ref}
            style={{
                ...inputStyle,
                borderColor: hasError ? "rgba(226,75,74,0.6)" : theme.border,
                ...style
            }}
            onFocus={e => (e.target.style.borderColor = hasError ? "rgba(226,75,74,0.6)" : "rgba(255,255,255,0.22)")}
            onBlur={e => (e.target.style.borderColor = hasError ? "rgba(226,75,74,0.6)" : theme.border)}
            {...rest}
        />
    );
});
TextField.displayName = "TextField";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    return (
        <textarea
            ref={ref}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit", ...props.style }}
            onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
            onBlur={e => (e.target.style.borderColor = theme.border)}
            {...props}
        />
    );
});
TextArea.displayName = "TextArea";

interface SelectOption { value: string; label: string; icon?: React.ReactNode }
export function Select({ options, value, onChange, placeholder, size = "lg", hasError }: {
    options: SelectOption[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    size?: "md" | "lg";
    hasError?: boolean;
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

    const isLg = size === "lg";

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    ...inputStyle,
                    padding: isLg ? "14px 18px" : "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer",
                    background: open ? "rgba(255,255,255,0.05)" : theme.inputBg,
                    borderColor: hasError ? "rgba(226,75,74,0.6)" : (open ? theme.primary : theme.border),
                    fontSize: isLg ? 15 : 13
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {selected?.icon}
                    <span style={{ color: selected ? theme.textMain : theme.textMuted }}>{selected ? selected.label : placeholder || "Select..."}</span>
                </div>
                <ChevronDown size={isLg ? 18 : 14} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }} />
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
                                    transition: "all 0.15s",
                                    display: "flex", alignItems: "center", gap: 8
                                }}
                                onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
                            >
                                {o.icon}
                                {o.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export function Toggle({ label, sublabel, checked, onChange, icon: Icon }: { label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void; icon?: any }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                background: checked ? "rgba(83,74,183,0.04)" : "rgba(255,255,255,0.02)", 
                padding: "16px 20px", borderRadius: 20, 
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
                    transition: "background 0.3s", flexShrink: 0
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: checked ? 23 : 3,
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
            </div>
        </div>
    );
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { 
    options: { value: T; label: string; description?: string; color?: string; dot?: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
            {options.map(opt => {
                const selected = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        style={{
                            background: selected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                            border: `0.5px solid ${selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}`,
                            borderRadius: 8,
                            padding: opt.description ? "10px 8px" : "8px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: opt.description ? "column" : "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: opt.description ? 3 : 8,
                            transition: "all 0.15s",
                        }}
                    >
                        {opt.dot && <span style={{ width: 8, height: 8, borderRadius: 2, background: opt.dot, flexShrink: 0 }} />}
                        {!opt.dot && opt.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? (opt.color || "rgba(255,255,255,0.9)") : "rgba(255,255,255,0.45)" }}>
                            {opt.label}
                        </span>
                        {opt.description && (
                            <span style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                                {opt.description}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
