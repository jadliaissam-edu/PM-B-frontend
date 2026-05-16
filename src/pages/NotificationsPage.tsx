import { Bell, Check, Trash2, Info, Loader2, Target, MessageSquare, Zap, LayoutGrid, Sparkles, BellOff, RefreshCw, FolderTree, Folder, List as ListIcon, Rocket, SquarePen, History } from "lucide-react";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import Sidebar from "../components/Sidebar";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceResourcesPanel from "../components/WorkspaceResourcesPanel";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationsByUser, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api/notificationApi";
import { getWorkspacesByUser } from "../api/workspaceApi";
import type { WorkspaceResponseDto } from "../api/workspaceApi";
import type { NotificationResponseDto } from "../api/notificationApi";

function getUserFromStorage(): { id: string; userId?: string; firstName: string; lastName: string } {
    try {
        const raw = localStorage.getItem("user");
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                ...parsed,
                id: parsed.id || parsed.userId || ""
            };
        }
    } catch { /* ignore */ }
    return { id: "", firstName: "User", lastName: "" };
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [user] = useState(getUserFromStorage);
    const [activeTab, setActiveTab] = useState("all");
    const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Sidebar Data
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);

    const theme = localStorage.getItem("orbyte-theme") || "dark";
    const isDark = theme === "dark";
    
    // Semantics from index.css
    const C = {
        bg:        "var(--bg-main)",
        card:      "var(--bg-card)",
        text:      "var(--text-main)",
        textSub:   "var(--text-sub)",
        textFaint: "var(--text-faint)",
        border:    "var(--border)",
        accent:    "var(--accent)",
        accentSoft:"var(--accent-soft)",
        error:     "var(--error)",
        success:   "var(--success)",
        warning:   "var(--warning)",
    };

    const avatar = ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || "US";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

    useEffect(() => {
        loadSidebarData();
    }, []);

    const loadSidebarData = async () => {
        try {
            const wsData = await getWorkspacesByUser();
            setWorkspaces(wsData);
            if (wsData.length > 0) {
                const savedWsId = localStorage.getItem("activeWorkspaceId");
                const savedWs = wsData.find(ws => ws.id === savedWsId);
                setActiveWorkspace(savedWs ?? wsData[0]);
            }
        } catch (err) {
            console.error("Failed to load workspaces", err);
        }
    };

    const fetchNotifications = useCallback(async (showRefresh = false) => {
        const id = user.id || user.userId;
        if (!id) {
            setIsLoading(false);
            setError("User ID introuvable. Reconnectez-vous.");
            return;
        }
        try {
            if (showRefresh) setIsRefreshing(true);
            else setIsLoading(true);
            setError("");
            const data = await getNotificationsByUser(user.id);
            setNotifications(data);
        } catch (err: any) {
            console.error("Failed to fetch notifications:", err);
            setError(err.message || "Impossible de charger les notifications");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user.id]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
        } catch (err: any) {
            console.error("Mark read failed:", err);
        }
    };

    const handleMarkAllRead = async () => {
        const id = user.id || user.userId;
        if (!id) return;
        try {
            await markAllNotificationsAsRead(id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        } catch (err: any) {
            console.error("Mark all read failed:", err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err: any) {
            console.error("Delete failed:", err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesTab = activeTab === "all" || (activeTab === "unread" && !n.read);
        const matchesSearch = (n.title + n.message).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const sidebarNavItems = [
        { icon: LayoutGrid, label: "Dashboard", onClick: () => navigate("/workspace") },
        {
            icon: Sparkles,
            label: "Ask AI",
            onClick: () => navigate("/ai"),
            subItems: [
                {
                    label: "New Chat",
                    icon: SquarePen,
                    onClick: () => navigate("/ai?new=1"),
                },
                {
                    label: "History",
                    icon: History,
                    onClick: () => navigate("/ai?history=1"),
                },
            ],
        },
        { icon: Bell, label: "Notifications", active: true },
    ];

    const getIcon = (type: string) => {
        const t = (type || "").toUpperCase();
        if (t.includes("TASK")) return Target;
        if (t.includes("COMMENT") || t.includes("MENTION")) return MessageSquare;
        if (t.includes("SPRINT")) return Zap;
        if (t.includes("INFO") || t.includes("SYSTEM")) return Info;
        return Bell;
    };

    const getColor = (type: string) => {
        const t = (type || "").toUpperCase();
        if (t.includes("TASK")) return C.accent;
        if (t.includes("COMMENT") || t.includes("MENTION")) return C.success;
        if (t.includes("SPRINT")) return C.warning;
        if (t.includes("INFO") || t.includes("SYSTEM")) return "#3b82f6";
        return C.accent;
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "À l'instant";
        if (mins < 60) return `il y a ${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `il y a ${days}j`;
        return date.toLocaleDateString("fr-FR");
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Layout
            sidebar={(
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                    navItems={sidebarNavItems}
                    workspaceDropdown={
                        <WorkspacesDropdown
                            workspaces={workspaces}
                            activeWorkspace={activeWorkspace}
                            onSelect={setActiveWorkspace}
                            onCreateClick={() => navigate("/workspace?createWs=true")}
                            onEditClick={() => navigate("/workspace")}
                            onDeleteClick={() => navigate("/workspace")}
                        />
                    }
                    resourcesPanel={
                        <WorkspaceResourcesPanel 
                            workspaceId={activeWorkspace?.id} 
                            onSelectHierarchy={(h) => {
                                navigate("/workspace", { state: { selectedHierarchy: h } });
                            }}
                        />
                    }
                    userName={fullName}
                    userAvatar={avatar}
                    onSettingsClick={() => navigate("/settings")}
                />
            )}
        >
            <Content>
                <WorkspaceTopBar
                    userName={fullName}
                    userAvatar={avatar}
                    onNotificationsClick={() => fetchNotifications(true)}
                    onSearch={setSearchQuery}
                />
                <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
                    <div style={{ maxWidth: 800, margin: "0 auto" }}>
                        {/* Header */}
                        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div>
                                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Notifications</h1>
                                <p style={{ color: C.textSub, fontSize: 14 }}>
                                    {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}.` : "Aucune notification non lue."}
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => fetchNotifications(true)}
                                    disabled={isRefreshing}
                                    style={{ background: "var(--bg-hover)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                                >
                                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Rafraîchir
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        style={{ background: "var(--accent-soft)", border: `1px solid ${C.accent}`, borderRadius: 10, padding: "8px 14px", color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                                    >
                                        <Check size={14} /> Tout marquer comme lu
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
                            {["all", "unread"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: "12px 4px", background: "none", border: "none",
                                        borderBottom: activeTab === tab ? `2px solid ${C.accent}` : "2px solid transparent",
                                        color: activeTab === tab ? C.text : C.textSub,
                                        fontSize: 14, fontWeight: activeTab === tab ? 600 : 500,
                                        cursor: "pointer", transition: "all 0.2s"
                                    }}
                                >
                                    {tab === "all" ? "Toutes" : "Non lues"}
                                    {tab === "unread" && unreadCount > 0 && (
                                        <span style={{ marginLeft: 6, fontSize: 11, background: C.accentSoft, color: C.accent, padding: "2px 7px", borderRadius: 8 }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {isLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
                                    <Loader2 size={32} className="animate-spin" style={{ color: C.accent }} />
                                    <p style={{ color: C.textSub, fontSize: 13 }}>Chargement…</p>
                                </div>
                            ) : error ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: C.error }}>
                                    <p style={{ marginBottom: 12 }}>{error}</p>
                                    <button onClick={() => fetchNotifications()} style={{ background: C.accent, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
                                        Réessayer
                                    </button>
                                </div>
                            ) : filteredNotifications.length > 0 ? filteredNotifications.map(notif => {
                                const Icon = getIcon(notif.type);
                                const color = getColor(notif.type);
                                return (
                                    <div
                                        key={notif.id}
                                        style={{
                                            background: !notif.read ? (isDark ? "rgba(108,99,255,0.03)" : "rgba(108,99,255,0.05)") : C.card,
                                            border: `1px solid ${!notif.read ? "rgba(108,99,255,0.15)" : C.border}`,
                                            borderRadius: 16, padding: "16px 20px",
                                            display: "flex", alignItems: "center", gap: 16,
                                            position: "relative", transition: "all 0.15s",
                                        }}
                                    >
                                        {!notif.read && (
                                            <div style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", width: 4, height: 24, borderRadius: 99, background: C.accent }} />
                                        )}
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                                            <Icon size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, gap: 8 }}>
                                                <h4 style={{ fontSize: 14, fontWeight: 600, color: !notif.read ? C.text : C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notif.title}</h4>
                                                <span style={{ fontSize: 11, color: C.textSub, flexShrink: 0 }}>{formatTime(notif.createdAt)}</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notif.message}</p>
                                        </div>
                                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkRead(notif.id);
                                                    }}
                                                    title="Marquer comme lu"
                                                    style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", padding: 6, borderRadius: 6 }}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(notif.id);
                                                }}
                                                title="Supprimer"
                                                style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", padding: 6, borderRadius: 6 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", textAlign: "center" }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 20, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                                        <BellOff size={36} style={{ color: "var(--accent)", opacity: 0.4 }} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
                                        {activeTab === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                                    </h3>
                                    <p style={{ fontSize: 13, color: C.textSub }}>
                                        {activeTab === "unread" ? "Vous êtes à jour !" : "Les notifications apparaîtront ici."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Type legend */}
                        {notifications.length > 0 && (
                            <div style={{ marginTop: 32, padding: "20px 24px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                                <p style={{ fontSize: 12, color: C.textSub, marginBottom: 16, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Comprendre les notifications</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    {[
                                        { type: "TASK", label: "Tâche", desc: "Modifications, assignations ou rappels de vos tâches.", color: C.accent },
                                        { type: "COMMENT", label: "Commentaire", desc: "Nouveaux commentaires sur vos tâches ou mentions.", color: C.success },
                                        { type: "SPRINT", label: "Sprint", desc: "Mises à jour sur les cycles de développement.", color: C.warning },
                                        { type: "SYSTEM", label: "Système", desc: "Annonces de la plateforme ou alertes de sécurité.", color: "#3b82f6" },
                                    ].map(t => (
                                        <div key={t.type} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, marginTop: 4, flexShrink: 0 }} />
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block" }}>{t.label}</span>
                                                <span style={{ fontSize: 12, color: C.textSub }}>{t.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </Content>
        </Layout>
    );
}
