import { Plus, List, Pencil, Trash2 } from "lucide-react";
import type { ListeResponseDto } from "../api/listeApi";
import type { TaskResponseDto } from "../api/taskApi";

function getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}

function AssigneeAvatars({ names }: { names: string[] }) {
    if (!names || names.length === 0) {
        return <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Unassigned</span>;
    }

    return (
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            {names.slice(0, 3).map((name, i) => {
                const initials = getInitials(name);
                const bgColors = ["#4F46E5", "#0ea5e9", "#10b981", "#f59e0b"];
                const bgColor = bgColors[i % bgColors.length];

                return (
                    <div
                        key={name + i}
                        title={name}
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: bgColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            fontWeight: 700,
                            border: "1.5px solid var(--bg-card)",
                            marginLeft: i > 0 ? -6 : 0,
                            zIndex: 10 - i,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            fontFamily: "'DM Sans', sans-serif"
                        }}
                    >
                        {initials}
                    </div>
                );
            })}
            {names.length > 3 && (
                <div
                    title={names.slice(3).join(", ")}
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--bg-hover)",
                        color: "var(--text-sub)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        border: "1.5px solid var(--bg-card)",
                        marginLeft: -6,
                        zIndex: 5,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        fontFamily: "'DM Sans', sans-serif"
                    }}
                >
                    +{names.length - 3}
                </div>
            )}
        </div>
    );
}

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
        <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Workspace Lists</h2>
                    <p style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 4 }}>All phase and sprint lists across folders</p>
                </div>
                {onAddList && (
                    <button
                        onClick={onAddList}
                        style={{
                            padding: "8px 12px", background: "rgba(83,74,183,0.15)", border: "1px solid rgba(83,74,183,0.4)",
                            borderRadius: 8, color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                        }}
                    >
                        <Plus size={15} /> New List
                    </button>
                )}
            </div>

            {lists.length === 0 && _tasks.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "var(--text-sub)" }}>
                    <List size={32} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 500 }}>No items found yet.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 20px 20px" }}>
                    {lists.map((list) => {
                        const listTasks = _tasks.filter(t => t.listeId === list.id || t.sprintId === list.id);
                        return (
                            <div key={list.id} style={{ background: "var(--bg-hover)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 16 }}>
                                {/* List Header */}
                                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--sidebar-bg)", borderBottom: listTasks.length > 0 ? "1px solid var(--border)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: list.type === "SPRINT" ? "var(--warning)" : "var(--accent)" }} />
                                        <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 13 }}>{list.name}</span>
                                        <span style={{ fontSize: 11, color: "var(--text-sub)" }}>{listTasks.length} tasks</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {onEditList && <button onClick={() => onEditList(list)} className="icon-btn" style={{ width: 26, height: 26 }} title="Edit List"><Pencil size={12} /></button>}
                                        {onDeleteList && <button onClick={() => onDeleteList(list)} className="icon-btn" style={{ width: 26, height: 26, color: "var(--error)" }} title="Delete List"><Trash2 size={12} /></button>}
                                    </div>
                                </div>
                                
                                {/* Tasks Table */}
                                {listTasks.length > 0 ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                            <thead>
                                                    <tr style={{ background: "transparent" }}>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Task Name</th>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 120 }}>Status</th>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 100 }}>Priority</th>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 120 }}>Due Date</th>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", width: 120 }}>Assignee</th>
                                                        <th style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", textAlign: "right", width: 100 }}>Actions</th>
                                                    </tr>
                                            </thead>
                                            <tbody>
                                                {listTasks.map((task) => (
                                                    <tr key={task.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                        <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-main)", fontWeight: 500 }}>{task.title}</td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--bg-hover)", border: "0.5px solid var(--border)", color: "var(--text-sub)" }}>
                                                                {task.status.replace("_", " ")}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            {task.priority ? (
                                                                <span style={{ 
                                                                    fontSize: 10, 
                                                                    color: task.priority === "URGENT" ? "var(--error)" : task.priority === "HIGH" ? "var(--warning)" : task.priority === "LOW" ? "var(--success)" : "var(--accent)", 
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase"
                                                                }}>{task.priority}</span>
                                                            ) : <span style={{ color: "var(--text-faint)" }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-sub)" }}>
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : <span style={{ opacity: 0.5 }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: "10px 16px" }}>
                                                            <AssigneeAvatars names={task.assigneeNames || (task.assigneeName ? [task.assigneeName] : [])} />
                                                        </td>
                                                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                                <button onClick={() => _onEditTask(task)} className="icon-btn" style={{ width: 24, height: 24 }} title="Edit Task"><Pencil size={11} /></button>
                                                                <button onClick={() => _onDeleteTask(task)} className="icon-btn" style={{ width: 24, height: 24, color: "var(--error)" }} title="Delete Task"><Trash2 size={11} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ padding: "16px", fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>No tasks in this list.</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
