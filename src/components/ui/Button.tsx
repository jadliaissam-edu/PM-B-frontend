import React from "react";
import { theme } from "./theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "destructive" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "lg", loading, loadingText = "Loading...", fullWidth, children, style, disabled, ...rest }: ButtonProps) {
    const isPrimary = variant === "primary";
    const isDestructive = variant === "destructive";
    const isGhost = variant === "ghost";
    
    let background = "transparent";
    let color = "#fff";
    let border = "none";
    let boxShadow = "none";
    let padding = "10px 20px";
    let borderRadius = 12;
    let fontSize = 14;
    let fontWeight = 700;

    if (isPrimary) {
        background = theme.primary;
        boxShadow = `0 12px 32px ${theme.primary}44`;
        border = "none";
    } else if (isDestructive) {
        background = theme.destructive;
        boxShadow = `0 8px 24px ${theme.destructive}33`;
        border = "none";
    } else if (isGhost) {
        background = "none";
        border = "none";
        color = theme.textMuted;
        boxShadow = "none";
    } else {
        border = `1px solid ${theme.border}`;
        color = theme.textMain;
    }

    if (size === "lg") {
        padding = "18px";
        borderRadius = 16;
        fontSize = 16;
        fontWeight = 800;
    } else if (size === "sm") {
        padding = "7px 18px";
        borderRadius = 7;
        fontSize = 12;
        fontWeight = 600;
    }

    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            style={{
                background, color, border, boxShadow, padding, borderRadius, fontSize, fontWeight,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transform: loading && !isGhost ? "scale(0.98)" : "none",
                width: fullWidth ? "100%" : "auto",
                ...style
            }}
            {...rest}
        >
            {loading ? loadingText : children}
        </button>
    );
}
