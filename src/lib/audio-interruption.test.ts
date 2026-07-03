import { describe, expect, it } from "vitest";
import {
  getResumeDelaysMs,
  handleAudioPause,
  shouldAttemptResume,
  type InterruptionState,
} from "./audio-interruption";

const playingState = (): InterruptionState => ({
  wasPlaying: true,
  manuallyPaused: false,
  externalInterruption: false,
  hasUserInteracted: true,
  pauseOrigin: "none",
  audioEnded: false,
});

describe("handleAudioPause", () => {
  it("marks an external interruption when another app pauses playback", () => {
    const next = handleAudioPause(playingState(), { pauseOrigin: "none", audioEnded: false });

    expect(next.externalInterruption).toBe(true);
    expect(next.manuallyPaused).toBe(false);
    expect(next.wasPlaying).toBe(true);
  });

  it("does not mark interruption when the user manually pauses", () => {
    const next = handleAudioPause(playingState(), { pauseOrigin: "manual", audioEnded: false });

    expect(next.externalInterruption).toBe(false);
    expect(next.manuallyPaused).toBe(true);
    expect(next.wasPlaying).toBe(false);
  });

  it("ignores pauses triggered by track changes", () => {
    const next = handleAudioPause(playingState(), {
      pauseOrigin: "track-change",
      audioEnded: false,
    });

    expect(next.externalInterruption).toBe(false);
    expect(next.wasPlaying).toBe(true);
  });
});

describe("shouldAttemptResume", () => {
  it("resumes on mobile when whatsapp interrupted playback and the app is visible again", () => {
    expect(
      shouldAttemptResume({
        isMobile: true,
        externalInterruption: true,
        manuallyPaused: false,
        hasUserInteracted: true,
        isPageVisible: true,
        isAudioPaused: true,
        hasCurrentTrack: true,
      }),
    ).toBe(true);
  });

  it("does not resume when the user intentionally paused", () => {
    expect(
      shouldAttemptResume({
        isMobile: true,
        externalInterruption: true,
        manuallyPaused: true,
        hasUserInteracted: true,
        isPageVisible: true,
        isAudioPaused: true,
        hasCurrentTrack: true,
      }),
    ).toBe(false);
  });

  it("does not resume while the page is still hidden", () => {
    expect(
      shouldAttemptResume({
        isMobile: true,
        externalInterruption: true,
        manuallyPaused: false,
        hasUserInteracted: true,
        isPageVisible: false,
        isAudioPaused: true,
        hasCurrentTrack: true,
      }),
    ).toBe(false);
  });
});

describe("getResumeDelaysMs", () => {
  it("retries resume attempts to handle delayed ios focus restoration", () => {
    expect(getResumeDelaysMs()).toEqual([0, 250, 700]);
  });
});
