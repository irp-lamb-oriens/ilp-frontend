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
export { computeTimeline, typedAt, readingTime, wordCount, TIMING } from "./timeline";
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
