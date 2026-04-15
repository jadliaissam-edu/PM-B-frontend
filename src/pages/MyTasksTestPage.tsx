import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Inbox, BarChart2, ListTodo } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import { getWorkspacesByUser } from "../api/workspaceApi";
import type { WorkspaceResponseDto } from "../api/workspaceApi";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CheckSquare, label: "My Tasks", badge: 5 },
    { icon: Inbox, label: "Inbox", badge: 3 },
    { icon: BarChart2, label: "Reporting" },
];

export default function MyTasksTestPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState({ name: "User", avatar: "US" });
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsed = JSON.parse(storedUser);
            setUser({
                name: parsed.firstName || "User",
                avatar: ((parsed.firstName?.[0] || "") + (parsed.lastName?.[0] || "")).toUpperCase() || "US",
            });
        } catch (error) {
            console.error("Failed to parse user from local storage", error);
        }
    }, []);

    useEffect(() => {
        const loadWorkspaces = async () => {
            try {
                const wsData = await getWorkspacesByUser();
                setWorkspaces(wsData);

                if (wsData.length > 0) {
                    const savedWorkspaceId = localStorage.getItem("activeWorkspaceId");
                    const savedWorkspace = wsData.find((workspace) => workspace.id === savedWorkspaceId);
                    setActiveWorkspace(savedWorkspace ?? wsData[0]);
                }
            } catch (error) {
                console.error("Failed to load workspaces", error);
            }
        };

        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem("activeWorkspaceId", activeWorkspace.id);
        }
    }, [activeWorkspace]);

    const sidebarNavItems = navItems.map((item) => {
        if (item.label === "Dashboard") {
            return {
                ...item,
                active: location.pathname === "/workspace",
                onClick: () => navigate("/workspace"),
            };
        }

        if (item.label === "My Tasks") {
            return {
                ...item,
                active: location.pathname === "/workspace/my-tasks",
                onClick: () => navigate("/workspace/my-tasks"),
            };
        }

        return item;
    });

    return (
        <Layout
            sidebar={
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                    navItems={sidebarNavItems}
                    workspaceDropdown={
                        <WorkspacesDropdown
                            workspaces={workspaces}
                            activeWorkspace={activeWorkspace}
                            onSelect={setActiveWorkspace}
                        />
                    }
                    userName={user.name}
                    userAvatar={user.avatar}
                />
            }
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background 0.18s, color 0.18s; color: rgba(255,255,255,0.45); font-size: 14px; font-weight: 400; white-space: nowrap; overflow: hidden; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
                .nav-item.active { background: rgba(83,74,183,0.18); color: #a89ef5; }
                .search-input { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 14px 8px 38px; font-size: 13px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; width: 240px; transition: border-color 0.2s, width 0.3s; }
                .search-input:focus { border-color: rgba(83,74,183,0.5); width: 300px; }
                .search-input::placeholder { color: rgba(255,255,255,0.25); }
                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.18s, border-color 0.18s; }
                .icon-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
                .ws-selector { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor: pointer; transition: background 0.18s; font-size: 13px; color: rgba(255,255,255,0.7); }
                .ws-selector:hover { background: rgba(255,255,255,0.06); }
                .test-card { background: #16161a; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; }
            `}</style>

            <Content>
                <WorkspaceTopBar userName={user.name} userAvatar={user.avatar} />

                <main style={{ flex: 1, padding: "28px", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                    <div className="test-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <ListTodo size={20} style={{ color: "#a89ef5" }} />
                            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Test de persistance Sidebar</h2>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                            Cette page sert uniquement a tester que la sidebar reste disponible sur une autre page.
                            Clique sur Dashboard puis reviens sur My Tasks pour verifier le comportement.
                        </p>
                    </div>
                </main>
            </Content>
        </Layout>
    );
}
