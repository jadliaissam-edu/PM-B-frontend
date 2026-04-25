import { Trash2, EyeOff } from "lucide-react";
import { useState } from "react";
import type { FolderRequestDto, FolderResponseDto } from "../api/folderApi";
import { Modal } from "../components/ui/Modal";
import { FormGroup, TextField, TextArea, Select, Toggle } from "../components/ui/FormControls";
import { Button } from "../components/ui/Button";
import { theme } from "../components/ui/theme";

export type { FolderRequestDto, FolderResponseDto };

interface SelectOption { value: string; label: string }

interface FolderFormProps {
    onSubmit: (data: FolderRequestDto) => Promise<void> | void;
    onClose: () => void;
    spaces: SelectOption[];
    defaults?: Partial<FolderRequestDto>;
}

export function FolderAdd({ onSubmit, onClose, spaces, defaults }: FolderFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [spaceId, setSpaceId] = useState(defaults?.spaceId || "");
    const [isHidden, setIsHidden] = useState(defaults?.isHidden || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !spaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), isHidden, spaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title="New Folder" 
            description="Folders help group related project lists and sprints together for better organization."
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Folder Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Marketing Assets"
                    />
                </FormGroup>

                <FormGroup label="Description" optional>
                    <TextArea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What is this folder used for?"
                    />
                </FormGroup>

                <FormGroup label="Parent Space">
                    <Select options={spaces} value={spaceId} onChange={setSpaceId} placeholder="Select parent space" />
                </FormGroup>

                <Toggle
                    label="Hidden folder"
                    sublabel="Hide this folder from other workspace members"
                    checked={isHidden}
                    onChange={setIsHidden}
                    icon={EyeOff}
                />

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="submit" loading={loading} loadingText="Creating..." fullWidth disabled={!name.trim() || !spaceId}>
                        Create Folder
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export function FolderUpdate({ onSubmit, onClose, spaces, defaults }: FolderFormProps & { folderId: string }) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [spaceId, setSpaceId] = useState(defaults?.spaceId || "");
    const [isHidden, setIsHidden] = useState(defaults?.isHidden || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !spaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), isHidden, spaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Edit Folder" description="Update folder name or change its parent space.">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Folder Name">
                    <TextField
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Description" optional>
                    <TextArea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Parent Space">
                    <Select options={spaces} value={spaceId} onChange={setSpaceId} placeholder="Select parent space" />
                </FormGroup>

                <Toggle
                    label="Hidden folder"
                    checked={isHidden}
                    onChange={setIsHidden}
                />

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Saving..." style={{ flex: 2 }} disabled={!name.trim() || !spaceId}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}

export function FolderDelete({ folder, onDelete, onClose }: { folder: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <Modal 
            onClose={onClose} 
            title="Delete Folder" 
            icon={<Trash2 size={28} style={{ color: theme.destructive }} />}
            width={420}
        >
            <div style={{ textAlign: "center", marginBottom: 24, marginTop: -8 }}>
                <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                    Permanently delete <strong style={{ color: "white" }}>{folder.name}</strong>? All lists and tasks within will be removed. This cannot be undone.
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
                        try { await onDelete(folder.id); onClose(); } finally { setLoading(false); }
                    }}
                    style={{ flex: 1.2 }}
                >
                    Confirm Delete
                </Button>
            </div>
        </Modal>
    );
}
