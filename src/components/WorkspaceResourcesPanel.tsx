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
import { getListesByFolder, type ListeResponseDto } from "../api/listeApi";

interface WorkspaceResourcesPanelProps {
    workspaceId?: string;
}

function toLocalDateTimeString(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19);
}

export default function WorkspaceResourcesPanel({ workspaceId }: WorkspaceResourcesPanelProps) {
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setFoldersBySpace({});
        setSprintsByFolder({});
        setPhaseListsByFolder({});
        setExpandedSpaces({});
        setExpandedFolders({});
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

    const handleCreateSpace = async () => {
        if (!workspaceId) return;

        const name = window.prompt("Space name");
        if (!name || !name.trim()) return;

        try {
            await createSpace({
                name: name.trim(),
                color: "#534AB7",
                isPrivate: false,
                workspaceId,
            });
            await loadSpaces();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create space.";
            setErrorMessage(message);
        }
    };

    const handleEditSpace = async (space: SpaceResponseDto) => {
        if (!workspaceId) return;

        const nextName = window.prompt("Edit space name", space.spaceName || "");
        if (!nextName || !nextName.trim()) return;

        try {
            await updateSpace(space.id, {
                name: nextName.trim(),
                color: space.color || "#534AB7",
                isPrivate: space.isPrivate,
                workspaceId,
            });
            await loadSpaces();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update space.";
            setErrorMessage(message);
        }
    };

    const handleDeleteSpace = async (space: SpaceResponseDto) => {
        if (!window.confirm(`Delete space \"${space.spaceName}\" ?`)) return;

        try {
            await deleteSpace(space.id);
            await loadSpaces();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete space.";
            setErrorMessage(message);
        }
    };

    const handleCreateFolder = async (spaceId: string) => {
        const name = window.prompt("Folder name");
        if (!name || !name.trim()) return;

        try {
            await createFolder({
                name: name.trim(),
                isHidden: false,
                spaceId,
            });
            await loadFolders(spaceId);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create folder.";
            setErrorMessage(message);
        }
    };

    const handleEditFolder = async (spaceId: string, folder: FolderResponseDto) => {
        if (!folder.id) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }

        const nextName = window.prompt("Edit folder name", folder.name || "");
        if (!nextName || !nextName.trim()) return;

        try {
            await updateFolder(folder.id, {
                name: nextName.trim(),
                isHidden: Boolean(folder.isHidden),
                spaceId,
            });
            await loadFolders(spaceId);
            if (expandedFolders[folder.id]) {
                await Promise.all([loadSprints(folder.id), loadPhaseLists(folder.id)]);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update folder.";
            setErrorMessage(message);
        }
    };

    const handleDeleteFolder = async (spaceId: string, folder: FolderResponseDto) => {
        if (!folder.id) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }

        if (!window.confirm(`Delete folder \"${folder.name}\" ?`)) return;

        try {
            await deleteFolder(folder.id);
            await loadFolders(spaceId);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete folder.";
            setErrorMessage(message);
        }
    };

    const handleCreateSprint = async (folderId?: string) => {
        if (!folderId) {
            setErrorMessage("Folder id is missing on backend response.");
            return;
        }

        const name = window.prompt("Sprint name");
        if (!name || !name.trim()) return;

        const goal = window.prompt("Sprint goal", "Deliver planned features") || "";
        const startDate = toLocalDateTimeString(new Date());
        const endDate = toLocalDateTimeString(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

        try {
            await createSprintInFolder(folderId, {
                name: name.trim(),
                goal,
                isActive: true,
                startDate,
                endDate,
            });
            await loadSprints(folderId);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create sprint.";
            setErrorMessage(message);
        }
    };

    const handleEditSprint = async (folderId: string, sprint: SprintResponseDto) => {
        const nextName = window.prompt("Edit sprint name", sprint.name || "");
        if (!nextName || !nextName.trim()) return;

        const existingStart = sprint.startDate?.slice(0, 19) || toLocalDateTimeString(new Date());
        const existingEnd = sprint.endDate?.slice(0, 19) || toLocalDateTimeString(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

        try {
            await updateSprint(sprint.id, {
                name: nextName.trim(),
                goal: sprint.goal || "",
                isActive: Boolean(sprint.isActive),
                startDate: existingStart,
                endDate: existingEnd,
            });
            await loadSprints(folderId);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update sprint.";
            setErrorMessage(message);
        }
    };

    const handleDeleteSprint = async (folderId: string, sprint: SprintResponseDto) => {
        if (!window.confirm(`Delete sprint \"${sprint.name}\" ?`)) return;

        try {
            await deleteSprint(sprint.id);
            await loadSprints(folderId);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete sprint.";
            setErrorMessage(message);
        }
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

                return (
                    <div key={space.id}>
                        <div
                            onMouseEnter={() => setHoveredRow(spaceRowKey)}
                            onMouseLeave={() => setHoveredRow(null)}
                            style={{
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
                                    <button
                                        title="Create folder"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleCreateFolder(space.id);
                                        }}
                                        style={miniActionStyle("rgba(29,158,117,0.2)", "#76e7c2")}
                                    >
                                        <FolderPlus size={12} />
                                    </button>
                                    <button
                                        title="Edit space"
                                        onClick={(event) => {
                                            event.stopPropagation();
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
                                    const folderSprints = folder.id ? sprintsByFolder[folder.id] || [] : [];
                                    const folderPhaseLists = folder.id ? phaseListsByFolder[folder.id] || [] : [];

                                    return (
                                        <div key={folderLocalKey}>
                                            <div
                                                onMouseEnter={() => setHoveredRow(folderRowKey)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{
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
                                                        <button
                                                            title="Create sprint"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                void handleCreateSprint(folder.id);
                                                            }}
                                                            style={miniActionStyle("rgba(29,158,117,0.2)", "#76e7c2", !folder.id)}
                                                            disabled={!folder.id}
                                                        >
                                                            <Rocket size={12} />
                                                        </button>
                                                        <button
                                                            title="Edit folder"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
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
