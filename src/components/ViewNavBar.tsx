import { CalendarDays, Columns3, LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react";

export default function ViewNavBar() {
    return (
        <div
            style={{
                height: 56,
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                background: "#101014",
                flexShrink: 0,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                    style={{
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        border: "none",
                        borderBottom: "2px solid #7b6df7",
                        background: "transparent",
                        color: "#f4f4ff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    <LayoutGrid size={14} /> Overview
                </button>

                <button className="view-nav-tab">
                    <List size={14} /> List
                </button>

                <button className="view-nav-tab">
                    <Columns3 size={14} /> Board
                </button>

                <button className="view-nav-tab">
                    <CalendarDays size={14} /> Calendar
                </button>

                <button className="view-nav-tab">Gantt</button>

                <button
                    style={{
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        border: "0.5px dashed rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    <Plus size={14} /> View
                </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: 12,
                            color: "rgba(255,255,255,0.3)",
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        placeholder="Search in view..."
                        style={{
                            width: 250,
                            height: 36,
                            background: "rgba(255,255,255,0.04)",
                            border: "0.5px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            padding: "8px 14px 8px 34px",
                            fontSize: 13,
                            color: "#fff",
                            outline: "none",
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                </div>

                <button
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: "0.5px solid rgba(83,74,183,0.65)",
                        background: "rgba(83,74,183,0.35)",
                        color: "#c7bfff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                >
                    <Search size={15} />
                </button>

                <button className="icon-btn">
                    <SlidersHorizontal size={15} style={{ color: "rgba(255,255,255,0.65)" }} />
                </button>
            </div>
        </div>
    );
}
