"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {AppLocale} from "@/i18n/request";

/**
 * Browser speech in and out, both strictly optional.
 *
 * Everything is feature-detected: Web Speech recognition is Chromium-only and
 * synthesis voice quality varies wildly per platform, so the widget treats
 * both as enhancements and stays fully usable by keyboard when they are absent.
 */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {error?: string};

type SpeechRecognitionLike = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const speechLocales: Record<AppLocale, string> = {
  en: "en-US",
  es: "es-ES",
  "pt-br": "pt-BR",
  uk: "uk-UA",
  ko: "ko-KR"
};

interface UseSpeechOptions {
  locale: AppLocale;
  onTranscript: (text: string) => void;
  onInterim: (text: string) => void;
  onUnsupported: () => void;
  onDenied: () => void;
}

export function useSpeech({
  locale,
  onTranscript,
  onInterim,
  onUnsupported,
  onDenied
}: UseSpeechOptions) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const speechLocale = speechLocales[locale];

  const canListen = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  }, []);

  const canSpeak = useMemo(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancelSpeech = useCallback(() => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [canSpeak]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !canSpeak || !text.trim()) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLocale;
      utterance.rate = 1.02;
      utterance.pitch = 1.15;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((voice) => voice.lang.toLowerCase() === speechLocale.toLowerCase()) ??
        voices.find((voice) =>
          voice.lang.toLowerCase().startsWith(speechLocale.slice(0, 2))
        );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [canSpeak, speechLocale, voiceEnabled]
  );

  const toggleVoice = useCallback(() => {
    if (!canSpeak) {
      onUnsupported();
      return;
    }
    setVoiceEnabled((enabled) => {
      if (enabled) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      return !enabled;
    });
  }, [canSpeak, onUnsupported]);

  const toggleListening = useCallback(() => {
    if (!canListen) {
      onUnsupported();
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      onUnsupported();
      return;
    }

    transcriptRef.current = "";
    const recognition = new Recognition();
    recognition.lang = speechLocale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = transcriptRef.current;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      transcriptRef.current = final;
      onInterim(`${final}${interim}`.trimStart());
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onDenied();
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        onTranscript(finalText);
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [canListen, listening, onDenied, onInterim, onTranscript, onUnsupported, speechLocale]);

  return {
    canListen,
    canSpeak,
    listening,
    speaking,
    voiceEnabled,
    speak,
    cancelSpeech,
    toggleVoice,
    toggleListening
  };
}
