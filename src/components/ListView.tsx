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
        <div style={{ background: "#16161a", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, margin: 0 }}>Workspace Lists</h2>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>All phase and sprint lists across folders</p>
                </div>
                {onAddList && (
                    <button
                        onClick={onAddList}
                        style={{
                            padding: "8px 12px", background: "rgba(83,74,183,0.15)", border: "1px solid rgba(83,74,183,0.4)",
                            borderRadius: 8, color: "#a89ef5", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                        }}
                    >
                        <Plus size={15} /> New List
                    </button>
                )}
            </div>

            {lists.length === 0 && _tasks.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
                    <List size={32} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 500 }}>No items found yet.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 20px 20px" }}>
                    {lists.map((list) => {
                        const listTasks = _tasks.filter(t => t.listeId === list.id || t.sprintId === list.id);
                        return (
                            <div key={list.id} style={{ background: "rgba(255,255,255,0.01)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                                {/* List Header */}
                                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderBottom: listTasks.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: list.type === "SPRINT" ? "#EF9F27" : "#534AB7" }} />
                                        <span style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{list.name}</span>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{listTasks.length} tasks</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {onEditList && <button onClick={() => onEditList(list)} className="icon-btn" style={{ width: 26, height: 26 }} title="Edit List"><Pencil size={12} /></button>}
                                        {onDeleteList && <button onClick={() => onDeleteList(list)} className="icon-btn" style={{ width: 26, height: 26, color: "#E24B4A" }} title="Delete List"><Trash2 size={12} /></button>}
                                    </div>
                                </div>
                                
                                {/* Tasks Table */}
                                {listTasks.length > 0 ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                            <thead>
                                                <tr style={{ background: "transparent" }}>
                                                    <th style={{ padding: "10px 16px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Task Name</th>
                                                    <th style={{ padding: "10px 16px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 120 }}>Status</th>
                                                    <th style={{ padding: "10px 16px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 100 }}>Priority</th>
                                                    <th style={{ padding: "10px 16px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 120 }}>Due Date</th>
                                                    <th style={{ padding: "10px 16px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", textAlign: "right", width: 100 }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {listTasks.map((task) => (
                                                    <tr key={task.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                        <td style={{ padding: "10px 16px", fontSize: 13, color: "#fff", fontWeight: 500 }}>{task.title}</td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                                                                {task.status.replace("_", " ")}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            {task.priority ? (
                                                                <span style={{ fontSize: 10, color: task.priority === "URGENT" ? "#E24B4A" : task.priority === "HIGH" ? "#EF9F27" : task.priority === "LOW" ? "#1D9E75" : "#534AB7", fontWeight: 600 }}>{task.priority}</span>
                                                            ) : <span style={{ color: "rgba(255,255,255,0.2)" }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: "10px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : <span style={{ color: "rgba(255,255,255,0.2)" }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                                <button onClick={() => _onEditTask(task)} className="icon-btn" style={{ width: 24, height: 24 }} title="Edit Task"><Pencil size={11} /></button>
                                                                <button onClick={() => _onDeleteTask(task)} className="icon-btn" style={{ width: 24, height: 24, color: "#E24B4A" }} title="Delete Task"><Trash2 size={11} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>No tasks in this list.</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
