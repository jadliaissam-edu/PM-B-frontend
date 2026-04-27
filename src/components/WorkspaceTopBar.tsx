import { Bell, Plus, Search, UserPlus } from "lucide-react";

interface WorkspaceTopBarProps {
    userName: string;
    userAvatar: string;
    onInvite?: () => void;
}

export default function WorkspaceTopBar({ userName: _userName, userAvatar: _userAvatar, onInvite }: WorkspaceTopBarProps) {
    return (
        <header
            style={{
                height: 48,
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                background: "#0d0d0f",
                flexShrink: 0,
            }}
        >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: 12, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input className="search-input" placeholder="Search tasks, projects..." />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button 
                    onClick={onInvite}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(124, 58, 237, 0.1)",
                        border: "1px solid rgba(124, 58, 237, 0.2)",
                        borderRadius: 7, padding: "5px 10px",
                        color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124, 58, 237, 0.15)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"}
                >
                    <UserPlus size={13} />
                    Invite
                </button>
                
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

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
