/**
 * Tutorial engine. Import from "@/components/tutorial".
 * Configs live in src/tutorials/<role>/<screen>.ts; see docs/workstreams/TUTORIALS.md.
 */
export { TutorialProvider } from "./TutorialProvider";
export type { TutorialProviderProps } from "./TutorialProvider";
export { TutorialModal } from "./TutorialModal";
export { TutorialList } from "./TutorialList";
export { ScenePlayer, SCENE_SIZE } from "./ScenePlayer";
export { TutorialEmbed } from "./TutorialEmbed";
export { PlayerControls, StepNav } from "./PlayerControls";
export type { PlayerControlsProps, StepNavProps } from "./PlayerControls";
export {
  playerReducer,
  initPlayer,
  actionPosition,
  canPrev,
  canNext,
  shownMode,
  actionLabel,
  stepLabel,
  positionText,
  stopNames,
  stopDurations,
  explainItems,
} from "./playerState";
export type { PlayerState, PlayerAction, PlayMode, PauseCause, ExplainItem } from "./playerState";
export type { TutorialEmbedProps, EmbedAutoplay } from "./TutorialEmbed";
export { MockScene } from "./mock/MockScene";
export { TourSpotlight } from "./TourSpotlight";
export { HelpButton } from "./HelpButton";
export { useTutorial, useTutorialOptional } from "./context";
export type { TutorialApi, ActiveTutorial, CloseReason } from "./context";
export { useTutorialAutoStart, pageIsReady, AUTOSTART_ENV } from "./autostart";
export { createRegistry, matchTutorial, routeMatches, routeToRegExp, normalizePath } from "./registry";
export type { TutorialRegistry } from "./registry";
export { createTutorialStore, noopTutorialSync, STORAGE_KEY, MAX_SKIPS } from "./storage";
export type { TutorialStore, TutorialSync, TutorialState, TutorialRecord, StorageLike } from "./storage";
export { computeTimeline, typedAt, readingTime, wordCount, segmentAt, TIMING } from "./timeline";
export { createViewGate, shouldPlay, visibleShare, PLAY_ENTER, PLAY_LEAVE } from "./viewport";
export type { ViewGate } from "./viewport";
export type { Timeline, Segment } from "./timeline";
export {
  collectIds,
  missingRefs,
  scriptRefs,
  describeScene,
  markers,
  endState,
  applyChanges,
  captionsOf,
  firstUseTerms,
  placeCallout,
  stateThrough,
  stopIndices,
  termsOf,
  EMPTY_OVERRIDES,
} from "./sceneUtils";
export type { Overrides, CaptionInfo, Rect, CalloutSide } from "./sceneUtils";
export type * from "./types";
