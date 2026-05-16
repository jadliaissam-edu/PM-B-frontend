import { 
    User, Bell, Palette, Lock, LayoutGrid, LogOut, Sparkles, 
    CheckCircle2, Clock, Sun, Moon, ListChecks,
    ChevronRight, CheckCircle, SquarePen, History
} from "lucide-react";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import Sidebar from "../components/Sidebar";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceResourcesPanel from "../components/WorkspaceResourcesPanel";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import { getTasksByAssignee } from "../api/taskApi.tsx";
import type { TaskResponseDto } from "../api/taskApi.tsx";
import { getWorkspacesByUser } from "../api/workspaceApi.tsx";
import type { WorkspaceResponseDto } from "../api/workspaceApi.tsx";
import { TaskUpdate } from "../components/TaskForms";
import type { SelectedHierarchy } from "./DashboardPage";

interface UserData {
    id?: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    mfaEnabled?: boolean;
}

function getUserFromStorage(): UserData {
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
    return { firstName: "User", lastName: "", email: "" };
}

function getAccentColor(): string {
    return localStorage.getItem("orbyte-accent") || "#6c63ff";
}

function getThemeFromStorage(): "dark" | "light" {
    return (localStorage.getItem("orbyte-theme") as "dark" | "light") || "dark";
}

export default function SettingsPage() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [userData] = useState<UserData>(getUserFromStorage);
    const [tasks, setTasks] = useState<TaskResponseDto[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [selectedTask, setSelectedTask] = useState<TaskResponseDto | null>(null);

    // Sidebar Data
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);

    // Appearance
    const [accentColor, setAccentColor] = useState(getAccentColor);
    const [theme, setTheme] = useState<"dark" | "light">(getThemeFromStorage);

    const avatar = ((userData.firstName?.[0] || "") + (userData.lastName?.[0] || "")).toUpperCase() || "US";
    const fullName = `${userData.firstName} ${userData.lastName}`.trim() || "User";

    useEffect(() => {
        loadSidebarData();
    }, []);

    useEffect(() => {
        if (activeTab === "tasks" && userData.id) {
            loadTasks();
        }
    }, [activeTab]);

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

    const loadTasks = async () => {
        setLoadingTasks(true);
        try {
            const id = userData.id || userData.userId;
            if (id) {
                const data = await getTasksByAssignee(id);
                setTasks(data);
            }
        } catch (err) {
            console.error("Failed to load user tasks", err);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken") || undefined;
            await logout({ refreshToken });
        } catch { /* ignore */ }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleAccentChange = (color: string) => {
        setAccentColor(color);
        localStorage.setItem("orbyte-accent", color);
        document.documentElement.style.setProperty("--accent", color);
    };

    const toggleTheme = (newTheme: "dark" | "light") => {
        setTheme(newTheme);
        localStorage.setItem("orbyte-theme", newTheme);
        window.location.reload(); 
    };

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
        { icon: Bell, label: "Notifications", onClick: () => navigate("/notifications") },
    ];

    const handleSelectHierarchy = (hierarchy: SelectedHierarchy | null) => {
        if (!hierarchy) return;
        navigate("/workspace", { state: { selectedHierarchy: hierarchy } });
    };

    const menuItems = [
        { id: "profile", icon: User, label: "Mon Profil" },
        { id: "tasks", icon: ListChecks, label: "Mes Tâches" },
        { id: "appearance", icon: Palette, label: "Apparence" },
    ];

    const accentOptions = [
        { color: "#6c63ff", name: "Orbyte Violet" },
        { color: "#3b82f6", name: "Bleu" },
        { color: "#22d3a0", name: "Émeraude" },
        { color: "#f59e0b", name: "Ambre" },
        { color: "#f43f5e", name: "Rose" },
    ];

    const textMain = "var(--text-main)";
    const textSub = "var(--text-sub)";
    const cardBg = "var(--bg-card)";
    const bg = "var(--bg-main)";
    const border = "var(--border)";

    const getPriorityStyles = (priority: string) => {
        const p = (priority || "").toUpperCase();
        if (p === "URGENT") return { bg: "var(--error)", color: "#fff", border: "none" };
        if (p === "HIGH") return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" };
        if (p === "MEDIUM") return { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" };
        if (p === "LOW") return { bg: "rgba(34,211,160,0.15)", color: "#22d3a0", border: "1px solid rgba(34,211,160,0.3)" };
        return { bg: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" };
    };

    const filteredTasks = tasks.filter(t => {
        const title = t.title || "";
        const desc = t.description || "";
        const list = t.listeName || "";
        const matchesSearch = (title + desc + list).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

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
                    resourcesPanel={<WorkspaceResourcesPanel workspaceId={activeWorkspace?.id} onSelectHierarchy={handleSelectHierarchy} />}
                    userName={fullName}
                    userAvatar={avatar}
                    onSettingsClick={() => {/* already here */}}
                />
            )}
        >
            <Content>
                <WorkspaceTopBar
                    userName={fullName}
                    userAvatar={avatar}
                    onNotificationsClick={() => navigate("/notifications")}
                    onSearch={setSearchQuery}
                />
                <main style={{ flex: 1, background: bg, display: "flex", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
                    {/* Left Sub-sidebar (Sticky) */}
                    <div style={{ width: 260, borderRight: `1px solid ${border}`, padding: "32px 16px", display: "flex", flexDirection: "column", flexShrink: 0, background: cardBg }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: textMain, marginBottom: 24, paddingLeft: 12, fontFamily: "'Syne', sans-serif" }}>Réglages</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 12px", borderRadius: 10, border: "none",
                                        background: activeTab === item.id ? "var(--accent-soft)" : "transparent",
                                        color: activeTab === item.id ? "var(--accent)" : textSub,
                                        fontSize: 14, fontWeight: activeTab === item.id ? 600 : 500,
                                        cursor: "pointer", textAlign: "left", transition: "all 0.2s"
                                    }}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: "auto" }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px",
                                    color: "var(--error)", background: "transparent", border: "none", cursor: "pointer", fontSize: 14
                                }}
                            >
                                <LogOut size={18} /> Déconnexion
                            </button>
                        </div>
                    </div>

                    {/* Right Content (Scrollable) */}
                    <div style={{ flex: 1, padding: "48px 64px", overflowY: "auto", maxWidth: "100%", color: textMain }}>
                        
                        {/* ─── Profile Tab ─── */}
                        {activeTab === "profile" && (
                            <div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: textMain, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Mon Profil</h1>
                                <p style={{ color: textSub, fontSize: 14, marginBottom: 32 }}>
                                    Informations de votre compte Orbyte.
                                </p>

                                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 32, marginBottom: 24 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
                                        <div style={{ width: 100, height: 100, borderRadius: 24, background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff" }}>
                                            {avatar}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 22, fontWeight: 700, color: textMain, marginBottom: 4 }}>{fullName}</h3>
                                            <p style={{ color: textSub, fontSize: 14 }}>{userData.email}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textSub, marginBottom: 8, textTransform: "uppercase" }}>Prénom</label>
                                            <div style={{ background: "var(--bg-main)", borderRadius: 12, padding: "12px 16px", border: `1px solid ${border}`, color: textMain }}>{userData.firstName}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textSub, marginBottom: 8, textTransform: "uppercase" }}>Nom</label>
                                            <div style={{ background: "var(--bg-main)", borderRadius: 12, padding: "12px 16px", border: `1px solid ${border}`, color: textMain }}>{userData.lastName}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 24, padding: "20px 24px", background: "var(--bg-main)", borderRadius: 16, border: `1px solid ${border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Authentification à deux facteurs (MFA)</h4>
                                                <p style={{ fontSize: 12, color: textSub }}>
                                                    {userData.mfaEnabled
                                                        ? "Votre compte est sécurisé par MFA."
                                                        : "La MFA n'est pas activée."}
                                                </p>
                                            </div>
                                            <span style={{
                                                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                background: userData.mfaEnabled ? "var(--success-soft)" : "var(--border)",
                                                color: userData.mfaEnabled ? "var(--success)" : textSub,
                                            }}>
                                                {userData.mfaEnabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 12, color: "var(--error)", marginTop: 16 }}>* La modification du profil n'est pas disponible pour le moment.</p>
                                </div>
                            </div>
                        )}

                        {/* ─── Tasks Tab ─── */}
                        {activeTab === "tasks" && (
                            <div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: textMain, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Mes Tâches</h1>
                                <p style={{ color: textSub, fontSize: 14, marginBottom: 32 }}>
                                    Toutes les tâches qui vous sont assignées.
                                </p>

                                {loadingTasks ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                                        <div className="animate-spin" style={{ color: accentColor }}>⌛</div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 8 }}>
                                            {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPriorityFilter(p)}
                                                    style={{
                                                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                        background: priorityFilter === p ? accentColor : "var(--bg-hover)",
                                                        color: priorityFilter === p ? "#fff" : "var(--text-sub)",
                                                        border: `1px solid ${priorityFilter === p ? accentColor : "var(--border)"}`,
                                                        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {p === "ALL" ? "Tout" : p}
                                                </button>
                                            ))}
                                        </div>

                                        {filteredTasks.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                {filteredTasks.map(task => {
                                                    const pStyle = getPriorityStyles(task.priority);
                                                    return (
                                                        <div 
                                                            key={task.id} 
                                                            onClick={() => setSelectedTask(task)}
                                                            style={{ 
                                                                background: cardBg, border: `1px solid ${border}`, borderRadius: 16, 
                                                                padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, 
                                                                transition: "all 0.2s", cursor: "pointer",
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}
                                                        >
                                                            <div style={{ color: task.status === "DONE" ? "var(--success)" : "var(--text-sub)" }}>
                                                                {task.status === "DONE" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)" }}>{task.title}</h4>
                                                                <p style={{ fontSize: 13, color: "var(--text-sub)" }}>{task.listeName} • {task.status}</p>
                                                            </div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: pStyle.bg, color: pStyle.color, border: pStyle.border, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                                {task.priority}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "60px 20px", background: cardBg, borderRadius: 20, border: `1px solid ${border}` }}>
                                                <CheckCircle size={48} style={{ color: "var(--success)", marginBottom: 16, opacity: 0.5 }} />
                                                <p style={{ color: "var(--text-sub)" }}>Aucune tâche ne correspond à vos critères.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ─── Appearance Tab ─── */}
                        {activeTab === "appearance" && (
                            <div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: textMain, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Apparence</h1>
                                <p style={{ color: textSub, fontSize: 14, marginBottom: 32 }}>
                                    Personnalisez votre interface Orbyte.
                                </p>

                                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 32 }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Thème</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
                                        <button 
                                            onClick={() => toggleTheme("light")}
                                            style={{
                                                padding: 24, borderRadius: 16, background: theme === "light" ? "var(--accent-soft)" : "var(--bg-main)",
                                                border: `2px solid ${theme === "light" ? "var(--accent)" : "transparent"}`,
                                                cursor: "pointer", transition: "all 0.2s"
                                            }}
                                        >
                                            <Sun size={24} style={{ marginBottom: 12, color: theme === "light" ? "var(--accent)" : textSub }} />
                                            <p style={{ fontWeight: 600, color: theme === "light" ? "var(--accent)" : textMain }}>Clair</p>
                                        </button>
                                        <button 
                                            onClick={() => toggleTheme("dark")}
                                            style={{
                                                padding: 24, borderRadius: 16, background: theme === "dark" ? "var(--accent-soft)" : "var(--bg-main)",
                                                border: `2px solid ${theme === "dark" ? "var(--accent)" : "transparent"}`,
                                                cursor: "pointer", transition: "all 0.2s"
                                            }}
                                        >
                                            <Moon size={24} style={{ marginBottom: 12, color: theme === "dark" ? "var(--accent)" : textSub }} />
                                            <p style={{ fontWeight: 600, color: theme === "dark" ? "var(--accent)" : textMain }}>Sombre</p>
                                        </button>
                                    </div>

                                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Couleur d'accentuation</h4>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                        {accentOptions.map(opt => (
                                            <button 
                                                key={opt.color}
                                                onClick={() => handleAccentChange(opt.color)}
                                                style={{
                                                    width: 48, height: 48, borderRadius: 12, background: opt.color, border: "none",
                                                    cursor: "pointer", position: "relative", transform: accentColor === opt.color ? "scale(1.1)" : "scale(1)",
                                                    boxShadow: accentColor === opt.color ? `0 0 20px ${opt.color}40` : "none", transition: "all 0.2s"
                                                }}
                                            >
                                                {accentColor === opt.color && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><ChevronRight size={24} /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </Content>

            {selectedTask && (
                <TaskUpdate
                    taskId={selectedTask.id}
                    defaults={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onSubmit={async () => {
                        await loadTasks();
                        setSelectedTask(null);
                    }}
                    listes={[{ value: selectedTask.listeId, label: selectedTask.listeName }]}
                    sprints={selectedTask.sprintId ? [{ value: selectedTask.sprintId, label: selectedTask.sprintName || "Sprint" }] : []}
                    assignees={[{ value: selectedTask.assigneeId || "", label: selectedTask.assigneeName || "Assigné" }]}
                />
            )}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </Layout>
    );
}
