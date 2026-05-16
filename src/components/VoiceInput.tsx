import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, Check } from "lucide-react";
import { transcribeAudio } from "../api/iaApi";

// ─── Types ───────────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "transcribing" | "unsupported";

interface Language {
  code: string;
  label: string;
  flag: string;
  listeningMsg: string;
  whisperCode: string;
}

interface VoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  inputValue: string;
  onInterimResult?: (text: string) => void;
  onError?: (msg: string) => void;
}

const LANGUAGES: Language[] = [
  { code: "fr-FR", label: "FR", flag: "🇫🇷", listeningMsg: "Je vous écoute en Français...", whisperCode: "fr" },
  { code: "en-US", label: "EN", flag: "🇺🇸", listeningMsg: "Listening in English...", whisperCode: "en" },
];

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onInterimResult,
  onError,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // ─── UI/UX: Fermer le sélecteur si clic à l'extérieur (Best practice) ─────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const stopRecognition = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startRecognition = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingState("unsupported");
      onError?.("Microphone non supporté.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstart = () => {
        setRecordingState("recording");
        onInterimResult?.(selectedLang.listeningMsg);
      };

      recorder.onstop = async () => {
        setRecordingState("transcribing");
        onInterimResult?.("Analyse...");

        try {
          if (audioChunksRef.current.length === 0) {
            console.warn("Aucun audio enregistré.");
            setRecordingState("idle");
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          // Appel à l'API backend Whisper Local
          const result = await transcribeAudio(audioBlob, selectedLang.whisperCode);
          
          if (result.text) {
            onTranscript(result.text.trim() + " ", true);
          }
          
          setRecordingState("idle");
          onInterimResult?.("");
        } catch (err: any) {
          onError?.(`Erreur transcription : ${err.message}`);
          setRecordingState("idle");
          onInterimResult?.("");
        }
      };

      recorder.start();
    } catch (err: any) {
      onError?.(`Microphone : ${err.message}`);
      setRecordingState("idle");
    }
  }, [selectedLang, onTranscript, onInterimResult, onError]);

  const handleMicClick = () => {
    if (recordingState === "recording") stopRecognition();
    else if (recordingState === "idle") startRecognition();
  };

  return (
    <div className="flex items-center gap-2 relative shrink-0">
      
      {/* ─── STYLE DYNAMIQUE DES COMPOSANTS (Soundwaves / Glow / Rec) ─────────── */}
      <style>{`
        @keyframes soundwave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .wave-bar {
          width: 2.5px;
          background-color: #ef4444;
          border-radius: 99px;
          animation: soundwave 0.8s ease-in-out infinite;
        }
        .wave-bar:nth-child(2) { animation-delay: 0.15s; }
        .wave-bar:nth-child(3) { animation-delay: 0.3s; }
        .wave-bar:nth-child(4) { animation-delay: 0.45s; }
      `}</style>

      {/* ─── OPTIMISATION DU SÉLECTEUR DE LANGUES ────────────────────────────── */}
      <div ref={langMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          disabled={recordingState !== "idle"}
          className={`
            w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer
            border transition-all duration-300
            ${
              recordingState !== "idle"
                ? "bg-zinc-900/10 border-zinc-800/40 opacity-40 cursor-not-allowed"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:scale-105 active:scale-95"
            }
          `}
          title="Choisir la langue d'écoute"
        >
          <span className="text-[17px] filter drop-shadow-sm select-none">{selectedLang.flag}</span>
        </button>

        {/* Dropdown Langue Modernisé (Affichage exclusif des drapeaux sous forme d'icônes avec padding) */}
        {showLangMenu && (
          <div 
            className="absolute bottom-[125%] left-0 rounded-xl p-1.5 z-[110]
                       backdrop-blur-xl bg-zinc-950/90 border border-white/10
                       shadow-2xl shadow-black/80 flex flex-col gap-1.5
                       animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {LANGUAGES.map(l => {
              const isSelected = selectedLang.code === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => { setSelectedLang(l); setShowLangMenu(false); }}
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-lg text-lg
                    transition-all duration-200 relative
                    ${
                      isSelected
                        ? "bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 scale-105"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                    }
                  `}
                  title={l.label}
                >
                  <span className="select-none filter drop-shadow-sm">{l.flag}</span>
                  {isSelected && (
                    <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── BOUTON MICROPHONE & FEEDBACK ENREGISTREMENT ──────────────────────── */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={recordingState === "transcribing"}
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer
          border transition-all duration-300 relative group
          ${
            recordingState === "transcribing"
              ? "bg-zinc-900/40 border-zinc-800 text-zinc-500 cursor-not-allowed"
              : recordingState === "recording"
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400/50 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 animate-pulse"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:scale-105 active:scale-95"
          }
        `}
        title={recordingState === "recording" ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
      >
        {/* Pulsation Ripple Effect en arrière-plan lorsque actif */}
        {recordingState === "recording" && (
          <span className="absolute inset-0 rounded-xl bg-red-500/50 animate-ping -z-10" />
        )}

        {recordingState === "transcribing" ? (
          <Loader2 size={15} className="animate-spin text-cyan-400" />
        ) : recordingState === "recording" ? (
          <MicOff size={15} className="text-white" />
        ) : (
          <Mic size={15} className="group-hover:rotate-6 transition-transform" />
        )}
      </button>

      {/* ─── STATUS & WAVEFORM ANIMÉE (Floating HUD) ─────────────────────────── */}
      {recordingState !== "idle" && (
        <div 
          className={`
            absolute bottom-[125%] right-0 flex items-center gap-2.5 z-[100]
            backdrop-blur-xl bg-zinc-950/90 border px-3 py-2 rounded-xl shadow-2xl
            font-sans text-xs whitespace-nowrap select-none
            animate-in fade-in slide-in-from-bottom-2 duration-200
            ${
              recordingState === "recording" 
                ? "border-red-500/30 shadow-red-950/20" 
                : "border-cyan-500/30 shadow-cyan-950/20"
            }
          `}
        >
          {/* Indicateur d'état dynamique */}
          {recordingState === "recording" ? (
            <>
              {/* Point Rouge "REC" clignotant */}
              <span className="flex items-center gap-1 bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                REC
              </span>
              
              <span className="text-white/80 font-medium text-[11px]">{selectedLang.listeningMsg}</span>

              {/* Onde sonore animée CSS */}
              <div className="flex items-end gap-[2px] h-3.5 px-0.5">
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
              </div>
            </>
          ) : (
            <>
              <Loader2 size={12} className="animate-spin text-cyan-400" />
              <span className="text-cyan-300 font-mono text-[10px] tracking-wider uppercase">Analyse...</span>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default VoiceInput;
