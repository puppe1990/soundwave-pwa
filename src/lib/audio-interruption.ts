export type PauseOrigin = "none" | "manual" | "track-change" | "cleanup";

export interface InterruptionState {
  wasPlaying: boolean;
  manuallyPaused: boolean;
  externalInterruption: boolean;
  hasUserInteracted: boolean;
  pauseOrigin: PauseOrigin;
  audioEnded: boolean;
}

export interface PauseEventInput {
  pauseOrigin: PauseOrigin;
  audioEnded: boolean;
}

export interface ResumeAttemptInput {
  isMobile: boolean;
  externalInterruption: boolean;
  manuallyPaused: boolean;
  hasUserInteracted: boolean;
  isPageVisible: boolean;
  isAudioPaused: boolean;
  hasCurrentTrack: boolean;
}

export const handleAudioPause = (
  state: InterruptionState,
  input: PauseEventInput,
): InterruptionState => {
  if (input.audioEnded) {
    return { ...state, pauseOrigin: "none" };
  }

  if (input.pauseOrigin === "manual") {
    return {
      ...state,
      wasPlaying: false,
      manuallyPaused: true,
      externalInterruption: false,
      pauseOrigin: "none",
    };
  }

  if (input.pauseOrigin === "track-change" || input.pauseOrigin === "cleanup") {
    return { ...state, pauseOrigin: "none" };
  }

  if (state.wasPlaying && !state.manuallyPaused) {
    return {
      ...state,
      externalInterruption: true,
      pauseOrigin: "none",
    };
  }

  return { ...state, pauseOrigin: "none" };
};

export const shouldAttemptResume = (input: ResumeAttemptInput): boolean => {
  return (
    input.isMobile &&
    input.hasCurrentTrack &&
    input.externalInterruption &&
    !input.manuallyPaused &&
    input.hasUserInteracted &&
    input.isPageVisible &&
    input.isAudioPaused
  );
};

export const getResumeDelaysMs = (): number[] => [0, 250, 700];

export const getSuccessfulResumeState = (state: InterruptionState): InterruptionState => ({
  ...state,
  wasPlaying: true,
  manuallyPaused: false,
  externalInterruption: false,
  pauseOrigin: "none",
});
