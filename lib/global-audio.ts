"use client";

import * as React from "react";

export interface GlobalAudioState {
  isPlaying: boolean;
  src: string | null;
}

export type GlobalAudioListener = (state: GlobalAudioState) => void;

/**
 * GlobalAudioManager (Singleton)
 * -------------------------------------------------------------
 * Quản lý ĐÚNG 1 instance HTMLAudioElement duy nhất trên toàn ứng dụng.
 * Mọi yêu cầu phát nhạc mới sẽ tự động dừng sạch mọi track trước đó,
 * đảm bảo không bao giờ xảy ra hiện tượng phát chồng chéo nhiều lớp âm thanh.
 */
class GlobalAudioManager {
  private static instance: GlobalAudioManager | null = null;
  private audio: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private listeners: Set<GlobalAudioListener> = new Set();
  private userPaused: boolean = false;
  private wasPlayingBeforeHide: boolean = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.initAudio();
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  public static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  private initAudio() {
    if (this.audio || typeof window === "undefined") return;
    const a = new Audio();
    a.id = "global-inviwedd-audio";
    a.preload = "auto";
    a.loop = true;
    a.volume = 0.55;

    a.addEventListener("play", () => this.notify());
    a.addEventListener("pause", () => this.notify());
    a.addEventListener("ended", () => this.notify());
    a.addEventListener("error", (e) => {
      console.warn("[GlobalAudio] Audio element error:", e);
      this.notify();
    });

    this.audio = a;
    this.mountToDom();
  }

  private mountToDom() {
    if (typeof document === "undefined" || !this.audio) return;
    if (document.body && !document.getElementById("global-inviwedd-audio")) {
      document.body.appendChild(this.audio);
    } else if (!document.body) {
      window.addEventListener(
        "DOMContentLoaded",
        () => {
          if (this.audio && !document.getElementById("global-inviwedd-audio")) {
            document.body?.appendChild(this.audio);
          }
        },
        { once: true },
      );
    }
  }

  private handleVisibilityChange = () => {
    if (typeof document === "undefined" || !this.audio) return;
    if (document.hidden) {
      if (!this.audio.paused) {
        this.wasPlayingBeforeHide = true;
        this.audio.pause();
      } else {
        this.wasPlayingBeforeHide = false;
      }
    } else {
      if (this.wasPlayingBeforeHide && !this.userPaused && this.currentSrc) {
        this.audio.play().catch(() => {});
      }
      this.wasPlayingBeforeHide = false;
    }
  };

  private notify() {
    const state: GlobalAudioState = {
      isPlaying: this.isPlaying(),
      src: this.currentSrc,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("[GlobalAudio] Listener error:", err);
      }
    });
  }

  public isPlaying(): boolean {
    return Boolean(this.audio && !this.audio.paused && !this.audio.ended && this.audio.readyState > 2);
  }

  public getSrc(): string | null {
    return this.currentSrc;
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime : 0;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  public subscribe(listener: GlobalAudioListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener({
      isPlaying: this.isPlaying(),
      src: this.currentSrc,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Phát nhạc với src được chỉ định.
   * Dừng sạch mọi track trước đó và đảm bảo chỉ có duy nhất 1 nguồn phát.
   */
  public async play(src: string, options?: { volume?: number }): Promise<boolean> {
    this.initAudio();
    this.mountToDom();
    if (!this.audio || !src) return false;

    this.userPaused = false;
    const vol = typeof options?.volume === "number" ? options.volume : 0.55;
    this.audio.volume = vol;

    const fullTargetUrl = typeof window !== "undefined" ? new URL(src, window.location.href).href : src;

    // Nếu đổi track, pause track cũ và đặt src mới
    if (this.audio.src !== fullTargetUrl) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {}
      this.audio.src = src;
      this.currentSrc = src;
    } else {
      this.currentSrc = src;
    }

    try {
      await this.audio.play();
      this.notify();
      return true;
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name;
      if (errorName === "NotAllowedError") {
        // Browser policy blocks autoplay before user gesture; unlock will occur on first interaction
        console.info("[GlobalAudio] Autoplay waiting for user gesture:", src);
      } else if (errorName === "AbortError") {
        // Play was interrupted by pause/stop during route navigation or rapid toggling; safe to ignore
      } else {
        console.warn("[GlobalAudio] Play was blocked or failed:", err);
      }
      this.notify();
      return false;
    }
  }

  public pause(): void {
    this.userPaused = true;
    if (this.audio) {
      this.audio.pause();
    }
    this.notify();
  }

  /**
   * Dừng sạch hoàn toàn âm thanh (pause và reset về đầu, xóa track hiện tại).
   */
  public stop(): void {
    this.userPaused = true;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {}
    }
    this.currentSrc = null;
    this.notify();
  }

  public async toggle(src: string, options?: { volume?: number }): Promise<boolean> {
    if (this.isPlaying()) {
      const fullTargetUrl = typeof window !== "undefined" ? new URL(src, window.location.href).href : src;
      if (this.audio?.src === fullTargetUrl) {
        this.pause();
        return false;
      }
    }
    return this.play(src, options);
  }
}

export const globalAudio = GlobalAudioManager.getInstance();

export function useGlobalAudio() {
  const [state, setState] = React.useState<GlobalAudioState>(() => ({
    isPlaying: globalAudio.isPlaying(),
    src: globalAudio.getSrc(),
  }));

  React.useEffect(() => {
    return globalAudio.subscribe((next) => {
      setState(next);
    });
  }, []);

  const play = React.useCallback((src: string, options?: { volume?: number }) => {
    return globalAudio.play(src, options);
  }, []);

  const pause = React.useCallback(() => {
    globalAudio.pause();
  }, []);

  const stop = React.useCallback(() => {
    globalAudio.stop();
  }, []);

  const toggle = React.useCallback((src: string, options?: { volume?: number }) => {
    return globalAudio.toggle(src, options);
  }, []);

  return {
    ...state,
    play,
    pause,
    stop,
    toggle,
  };
}
