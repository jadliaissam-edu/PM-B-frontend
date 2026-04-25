import { type ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { Trash2, Pencil, GripVertical, User, Flag, Circle, Plus, AlignLeft } from "lucide-react";
import type { TaskResponseDto, TaskStatus, Priority } from "../api/taskApi";

interface BoardViewProps {
    tasks: TaskResponseDto[];
    onEditTask: (task: TaskResponseDto) => void;
    onDeleteTask: (task: TaskResponseDto) => void;
    onStatusChange: (task: TaskResponseDto, newStatus: TaskStatus) => void;
    onPriorityChange?: (task: TaskResponseDto, priority?: Priority) => void;
    onAddTask?: (status: TaskStatus) => void;
}

const columns = [
    { key: "TO_DO" as const, label: "TO DO", accent: "#6B7280" },
    { key: "IN_DEV" as const, label: "IN PROGRESS", accent: "#7C3AED" },
    { key: "IN_TEST" as const, label: "IN TESTING", accent: "#F59E0B" },
    { key: "IN_REVIEW" as const, label: "IN REVIEW", accent: "#3B82F6" },
    { key: "DONE" as const, label: "DONE", accent: "#22C55E" },
];

const priorityColors: Record<string, string> = {
    urgent: "#E24B4A",
    high: "#F97316",
    medium: "#534AB7",
    low: "#1D9E75",
};

type BoardColumnKey = (typeof columns)[number]["key"];

const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];

function TaskCard({ task, onEditTask, onDeleteTask, onPriorityChange }: { task: TaskResponseDto; onEditTask: (task: TaskResponseDto) => void; onDeleteTask: (task: TaskResponseDto) => void; onPriorityChange?: (task: TaskResponseDto, priority?: Priority) => void; }) {
    const [isHovered, setIsHovered] = useState(false);
    const [showDesc, setShowDesc] = useState(false);
    const [descCoords, setDescCoords] = useState<{ x: number; y: number } | null>(null);
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const hideTimeout = useRef<number | null>(null);
    const priorityRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showPriorityMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
                setShowPriorityMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPriorityMenu]);

    const handleDescEnter = (e: React.MouseEvent) => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setDescCoords({ x: rect.left, y: Math.min(rect.bottom + 8, window.innerHeight - 300) });
        setShowDesc(true);
    };

    const handleDescLeave = () => {
        hideTimeout.current = setTimeout(() => {
            setShowDesc(false);
        }, 200);
    };
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.5 : 1,
        touchAction: "manipulation" as const,
        zIndex: isDragging ? 10 : (showPriorityMenu || isHovered ? 5 : 1),
    };

    const assigneeInitials = task.assigneeName ? task.assigneeName.substring(0, 2).toUpperCase() : null;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                ...style,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#16161a",
                cursor: "pointer",
                transition: "border 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                position: "relative",
            }}
            onClick={() => onEditTask(task)}
        >
            {/* Removed absolute hover actions, they will be placed in the bottom row */}
            
            <div {...listeners} onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 12, right: 12, color: isHovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)", cursor: "grab", zIndex: 2, transition: "color 0.2s" }}>
                <GripVertical size={14} />
            </div>

            <div style={{ paddingRight: 24, marginBottom: 16 }}>
                <strong style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontWeight: 500 }}>
                    {task.title}
                </strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {assigneeInitials ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1D9E75", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }} title={task.assigneeName}>
                        {assigneeInitials}
                    </div>
                ) : (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
                        <User size={10} />
                    </div>
                )}
                
                {task.description && (
                    <div style={{ position: "relative" }} onMouseLeave={handleDescLeave}>
                        <div 
                            onMouseEnter={handleDescEnter}
                            style={{ color: "rgba(255,255,255,0.3)", cursor: "default", display: "flex", alignItems: "center", transition: "color 0.2s" }}
                        >
                            <AlignLeft size={14} />
                        </div>
                        {showDesc && descCoords && createPortal(
                            <div 
                                onMouseEnter={() => { if (hideTimeout.current) clearTimeout(hideTimeout.current); }}
                                onMouseLeave={handleDescLeave}
                                style={{ position: "fixed", top: descCoords.y, left: descCoords.x, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "16px 20px", zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.8)", width: "max-content", maxWidth: 450, maxHeight: "50vh", overflowY: "auto", color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                            >
                                {task.description}
                            </div>,
                            document.body
                        )}
                    </div>
                )}
                
                <div style={{ position: "relative" }} ref={priorityRef}>
                    <div 
                        onClick={(e) => { e.stopPropagation(); setShowPriorityMenu(!showPriorityMenu); }}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: showPriorityMenu ? "rgba(255,255,255,0.05)" : "transparent", transition: "background 0.2s" }}
                        title="Set Priority"
                    >
                        <Flag size={12} color={task.priority ? priorityColors[task.priority.toLowerCase()] : "rgba(255,255,255,0.2)"} />
                    </div>
                    {showPriorityMenu && (
                        <div style={{ position: "absolute", top: 28, left: 0, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 4, zIndex: 20, boxShadow: "0 8px 16px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", minWidth: 100 }}>
                            {priorities.map((p) => (
                                <button
                                    key={p}
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (onPriorityChange) {
                                            const pVal = p === "NONE" ? undefined : (p as Priority);
                                            onPriorityChange(task, pVal); 
                                        }
                                        setShowPriorityMenu(false); 
                                    }}
                                    style={{ 
                                        padding: "6px 10px", 
                                        background: "transparent", 
                                        border: "none", 
                                        color: p === "NONE" ? "rgba(255,255,255,0.5)" : priorityColors[p.toLowerCase()], 
                                        textAlign: "left", 
                                        fontSize: 12, 
                                        fontWeight: 600, 
                                        cursor: "pointer", 
                                        borderRadius: 4,
                                        transition: "background 0.2s" 
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Action Buttons (Always Visible) pushed to the right */}
                <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); onEditTask(task); }} 
                        style={{ width: 24, height: 24, border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                        title="Edit"
                    >
                        <Pencil size={12} />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }} 
                        style={{ width: 24, height: 24, border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(226,75,74,0.1)"; e.currentTarget.style.color = "#E24B4A"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
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
    onAddTask?: (status: TaskStatus) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.key });

    return (
        <div
            ref={setNodeRef}
            style={{
                background: isOver ? "rgba(255,255,255,0.02)" : "transparent",
                minHeight: 360,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                borderRadius: 16,
                transition: "background 0.2s"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ 
                    display: "flex", alignItems: "center", gap: 6, 
                    background: `${column.accent}15`, 
                    border: `1px solid ${column.accent}40`,
                    borderRadius: 12, padding: "4px 10px", 
                }}>
                    <Circle size={10} style={{ color: column.accent, fill: column.accent }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>{column.label}</span>
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{count}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 120 }}>
                {children}
                {count === 0 && (
                    <div style={{ padding: "20px 10px", textAlign: "center", border: `1px dashed ${column.accent}40`, borderRadius: 12, background: "rgba(255,255,255,0.01)", color: "rgba(255,255,255,0.25)", fontSize: 12, transition: "background 0.2s" }}>
                        Drop tasks here
                    </div>
                )}
            </div>
            
            <button 
                onClick={() => onAddTask?.(column.key)}
                style={{ 
                    marginTop: 12, 
                    background: "transparent", 
                    border: "none", 
                    color: column.accent, 
                    fontSize: 13, 
                    fontWeight: 500, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6,
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                    transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
                <Plus size={14} /> Add Task
            </button>
        </div>
    );
}

export default function BoardView({ tasks, onEditTask, onDeleteTask, onStatusChange, onPriorityChange, onAddTask }: BoardViewProps) {
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
            <div style={{ width: "100%", overflowX: "auto", paddingBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(240px, 1fr))", gap: 16, alignItems: "start", minWidth: "max-content" }}>
                    {columns.map((column) => (
                        <ColumnZone key={column.key} column={column} count={tasksByStatus[column.key].length} onAddTask={onAddTask}>
                            {tasksByStatus[column.key].map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onEditTask={onEditTask}
                                    onDeleteTask={onDeleteTask}
                                    onPriorityChange={onPriorityChange}
                                />
                            ))}
                        </ColumnZone>
                    ))}
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div style={{ padding: "12px 14px", borderRadius: 12, background: "#16161a", border: "1px solid rgba(255,255,255,0.15)", width: 240, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", opacity: 0.9, cursor: "grabbing" }}>
                        <strong style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontWeight: 500 }}>{activeTask.title}</strong>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: activeTask.description ? 6 : 10 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1D9E75", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                                {activeTask.assigneeName ? activeTask.assigneeName.substring(0, 2).toUpperCase() : <User size={10} />}
                            </div>
                            <Flag size={12} color={activeTask.priority ? priorityColors[activeTask.priority.toLowerCase()] : "rgba(255,255,255,0.2)"} />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
