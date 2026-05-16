import { pipeline, env } from "@huggingface/transformers";

// Configuration 100% Locale
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = "/models/";

// Désactiver SIMD pour éviter les erreurs de parsing Protobuf sur certains navigateurs
// @ts-ignore
env.backends.onnx.wasm.simd = false;

let transcriber: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { audioData, language } = event.data;

  try {
    if (!transcriber) {
      transcriber = await pipeline(
        "automatic-speech-recognition",
        "whisper-tiny", 
        {
          device: "wasm",
          dtype: "fp32",
        }
      );
    }

    const output = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: language,
      task: "transcribe",
    });

    self.postMessage({ 
      type: "RESULT", 
      text: output.text 
    });

  } catch (error: any) {
    console.error("Worker Transcription Error:", error);
    self.postMessage({ 
      type: "ERROR", 
      error: error.message || "Erreur inconnue dans le worker" 
    });
  }
};
