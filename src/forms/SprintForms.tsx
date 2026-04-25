import { Trash2, Target } from "lucide-react";
import { useState } from "react";
import type { SprintRequestDto, SprintResponseDto } from "../api/sprintApi";
import { Modal } from "../components/ui/Modal";
import { FormGroup, TextField, TextArea, Select } from "../components/ui/FormControls";
import { Button } from "../components/ui/Button";
import { theme } from "../components/ui/theme";

export type { SprintRequestDto, SprintResponseDto };

interface SelectOption { value: string; label: string }

interface SprintFormProps {
    onSubmit: (data: SprintRequestDto) => Promise<void> | void;
    onClose: () => void;
    folders: SelectOption[];
    defaults?: Partial<SprintRequestDto>;
}

export function SprintAdd({ onSubmit, onClose, folders, defaults }: SprintFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [goal, setGoal] = useState(defaults?.goal || "");
    const [folderId, setFolderId] = useState(defaults?.folderId || "");
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(defaults?.startDate?.split('T')[0] || today);
    const [endDate, setEndDate] = useState(defaults?.endDate?.split('T')[0] || today);
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId && startDate && endDate && new Date(startDate) <= new Date(endDate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({ 
                name: name.trim(), 
                goal: goal.trim(), 
                startDate: `${startDate}T00:00:00`, 
                endDate: `${endDate}T23:59:59`, 
                folderId, 
                isActive: true 
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title="New Sprint" 
            description="Sprints help your team focus on a set of tasks to deliver within a specific timeframe."
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Sprint Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sprint 1, Q2 Launch"
                    />
                </FormGroup>

                <FormGroup label="Sprint Goal">
                    <div style={{ position: "relative" }}>
                        <Target size={18} style={{ position: "absolute", top: 16, left: 18, color: theme.textMuted }} />
                        <TextArea
                            style={{ paddingLeft: 48, minHeight: 80, resize: "none" }}
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="What's the main objective of this sprint?"
                        />
                    </div>
                </FormGroup>

                <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Start Date">
                            <TextField
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="End Date">
                            <TextField
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                </div>

                <FormGroup label="Parent Folder">
                    <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select parent folder" />
                </FormGroup>

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="submit" loading={loading} loadingText="Creating..." fullWidth disabled={!isValid}>
                        Create Sprint
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export function SprintUpdate({ onSubmit, onClose, folders, defaults }: SprintFormProps & { sprintId: string }) {
    const today = new Date().toISOString().split('T')[0];
    const [name, setName] = useState(defaults?.name || "");
    const [goal, setGoal] = useState(defaults?.goal || "");
    const [folderId, setFolderId] = useState(defaults?.folderId || "");
    const [startDate, setStartDate] = useState(defaults?.startDate?.split('T')[0] || today);
    const [endDate, setEndDate] = useState(defaults?.endDate?.split('T')[0] || today);
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId && startDate && endDate && new Date(startDate) <= new Date(endDate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({ 
                name: name.trim(), 
                goal: goal.trim(), 
                startDate: startDate.includes('T') ? startDate : `${startDate}T00:00:00`, 
                endDate: endDate.includes('T') ? endDate : `${endDate}T23:59:59`, 
                folderId, 
                isActive: defaults?.isActive ?? true 
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Edit Sprint" description="Update sprint details, goals, or timeframes.">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Sprint Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Sprint Goal">
                    <div style={{ position: "relative" }}>
                        <Target size={18} style={{ position: "absolute", top: 16, left: 18, color: theme.textMuted }} />
                        <TextArea
                            style={{ paddingLeft: 48, minHeight: 80, resize: "none" }}
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                        />
                    </div>
                </FormGroup>

                <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Start Date">
                            <TextField
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="End Date">
                            <TextField
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                </div>

                <FormGroup label="Parent Folder">
                    <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select parent folder" />
                </FormGroup>

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Saving..." style={{ flex: 2 }} disabled={!isValid}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}

export function SprintDelete({ sprint, onDelete, onClose }: { sprint: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <Modal 
            onClose={onClose} 
            title="Delete Sprint" 
            icon={<Trash2 size={28} style={{ color: theme.destructive }} />}
            width={420}
        >
            <div style={{ textAlign: "center", marginBottom: 24, marginTop: -8 }}>
                <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                    Permanently delete <strong style={{ color: "white" }}>{sprint.name}</strong>? This will remove all associated lists and tasks. This action is irreversible.
                </p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
                <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
                <Button
                    type="button"
                    variant="destructive"
                    loading={loading}
                    loadingText="Deleting..."
                    onClick={async () => {
                        setLoading(true);
                        try { await onDelete(sprint.id); onClose(); } finally { setLoading(false); }
                    }}
                    style={{ flex: 1.2 }}
                >
                    Confirm Delete
                </Button>
            </div>
        </Modal>
    );
}
