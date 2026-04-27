import { type ReactNode, useState } from "react";
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
import { Trash2, Pencil, GripVertical, User, AlignLeft, ChevronDown, ChevronUp } from "lucide-react";
import type { TaskResponseDto, TaskStatus } from "../api/taskApi";

interface BoardViewProps {
    tasks: TaskResponseDto[];
    onEditTask: (task: TaskResponseDto) => void;
    onDeleteTask: (task: TaskResponseDto) => void;
    onStatusChange: (task: TaskResponseDto, newStatus: TaskStatus) => void;
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
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                cursor: "default",
                transition: "transform 0.15s, background 0.15s",
                boxShadow: isDragging ? "0 18px 45px rgba(0,0,0,0.18)" : "none",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ 
                        fontSize: 13, 
                        color: "#fff",
                        display: showDesc ? "block" : "-webkit-box",
                        WebkitLineClamp: showDesc ? undefined : 2,
                        WebkitBoxOrient: showDesc ? undefined : "vertical",
                        overflow: showDesc ? "visible" : "hidden",
                        textOverflow: showDesc ? "clip" : "ellipsis",
                        wordBreak: "break-word",
                        lineHeight: 1.4
                    }}>
                        {task.title}
                    </strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {task.priority && (
                        <span style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.1)",
                            color: priorityColors[task.priority.toLowerCase()] || "#fff",
                            textTransform: "uppercase",
                            fontWeight: 600,
                        }}>
                            {task.priority}
                        </span>
                    )}
                    <div {...listeners} style={{ cursor: "grab", color: "rgba(255,255,255,0.4)" }}>
                        <GripVertical size={14} />
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowDesc(!showDesc); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "rgba(255,255,255,0.05)", borderRadius: 6, width: 22, height: 22, color: "rgba(255,255,255,0.55)", cursor: "pointer", padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    >
                        {showDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {showDesc && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                            {task.dueDate && (
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={(event) => { event.stopPropagation(); onEditTask(task); }} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                                <Pencil size={12} />
                            </button>
                            <button onClick={(event) => { event.stopPropagation(); onDeleteTask(task); }} style={{ border: "none", background: "transparent", color: "#E24B4A", cursor: "pointer" }}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    {task.description ? (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                            {task.description}
                        </p>
                    ) : (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>No description</p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{task.listeName ?? task.sprintName ?? "No parent"}</span>
                        {task.assigneeName && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                                <User size={11} />
                                <span>{task.assigneeName}</span>
                            </div>
                        )}
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
}: {
    column: typeof columns[number];
    children: ReactNode;
    count: number;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.key });

    return (
        <div
            ref={setNodeRef}
            style={{
                background: isOver ? "rgba(124, 58, 237, 0.15)" : "#16161a",
                border: `1px solid ${isOver ? "rgba(124, 58, 237, 0.35)" : "rgba(255,255,255,0.08)"}`,
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{column.label}</span>
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{count}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 80 }}>
                {children}
            </div>
        </div>
    );
}

export default function BoardView({ tasks, onEditTask, onDeleteTask, onStatusChange }: BoardViewProps) {
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
                {columns.map((column) => (
                    <ColumnZone key={column.key} column={column} count={tasksByStatus[column.key].length}>
                        {tasksByStatus[column.key].length === 0 ? (
                            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12, minHeight: 60 }}>
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

            <DragOverlay>
                {activeTask ? (
                    <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", width: 260 }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: 6, fontSize: 13 }}>{activeTask.title}</strong>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: 0 }}>{activeTask.description || "No description"}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
