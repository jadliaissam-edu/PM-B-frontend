import type { ReactNode } from "react";

interface LayoutProps {
    sidebar: ReactNode;
    children: ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
    const theme = localStorage.getItem("orbyte-theme") || "dark";
    const isDark = theme === "dark";

    return (
        <div
            data-theme={theme}
            style={{
                display: "flex",
                height: "100vh",
                background: "var(--bg-main)",
                fontFamily: "'DM Sans', sans-serif",
                color: "var(--text-main)",
                overflow: "hidden",
            }}
        >
            {sidebar}
            {children}
        </div>
    );
}
