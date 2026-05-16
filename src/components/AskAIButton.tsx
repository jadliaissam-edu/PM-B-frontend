import React from "react";
import { Loader2 } from "lucide-react";

interface AskAIButtonProps {
  entityName: string;
  onGenerationComplete: (text: string) => void;
  isLoading: boolean;
  entityType: "space" | "folder" | "task" | "sprint";
  className?: string;
}

import { askAI } from "../api/iaApi";

// ─── Robot Head SVG Custom Component (Style Agent Robot) ──────────────────────
const RobotIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v4" />
    <path d="M9 5h6" />
    <path d="M3 13h2" />
    <path d="M19 13h2" />
    <rect x="5" y="8" width="14" height="12" rx="3" />
    <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
    <path d="M9 17h6" />
  </svg>
);

const AskAIButton: React.FC<AskAIButtonProps> = ({
  entityName,
  onGenerationComplete,
  isLoading: parentLoading,
  entityType,
  className = "",
}) => {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const handleAskAI = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!entityName.trim() || internalLoading || parentLoading) return;

    setInternalLoading(true);
    try {
      const response = await askAI(entityType, entityName);
      onGenerationComplete(response.generated_text);
    } catch (error) {
      console.error("Ask AI error:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const isLoading = internalLoading || parentLoading;
  const isDisabled = !entityName.trim() || isLoading;

  return (
    <button
      onClick={handleAskAI}
      disabled={isDisabled}
      className={`
        relative group flex items-center gap-2 px-3.5 py-1.5 rounded-lg
        font-bold text-[10px] uppercase tracking-wider transition-all duration-300
        overflow-hidden border
        ${
          isDisabled
            ? "bg-zinc-900/40 text-zinc-600 border-zinc-800/50 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600/90 via-indigo-600/90 to-cyan-600/90 text-white shadow-lg shadow-indigo-500/25 border-indigo-400/30 hover:border-cyan-400/60 hover:scale-[1.03] active:scale-95 hover:shadow-cyan-500/20"
        }
        ${className}
      `}
      title="Générer avec l'Agent IA"
    >
      {/* Laser light reflection bar inside button */}
      {!isDisabled && (
        <div className="absolute inset-0 w-[40px] h-full bg-white/20 transform -skew-x-12 -translate-x-[60px] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}

      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
      ) : (
        <RobotIcon className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-6 transition-transform duration-300" />
      )}
      
      <span className="relative font-mono font-semibold tracking-widest">
        {isLoading ? "ROBOT..." : "ASK AGENT"}
      </span>

      {/* Cyberpunk Glow Effect */}
      {!isDisabled && (
        <div className="absolute -inset-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-lg -z-10 opacity-0 group-hover:opacity-50 blur-[8px] transition-opacity duration-500" />
      )}

      {/* Futuristic Custom Styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: skewX(-12deg) translateX(-60px); }
          100% { transform: skewX(-12deg) translateX(240px); }
        }
      `}</style>
    </button>
  );
};

export default AskAIButton;
