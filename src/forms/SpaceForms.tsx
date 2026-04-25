import { Trash2, Shield } from "lucide-react";
import { useState } from "react";
import type { SpaceRequestDto, SpaceResponseDto } from "../api/spaceApi";
import { Modal } from "../components/ui/Modal";
import { FormGroup, TextField, TextArea, Select, Toggle } from "../components/ui/FormControls";
import { Button } from "../components/ui/Button";
import { theme } from "../components/ui/theme";

export type { SpaceRequestDto, SpaceResponseDto };

interface SelectOption { value: string; label: string }

interface SpaceFormProps {
    onSubmit: (data: SpaceRequestDto) => Promise<void> | void;
    onClose: () => void;
    workspaces: SelectOption[];
    defaults?: Partial<SpaceRequestDto>;
}

const colorOptions = [
    "#534AB7", "#7C3AED", "#DB2777", "#E11D48", 
    "#EA580C", "#D97706", "#65A30D", "#0891B2"
];

export function SpaceAdd({ onSubmit, onClose, workspaces, defaults }: SpaceFormProps) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [color, setColor] = useState(defaults?.color || colorOptions[0]);
    const [isPrivate, setIsPrivate] = useState(defaults?.isPrivate || false);
    const [workspaceId, setWorkspaceId] = useState(defaults?.workspaceId || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), color, isPrivate, workspaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title="Create a Space" 
            description="A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings."
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Space name">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ 
                            width: 52, height: 52, borderRadius: 14, background: color, 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            color: "#fff", flexShrink: 0, boxShadow: `0 8px 20px ${color}33`,
                            border: "2px solid rgba(255,255,255,0.1)",
                            fontSize: 20, fontWeight: 800
                        }}>
                            {name.charAt(0).toUpperCase() || "S"}
                        </div>
                        <TextField
                            autoFocus
                            style={{ fontSize: 16, height: 52, fontWeight: 500 }}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Marketing, Engineering, HR"
                        />
                    </div>
                </FormGroup>

                <FormGroup label="Description" optional>
                    <TextArea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Briefly describe what happens in this space..."
                    />
                </FormGroup>

                <FormGroup label="Space Color">
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                        {colorOptions.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                style={{
                                    width: 34, height: 34, borderRadius: 10, background: c,
                                    border: color === c ? "3px solid #fff" : "none",
                                    cursor: "pointer", padding: 0, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    transform: color === c ? "scale(1.15)" : "scale(1)",
                                    boxShadow: color === c ? `0 8px 16px ${c}44` : "none"
                                }}
                            />
                        ))}
                    </div>
                </FormGroup>

                <FormGroup label="Workspace">
                    <Select options={workspaces} value={workspaceId} onChange={setWorkspaceId} placeholder="Select workspace" />
                </FormGroup>

                <Toggle 
                    label="Make Private" 
                    sublabel="Only you and invited members have access" 
                    checked={isPrivate} 
                    onChange={setIsPrivate} 
                    icon={Shield} 
                />

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="submit" loading={loading} loadingText="Creating..." fullWidth disabled={!name.trim() || !workspaceId}>
                        Continue
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export function SpaceUpdate({ onSubmit, onClose, workspaces, defaults }: SpaceFormProps & { spaceId: string }) {
    const [name, setName] = useState(defaults?.name || "");
    const [description, setDescription] = useState(defaults?.description || "");
    const [color, setColor] = useState(defaults?.color || colorOptions[0]);
    const [isPrivate, setIsPrivate] = useState(defaults?.isPrivate || false);
    const [workspaceId, setWorkspaceId] = useState(defaults?.workspaceId || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspaceId) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), color, isPrivate, workspaceId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Edit Space" description="Update your space configuration and settings.">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <FormGroup label="Space name">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ 
                            width: 52, height: 52, borderRadius: 14, background: color, 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            color: "#fff", flexShrink: 0, boxShadow: `0 8px 20px ${color}33`,
                            fontSize: 20, fontWeight: 800
                        }}>
                            {name.charAt(0).toUpperCase() || "S"}
                        </div>
                        <TextField
                            autoFocus
                            style={{ fontSize: 16, height: 52, fontWeight: 500 }}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                </FormGroup>

                <FormGroup label="Description" optional>
                    <TextArea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </FormGroup>

                <FormGroup label="Space Color">
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                        {colorOptions.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                style={{
                                    width: 32, height: 32, borderRadius: 10, background: c,
                                    border: color === c ? "3px solid #fff" : "none",
                                    cursor: "pointer", padding: 0
                                }}
                            />
                        ))}
                    </div>
                </FormGroup>

                <FormGroup label="Workspace">
                    <Select options={workspaces} value={workspaceId} onChange={setWorkspaceId} placeholder="Select workspace" />
                </FormGroup>

                <Toggle 
                    label="Make Private" 
                    sublabel="Only invited members have access" 
                    checked={isPrivate} 
                    onChange={setIsPrivate} 
                />

                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
                    <Button type="submit" loading={loading} loadingText="Saving..." style={{ flex: 2 }} disabled={!name.trim() || !workspaceId}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}

export function SpaceDelete({ space, onDelete, onClose }: { space: { id: string, name: string }, onDelete: (id: string) => Promise<void>, onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    return (
        <Modal 
            onClose={onClose} 
            title="Delete Space" 
            icon={<Trash2 size={32} style={{ color: theme.destructive }} />}
            width={440}
        >
            <div style={{ textAlign: "center", marginBottom: 24, marginTop: -8 }}>
                <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: "1.6", margin: 0 }}>
                    Permanently delete <strong style={{ color: "white" }}>{space.name}</strong>? This will remove all nested folders, lists, and tasks. This action is irreversible.
                </p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
                <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Keep Space</Button>
                <Button
                    type="button"
                    variant="destructive"
                    loading={loading}
                    loadingText="Deleting..."
                    onClick={async () => {
                        setLoading(true);
                        try { await onDelete(space.id); onClose(); } finally { setLoading(false); }
                    }}
                    style={{ flex: 1.2 }}
                >
                    Confirm Delete
                </Button>
            </div>
        </Modal>
    );
}
