import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioPlayer, type Track } from "./useAudioPlayer";

const tracks: Track[] = [
  {
    id: "track-1",
    title: "Test Track",
    artist: "Test Artist",
    album: "Test Album",
    duration: 120,
    src: "blob:track-1",
    cover: "",
  },
];

class MockAudio {
  static lastInstance: MockAudio | null = null;

  src = "";
  volume = 1;
  currentTime = 0;
  duration = 120;
  paused = true;
  ended = false;
  readyState = 4;
  private listeners = new Map<string, Set<EventListener>>();

  constructor() {
    MockAudio.lastInstance = this;
  }

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string) {
    const event = new Event(type);
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  async play() {
    this.paused = false;
    this.emit("play");
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit("pause");
  }
}

describe("useAudioPlayer mobile interruption resume", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "navigator",
      Object.defineProperty({}, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        configurable: true,
      }),
    );

    vi.stubGlobal("Audio", MockAudio);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("resumes playback when returning to the app after a whatsapp audio interruption", async () => {
    const { result } = renderHook(() => useAudioPlayer(tracks));
    const audio = MockAudio.lastInstance;

    expect(audio).toBeTruthy();

    await act(async () => {
      await result.current.togglePlay();
    });

    expect(result.current.isPlaying).toBe(true);

    await act(async () => {
      audio?.pause();
    });

    expect(result.current.isPlaying).toBe(false);

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });
  });

  it("resumes playback on the next tap when ios blocks automatic resume", async () => {
    const { result } = renderHook(() => useAudioPlayer(tracks));
    const audio = MockAudio.lastInstance;

    await act(async () => {
      await result.current.togglePlay();
    });

    await act(async () => {
      audio?.pause();
    });

    const playSpy = vi.spyOn(audio!, "play").mockRejectedValueOnce(new DOMException("blocked"));

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.isPlaying).toBe(false);

    playSpy.mockImplementation(async function play(this: MockAudio) {
      this.paused = false;
      this.emit("play");
    });

    await act(async () => {
      document.dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));
    });

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(2);
      expect(result.current.isPlaying).toBe(true);
    });
  });
});
