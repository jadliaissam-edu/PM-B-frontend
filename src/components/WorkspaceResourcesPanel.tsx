import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    ChevronDown,
    ChevronRight,
    Folder,
    FolderPlus,
    FolderTree,
    List,
    Pencil,
    Plus,
    Rocket,
    Trash2,
} from "lucide-react";
import {
    createSpace,
    deleteSpace,
    getSpacesByWorkspace,
    updateSpace,
    type SpaceResponseDto,
} from "../api/spaceApi";
import {
    createFolder,
    deleteFolder,
    getFoldersBySpace,
    updateFolder,
    type FolderResponseDto,
} from "../api/folderApi";
import {
    createSprintInFolder,
    deleteSprint,
    getSprintsByFolder,
    updateSprint,
    type SprintResponseDto,
} from "../api/sprintApi";
import {
    createListe,
    deleteListe,
    getListesByFolder,
    updateListe,
    type ListeResponseDto,
} from "../api/listeApi";
import { getWorkspacesByUser, type WorkspaceResponseDto } from "../api/workspaceApi";
import { SpaceAdd, SpaceUpdate, SpaceDelete } from "../forms/SpaceForms";
import { FolderAdd, FolderUpdate, FolderDelete } from "../forms/FolderForms";
import { SprintAdd, SprintUpdate, SprintDelete } from "../forms/SprintForms";
import { ListeAdd, ListeUpdate, ListeDelete } from "../components/listeForms";

type ActiveModal =
    | { type: "SPACE_ADD" }
    | { type: "SPACE_UPDATE"; space: SpaceResponseDto }
    | { type: "SPACE_DELETE"; space: SpaceResponseDto }
    | { type: "FOLDER_ADD"; spaceId: string }
    | { type: "FOLDER_UPDATE"; spaceId: string; folder: FolderResponseDto }
    | { type: "FOLDER_DELETE"; spaceId: string; folder: FolderResponseDto }
    | { type: "SPRINT_ADD"; folderId: string }
    | { type: "SPRINT_UPDATE"; folderId: string; sprint: SprintResponseDto }
    | { type: "SPRINT_DELETE"; folderId: string; sprint: SprintResponseDto }
    | { type: "LISTE_ADD"; folderId?: string; spaceId?: string }
    | { type: "LISTE_UPDATE"; folderId: string; liste: ListeResponseDto }
    | { type: "LISTE_DELETE"; folderId: string; liste: ListeResponseDto }
    | null;


interface WorkspaceResourcesPanelProps {
    workspaceId?: string;
    onResourcesChange?: () => void;
}

function toLocalDateTimeString(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19);
}

export default function WorkspaceResourcesPanel({ workspaceId, onResourcesChange }: WorkspaceResourcesPanelProps) {
    const [spaces, setSpaces] = useState<SpaceResponseDto[]>([]);
    const [foldersBySpace, setFoldersBySpace] = useState<Record<string, FolderResponseDto[]>>({});
    const [sprintsByFolder, setSprintsByFolder] = useState<Record<string, SprintResponseDto[]>>({});
    const [phaseListsByFolder, setPhaseListsByFolder] = useState<Record<string, ListeResponseDto[]>>({});
    const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [loadingSpaces, setLoadingSpaces] = useState(false);
    const [loadingFoldersFor, setLoadingFoldersFor] = useState<string | null>(null);
    const [loadingSprintsFor, setLoadingSprintsFor] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [openSpaceCreateMenuFor, setOpenSpaceCreateMenuFor] = useState<string | null>(null);
    const [openCreateMenuFor, setOpenCreateMenuFor] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceResponseDto[]>([]);


    const loadSpaces = useCallback(async () => {
        if (!workspaceId) {
            setSpaces([]);
            return;
        }

        setLoadingSpaces(true);
        setErrorMessage(null);

        try {
            const loadedSpaces = await getSpacesByWorkspace(workspaceId);
            setSpaces(loadedSpaces);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load spaces.";
            setErrorMessage(message);
            setSpaces([]);
        } finally {
            setLoadingSpaces(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        const fetchAllWorkspaces = async () => {
            try {
                const workspaces = await getWorkspacesByUser();
                setAllWorkspaces(workspaces);
            } catch (err) {
                console.error("Failed to fetch workspaces for form options", err);
            }
        };
        void fetchAllWorkspaces();
    }, []);

    useEffect(() => {
        setFoldersBySpace({});
        setSprintsByFolder({});
        setPhaseListsByFolder({});
        setExpandedSpaces({});
        setExpandedFolders({});
        setOpenSpaceCreateMenuFor(null);
        setOpenCreateMenuFor(null);
        void loadSpaces();
    }, [loadSpaces]);


    const loadFolders = async (spaceId: string) => {
        setLoadingFoldersFor(spaceId);
        setErrorMessage(null);

        try {
            const loadedFolders = await getFoldersBySpace(spaceId);
            setFoldersBySpace((prev) => ({ ...prev, [spaceId]: loadedFolders }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load folders.";
            setErrorMessage(message);
            setFoldersBySpace((prev) => ({ ...prev, [spaceId]: [] }));
        } finally {
            setLoadingFoldersFor(null);
        }
    };

    const loadSprints = async (folderId: string) => {
        setLoadingSprintsFor(folderId);
        setErrorMessage(null);

        try {
            const loadedSprints = await getSprintsByFolder(folderId);
            setSprintsByFolder((prev) => ({ ...prev, [folderId]: loadedSprints }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load sprints.";
            setErrorMessage(message);
            setSprintsByFolder((prev) => ({ ...prev, [folderId]: [] }));
        } finally {
            setLoadingSprintsFor(null);
        }
    };

    const loadPhaseLists = async (folderId: string) => {
        setErrorMessage(null);

        try {
            const loadedLists = await getListesByFolder(folderId);
            const phaseLists = loadedLists.filter((liste) => liste.type === "PHASE");
            setPhaseListsByFolder((prev) => ({ ...prev, [folderId]: phaseLists }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load lists.";
            setErrorMessage(message);
            setPhaseListsByFolder((prev) => ({ ...prev, [folderId]: [] }));
        }
    };

    const handleToggleSpace = async (spaceId: string) => {
        const isCurrentlyOpen = Boolean(expandedSpaces[spaceId]);

        setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !isCurrentlyOpen }));

        if (!isCurrentlyOpen && !foldersBySpace[spaceId]) {
            await loadFolders(spaceId);
        }
    };

    const handleToggleFolder = async (folderId?: string) => {
        if (!folderId) return;

        const isCurrentlyOpen = Boolean(expandedFolders[folderId]);

        setExpandedFolders((prev) => ({ ...prev, [folderId]: !isCurrentlyOpen }));

        if (!isCurrentlyOpen) {
            const shouldLoadSprints = !sprintsByFolder[folderId];
            const shouldLoadPhaseLists = !phaseListsByFolder[folderId];

            await Promise.all([
                shouldLoadSprints ? loadSprints(folderId) : Promise.resolve(),
                shouldLoadPhaseLists ? loadPhaseLists(folderId) : Promise.resolve(),
            ]);
        }
    };

    const handleCreateSpace = () => {
        if (!workspaceId) return;
        setActiveModal({ type: "SPACE_ADD" });
    };

    const handleOnSpaceChange = useCallback(() => {
        onResourcesChange?.();
    }, [onResourcesChange]);



    const handleEditSpace = (space: SpaceResponseDto) => {
        setActiveModal({ type: "SPACE_UPDATE", space });
    };


    const handleDeleteSpace = (space: SpaceResponseDto) => {
        setActiveModal({ type: "SPACE_DELETE", space });
    };


    const handleCreateFolder = (spaceId: string) => {
        setActiveModal({ type: "FOLDER_ADD", spaceId });
    };


    const handleEditFolder = (spaceId: string, folder: FolderResponseDto) => {
        if (!folder.id) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }
        setActiveModal({ type: "FOLDER_UPDATE", spaceId, folder });
    };


    const handleDeleteFolder = (spaceId: string, folder: FolderResponseDto) => {
        if (!folder.id) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }
        setActiveModal({ type: "FOLDER_DELETE", spaceId, folder });
    };


    const handleCreateSprint = (folderId?: string) => {
        if (!folderId) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }
        setActiveModal({ type: "SPRINT_ADD", folderId });
    };


    const handleCreatePhaseList = (folderId?: string) => {
        setActiveModal({ type: "LISTE_ADD", folderId });
    };

    const handleCreatePhaseListFromSpace = async (spaceId: string) => {
        if (!foldersBySpace[spaceId]) {
            await loadFolders(spaceId);
        }
        setActiveModal({ type: "LISTE_ADD", spaceId });
    };

    const handleEditPhaseList = (folderId: string, liste: ListeResponseDto) => {
        setActiveModal({ type: "LISTE_UPDATE", folderId, liste });
    };

    const handleDeletePhaseList = (folderId: string, liste: ListeResponseDto) => {
        setActiveModal({ type: "LISTE_DELETE", folderId, liste });
    };

    const handleDeleteSprint = (folderId: string, sprint: SprintResponseDto) => {
        setActiveModal({ type: "SPRINT_DELETE", folderId, sprint });
    };

    const handleEditSprint = (folderId: string, sprint: SprintResponseDto) => {
        setActiveModal({ type: "SPRINT_UPDATE", folderId, sprint });
    };


    return (
        <div style={{ padding: "10px 8px 2px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    padding: "0 6px",
                }}
            >
                <p
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.25)",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                    }}
                >
                    <FolderTree size={11} />
                    Spaces
                </p>
                <button
                    title="Create space"
                    onClick={handleCreateSpace}
                    disabled={!workspaceId}
                    style={{
                        border: "none",
                        background: "rgba(83,74,183,0.18)",
                        color: "#c8c0ff",
                        borderRadius: 8,
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: workspaceId ? "pointer" : "not-allowed",
                        opacity: workspaceId ? 1 : 0.4,
                    }}
                >
                    <Plus size={13} />
                </button>
            </div>

            {!workspaceId && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, padding: "4px 8px 8px" }}>
                    Select a workspace first.
                </div>
            )}

            {loadingSpaces && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, padding: "4px 8px 8px" }}>
                    Loading spaces...
                </div>
            )}

            {errorMessage && (
                <div style={{ color: "#fda4af", fontSize: 11, padding: "4px 8px 8px" }}>
                    {errorMessage}
                </div>
            )}

            {!loadingSpaces && workspaceId && spaces.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, padding: "4px 8px 8px" }}>
                    No spaces in this workspace.
                </div>
            )}

            {spaces.map((space) => {
                const isSpaceOpen = Boolean(expandedSpaces[space.id]);
                const spaceFolders = foldersBySpace[space.id] || [];
                const spaceRowKey = `space-${space.id}`;
                const isSpaceHovered = hoveredRow === spaceRowKey;
                const isSpaceCreateMenuOpen = openSpaceCreateMenuFor === spaceRowKey;

                return (
                    <div key={space.id}>
                        <div
                            onMouseEnter={() => setHoveredRow(spaceRowKey)}
                            onMouseLeave={() => {
                                setHoveredRow(null);
                                setOpenSpaceCreateMenuFor(null);
                            }}
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 8px",
                                borderRadius: 9,
                                cursor: "pointer",
                                background: hoveredRow === spaceRowKey ? "rgba(255,255,255,0.05)" : "transparent",
                                color: "rgba(255,255,255,0.82)",
                                fontSize: 13,
                            }}
                        >
                            <button
                                onClick={() => {
                                    void handleToggleSpace(space.id);
                                }}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.65)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                    width: 14,
                                    height: 14,
                                    cursor: "pointer",
                                }}
                                aria-label={isSpaceOpen ? "Collapse space" : "Expand space"}
                            >
                                <CollapsibleLeadIcon
                                    isOpen={isSpaceOpen}
                                    isHovered={isSpaceHovered}
                                    resourceIcon={FolderTree}
                                    resourceColor="#8ea2ff"
                                    resourceSize={13}
                                    chevronSize={14}
                                />
                            </button>

                            <span
                                onClick={() => {
                                    void handleToggleSpace(space.id);
                                }}
                                style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {space.spaceName}
                            </span>

                            {hoveredRow === spaceRowKey && (
                                <>
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <button
                                            title="Create item"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setOpenSpaceCreateMenuFor((current) => (current === spaceRowKey ? null : spaceRowKey));
                                            }}
                                            style={miniActionStyle("rgba(29,158,117,0.2)", "#76e7c2")}
                                        >
                                            <Plus size={12} />
                                        </button>

                                        {isSpaceCreateMenuOpen && (
                                            <div
                                                onClick={(event) => event.stopPropagation()}
                                                style={{
                                                    position: "absolute",
                                                    top: "calc(100% + 6px)",
                                                    right: 0,
                                                    minWidth: 130,
                                                    padding: 6,
                                                    borderRadius: 10,
                                                    border: "1px solid rgba(255,255,255,0.14)",
                                                    background: "rgba(13,15,20,0.96)",
                                                    boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                    zIndex: 20,
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setOpenSpaceCreateMenuFor(null);
                                                        void handleCreateFolder(space.id);
                                                    }}
                                                    style={createMenuItemStyle}
                                                >
                                                    Create Folder
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpenSpaceCreateMenuFor(null);
                                                        void handleCreatePhaseListFromSpace(space.id);
                                                    }}
                                                    style={createMenuItemStyle}
                                                >
                                                    Create List
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        title="Edit space"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setOpenSpaceCreateMenuFor(null);
                                            void handleEditSpace(space);
                                        }}
                                        style={miniActionStyle("rgba(83,74,183,0.18)", "#c8c0ff")}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        title="Delete space"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setOpenSpaceCreateMenuFor(null);
                                            void handleDeleteSpace(space);
                                        }}
                                        style={miniActionStyle("rgba(226,75,74,0.18)", "#fca5a5")}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            )}
                        </div>

                        {isSpaceOpen && (
                            <div style={{ marginLeft: 18, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                                {loadingFoldersFor === space.id && (
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, padding: "6px 10px" }}>
                                        Loading folders...
                                    </div>
                                )}

                                {!loadingFoldersFor && spaceFolders.length === 0 && (
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, padding: "6px 10px" }}>
                                        No folders.
                                    </div>
                                )}

                                {spaceFolders.map((folder, index) => {
                                    const folderLocalKey = folder.id || `${space.id}-folder-${index}`;
                                    const folderRowKey = `folder-${folderLocalKey}`;
                                    const isFolderOpen = folder.id ? Boolean(expandedFolders[folder.id]) : false;
                                    const isFolderHovered = hoveredRow === folderRowKey;
                                    const isCreateMenuOpen = openCreateMenuFor === folderRowKey;
                                    const folderSprints = folder.id ? sprintsByFolder[folder.id] || [] : [];
                                    const folderPhaseLists = folder.id ? phaseListsByFolder[folder.id] || [] : [];

                                    return (
                                        <div key={folderLocalKey}>
                                            <div
                                                onMouseEnter={() => setHoveredRow(folderRowKey)}
                                                onMouseLeave={() => {
                                                    setHoveredRow(null);
                                                    setOpenCreateMenuFor(null);
                                                }}
                                                style={{
                                                    position: "relative",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: "6px 10px",
                                                    borderRadius: 8,
                                                    cursor: folder.id ? "pointer" : "default",
                                                    color: "rgba(255,255,255,0.68)",
                                                    fontSize: 12,
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        if (folder.id) {
                                                            void handleToggleFolder(folder.id);
                                                        }
                                                    }}
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        color: "rgba(255,255,255,0.55)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        padding: 0,
                                                        width: 13,
                                                        height: 13,
                                                        cursor: folder.id ? "pointer" : "not-allowed",
                                                        opacity: folder.id ? 1 : 0.35,
                                                    }}
                                                    aria-label={isFolderOpen ? "Collapse folder" : "Expand folder"}
                                                >
                                                    <CollapsibleLeadIcon
                                                        isOpen={isFolderOpen}
                                                        isHovered={isFolderHovered}
                                                        resourceIcon={Folder}
                                                        resourceColor="#8ed6c2"
                                                        resourceSize={12}
                                                        chevronSize={13}
                                                    />
                                                </button>

                                                <span
                                                    onClick={() => {
                                                        if (folder.id) {
                                                            void handleToggleFolder(folder.id);
                                                        }
                                                    }}
                                                    style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                >
                                                    {folder.name}
                                                </span>

                                                {hoveredRow === folderRowKey && (
                                                    <>
                                                        <div style={{ position: "relative", flexShrink: 0 }}>
                                                            <button
                                                                title="Create item"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    setOpenCreateMenuFor((current) => (current === folderRowKey ? null : folderRowKey));
                                                                }}
                                                                style={miniActionStyle("rgba(29,158,117,0.2)", "#76e7c2", !folder.id)}
                                                                disabled={!folder.id}
                                                            >
                                                                <Plus size={12} />
                                                            </button>

                                                            {isCreateMenuOpen && folder.id && (
                                                                <div
                                                                    onClick={(event) => event.stopPropagation()}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "calc(100% + 6px)",
                                                                        right: 0,
                                                                        minWidth: 130,
                                                                        padding: 6,
                                                                        borderRadius: 10,
                                                                        border: "1px solid rgba(255,255,255,0.14)",
                                                                        background: "rgba(13,15,20,0.96)",
                                                                        boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        gap: 4,
                                                                        zIndex: 20,
                                                                    }}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenCreateMenuFor(null);
                                                                            void handleCreateSprint(folder.id);
                                                                        }}
                                                                        style={createMenuItemStyle}
                                                                    >
                                                                        Create Sprint
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenCreateMenuFor(null);
                                                                            void handleCreatePhaseList(folder.id);
                                                                        }}
                                                                        style={createMenuItemStyle}
                                                                    >
                                                                        Create List
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            title="Edit folder"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setOpenCreateMenuFor(null);
                                                                void handleEditFolder(space.id, folder);
                                                            }}
                                                            style={miniActionStyle("rgba(83,74,183,0.18)", "#c8c0ff", !folder.id)}
                                                            disabled={!folder.id}
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            title="Delete folder"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setOpenCreateMenuFor(null);
                                                                void handleDeleteFolder(space.id, folder);
                                                            }}
                                                            style={miniActionStyle("rgba(226,75,74,0.18)", "#fca5a5", !folder.id)}
                                                            disabled={!folder.id}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {folder.id && isFolderOpen && (
                                                <div style={{ marginLeft: 16, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                                                    {loadingSprintsFor === folder.id && (
                                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, padding: "6px 10px" }}>
                                                            Loading items...
                                                        </div>
                                                    )}

                                                    {!loadingSprintsFor && folderSprints.length === 0 && folderPhaseLists.length === 0 && (
                                                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, padding: "6px 10px" }}>
                                                            No sprints or lists.
                                                        </div>
                                                    )}

                                                    {folderPhaseLists.map((liste) => {
                                                        const listRowKey = `list-${liste.id}`;

                                                        return (
                                                            <div
                                                                key={liste.id}
                                                                onMouseEnter={() => setHoveredRow(listRowKey)}
                                                                onMouseLeave={() => setHoveredRow(null)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 6,
                                                                    padding: "6px 10px",
                                                                    borderRadius: 8,
                                                                    color: "rgba(255,255,255,0.62)",
                                                                    fontSize: 12,
                                                                }}
                                                                title="List"
                                                            >
                                                                <List size={12} style={{ color: "#93c5fd", flexShrink: 0 }} />
                                                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    {liste.name}
                                                                </span>

                                                                {hoveredRow === listRowKey && (
                                                                    <>
                                                                        <button
                                                                            title="Edit list"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                void handleEditPhaseList(folder.id!, liste);
                                                                            }}
                                                                            style={miniActionStyle("rgba(83,74,183,0.18)", "#c8c0ff")}
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button
                                                                            title="Delete list"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                void handleDeletePhaseList(folder.id!, liste);
                                                                            }}
                                                                            style={miniActionStyle("rgba(226,75,74,0.18)", "#fca5a5")}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {folderSprints.map((sprint) => {
                                                        const sprintRowKey = `sprint-${sprint.id}`;

                                                        return (
                                                            <div
                                                                key={sprint.id}
                                                                onMouseEnter={() => setHoveredRow(sprintRowKey)}
                                                                onMouseLeave={() => setHoveredRow(null)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 6,
                                                                    padding: "6px 10px",
                                                                    borderRadius: 8,
                                                                    color: "rgba(255,255,255,0.62)",
                                                                    fontSize: 12,
                                                                }}
                                                                title="Sprint"
                                                            >
                                                                <Rocket size={12} style={{ color: "#f8c285", flexShrink: 0 }} />
                                                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    {sprint.name}
                                                                </span>

                                                                {hoveredRow === sprintRowKey && (
                                                                    <>
                                                                        <button
                                                                            title="Edit sprint"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                void handleEditSprint(folder.id!, sprint);
                                                                            }}
                                                                            style={miniActionStyle("rgba(83,74,183,0.18)", "#c8c0ff")}
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button
                                                                            title="Delete sprint"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                void handleDeleteSprint(folder.id!, sprint);
                                                                            }}
                                                                            style={miniActionStyle("rgba(226,75,74,0.18)", "#fca5a5")}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
            {activeModal?.type === "SPACE_ADD" && (
                <SpaceAdd
                    onClose={() => setActiveModal(null)}
                    workspaces={allWorkspaces.map((w) => ({ value: w.id, label: w.name }))}
                    defaults={{ workspaceId }}
                    onSubmit={async (data) => {
                        await createSpace(data);
                        await loadSpaces();
                        handleOnSpaceChange();
                    }}
                />
            )}
            {activeModal?.type === "SPACE_UPDATE" && (
                <SpaceUpdate
                    onClose={() => setActiveModal(null)}
                    spaceId={activeModal.space.id}
                    workspaces={allWorkspaces.map((w) => ({ value: w.id, label: w.name }))}
                    defaults={{
                        name: activeModal.space.spaceName,
                        description: activeModal.space.description,
                        color: activeModal.space.color,
                        isPrivate: activeModal.space.isPrivate,
                        workspaceId,
                    }}
                    onSubmit={async (data) => {
                        await updateSpace(activeModal.space.id, data);
                        await loadSpaces();
                        handleOnSpaceChange();
                    }}
                />
            )}
            {activeModal?.type === "SPACE_DELETE" && (
                <SpaceDelete
                    onClose={() => setActiveModal(null)}
                    space={{ id: activeModal.space.id, name: activeModal.space.spaceName }}
                    onDelete={async (id) => {
                        await deleteSpace(id);
                        await loadSpaces();
                        handleOnSpaceChange();
                    }}
                />
            )}

            {activeModal?.type === "FOLDER_ADD" && (
                <FolderAdd
                    onClose={() => setActiveModal(null)}
                    spaces={spaces.map((s) => ({ value: s.id, label: s.spaceName }))}
                    defaults={{ spaceId: activeModal.spaceId }}
                    onSubmit={async (data) => {
                        await createFolder(data);
                        await loadFolders(activeModal.spaceId);
                        onResourcesChange?.();
                    }}
                />
            )}
            {activeModal?.type === "FOLDER_UPDATE" && (
                <FolderUpdate
                    onClose={() => setActiveModal(null)}
                    folderId={activeModal.folder.id!}
                    spaces={spaces.map((s) => ({ value: s.id, label: s.spaceName }))}
                    defaults={{
                        name: activeModal.folder.name,
                        description: activeModal.folder.description,
                        isHidden: activeModal.folder.isHidden,
                        spaceId: activeModal.spaceId,
                    }}
                    onSubmit={async (data) => {
                        await updateFolder(activeModal.folder.id!, data);
                        await loadFolders(activeModal.spaceId);
                        if (expandedFolders[activeModal.folder.id!]) {
                            await Promise.all([loadSprints(activeModal.folder.id!), loadPhaseLists(activeModal.folder.id!)]);
                        }
                        onResourcesChange?.();
                    }}
                />
            )}
            {activeModal?.type === "FOLDER_DELETE" && (
                <FolderDelete
                    onClose={() => setActiveModal(null)}
                    folder={{ id: activeModal.folder.id!, name: activeModal.folder.name }}
                    onDelete={async (id) => {
                        await deleteFolder(id);
                        await loadFolders(activeModal.spaceId);
                        onResourcesChange?.();
                    }}
                />
            )}

            {activeModal?.type === "SPRINT_ADD" && (
                <SprintAdd
                    onClose={() => setActiveModal(null)}
                    folders={spaces.flatMap(s => foldersBySpace[s.id] || []).map(f => ({ value: f.id!, label: f.name }))}
                    defaults={{ folderId: activeModal.folderId }}
                    onSubmit={async (data) => {
                        await createSprintInFolder(activeModal.folderId, data);
                        await loadSprints(activeModal.folderId);
                        onResourcesChange?.();
                    }}
                />
            )}
            {activeModal?.type === "SPRINT_UPDATE" && (
                <SprintUpdate
                    onClose={() => setActiveModal(null)}
                    sprintId={activeModal.sprint.id}
                    folders={spaces.flatMap(s => foldersBySpace[s.id] || []).map(f => ({ value: f.id!, label: f.name }))}
                    defaults={{ ...activeModal.sprint, folderId: activeModal.folderId }}
                    onSubmit={async (data) => {
                        await updateSprint(activeModal.sprint.id, data);
                        await loadSprints(activeModal.folderId);
                        onResourcesChange?.();
                    }}
                />
            )}
            {activeModal?.type === "SPRINT_DELETE" && (
                <SprintDelete
                    onClose={() => setActiveModal(null)}
                    sprint={{ id: activeModal.sprint.id, name: activeModal.sprint.name }}
                    onDelete={async (id) => {
                        await deleteSprint(id);
                        await loadSprints(activeModal.folderId);
                        onResourcesChange?.();
                    }}
                />
            )}

            {activeModal?.type === "LISTE_ADD" && (
                <ListeAdd
                    onClose={() => setActiveModal(null)}
                    folders={spaces.flatMap(s => foldersBySpace[s.id] || []).map(f => ({ value: f.id!, label: f.name }))}
                    sprints={activeModal.folderId ? (sprintsByFolder[activeModal.folderId] || []).map(s => ({ value: s.id, label: s.name })) : []}
                    defaults={{ folderId: activeModal.folderId, type: "PHASE", order: (activeModal.folderId ? phaseListsByFolder[activeModal.folderId]?.length || 0 : 0) + 1 }}
                    onSubmit={async (data) => {
                        await createListe(data);
                        if (data.folderId) {
                            await loadPhaseLists(data.folderId);
                        }
                    }}
                />
            )}
            {activeModal?.type === "LISTE_UPDATE" && (
                <ListeUpdate
                    onClose={() => setActiveModal(null)}
                    listeId={activeModal.liste.id}
                    folders={spaces.flatMap(s => foldersBySpace[s.id] || []).map(f => ({ value: f.id!, label: f.name }))}
                    sprints={activeModal.folderId ? (sprintsByFolder[activeModal.folderId] || []).map(s => ({ value: s.id, label: s.name })) : []}
                    defaults={{ name: activeModal.liste.name, folderId: activeModal.folderId, type: activeModal.liste.type, order: typeof activeModal.liste.order === "number" ? activeModal.liste.order : 1 }}
                    onSubmit={async (data) => {
                        await updateListe(activeModal.liste.id, data);
                        await loadPhaseLists(activeModal.folderId);
                    }}
                />
            )}
            {activeModal?.type === "LISTE_DELETE" && (
                <ListeDelete
                    onClose={() => setActiveModal(null)}
                    liste={{ id: activeModal.liste.id, name: activeModal.liste.name }}
                    onDelete={async (id) => {
                        await deleteListe(id);
                        await loadPhaseLists(activeModal.folderId);
                    }}
                />
            )}

        </div>
    );
}


interface CollapsibleLeadIconProps {
    isOpen: boolean;
    isHovered: boolean;
    resourceIcon: LucideIcon;
    resourceColor: string;
    resourceSize: number;
    chevronSize: number;
}

function CollapsibleLeadIcon({
    isOpen,
    isHovered,
    resourceIcon: ResourceIcon,
    resourceColor,
    resourceSize,
    chevronSize,
}: CollapsibleLeadIconProps) {
    return (
        <span
            style={{
                position: "relative",
                width: Math.max(resourceSize, chevronSize),
                height: Math.max(resourceSize, chevronSize),
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isHovered ? 0 : 1,
                    transform: isHovered ? "translateX(-3px) scale(0.92)" : "translateX(0) scale(1)",
                    transition: "opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1)",
                    pointerEvents: "none",
                }}
            >
                <ResourceIcon size={resourceSize} style={{ color: resourceColor, flexShrink: 0 }} />
            </span>

            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.72)",
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateX(0) scale(1)" : "translateX(3px) scale(0.92)",
                    transition: "opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1)",
                    pointerEvents: "none",
                }}
            >
                {isOpen ? <ChevronDown size={chevronSize} /> : <ChevronRight size={chevronSize} />}
            </span>
        </span>
    );
}

function miniActionStyle(background: string, color: string, disabled = false) {
    return {
        width: 22,
        height: 22,
        border: "none",
        borderRadius: 7,
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        padding: 0,
        flexShrink: 0,
    } as const;
}

const createMenuItemStyle = {
    border: "none",
    borderRadius: 7,
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.88)",
    textAlign: "left",
    fontSize: 11,
    padding: "7px 9px",
    cursor: "pointer",
} as const;
