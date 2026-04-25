import React, { useEffect } from "react";
import { X } from "lucide-react";
import { theme } from "./theme";

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(12px)",
    zIndex: 1300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
};

const modalStyle: React.CSSProperties = {
    background: theme.bgModal,
    border: `1px solid ${theme.border}`,
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
    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
};

interface ModalProps {
    onClose: () => void;
    title?: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    width?: number;
    icon?: React.ReactNode;
    padding?: string | number;
}

export function Modal({ onClose, title, description, children, width = 520, icon, padding = "40px" }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalStyle, width, padding }} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = theme.textMain; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = theme.textMuted; }}
                >
                    <X size={20} />
                </button>

                {(title || icon) && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: icon ? "center" : "flex-start", textAlign: icon ? "center" : "left", gap: icon ? 24 : 8 }}>
                        {icon && (
                            <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h2 style={{ fontSize: icon ? 24 : 28, fontWeight: 800, margin: "0 0 8px", color: "#fff", fontFamily: "'Syne', sans-serif" }}>{title}</h2>}
                            {description && <div style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>{description}</div>}
                        </div>
                    </div>
                )}
                
                {children}
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
}
