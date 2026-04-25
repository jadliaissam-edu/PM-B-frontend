import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { ListeRequestDto, ListeResponseDto, ListType } from "../api/listeApi";
import { Modal } from "../components/ui/Modal";
import { FormGroup, TextField, Select, SegmentedControl } from "../components/ui/FormControls";
import { Button } from "../components/ui/Button";
import { theme } from "../components/ui/theme";

export type { ListeRequestDto, ListeResponseDto };

interface SelectOption { value: string; label: string }

interface ListeFormProps {
    onSubmit: (data: ListeRequestDto) => Promise<void> | void;
    onClose: () => void;
    defaultOrder?: number;
    folders?: SelectOption[];
    sprints?: SelectOption[];
    defaults?: Partial<ListeRequestDto>;
}

const LIST_TYPES: { value: ListType; label: string; description: string }[] = [
    { value: "SPRINT", label: "Sprint", description: "Sprint tasks" },
    { value: "PHASE", label: "Phase", description: "Project phase" },
];

export function ListeAdd({ onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeFormProps) {
    const [name, setName] = useState(defaults.name || "");
    const [type, setType] = useState<ListType>(defaults.type || "SPRINT");
    const [order, setOrder] = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(),
                type,
                order,
                folderId: folderId || undefined,
                sprintId: sprintId || undefined
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title="New List" 
            description="Organize tasks within a folder or sprint."
            width={480}
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <FormGroup label="Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sprint 1, Backlog..."
                    />
                </FormGroup>

                <FormGroup label="Type">
                    <SegmentedControl
                        options={LIST_TYPES}
                        value={type}
                        onChange={(v) => setType(v as ListType)}
                    />
                </FormGroup>

                <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Folder">
                            <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder..." size="md" />
                        </FormGroup>
                    </div>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Sprint" optional>
                            <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select Sprint..." size="md" />
                        </FormGroup>
                    </div>
                </div>

                <FormGroup label="Order" optional>
                    <TextField
                        type="number"
                        min={0}
                        value={order}
                        onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                </FormGroup>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                    <Button type="button" variant="secondary" onClick={onClose} size="md">Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Creating..." size="md" disabled={!isValid}>Create List</Button>
                </div>
            </form>
        </Modal>
    );
}

export function ListeUpdate({ onSubmit, onClose, defaultOrder = 0, folders = [], sprints = [], defaults = {} }: ListeFormProps & { listeId: string }) {
    const [name, setName] = useState(defaults.name || "");
    const [type, setType] = useState<ListType>(defaults.type || "SPRINT");
    const [order, setOrder] = useState<number>(defaults.order ?? defaultOrder);
    const [folderId, setFolderId] = useState<string>(defaults.folderId || "");
    const [sprintId, setSprintId] = useState<string>(defaults.sprintId || "");
    const [loading, setLoading] = useState(false);

    const isValid = name.trim().length > 0 && folderId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        try {
            await onSubmit({
                name: name.trim(),
                type,
                order,
                folderId: folderId || undefined,
                sprintId: sprintId || undefined
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title="Edit List" 
            description="Update list settings and associations."
            width={480}
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <FormGroup label="Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Type">
                    <SegmentedControl
                        options={LIST_TYPES}
                        value={type}
                        onChange={(v) => setType(v as ListType)}
                    />
                </FormGroup>

                <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Folder">
                            <Select options={folders} value={folderId} onChange={setFolderId} placeholder="Select Folder..." size="md" />
                        </FormGroup>
                    </div>
                    <div style={{ flex: 1 }}>
                        <FormGroup label="Sprint" optional>
                            <Select options={sprints} value={sprintId} onChange={setSprintId} placeholder="Select Sprint..." size="md" />
                        </FormGroup>
                    </div>
                </div>

                <FormGroup label="Order" optional>
                    <TextField
                        type="number"
                        min={0}
                        value={order}
                        onChange={e => setOrder(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                </FormGroup>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                    <Button type="button" variant="secondary" onClick={onClose} size="md">Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Saving..." size="md" disabled={!isValid}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}

export function ListeDelete({ liste, onDelete, onClose }: { liste: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <Modal 
            onClose={onClose} 
            title="Delete List" 
            icon={<Trash2 size={28} style={{ color: theme.destructive }} />}
            width={420}
            padding={32}
        >
            <div style={{ textAlign: "center", marginBottom: 24, marginTop: -8 }}>
                <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                    Are you sure you want to delete <strong style={{ color: "white" }}>{liste.name}</strong>? This will also remove all tasks within this list.
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
                        try { await onDelete(liste.id); onClose(); } finally { setLoading(false); }
                    }}
                    style={{ flex: 1 }}
                    size="md"
                >
                    Delete List
                </Button>
            </div>
        </Modal>
    );
}
