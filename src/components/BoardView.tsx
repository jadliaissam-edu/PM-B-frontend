import { type ReactNode, useEffect, useRef, useState } from "react";
import {
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, GripVertical, User, ChevronDown, ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import type { TaskResponseDto, TaskStatus } from "../api/taskApi";

function getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}

function AssigneeAvatars({ names }: { names: string[] }) {
    if (!names || names.length === 0) return null;

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

interface BoardViewProps {
    tasks: TaskResponseDto[];
    onEditTask: (task: TaskResponseDto) => void;
    onDeleteTask: (task: TaskResponseDto) => void;
    onStatusChange: (task: TaskResponseDto, newStatus: TaskStatus) => void;
    onAddTask: (status: TaskStatus) => void;
}

const columns = [
    { key: "TO_DO" as const, label: "To Do", accent: "#6B7280" },
    { key: "IN_DEV" as const, label: "In Development", accent: "#3B82F6" },
    { key: "IN_TEST" as const, label: "In Testing", accent: "#F59E0B" },
    { key: "IN_REVIEW" as const, label: "In Review", accent: "#A855F7" },
    { key: "DONE" as const, label: "Done", accent: "#22C55E" },
];

const priorityColors: Record<string, string> = {
    urgent: "#E24B4A",
    high: "#EF9F27",
    medium: "#534AB7",
    low: "#1D9E75",
};

type BoardColumnKey = (typeof columns)[number]["key"];

function TaskCard({ task, onEditTask, onDeleteTask }: { task: TaskResponseDto; onEditTask: (task: TaskResponseDto) => void; onDeleteTask: (task: TaskResponseDto) => void; }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });
    
    const [showDesc, setShowDesc] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.45 : 1,
        touchAction: "manipulation" as const,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            style={{
                ...style,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                cursor: "default",
                transition: "transform 0.15s, background 0.15s",
                boxShadow: isDragging ? "0 18px 45px rgba(0,0,0,0.18)" : "none",
                position: "relative",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                    <strong style={{ 
                        fontSize: 13, 
                        color: "var(--text-main)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word",
                        lineHeight: 1.4
                    }}>
                        {task.title}
                    </strong>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                    {task.priority && (
                        <span style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "var(--bg-hover)",
                            color: priorityColors[task.priority.toLowerCase()] || "#fff",
                            textTransform: "uppercase",
                            fontWeight: 600,
                        }}>
                            {task.priority}
                        </span>
                    )}

                    {task.dueDate && (
                        <span style={{ fontSize: 10, color: "var(--text-sub)", background: "var(--bg-hover)", padding: "2px 6px", borderRadius: 4 }}>
                            {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    )}

                    <div {...listeners} style={{ cursor: "grab", color: "var(--text-faint)" }}>
                        <GripVertical size={14} />
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <AssigneeAvatars names={task.assigneeNames || (task.assigneeName ? [task.assigneeName] : [])} />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowDesc((prev) => !prev); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "rgba(255,255,255,0.05)", borderRadius: 6, width: 22, height: 22, color: "rgba(255,255,255,0.55)", cursor: "pointer", padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    >
                        {showDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <div ref={menuRef} style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "none",
                                background: "var(--bg-hover)",
                                borderRadius: 6,
                                width: 22,
                                height: 22,
                                color: "var(--text-sub)",
                                cursor: "pointer",
                                padding: 0,
                            }}
                            title="Task actions"
                        >
                            <MoreHorizontal size={14} />
                        </button>

                        {menuOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 26,
                                    right: 0,
                                    minWidth: 118,
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--bg-card)",
                                    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                                    zIndex: 30,
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setMenuOpen(false);
                                        onEditTask(task);
                                    }}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--text-main)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 10px",
                                        fontSize: 11,
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <Pencil size={12} />
                                    Edit task
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setMenuOpen(false);
                                        onDeleteTask(task);
                                    }}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        borderTop: "1px solid rgba(255,255,255,0.08)",
                                        background: "transparent",
                                        color: "#fda4af",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 10px",
                                        fontSize: 11,
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <Trash2 size={12} />
                                    Delete task
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showDesc && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
                    {task.description ? (
                        <p style={{ fontSize: 11, color: "var(--text-sub)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                            {task.description}
                        </p>
                    ) : (
                        <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>No description</p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{task.listeName ?? task.sprintName ?? "No parent"}</span>
                        <AssigneeAvatars names={task.assigneeNames || (task.assigneeName ? [task.assigneeName] : [])} />
                    </div>
                </div>
            )}
        </div>
    );
}

function ColumnZone({
    column,
    children,
    count,
    onAddTask,
}: {
    column: typeof columns[number];
    children: ReactNode;
    count: number;
    onAddTask: (status: TaskStatus) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.key });
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            ref={setNodeRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: isOver ? "var(--accent-soft)" : "var(--bg-main)",
                border: `1px solid ${isOver ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12,
                padding: 14,
                minHeight: 360,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: column.accent, display: "inline-block" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{column.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{count}</span>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onAddTask(column.key);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            border: "1px solid var(--border)",
                            background: "var(--bg-hover)",
                            color: "var(--text-sub)",
                            borderRadius: 999,
                            padding: "3px 9px",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: isHovered || isOver ? 1 : 0,
                            transform: isHovered || isOver ? "translateY(0)" : "translateY(-2px)",
                            pointerEvents: isHovered || isOver ? "auto" : "none",
                            transition: "opacity 0.14s ease, transform 0.14s ease",
                        }}
                        title={`Add task in ${column.label}`}
                    >
                        <Plus size={11} />
                        Task
                    </button>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 80 }}>
                {children}
            </div>
        </div>
    );
}

export default function BoardView({ tasks, onEditTask, onDeleteTask, onStatusChange, onAddTask }: BoardViewProps) {
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

    const tasksByStatus = columns.reduce((map, column) => {
        map[column.key] = tasks.filter((task) => task.status === column.key);
        return map;
    }, {} as Record<BoardColumnKey, TaskResponseDto[]>);

    const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveTaskId(active.id as string);
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveTaskId(null);

        if (!over || active.id === over.id) return;
        const targetStatus = columns.find((column) => column.key === over.id)?.key;
        const task = tasks.find((item) => item.id === active.id);

        if (task && targetStatus && task.status !== targetStatus) {
            onStatusChange(task, targetStatus);
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 6 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns.length}, minmax(300px, 320px))`,
                        gap: 12,
                        alignItems: "start",
                        width: "max-content",
                        minWidth: "100%",
                    }}
                >
                    {columns.map((column) => (
                        <ColumnZone
                            key={column.key}
                            column={column}
                            count={tasksByStatus[column.key].length}
                            onAddTask={onAddTask}
                        >
                            {tasksByStatus[column.key].length === 0 ? (
                                <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-hover)", color: "var(--text-faint)", fontSize: 12, minHeight: 60 }}>
                                    No tasks yet.
                                </div>
                            ) : (
                                tasksByStatus[column.key].map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEditTask={onEditTask}
                                        onDeleteTask={onDeleteTask}
                                    />
                                ))
                            )}
                        </ColumnZone>
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", width: 260, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                        <strong style={{ color: "var(--text-main)", display: "block", marginBottom: 6, fontSize: 13 }}>{activeTask.title}</strong>
                        <p style={{ fontSize: 11, color: "var(--text-sub)", margin: 0 }}>{activeTask.description || "No description"}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}