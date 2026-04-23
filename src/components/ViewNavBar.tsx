import { CalendarDays, Columns3, LayoutGrid, List, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

interface ViewNavBarProps {
    activeView: "overview" | "list" | "members" | "board";
    onViewChange: (view: "overview" | "list" | "members" | "board") => void;
}

export default function ViewNavBar({ activeView, onViewChange }: ViewNavBarProps) {
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
                    onClick={() => onViewChange("overview")}
                    style={{
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        border: "none",
                        borderBottom: activeView === "overview" ? "2px solid #7b6df7" : "2px solid transparent",
                        background: "transparent",
                        color: activeView === "overview" ? "#f4f4ff" : "rgba(255,255,255,0.4)",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                >
                    <LayoutGrid size={14} /> Overview
                </button>

                <button 
                    className={`view-nav-tab ${activeView === "list" ? "active" : ""}`}
                    onClick={() => onViewChange("list")}
                    style={activeView === "list" ? { borderBottom: "2px solid #7b6df7", borderRadius: 0 } : {}}
                >
                    <List size={14} /> List
                </button>

                <button 
                    className={`view-nav-tab ${activeView === "members" ? "active" : ""}`}
                    onClick={() => onViewChange("members")}
                    style={activeView === "members" ? { borderBottom: "2px solid #7b6df7", borderRadius: 0 } : {}}
                >
                    <Users size={14} /> Members
                </button>

                <button 
                    className={`view-nav-tab ${activeView === "board" ? "active" : ""}`}
                    onClick={() => onViewChange("board")}
                    style={activeView === "board" ? { borderBottom: "2px solid #7b6df7", borderRadius: 0 } : {}}
                >
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

                <div className="icon-btn" style={{ marginLeft: 8 }}>
                    <SlidersHorizontal size={15} style={{ color: "rgba(255,255,255,0.65)" }} />
                </div>
            </div>
        </div>
    );
}
