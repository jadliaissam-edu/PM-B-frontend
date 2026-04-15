import { Bell, Plus, Search } from "lucide-react";

interface WorkspaceTopBarProps {
    userName: string;
    userAvatar: string;
}

export default function WorkspaceTopBar({ userName: _userName, userAvatar: _userAvatar }: WorkspaceTopBarProps) {
    return (
        <header
            style={{
                height: 60,
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                background: "#0d0d0f",
                flexShrink: 0,
            }}
        >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: 12, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input className="search-input" placeholder="Search tasks, projects..." />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="icon-btn" style={{ position: "relative" }}>
                    <Bell size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                    <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#E24B4A", border: "1.5px solid #0d0d0f" }} />
                </button>
                <button className="icon-btn">
                    <Plus size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
            </div>
        </header>
    );
}
