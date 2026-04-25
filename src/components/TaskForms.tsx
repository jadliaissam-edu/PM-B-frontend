import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { TaskRequestDto, TaskResponseDto, TaskStatus, Priority } from "../api/taskApi";
import { Modal } from "../components/ui/Modal";
import { FormGroup, TextField, TextArea, Select, SegmentedControl } from "../components/ui/FormControls";
import { Button } from "../components/ui/Button";
import { theme } from "../components/ui/theme";

export type { TaskRequestDto, TaskResponseDto };

interface SelectOption { value: string; label: string }

interface TaskFormProps {
    onSubmit: (data: TaskRequestDto) => Promise<void> | void;
    onClose: () => void;
    listes?: SelectOption[];
    sprints?: SelectOption[];
    assignees?: SelectOption[];
    defaults?: Partial<TaskRequestDto>;
}

interface TaskUpdateProps extends TaskFormProps {
    taskId: string;
}

interface TaskDeleteProps {
    task: { id: string; title: string };
    onDelete: (id: string) => Promise<void> | void;
    onClose: () => void;
}

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
    { value: "TO_DO", label: "To Do", color: "#6B7280" },
    { value: "IN_DEV", label: "In Dev", color: "#3B82F6" },
    { value: "IN_TEST", label: "In Test", color: "#F59E0B" },
    { value: "IN_REVIEW", label: "In Review", color: "#A855F7" },
    { value: "DONE", label: "Done", color: "#22C55E" },
];

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
    { value: "URGENT", label: "Urgent", color: "#E24B4A", dot: "#E24B4A" },
    { value: "HIGH", label: "High", color: "#F97316", dot: "#F97316" },
    { value: "MEDIUM", label: "Medium", color: "#F59E0B", dot: "#F59E0B" },
    { value: "LOW", label: "Low", color: "rgba(255,255,255,0.35)", dot: "#6B7280" },
];

function TaskFormBody({
    title, setTitle,
    description, setDescription,
    status, setStatus,
    priority, setPriority,
    dueDate, setDueDate,
    listeId, setListeId,
    sprintId, setSprintId,
    assigneeId, setAssigneeId,
    listes, sprints, assignees,
}: {
    title: string; setTitle: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    status: TaskStatus; setStatus: (v: TaskStatus) => void;
    priority: Priority; setPriority: (v: Priority) => void;
    dueDate: string; setDueDate: (v: string) => void;
    listeId: string; setListeId: (v: string) => void;
    sprintId: string; setSprintId: (v: string) => void;
    assigneeId: string; setAssigneeId: (v: string) => void;
    listes: SelectOption[]; sprints: SelectOption[]; assignees: SelectOption[];
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <FormGroup label="Title">
                <TextField
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Task title..."
                />
            </FormGroup>

            <FormGroup label="Description" optional>
                <TextArea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add a description..."
                />
            </FormGroup>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormGroup label="Status">
                    <SegmentedControl
                        options={STATUSES.map(s => ({ value: s.value, label: s.label, color: s.color }))}
                        value={status}
                        onChange={setStatus}
                    />
                </FormGroup>
                <FormGroup label="Priority">
                    <SegmentedControl
                        options={PRIORITIES.map(p => ({ value: p.value, label: p.label, dot: p.dot, color: p.color }))}
                        value={priority}
                        onChange={setPriority}
                    />
                </FormGroup>
            </div>

            <FormGroup label="Due Date" optional>
                <TextField
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ colorScheme: "dark" }}
                />
            </FormGroup>

            <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)", margin: "0 -24px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormGroup label="List">
                    <Select options={listes} value={listeId} onChange={setListeId} placeholder="Select list..." size="md" />
                </FormGroup>
                <FormGroup label="Sprint" optional>
                    <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select sprint..." size="md" />
                </FormGroup>
            </div>

            <FormGroup label="Assignee" optional>
                <Select options={assignees} value={assigneeId} onChange={setAssigneeId} placeholder="Assign to..." size="md" />
            </FormGroup>
        </div>
    );
}

export function TaskAdd({ onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {} }: TaskFormProps) {
    const [title, setTitle] = useState(defaults.title ?? "");
    const [description, setDescription] = useState(defaults.description ?? "");
    const [status, setStatus] = useState<TaskStatus>((defaults.status as TaskStatus) ?? "TO_DO");
    const [priority, setPriority] = useState<Priority>((defaults.priority as Priority) ?? "MEDIUM");
    const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
    const [listeId, setListeId] = useState(defaults.listeId ?? "");
    const [sprintId, setSprintId] = useState(defaults.sprintId ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [loading, setLoading] = useState(false);

    const isValid = title.trim().length > 0 && listeId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                listeId,
                sprintId: sprintId || undefined,
                assigneeId: assigneeId || undefined
            });
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <Modal onClose={onClose} title="New Task">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, listes, sprints, assignees }} />
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                    <Button type="button" variant="secondary" onClick={onClose} size="md">Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Creating..." size="md" disabled={!isValid}>Create Task</Button>
                </div>
            </form>
        </Modal>
    );
}

export function TaskUpdate({ taskId, onSubmit, onClose, listes = [], sprints = [], assignees = [], defaults = {} }: TaskUpdateProps) {
    const [title, setTitle] = useState(defaults.title ?? "");
    const [description, setDescription] = useState(defaults.description ?? "");
    const [status, setStatus] = useState<TaskStatus>((defaults.status as TaskStatus) ?? "TO_DO");
    const [priority, setPriority] = useState<Priority>((defaults.priority as Priority) ?? "MEDIUM");
    const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
    const [listeId, setListeId] = useState(defaults.listeId ?? "");
    const [sprintId, setSprintId] = useState(defaults.sprintId ?? "");
    const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
    const [loading, setLoading] = useState(false);

    const isValid = title.trim().length > 0 && listeId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                listeId,
                sprintId: sprintId || undefined,
                assigneeId: assigneeId || undefined
            });
            onClose();
        } finally { setLoading(false); }
    };

    return (
        <Modal onClose={onClose} title="Edit Task" description={`#${taskId.slice(-8)}`}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <TaskFormBody {...{ title, setTitle, description, setDescription, status, setStatus, priority, setPriority, dueDate, setDueDate, listeId, setListeId, sprintId, setSprintId, assigneeId, setAssigneeId, listes, sprints, assignees }} />
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                    <Button type="button" variant="secondary" onClick={onClose} size="md">Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Saving..." size="md" disabled={!isValid}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}

export function TaskDelete({ task, onDelete, onClose }: TaskDeleteProps) {
    const [loading, setLoading] = useState(false);

    return (
        <Modal 
            onClose={onClose} 
            title="Delete Task" 
            icon={<Trash2 size={24} style={{ color: theme.destructive }} />}
            width={400}
            padding={32}
        >
            <div style={{ textAlign: "center", marginBottom: 24, marginTop: -8 }}>
                <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                    You are about to permanently delete <strong style={{ color: "white" }}>"{task.title}"</strong>. All associated data will be removed.
                </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }} size="md">Cancel</Button>
                <Button
                    type="button"
                    variant="destructive"
                    loading={loading}
                    loadingText="Deleting..."
                    onClick={async () => {
                        setLoading(true);
                        try { await onDelete(task.id); onClose(); } finally { setLoading(false); }
                    }}
                    style={{ flex: 1 }}
                    size="md"
                >
                    Delete Task
                </Button>
            </div>
        </Modal>
    );
}

export default TaskAdd;