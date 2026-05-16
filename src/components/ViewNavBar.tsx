import { CalendarDays, Columns3, LayoutGrid, List, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

interface ViewNavBarProps {
    activeView: "overview" | "list" | "members" | "board";
    onViewChange: (view: "overview" | "list" | "members" | "board") => void;
    onSearch?: (query: string) => void;
    onAddView?: () => void;
}

export default function ViewNavBar({ activeView, onViewChange, onSearch, onAddView }: ViewNavBarProps) {
    return (
        <div
            style={{
                height: 56,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                background: "var(--bg-card)",
                flexShrink: 0,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                    className={`view-nav-tab ${activeView === "overview" ? "active" : ""}`}
                    onClick={() => onViewChange("overview")}
                >
                    <LayoutGrid size={14} /> Overview
                </button>
                <button 
                    className={`view-nav-tab ${activeView === "list" ? "active" : ""}`}
                    onClick={() => onViewChange("list")}
                >
                    <List size={14} /> List
                </button>

                <button 
                    className={`view-nav-tab ${activeView === "members" ? "active" : ""}`}
                    onClick={() => onViewChange("members")}
                >
                    <Users size={14} /> Members
                </button>

                <button 
                    className={`view-nav-tab ${activeView === "board" ? "active" : ""}`}
                    onClick={() => onViewChange("board")}
                >
                    <Columns3 size={14} /> Board
                </button>

                <button className="view-nav-tab">
                    <CalendarDays size={14} /> Calendar
                </button>

                <button className="view-nav-tab">Gantt</button>

                <button
                    onClick={onAddView}
                    style={{
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        border: "1px dashed var(--border)",
                        borderRadius: 10,
                        background: "var(--bg-hover)",
                        color: "var(--text-sub)",
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
                            color: "var(--text-faint)",
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        placeholder="Search in view..."
                        onChange={(e) => onSearch?.(e.target.value)}
                        style={{
                            width: 250,
                            height: 36,
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "8px 14px 8px 34px",
                            fontSize: 13,
                            color: "var(--text-main)",
                            outline: "none",
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                </div>

                <div className="icon-btn" style={{ marginLeft: 8 }}>
                    <SlidersHorizontal size={15} style={{ color: "var(--text-sub)" }} />
                </div>
            </div>
        </div>
    );
}
