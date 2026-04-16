import type { ReactNode } from "react";

interface LayoutProps {
    sidebar: ReactNode;
    children: ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                background: "#0d0d0f",
                fontFamily: "'DM Sans', sans-serif",
                color: "#fff",
                overflow: "hidden",
            }}
        >
            {sidebar}
            {children}
        </div>
    );
}
