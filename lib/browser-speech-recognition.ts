/** Shared Web Speech API typings used by the play stage and optional voice-command hook. */

export type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

export type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
};

export type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: BrowserSpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: BrowserSpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
};

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};
