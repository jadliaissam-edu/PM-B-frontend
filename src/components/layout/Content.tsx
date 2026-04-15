import type { CSSProperties, ReactNode } from "react";

interface ContentProps {
    children: ReactNode;
    style?: CSSProperties;
}

export default function Content({ children, style }: ContentProps) {
    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
