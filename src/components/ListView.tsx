import { Plus, List, Pencil, Trash2 } from "lucide-react";
import type { ListeResponseDto } from "../api/listeApi";
import type { TaskResponseDto } from "../api/taskApi";

interface ListViewProps {
    lists: ListeResponseDto[];
    tasks: TaskResponseDto[];
    onEditTask: (task: TaskResponseDto) => void;
    onDeleteTask: (task: TaskResponseDto) => void;
    onEditList?: (list: ListeResponseDto) => void;
    onDeleteList?: (list: ListeResponseDto) => void;
    onAddList?: () => void;
}

export default function ListView({ lists, tasks: _tasks, onEditTask: _onEditTask, onDeleteTask: _onDeleteTask, onEditList, onDeleteList, onAddList }: ListViewProps) {
    return (
        <div style={{ background: "#16161a", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "24px 32px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Workspace Lists</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>All phase and sprint lists across folders</p>
                </div>
                {onAddList && (
                    <button
                        onClick={onAddList}
                        style={{
                            padding: "10px 16px", background: "rgba(83,74,183,0.15)", border: "1px solid rgba(83,74,183,0.4)",
                            borderRadius: 12, color: "#a89ef5", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                        }}
                    >
                        <Plus size={15} /> New List
                    </button>
                )}
            </div>

            {lists.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
                    <List size={32} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 500 }}>No lists found yet.</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Create a space and folder to start adding lists.</p>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                                <th style={{ padding: "16px 32px", fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Name</th>
                                <th style={{ padding: "16px 32px", fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Type</th>
                                <th style={{ padding: "16px 32px", fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Context</th>
                                <th style={{ padding: "16px 32px", fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lists.map((list) => (
                                <tr key={list.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                                    <td style={{ padding: "20px 32px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: list.type === "SPRINT" ? "#EF9F27" : "#534AB7" }} />
                                            <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{list.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "20px 32px" }}>
                                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                                            {list.type || "List"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "20px 32px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                                        {list.folderName ?? list.sprintName ?? "Root Level"}
                                    </td>
                                    <td style={{ padding: "20px 32px", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                            {onEditList && <button onClick={() => onEditList(list)} className="icon-btn" style={{ width: 30, height: 30 }}><Pencil size={14} /></button>}
                                            {onDeleteList && <button onClick={() => onDeleteList(list)} className="icon-btn" style={{ width: 30, height: 30, color: "#E24B4A" }}><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
