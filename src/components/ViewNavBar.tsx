import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  List,
  Kanban,
  Calendar,
  GanttChart,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

type ViewId = "overview" | "list" | "board" | "calendar" | "gantt";

interface View {
  id: ViewId;
  label: string;
  icon: React.ElementType;
  color: string;
}

const VIEWS: View[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, color: "#a89ef5" },
  { id: "list",     label: "List",     icon: List,            color: "#1D9E75" },
  { id: "board",    label: "Board",    icon: Kanban,          color: "#EF9F27" },
  { id: "calendar", label: "Calendar", icon: Calendar,        color: "#D4537E" },
  { id: "gantt",    label: "Gantt",    icon: GanttChart,      color: "#378ADD" },
];

interface ViewNavBarProps {
  activeView?: ViewId;
  onViewChange?: (view: ViewId) => void;
}

export default function ViewNavBar({
  activeView: controlledView,
  onViewChange,
}: ViewNavBarProps) {
  const [internalView, setInternalView] = useState<ViewId>("overview");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeView = controlledView ?? internalView;

  const handleViewChange = (id: ViewId) => {
    if (!controlledView) setInternalView(id);
    onViewChange?.(id);
  };

  // Animate the sliding indicator
  useEffect(() => {
    if (activeRef.current && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
      });
    }
  }, [activeView]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const activeViewData = VIEWS.find((v) => v.id === activeView)!;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Syne:wght@600;700&display=swap');

        .vnb-root {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: #111114;
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
          padding: 0 20px;
          height: 46px;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
        }

        .vnb-left {
          display: flex;
          align-items: center;
          gap: 2px;
          position: relative;
        }

        .vnb-indicator {
          position: absolute;
          bottom: -13px;
          height: 2px;
          border-radius: 99px;
          transition: left 0.25s cubic-bezier(.4,0,.2,1), width 0.25s cubic-bezier(.4,0,.2,1);
          pointer-events: none;
        }

        .vnb-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.38);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          outline: none;
          position: relative;
        }

        .vnb-btn:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
        }

        .vnb-btn.active {
          color: #fff;
          font-weight: 500;
        }

        .vnb-btn.active:hover {
          background: rgba(255,255,255,0.05);
        }

        .vnb-divider {
          width: 0.5px;
          height: 18px;
          background: rgba(255,255,255,0.08);
          margin: 0 6px;
          flex-shrink: 0;
        }

        .vnb-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .vnb-add-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 8px;
          border: 0.5px dashed rgba(255,255,255,0.18);
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          outline: none;
          white-space: nowrap;
        }

        .vnb-add-btn:hover {
          border-color: rgba(83,74,183,0.7);
          color: #a89ef5;
          background: rgba(83,74,183,0.08);
        }

        .vnb-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .vnb-search-input {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 5px 28px 5px 30px;
          font-size: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          width: 0;
          opacity: 0;
          transition: width 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s, border-color 0.2s;
          pointer-events: none;
        }

        .vnb-search-input.open {
          width: 180px;
          opacity: 1;
          pointer-events: auto;
        }

        .vnb-search-input:focus {
          border-color: rgba(83,74,183,0.55);
        }

        .vnb-search-input::placeholder {
          color: rgba(255,255,255,0.22);
        }

        .vnb-icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 0.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        .vnb-icon-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.75);
        }

        .vnb-icon-btn.active-search {
          background: rgba(83,74,183,0.15);
          border-color: rgba(83,74,183,0.4);
          color: #a89ef5;
        }

        /* View content placeholder */
        .view-content {
          animation: fadeSlideIn 0.22s cubic-bezier(.4,0,.2,1);
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* NAV BAR */}
      <nav className="vnb-root">
        {/* Left — view tabs */}
        <div className="vnb-left" ref={navRef}>
          {VIEWS.map((view) => {
            const isActive = view.id === activeView;
            return (
              <button
                key={view.id}
                ref={isActive ? activeRef : undefined}
                className={`vnb-btn ${isActive ? "active" : ""}`}
                onClick={() => handleViewChange(view.id)}
                title={view.label}
              >
                <view.icon
                  size={14}
                  style={{ color: isActive ? view.color : undefined, flexShrink: 0 }}
                />
                {view.label}
              </button>
            );
          })}

          {/* Sliding underline indicator */}
          <div
            className="vnb-indicator"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: activeViewData.color,
              boxShadow: `0 0 8px ${activeViewData.color}88`,
            }}
          />

          <div className="vnb-divider" />

          {/* + View button */}
          <button className="vnb-add-btn" onClick={() => alert("Add a custom view!")}>
            <Plus size={12} />
            View
          </button>
        </div>

        {/* Right — search + filter */}
        <div className="vnb-right">
          {/* Animated search */}
          <div className="vnb-search-wrapper">
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 9,
                color: searchOpen ? "rgba(168,158,245,0.8)" : "rgba(255,255,255,0.3)",
                pointerEvents: "none",
                transition: "color 0.2s",
                zIndex: 1,
              }}
            />
            <input
              ref={searchRef}
              className={`vnb-search-input ${searchOpen ? "open" : ""}`}
              placeholder="Search in view…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchOpen && searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 8, background: "none",
                  border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)",
                  display: "flex", padding: 0,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          <button
            className={`vnb-icon-btn ${searchOpen ? "active-search" : ""}`}
            onClick={() => { setSearchOpen((s) => !s); if (searchOpen) setSearchQuery(""); }}
            title="Search"
          >
            <Search size={13} />
          </button>

          <button className="vnb-icon-btn" title="Filter & sort">
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </nav>
    </>
  );
}