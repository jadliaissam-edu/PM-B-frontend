import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    LayoutDashboard, FolderGit2,
    Sparkles, Send, Loader2, Plus, 
    X, Check, Trash2, Pencil
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    getWorkspacesByUser, 
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace 
} from "../api/workspaceApi";
import type { WorkspaceResponseDto } from "../api/workspaceApi";
import { analyzeRepo } from "../api/iaApi";
import {
    addConversationMessage,
    createConversation,
    deleteConversation,
    getConversationMessages,
    getMyConversations,
    updateConversationTitle,
} from "../api/conversationApi";
import type { ConversationResponseDto } from "../api/conversationApi";

import Sidebar from "../components/Sidebar";
import Layout from "../components/Layout";
import Content from "../components/layout/Content";
import WorkspacesDropdown from "../components/WorkspacesDropdown";
import WorkspaceTopBar from "../components/WorkspaceTopBar";
import WorkspaceResourcesPanel from "../components/WorkspaceResourcesPanel";

// ============================================================================
// MODALS (Identiques au Dashboard)
// ============================================================================

interface WorkspaceFormModalProps {
    mode: "create" | "edit";
    initialName?: string;
    initialSlug?: string;
    onSubmit: (name: string, slug: string) => Promise<void>;
    onClose: () => void;
}

function WorkspaceFormModal({ mode, initialName = "", initialSlug = "", onSubmit, onClose }: WorkspaceFormModalProps) {
    const [name, setName] = useState(initialName);
    const [slug, setSlug] = useState(initialSlug);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNameChange = (val: string) => {
        setName(val);
        if (mode === "create") {
            setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) {
            setError("Name and slug are required.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(name.trim(), slug.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 18, padding: "28px 32px", width: 420, maxWidth: "calc(100vw - 40px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {mode === "create" ? "Create Workspace" : "Edit Workspace"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 4, borderRadius: 8 }}
                    >
                        <X size={17} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. My Team"
                            autoFocus
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                                borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#fff",
                                fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 22 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                            Slug
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
                                /
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                                    borderRadius: 10, padding: "10px 14px 10px 24px", fontSize: 14, color: "#fff",
                                    fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 14, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                            {error}
                        </p>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                                borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.6)",
                                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                background: "linear-gradient(135deg, #534AB7, #3C3489)", border: "none",
                                borderRadius: 10, padding: "9px 20px", color: "#fff",
                                fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7,
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {mode === "create" ? "Create" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface DeleteConfirmModalProps {
    workspaceName: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

function DeleteConfirmModal({ workspaceName, onConfirm, onClose }: DeleteConfirmModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to delete workspace.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a", border: "0.5px solid rgba(226,75,74,0.2)",
                    borderRadius: 18, padding: "28px 32px", width: 380, maxWidth: "calc(100vw - 40px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(226,75,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={17} style={{ color: "#E24B4A" }} />
                    </div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                        Delete Workspace
                    </h2>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
                    Are you sure you want to delete <span style={{ color: "#fff", fontWeight: 600 }}>"{workspaceName}"</span>? This action cannot be undone.
                </p>
                {error && (
                    <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 14, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                        {error}
                    </p>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        style={{ background: "#E24B4A", border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7, opacity: isDeleting ? 0.7 : 1 }}
                    >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ConversationDeleteConfirmModalProps {
    conversationTitle: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

function ConversationDeleteConfirmModal({ conversationTitle, onConfirm, onClose }: ConversationDeleteConfirmModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Suppression impossible.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
            }}
            onClick={() => {
                if (!isDeleting) onClose();
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a",
                    border: "0.5px solid rgba(226,75,74,0.22)",
                    borderRadius: 18,
                    padding: "24px 28px",
                    width: 360,
                    maxWidth: "calc(100vw - 30px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: "rgba(226,75,74,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Trash2 size={16} style={{ color: "#E24B4A" }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 700 }}>
                        Confirmer la suppression
                    </h2>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                    Voulez-vous vraiment supprimer la conversation <span style={{ color: "#fff", fontWeight: 600 }}>"{conversationTitle || "Nouvelle conversation"}"</span> ?
                </p>

                {error && (
                    <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 12, background: "rgba(226,75,74,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "0.5px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.7 : 1,
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        style={{
                            background: "#E24B4A",
                            border: "none",
                            borderRadius: 10,
                            padding: "9px 16px",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// REPO FORM MODAL
// ============================================================================

interface RepoFormModalProps {
    mode: "add" | "edit";
    initialData?: { owner: string; repo: string; branch: string };
    onSubmit: (owner: string, repo: string, branch: string) => void;
    onClose: () => void;
}

function RepoFormModal({ mode, initialData, onSubmit, onClose }: RepoFormModalProps) {
    const [owner, setOwner] = useState(initialData?.owner || "");
    const [repo, setRepo] = useState(initialData?.repo || "");
    const [branch, setBranch] = useState(initialData?.branch || "main");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!owner.trim() || !repo.trim()) return;
        onSubmit(owner.trim(), repo.trim(), branch.trim());
        onClose();
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#16161a", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 18, padding: "28px 32px", width: 400,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)", fontFamily: "'DM Sans', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {mode === "add" ? "Add Repository" : "Edit Repository"}
                    </h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>GitHub Owner</label>
                        <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. facebook" style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, color: "white", outline: "none" }} />
                    </div>
                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>Repository Name</label>
                        <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="e.g. react" style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, color: "white", outline: "none" }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>Branch</label>
                        <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, color: "white", outline: "none" }} />
                    </div>
                    <button type="submit" style={{ width: "100%", background: "#534AB7", border: "none", borderRadius: 10, padding: 12, color: "white", fontWeight: 700, cursor: "pointer" }}>
                        Add to List
                    </button>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// PAGE IA
// ============================================================================

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Sparkles, label: "Ask AI" },
];

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
    role: ChatRole;
    content: string;
    timestamp: string | Date;
}

const INITIAL_VISIBLE_MESSAGES = 20;
const MESSAGE_BATCH_SIZE = 20;

function normalizeChatRole(role: string): ChatRole {
    if (role === "assistant" || role === "system") {
        return role;
    }
    return "user";
}

function buildConversationTitleFromMessage(message: string): string {
    const singleLine = message.replace(/\s+/g, " ").trim();
    if (!singleLine) {
        return "Nouvelle conversation";
    }

    if (singleLine.length <= 60) {
        return singleLine;
    }

    return `${singleLine.slice(0, 57)}...`;
}

export default function AIPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState({ name: "User", avatar: "US" });
    const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceResponseDto | null>(null);
    
    // State pour les modales de workspace
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceResponseDto | null>(null);
    const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceResponseDto | null>(null);

    // State pour l'IA
    const [repoList, setRepoList] = useState<{ owner: string; repo: string; branch: string }[]>(() => {
        const saved = localStorage.getItem("ai_repo_list");
        return saved ? JSON.parse(saved) : [{ owner: "ilyass-hm-04", repo: "Medical-chatbot", branch: "main" }];
    });
    const [activeRepoIndex, setActiveRepoIndex] = useState(0);
    const [conversations, setConversations] = useState<ConversationResponseDto[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageFetchLimit, setMessageFetchLimit] = useState(INITIAL_VISIBLE_MESSAGES);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(false);
    const [isConversationLoading, setIsConversationLoading] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showRepoModal, setShowRepoModal] = useState(false);
    const [editingRepoIndex, setEditingRepoIndex] = useState<number | null>(null);
    const [deletingRepoIndex, setDeletingRepoIndex] = useState<number | null>(null);
    const [deletingConversation, setDeletingConversation] = useState<ConversationResponseDto | null>(null);

    const toChatMessages = (conversationMessages: { role: string; content: string; createdAt: string }[]): ChatMessage[] => {
        return conversationMessages.map((msg) => ({
            role: normalizeChatRole(msg.role),
            content: msg.content,
            timestamp: msg.createdAt,
        }));
    };

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser({
                    name: parsed.firstName || "User",
                    avatar: ((parsed.firstName?.[0] || "") + (parsed.lastName?.[0] || "")).toUpperCase() || "US",
                });
            }
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
        }

        const loadInitialData = async () => {
            try {
                const wsData = await getWorkspacesByUser();
                setWorkspaces(wsData);
                if (wsData.length > 0) {
                    const savedWorkspaceId = localStorage.getItem("activeWorkspaceId");
                    const savedWorkspace = wsData.find((ws) => ws.id === savedWorkspaceId);
                    setActiveWorkspace(savedWorkspace ?? wsData[0]);
                }

                const savedConversationId = localStorage.getItem("activeConversationId");
                const existingConversations = await getMyConversations();

                let selectedConversation = existingConversations.find((conv) => conv.id === savedConversationId)
                    ?? existingConversations[0];

                if (!selectedConversation) {
                    selectedConversation = await createConversation({ title: "Nouvelle conversation" });
                }

                setConversations(existingConversations);

                setConversationId(selectedConversation.id);

                setIsConversationLoading(true);
                const conversationMessages = await getConversationMessages(selectedConversation.id, INITIAL_VISIBLE_MESSAGES);
                setMessages(toChatMessages(conversationMessages));
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(conversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
            } catch (error) {
                console.error("Failed to load workspaces", error);
            } finally {
                setIsConversationLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem("activeWorkspaceId", activeWorkspace.id);
        }
    }, [activeWorkspace]);

    useEffect(() => {
        if (conversationId) {
            localStorage.setItem("activeConversationId", conversationId);
        }
    }, [conversationId]);

    // Persistance des données IA
    useEffect(() => {
        localStorage.setItem("ai_repo_list", JSON.stringify(repoList));
    }, [repoList]);

    // Workspace CRUD handlers
    const handleCreateWorkspace = async (name: string, slug: string) => {
        const created = await createWorkspace({ name, slug });
        setWorkspaces((prev) => [...prev, created]);
        setActiveWorkspace(created);
    };

    const handleUpdateWorkspace = async (name: string, slug: string) => {
        if (!editingWorkspace) return;
        const updated = await updateWorkspace(editingWorkspace.id, { name, slug });
        setWorkspaces((prev) => prev.map((ws) => (ws.id === updated.id ? updated : ws)));
        if (activeWorkspace?.id === updated.id) setActiveWorkspace(updated);
    };

    const handleDeleteWorkspace = async () => {
        if (!deletingWorkspace) return;
        await deleteWorkspace(deletingWorkspace.id);
        const remaining = workspaces.filter((ws) => ws.id !== deletingWorkspace.id);
        setWorkspaces(remaining);
        if (activeWorkspace?.id === deletingWorkspace.id) {
            setActiveWorkspace(remaining.length > 0 ? remaining[0] : null);
        }
    };

    const sidebarNavItems = navItems.map((item) => {
        if (item.label === "Dashboard") {
            return {
                ...item,
                active: location.pathname === "/workspace",
                onClick: () => navigate("/workspace"),
            };
        }
        if (item.label === "Ask AI") {
            return {
                ...item,
                active: location.pathname === "/ai",
                onClick: () => navigate("/ai"),
            };
        }
        return item;
    });

    const refreshConversations = async () => {
        const updatedConversations = await getMyConversations();
        setConversations(updatedConversations);
        return updatedConversations;
    };

    const handleSelectConversation = async (targetConversationId: string) => {
        if (!targetConversationId || targetConversationId === conversationId || isConversationLoading) {
            return;
        }

        setIsConversationLoading(true);
        try {
            const conversationMessages = await getConversationMessages(targetConversationId, INITIAL_VISIBLE_MESSAGES);
            setConversationId(targetConversationId);
            setMessages(toChatMessages(conversationMessages));
            setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
            setHasMoreMessages(conversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConversationLoading(false);
        }
    };

    const handleCreateConversation = async () => {
        try {
            const createdConversation = await createConversation({ title: "Nouvelle conversation" });
            setConversationId(createdConversation.id);
            setMessages([]);
            setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
            setHasMoreMessages(false);
            setIsConversationPanelOpen(true);

            await refreshConversations();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteConversation = async (conversationToDeleteId: string) => {
        if (!conversationToDeleteId) return;

        try {
            await deleteConversation(conversationToDeleteId);

            let updatedConversations = await getMyConversations();
            if (updatedConversations.length === 0) {
                const createdConversation = await createConversation({ title: "Nouvelle conversation" });
                setConversations([]);
                setConversationId(createdConversation.id);
                setMessages([]);
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(false);
                return;
            }

            setConversations(updatedConversations);

            if (conversationId === conversationToDeleteId || !conversationId) {
                const nextConversation = updatedConversations[0];
                setConversationId(nextConversation.id);
                setIsConversationLoading(true);

                const nextConversationMessages = await getConversationMessages(nextConversation.id, INITIAL_VISIBLE_MESSAGES);
                setMessages(toChatMessages(nextConversationMessages));
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(nextConversationMessages.length >= INITIAL_VISIBLE_MESSAGES);
                setIsConversationLoading(false);
            }
        } catch (error) {
            console.error(error);
            setIsConversationLoading(false);
        }
    };

    const promptDeleteConversation = (conversationToDeleteId: string) => {
        const targetConversation = conversations.find((conv) => conv.id === conversationToDeleteId);
        if (!targetConversation) {
            return;
        }

        setDeletingConversation(targetConversation);
    };

    const handleShowMoreMessages = async () => {
        if (!conversationId || isConversationLoading) {
            return;
        }

        const nextLimit = messageFetchLimit + MESSAGE_BATCH_SIZE;

        setIsConversationLoading(true);
        try {
            const conversationMessages = await getConversationMessages(conversationId, nextLimit);
            setMessages(toChatMessages(conversationMessages));
            setMessageFetchLimit(nextLimit);
            setHasMoreMessages(conversationMessages.length >= nextLimit);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConversationLoading(false);
        }
    };

    const handleSend = async () => {
        const userInput = input.trim();
        if (!userInput || isTyping) return;

        const isFirstMessageInConversation = messages.length === 0;
        const nextConversationTitle = buildConversationTitleFromMessage(userInput);

        const userMsg: ChatMessage = { role: "user", content: userInput, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            let currentConversationId = conversationId;
            if (!currentConversationId) {
                const createdConversation = await createConversation({ title: "Nouvelle conversation" });
                currentConversationId = createdConversation.id;
                setConversationId(createdConversation.id);
                setMessageFetchLimit(INITIAL_VISIBLE_MESSAGES);
                setHasMoreMessages(false);
            }

            if (isFirstMessageInConversation) {
                const updatedConversation = await updateConversationTitle(currentConversationId, {
                    title: nextConversationTitle,
                });

                setConversations((prev) => prev.map((conv) => (
                    conv.id === updatedConversation.id ? updatedConversation : conv
                )));
            }

            await addConversationMessage(currentConversationId, {
                role: "user",
                content: userInput,
            });

            const res = await analyzeRepo({
                repositories: repoList,
                user_query: userInput
            });

            const assistantMsg: ChatMessage = { role: "assistant", content: res.response, timestamp: new Date() };
            setMessages(prev => [...prev, assistantMsg]);

            await addConversationMessage(currentConversationId, {
                role: "assistant",
                content: res.response,
            });

            await refreshConversations();
        } catch (err) {
            console.error(err);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <Layout
            sidebar={
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                    navItems={sidebarNavItems}
                    workspaceDropdown={
                        <WorkspacesDropdown
                            workspaces={workspaces}
                            activeWorkspace={activeWorkspace}
                            onSelect={setActiveWorkspace}
                            onCreateClick={() => setShowCreateModal(true)}
                            onEditClick={(ws) => setEditingWorkspace(ws)}
                            onDeleteClick={(ws) => setDeletingWorkspace(ws)}
                        />
                    }
                    resourcesPanel={<WorkspaceResourcesPanel workspaceId={activeWorkspace?.id} />}
                    userName={user.name}
                    userAvatar={user.avatar}
                />
            }
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
                .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background 0.18s, color 0.18s; color: rgba(255,255,255,0.45); font-size: 14px; font-weight: 400; white-space: nowrap; overflow: hidden; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
                .nav-item.active { background: rgba(83,74,183,0.18); color: #a89ef5; }
                .ws-selector { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor: pointer; transition: background 0.18s; font-size: 13px; color: rgba(255,255,255,0.7); }
                .ws-selector:hover { background: rgba(255,255,255,0.06); }
                .search-input { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 14px 8px 38px; font-size: 13px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; width: 240px; transition: border-color 0.2s, width 0.3s; }
                .search-input:focus { border-color: rgba(83,74,183,0.5); width: 300px; }
                .search-input::placeholder { color: rgba(255,255,255,0.25); }
                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.18s, border-color 0.18s; }
                .icon-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
                
                /* Markdown Styles */
                .markdown-content { font-size: 14px; line-height: 1.6; }
                .markdown-content p { margin-bottom: 12px; }
                .markdown-content p:last-child { margin-bottom: 0; }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 { color: #fff; margin: 20px 0 10px; font-family: 'Syne', sans-serif; font-weight: 700; }
                .markdown-content h1 { font-size: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                .markdown-content h2 { font-size: 18px; }
                .markdown-content h3 { font-size: 16px; }
                .markdown-content code { background: rgba(255,255,255,0.08); padding: 2px 5px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
                .markdown-content pre { background: #000; padding: 16px; border-radius: 12px; overflow-x: auto; margin: 12px 0; border: 1px solid rgba(255,255,255,0.05); }
                .markdown-content pre code { background: none; padding: 0; font-size: 13px; color: #e5e7eb; }
                .markdown-content ul, .markdown-content ol { margin-left: 20px; margin-bottom: 12px; }
                .markdown-content li { margin-bottom: 6px; }
                .markdown-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                .markdown-content th, .markdown-content td { border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px; text-align: left; }
                .markdown-content th { background: rgba(255,255,255,0.05); color: #fff; font-weight: 600; }
                .markdown-content tr:nth-child(even) { background: rgba(255,255,255,0.02); }
                .markdown-content blockquote { border-left: 4px solid #534AB7; background: rgba(83,74,183,0.05); padding: 10px 20px; margin: 12px 0; font-style: italic; color: rgba(255,255,255,0.7); }
                .markdown-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }

                /* AI Page Layout */
                .ai-page-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; background: #0d0d0f; }
                .ai-top-bar { display: flex; align-items: center; gap: 10px; padding: 0 20px; height: 52px; border-bottom: 0.5px solid rgba(255,255,255,0.06); flex-shrink: 0; background: rgba(13,13,15,0.95); backdrop-filter: blur(12px); }
                .ai-main-layout { position: relative; display: flex; flex: 1; min-height: 0; overflow: hidden; }
                .repo-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.18s; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.5); }
                .repo-chip.active { background: rgba(83,74,183,0.2); border-color: rgba(83,74,183,0.5); color: #c4beff; }
                .repo-chip:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
                .repo-chip-icon { opacity: 0.7; display: flex; align-items: center; }
                .messages-scroll { flex: 1; overflow-y: auto; padding: 0; transition: padding-right 0.25s ease; }
                .messages-scroll.with-panel { padding-right: 320px; }
                .messages-inner { max-width: 820px; margin: 0 auto; padding: 40px 24px 24px; display: flex; flex-direction: column; gap: 0; }
                .msg-row { display: flex; gap: 14px; padding: 20px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); align-items: flex-start; }
                .msg-row:last-child { border-bottom: none; }
                .msg-row.user { flex-direction: row-reverse; }
                .msg-avatar { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 700; }
                .msg-avatar.ai { background: linear-gradient(135deg, #534AB7, #8b5cf6); }
                .msg-avatar.user-av { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); font-size: 13px; }
                .msg-body { flex: 1; min-width: 0; }
                .msg-row.user .msg-body { display: flex; flex-direction: column; align-items: flex-end; }
                .msg-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); margin-bottom: 6px; letter-spacing: 0.3px; }
                .msg-user-bubble { background: rgba(83,74,183,0.18); border: 0.5px solid rgba(83,74,183,0.35); border-radius: 18px 18px 4px 18px; padding: 12px 18px; max-width: 580px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.92); }
                .msg-ai-content { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.88); padding-top: 2px; }
                .msg-meta { font-size: 11px; color: rgba(255,255,255,0.18); margin-top: 6px; display: flex; align-items: center; gap: 4px; }
                .msg-row.user .msg-meta { justify-content: flex-end; }
                .input-dock { flex-shrink: 0; padding: 16px 24px 20px; background: #0d0d0f; }
                .input-dock.with-panel { padding-right: 344px; }
                .input-dock-inner { max-width: 820px; margin: 0 auto; }
                .input-box { display: flex; align-items: flex-end; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 8px 8px 8px 20px; transition: border-color 0.2s, box-shadow 0.2s; }
                .input-box:focus-within { border-color: rgba(168,158,245,0.4); box-shadow: 0 0 0 3px rgba(83,74,183,0.08), 0 8px 32px rgba(0,0,0,0.2); }
                .input-textarea { flex: 1; background: none; border: none; color: rgba(255,255,255,0.9); outline: none; font-size: 15px; font-family: 'DM Sans', sans-serif; resize: none; line-height: 1.5; min-height: 24px; max-height: 180px; padding-top: 6px; }
                .input-textarea::placeholder { color: rgba(255,255,255,0.2); }
                .send-btn { width: 42px; height: 42px; border-radius: 14px; border: none; background: linear-gradient(135deg, #534AB7, #7c3aed); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
                .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 16px rgba(83,74,183,0.4); }
                .send-btn:active { transform: scale(0.96); }
                .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .send-hint { text-align: center; font-size: 11px; color: rgba(255,255,255,0.15); margin-top: 10px; }
                .suggestion-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 28px; }
                .sugg-chip { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 99px; font-size: 13px; cursor: pointer; transition: all 0.18s; }
                .sugg-chip:hover { background: rgba(83,74,183,0.12); border-color: rgba(83,74,183,0.3); color: #c4beff; }
                .typing-dots { display: flex; gap: 4px; align-items: center; padding: 6px 0; }
                .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #a89ef5; animation: typing-pulse 1.4s ease-in-out infinite; }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                .show-more-btn { background: rgba(83,74,183,0.12); border: 0.5px solid rgba(83,74,183,0.35); color: #cfc8ff; border-radius: 99px; padding: 8px 14px; font-size: 12px; cursor: pointer; transition: background 0.18s; }
                .show-more-btn:hover { background: rgba(83,74,183,0.2); }
                .conversation-panel { position: absolute; top: 0; right: 0; width: 320px; height: 100%; background: rgba(17,17,20,0.96); border-left: 0.5px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px); display: flex; flex-direction: column; transform: translateX(100%); opacity: 0; pointer-events: none; transition: transform 0.25s ease, opacity 0.25s ease; }
                .conversation-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
                .conversation-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
                .conversation-new-btn { margin: 12px 14px; background: rgba(83,74,183,0.18); border: 0.5px solid rgba(83,74,183,0.32); color: #d6d2ff; border-radius: 10px; padding: 9px 12px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
                .conversation-new-btn:hover { background: rgba(83,74,183,0.26); }
                .conversation-list { flex: 1; overflow-y: auto; padding: 0 10px 12px; }
                .conversation-item { width: 100%; border: 0.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; text-align: left; transition: border-color 0.18s, background 0.18s; }
                .conversation-item:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
                .conversation-item.active { border-color: rgba(83,74,183,0.45); background: rgba(83,74,183,0.14); }
                .conversation-item-main { flex: 1; min-width: 0; }
                .conversation-item-title { color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .conversation-item-time { color: rgba(255,255,255,0.32); font-size: 11px; margin-top: 4px; }
                .conversation-delete-btn { width: 26px; height: 26px; border: none; border-radius: 8px; background: rgba(226,75,74,0.08); color: #f87171; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
                .conversation-delete-btn:hover { background: rgba(226,75,74,0.18); }
                @keyframes typing-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
                @keyframes msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .msg-row { animation: msg-in 0.25s ease-out; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @media (max-width: 900px) {
                    .messages-scroll.with-panel { padding-right: 0; }
                    .input-dock.with-panel { padding-right: 24px; }
                    .conversation-panel { width: min(92vw, 320px); }
                }
            `}</style>
            
            <Content>
                <WorkspaceTopBar userName={user.name} userAvatar={user.avatar} />

                <div className="ai-page-wrapper">

                    {/* ── Top Repo Bar ── */}
                    <div className="ai-top-bar">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginRight: 4 }}>
                            <FolderGit2 size={11} /> Repos
                        </div>
                        <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
                            {repoList.map((r, i) => (
                                <button
                                    key={i}
                                    className={`repo-chip${activeRepoIndex === i ? " active" : ""}`}
                                    onClick={() => setActiveRepoIndex(i)}
                                >
                                    <span className="repo-chip-icon">⬡</span>
                                    {r.owner}/{r.repo}
                                    {activeRepoIndex === i && (
                                        <>
                                            <Pencil size={10} onClick={(e) => { e.stopPropagation(); setEditingRepoIndex(i); }} style={{ cursor: "pointer", opacity: 0.7 }} />
                                            <Trash2 size={10} onClick={(e) => { e.stopPropagation(); setDeletingRepoIndex(i); }} style={{ cursor: "pointer", color: "#f87171", opacity: 0.8 }} />
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowRepoModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, border: "1px dashed rgba(29,158,117,0.4)", background: "rgba(29,158,117,0.06)", color: "#34d399", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                            <Plus size={12} /> Add repo
                        </button>
                        <button onClick={handleCreateConversation} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(83,74,183,0.35)", background: "rgba(83,74,183,0.15)", color: "#d6d2ff", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                            <Plus size={12} /> New chat
                        </button>
                        <button onClick={() => setIsConversationPanelOpen((prev) => !prev)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                            {isConversationPanelOpen ? "Hide Chat history" : "Chat History"}
                        </button>
                    </div>

                    <div className="ai-main-layout">
                        {/* ── Messages Scroll Area ── */}
                        <div className={`messages-scroll${isConversationPanelOpen ? " with-panel" : ""}`}>
                            <div className="messages-inner">
                                {hasMoreMessages && (
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                                        <button className="show-more-btn" onClick={handleShowMoreMessages}>
                                            Show more
                                        </button>
                                    </div>
                                )}

                                {messages.length === 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, textAlign: "center" }}>
                                        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #534AB7, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 12px 40px rgba(83,74,183,0.3)" }}>
                                            <Sparkles size={32} color="white" />
                                        </div>
                                        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.5px" }}>
                                            Bonjour, que puis-je analyser ?
                                        </h2>
                                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", maxWidth: 400, lineHeight: 1.6 }}>
                                            Je peux analyser votre code, suggérer des améliorations, détecter des bugs ou générer des tickets techniques.
                                        </p>
                                        <div className="suggestion-chips">
                                            {["Explique l'architecture du projet", "Quels bugs potentiels vois-tu ?", "Génère des tickets techniques", "Revue du code en profondeur"].map(s => (
                                                <button key={s} className="sugg-chip" onClick={() => { setInput(s); }}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((m, i) => (
                                        <div key={`${m.timestamp}-${i}`} className={`msg-row${m.role === "user" ? " user" : ""}`}>
                                            <div className={`msg-avatar${m.role === "user" ? " user-av" : " ai"}`}>
                                                {m.role === "user"
                                                    ? <span style={{ fontSize: 16 }}>👤</span>
                                                    : <Sparkles size={16} color="white" />}
                                            </div>
                                            <div className="msg-body">
                                                <div className="msg-name">
                                                    {m.role === "user" ? "Vous" : "Orbyte AI"}
                                                </div>
                                                {m.role === "user" ? (
                                                    <div className="msg-user-bubble">{m.content}</div>
                                                ) : (
                                                    <div className="msg-ai-content markdown-content">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                    </div>
                                                )}
                                                <div className="msg-meta">
                                                    <span>🕐</span>
                                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {isConversationLoading && (
                                    <div className="msg-row">
                                        <div className="msg-avatar ai"><Loader2 size={16} color="white" className="animate-spin" /></div>
                                        <div className="msg-body">
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Chargement de la conversation...</div>
                                        </div>
                                    </div>
                                )}

                                {isTyping && (
                                    <div className="msg-row">
                                        <div className="msg-avatar ai"><Sparkles size={16} color="white" /></div>
                                        <div className="msg-body">
                                            <div className="typing-dots">
                                                <span /><span /><span />
                                            </div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Analyse en cours...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`conversation-panel${isConversationPanelOpen ? " open" : ""}`}>
                            <div className="conversation-panel-head">
                                <h3 style={{ margin: 0, fontSize: 14, color: "#fff", fontFamily: "'Syne', sans-serif" }}>Historique</h3>
                                <button
                                    onClick={() => setIsConversationPanelOpen(false)}
                                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", display: "flex" }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <button className="conversation-new-btn" onClick={handleCreateConversation}>
                                <Plus size={14} /> Nouvelle conversation
                            </button>

                            <div className="conversation-list">
                                {conversations.length === 0 ? (
                                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, padding: "10px 6px" }}>Aucune conversation.</p>
                                ) : (
                                    conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            className={`conversation-item${conversationId === conv.id ? " active" : ""}`}
                                            onClick={() => handleSelectConversation(conv.id)}
                                        >
                                            <div className="conversation-item-main">
                                                <div className="conversation-item-title">{conv.title || "Nouvelle conversation"}</div>
                                                <div className="conversation-item-time">
                                                    {new Date(conv.updatedAt).toLocaleString([], {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </div>
                                            <span
                                                className="conversation-delete-btn"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    promptDeleteConversation(conv.id);
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Sticky Input Dock ── */}
                    <div className={`input-dock${isConversationPanelOpen ? " with-panel" : ""}`}>
                        <div className="input-dock-inner">
                            <div className="input-box">
                                <textarea
                                    className="input-textarea"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder="Posez une question sur votre codebase..."
                                    rows={1}
                                />
                                <button className="send-btn" onClick={handleSend} disabled={isTyping || !input.trim()}>
                                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                            <p className="send-hint">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</p>
                        </div>
                    </div>
                </div>
            </Content>

            {/* Modales de Workspace (Synchronisées avec le Dashboard) */}
            {showCreateModal && (
                <WorkspaceFormModal
                    mode="create"
                    onSubmit={handleCreateWorkspace}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            {editingWorkspace && (
                <WorkspaceFormModal
                    mode="edit"
                    initialName={editingWorkspace.name}
                    initialSlug={editingWorkspace.slug}
                    onSubmit={handleUpdateWorkspace}
                    onClose={() => setEditingWorkspace(null)}
                />
            )}
            {deletingWorkspace && (
                <DeleteConfirmModal
                    workspaceName={deletingWorkspace.name}
                    onConfirm={handleDeleteWorkspace}
                    onClose={() => setDeletingWorkspace(null)}
                />
            )}
            {showRepoModal && (
                <RepoFormModal
                    mode="add"
                    onSubmit={(owner, repo, branch) => {
                        setRepoList([...repoList, { owner, repo, branch }]);
                        setActiveRepoIndex(repoList.length);
                    }}
                    onClose={() => setShowRepoModal(false)}
                />
            )}
            {editingRepoIndex !== null && (
                <RepoFormModal
                    mode="edit"
                    initialData={repoList[editingRepoIndex]}
                    onSubmit={(owner, repo, branch) => {
                        const newList = [...repoList];
                        newList[editingRepoIndex] = { owner, repo, branch };
                        setRepoList(newList);
                        setEditingRepoIndex(null);
                    }}
                    onClose={() => setEditingRepoIndex(null)}
                />
            )}
            {deletingRepoIndex !== null && (
                <DeleteConfirmModal
                    workspaceName={repoList[deletingRepoIndex].repo}
                    onConfirm={async () => {
                        const newList = repoList.filter((_, i) => i !== deletingRepoIndex);
                        setRepoList(newList);
                        if (activeRepoIndex >= newList.length) {
                            setActiveRepoIndex(Math.max(0, newList.length - 1));
                        }
                        setDeletingRepoIndex(null);
                    }}
                    onClose={() => setDeletingRepoIndex(null)}
                />
            )}
            {deletingConversation && (
                <ConversationDeleteConfirmModal
                    conversationTitle={deletingConversation.title || "Nouvelle conversation"}
                    onConfirm={async () => {
                        await handleDeleteConversation(deletingConversation.id);
                        setDeletingConversation(null);
                    }}
                    onClose={() => setDeletingConversation(null)}
                />
            )}
        </Layout>
    );
}
