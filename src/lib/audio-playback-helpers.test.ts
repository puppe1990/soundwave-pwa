import { describe, expect, it } from "vitest";
import {
  clampVolume,
  getNextRepeatMode,
  getNextTrackIndex,
  getPreviousTrackIndex,
  isAutoplayPolicyError,
  isMobileUserAgent,
  resolveTrackEndedAction,
} from "./audio-playback-helpers";

describe("isMobileUserAgent", () => {
  it("detects common mobile agents", () => {
    expect(isMobileUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isMobileUserAgent("Mozilla/5.0 (Linux; Android 13)")).toBe(true);
  });

  it("rejects desktop agents", () => {
    expect(isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false);
  });
});

describe("isAutoplayPolicyError", () => {
  it("matches NotAllowedError and autoplay messages", () => {
    expect(isAutoplayPolicyError({ name: "NotAllowedError", message: "blocked" })).toBe(true);
    expect(isAutoplayPolicyError({ name: "Error", message: "autoplay denied" })).toBe(true);
    expect(isAutoplayPolicyError({ name: "TypeError", message: "oops" })).toBe(false);
    expect(isAutoplayPolicyError(null)).toBe(false);
  });
});

describe("playlist index helpers", () => {
  it("wraps next and previous indices", () => {
    expect(getNextTrackIndex(0, 3)).toBe(1);
    expect(getNextTrackIndex(2, 3)).toBe(0);
    expect(getPreviousTrackIndex(0, 3)).toBe(2);
    expect(getPreviousTrackIndex(2, 3)).toBe(1);
  });

  it("clamps volume to 0..1", () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(2)).toBe(1);
  });
});

describe("resolveTrackEndedAction", () => {
  it("replays when repeat one and was playing", () => {
    expect(
      resolveTrackEndedAction({
        wasPlaying: true,
        manuallyPaused: false,
        repeatMode: "one",
        currentIndex: 1,
        tracksLength: 3,
      }),
    ).toEqual({ type: "replay-current" });
  });

  it("advances for repeat all and none when was playing", () => {
    expect(
      resolveTrackEndedAction({
        wasPlaying: true,
        manuallyPaused: false,
        repeatMode: "all",
        currentIndex: 1,
        tracksLength: 3,
      }),
    ).toEqual({ type: "advance", nextIndex: 2 });

    expect(
      resolveTrackEndedAction({
        wasPlaying: true,
        manuallyPaused: false,
        repeatMode: "none",
        currentIndex: 2,
        tracksLength: 3,
      }),
    ).toEqual({ type: "advance", nextIndex: 0 });
  });

  it("stops when user was not playing or manually paused", () => {
    expect(
      resolveTrackEndedAction({
        wasPlaying: false,
        manuallyPaused: false,
        repeatMode: "all",
        currentIndex: 0,
        tracksLength: 2,
      }),
    ).toEqual({ type: "stop", clearWasPlaying: true });

    expect(
      resolveTrackEndedAction({
        wasPlaying: true,
        manuallyPaused: true,
        repeatMode: "all",
        currentIndex: 0,
        tracksLength: 2,
      }),
    ).toEqual({ type: "stop", clearWasPlaying: false });
  });
});

describe("getNextRepeatMode", () => {
  it("cycles none → all → one → none", () => {
    expect(getNextRepeatMode("none").mode).toBe("all");
    expect(getNextRepeatMode("all").mode).toBe("one");
    expect(getNextRepeatMode("one").mode).toBe("none");
  });
});
