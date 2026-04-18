import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, List as ListIcon } from "lucide-react";
import { type ListeResponseDto, getAllListes, createListe, updateListe, deleteListe } from "../api/ListeApi";
import { ListeAdd, ListeUpdate, ListeDelete, type ListeRequestDto } from "../components/listeForms";
import { TaskAdd, TaskUpdate, TaskDelete, type TaskRequestDto } from "../components/TaskForms";
import { SpaceAdd, SpaceUpdate, SpaceDelete, type SpaceRequestDto } from "../components/SpaceForms";
import { createTask, updateTask, deleteTask } from "../api/TaskApi";
import { addSpace, updateSpace, deleteSpace } from "../api/spaceApi";

export default function ListeTestPage() {
    const [listes, setListes] = useState<ListeResponseDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Form logic
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingListe, setEditingListe] = useState<ListeResponseDto | null>(null);
    const [deletingListe, setDeletingListe] = useState<ListeResponseDto | null>(null);

    // Task Form logic
    const [isTaskAddOpen, setIsTaskAddOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<{ id: string, title: string } | null>(null);
    const [deletingTask, setDeletingTask] = useState<{ id: string, title: string } | null>(null);

    // Space Form logic
    const [isSpaceAddOpen, setIsSpaceAddOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState<{ id: string, name: string } | null>(null);
    const [deletingSpace, setDeletingSpace] = useState<{ id: string, name: string } | null>(null);

    const testBtnStyle = (color: string): React.CSSProperties => ({
        background: color === "red" ? "#E24B4A" : color === "green" ? "#22C55E" : "#3B82F6",
        color: "white", padding: "8px 12px", borderRadius: 6, border: "none", fontSize: 13,
        fontWeight: 500, cursor: "pointer", display: "flex", gap: 6, alignItems: "center"
    });

    const [apiFolders, setApiFolders] = useState<{ value: string; label: string }[]>([]);
    const [apiSprints, setApiSprints] = useState<{ value: string; label: string }[]>([]);

    async function loadListes() {
        setLoading(true);
        try {
            const page = await getAllListes(0, 50); // Get first 50
            setListes(page.content); // Use content from pagination array

            // Also load real folders and sprints from backend
            const token = localStorage.getItem("accessToken");
            const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                const fRes = await fetch("/api/folders?size=50", { headers });
                if (fRes.ok) {
                    const fData = await fRes.json();
                    const fArr = Array.isArray(fData) ? fData : (fData.content || fData.data || fData.items || (fData._embedded && Object.values(fData._embedded)[0]) || []);
                    setApiFolders(fArr.map((f: any) => ({ value: f.id || f.folderId || "", label: f.name || "Unnamed Folder" })));
                } else {
                    console.error("Failed to load /api/folders", await fRes.text());
                }
            } catch (e) {
                console.error("Failed to fetch folders", e);
            }

            try {
                const sRes = await fetch("/api/sprints?size=50", { headers });
                if (sRes.ok) {
                    const sData = await sRes.json();
                    const sArr = Array.isArray(sData) ? sData : (sData.content || sData.data || sData.items || (sData._embedded && Object.values(sData._embedded)[0]) || []);
                    console.log("[DEBUG] Raw Sprints Data:", sData);
                    setApiSprints(sArr.map((s: any) => ({ value: s.id || s.sprintId || s._id || "", label: s.name || s.sprintName || "Unnamed Sprint" })));
                } else {
                    console.error("Failed to load /api/sprints", await sRes.text());
                }
            } catch (e) {
                console.error("Failed to fetch sprints", e);
            }

        } catch (error) {
            console.error("Error loading test listes", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadListes();
    }, []);

    // Handlers
    async function handleAdd(dto: ListeRequestDto) {
        await createListe(dto);
        await loadListes();
        setIsAddOpen(false);
    }

    async function handleUpdate(id: string, dto: ListeRequestDto) {
        await updateListe(id, dto);
        await loadListes();
        setEditingListe(null);
    }

    async function handleDelete(id: string) {
        await deleteListe(id);
        await loadListes();
        setDeletingListe(null);
    }

    async function handleTaskAdd(dto: TaskRequestDto) {
        console.log("Task Create DTO:", dto);
        try { await createTask(dto); alert("Task created!"); setIsTaskAddOpen(false); } catch(e: any) { alert("Error: " + e.message); }
    }
    async function handleTaskUpdate(id: string, dto: TaskRequestDto) {
        console.log("Task Update DTO:", dto);
        try { await updateTask(id, dto); alert("Task updated!"); setEditingTask(null); } catch(e: any) { alert("Error: " + e.message); }
    }
    async function handleTaskDelete(id: string) {
        try { await deleteTask(id); alert("Task deleted!"); setDeletingTask(null); } catch(e: any) { alert("Error: " + e.message); }
    }

    async function handleSpaceAdd(dto: SpaceRequestDto) {
        console.log("Space Create DTO:", dto);
        try { await addSpace(dto); alert("Space created!"); setIsSpaceAddOpen(false); } catch(e: any) { alert("Error: " + e.message); }
    }
    async function handleSpaceUpdate(id: string, dto: SpaceRequestDto) {
        console.log("Space Update DTO:", dto);
        try { await updateSpace(id, dto); alert("Space updated!"); setEditingSpace(null); } catch(e: any) { alert("Error: " + e.message); }
    }
    async function handleSpaceDelete(id: string) {
        try { await deleteSpace(id); alert("Space deleted!"); setDeletingSpace(null); } catch(e: any) { alert("Error: " + e.message); }
    }

    return (
        <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#f1f1f1", minHeight: "100vh", background: "#0a0a0b" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "rgba(83, 74, 183, 0.2)", padding: 8, borderRadius: 8 }}>
                        <ListIcon size={24} style={{ color: "#7b61ff" }} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Test Page - Listes CRUD</h1>
                </div>

                <button
                    onClick={() => setIsAddOpen(true)}
                    style={{
                        background: "#534AB7", color: "white", padding: "10px 18px", borderRadius: 8,
                        border: "none", fontWeight: 600, cursor: "pointer", display: "flex", gap: 8, alignItems: "center"
                    }}
                >
                    <Plus size={16} /> New List
                </button>
            </div>

            {/* Test Buttons container */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <button onClick={() => setIsTaskAddOpen(true)} style={testBtnStyle("blue")}><Plus size={14}/> Test Add Task</button>
                <button onClick={() => setEditingTask({id: "999", title: "Dummy Task to Edit"})} style={testBtnStyle("blue")}><Edit2 size={14}/> Test Update Task</button>
                <button onClick={() => setDeletingTask({id: "999", title: "Dummy Task to Delete"})} style={testBtnStyle("red")}><Trash2 size={14}/> Test Delete Task</button>
                
                <button onClick={() => setIsSpaceAddOpen(true)} style={testBtnStyle("green")}><Plus size={14}/> Test Add Space</button>
                <button onClick={() => setEditingSpace({id: "888", name: "Dummy Space to Edit"})} style={testBtnStyle("green")}><Edit2 size={14}/> Test Update Space</button>
                <button onClick={() => setDeletingSpace({id: "888", name: "Dummy Space to Delete"})} style={testBtnStyle("red")}><Trash2 size={14}/> Test Delete Space</button>
            </div>

            {/* Content */}
            <div style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 20 }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "gray" }}>Loading listes...</div>
                ) : listes.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "gray" }}>No listes found. Try creating one!</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "12px 16px", color: "gray", fontSize: 13, fontWeight: 500 }}>NAME</th>
                                <th style={{ padding: "12px 16px", color: "gray", fontSize: 13, fontWeight: 500 }}>TYPE</th>
                                <th style={{ padding: "12px 16px", color: "gray", fontSize: 13, fontWeight: 500 }}>PARENT</th>
                                <th style={{ padding: "12px 16px", color: "gray", fontSize: 13, fontWeight: 500, width: 100 }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listes.map(liste => (
                                <tr key={liste.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "16px", fontWeight: 600 }}>{liste.name}</td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                                            {liste.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                        {liste.folderId ? `Folder: ${liste.folderId}` : liste.sprintId ? `Sprint: ${liste.sprintId}` : "None"}
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button
                                                onClick={() => setEditingListe(liste)}
                                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
                                            ><Edit2 size={16} /></button>
                                            <button
                                                onClick={() => setDeletingListe(liste)}
                                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#E24B4A" }}
                                            ><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {isAddOpen && (
                <ListeAdd
                    onSubmit={handleAdd}
                    onClose={() => setIsAddOpen(false)}
                    folders={apiFolders}
                    sprints={apiSprints}
                />
            )}

            {editingListe && (
                <ListeUpdate
                    listeId={editingListe.id}
                    defaults={{
                        name: editingListe.name,
                        type: editingListe.type,
                        order: editingListe.order,
                        folderId: editingListe.folderId,
                        sprintId: editingListe.sprintId,
                    }}
                    onSubmit={(dto) => handleUpdate(editingListe.id, dto)}
                    onClose={() => setEditingListe(null)}
                    folders={apiFolders}
                    sprints={apiSprints}
                />
            )}

            {deletingListe && (
                <ListeDelete
                    liste={deletingListe}
                    onDelete={handleDelete}
                    onClose={() => setDeletingListe(null)}
                />
            )}

            {isTaskAddOpen && (
                <TaskAdd 
                    onSubmit={handleTaskAdd} 
                    onClose={() => setIsTaskAddOpen(false)}
                    listes={listes.map(l => ({ value: l.id, label: l.name }))}
                    sprints={apiSprints}
                />
            )}

            {editingTask && (
                <TaskUpdate 
                    taskId={editingTask.id}
                    defaults={{ title: editingTask.title, description: "Hello description", listeId: listes[0]?.id || "" }}
                    onSubmit={(dto) => handleTaskUpdate(editingTask.id, dto)}
                    onClose={() => setEditingTask(null)}
                    listes={listes.map(l => ({ value: l.id, label: l.name }))}
                    sprints={apiSprints}
                />
            )}

            {deletingTask && (
                <TaskDelete 
                    task={deletingTask}
                    onDelete={handleTaskDelete}
                    onClose={() => setDeletingTask(null)}
                />
            )}

            {isSpaceAddOpen && (
                <SpaceAdd 
                    onSubmit={handleSpaceAdd} 
                    onClose={() => setIsSpaceAddOpen(false)}
                    workspaces={[{ value: "wk-123", label: "My Workspace" }]}
                />
            )}

            {editingSpace && (
                <SpaceUpdate 
                    spaceId={editingSpace.id}
                    defaults={{ name: editingSpace.name, isPrivate: false, workspaceId: "wk-123" }}
                    onSubmit={(dto) => handleSpaceUpdate(editingSpace.id, dto)}
                    onClose={() => setEditingSpace(null)}
                    workspaces={[{ value: "wk-123", label: "My Workspace" }]}
                />
            )}

            {deletingSpace && (
                <SpaceDelete 
                    space={deletingSpace}
                    onDelete={handleSpaceDelete}
                    onClose={() => setDeletingSpace(null)}
                />
            )}

        </div>
    );
}
