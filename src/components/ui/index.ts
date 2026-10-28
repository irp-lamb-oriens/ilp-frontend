/**
 * ILP UI kit (W2). Import from "@/components/ui".
 * See /ui for live examples of every primitive.
 */
export { Button, ButtonLink } from "./Button";
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize } from "./Button";
export { Card } from "./Card";
export type { CardProps } from "./Card";
export { StatTile } from "./StatTile";
export type { StatTileProps } from "./StatTile";
export { DataTable } from "./DataTable";
export type { Column, DataTableProps, SortDir } from "./DataTable";
export { Drawer } from "./Drawer";
export type { DrawerProps } from "./Drawer";
export { Dialog } from "./Dialog";
export type { DialogProps } from "./Dialog";
// Unsaved-changes guard: forms call useUnsavedChanges(dirty); the root layout mounts UnsavedChangesGuard.
export { UnsavedChangesGuard, useUnsavedChanges, useLeaveGuard, confirmLeave, confirmDiscard } from "./UnsavedChanges";
export type { LeaveGuard, LeaveOptions } from "./UnsavedChanges";
export { guardedHref } from "./linkIntercept";
export { Timeline } from "./Timeline";
export type { TimelineItem, TimelineProps } from "./Timeline";
export { StatusPill } from "./StatusPill";
export type { StatusPillProps, StatusTone } from "./StatusPill";
export { AgingBadge, agingDays, agingLevel } from "./AgingBadge";
export type { AgingBadgeProps, AgingLevel } from "./AgingBadge";
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";
export { Tabs } from "./Tabs";
export type { TabItem, TabsProps } from "./Tabs";
export { cx } from "./cx";

// Loading states (UX_LOADING.md): skeletons, the delayed/minimum-visible
// loading flag, and the first-load staggered reveal.
export { Skeleton, SkeletonRegion, Loadable, useSkeleton, useDelayedFlag } from "./Skeleton";
export type { SkeletonProps, SkeletonShape, SkeletonSize, SkeletonWidth, SkeletonPhase, SkeletonRegionProps, LoadableProps } from "./Skeleton";
export { SkeletonText, SkeletonStatStrip, SkeletonList, SkeletonCard, SkeletonBoard } from "./SkeletonLayouts";
export type { SkeletonListProps, SkeletonCardProps, SkeletonBoardProps } from "./SkeletonLayouts";
export { SkeletonStatTile } from "./StatTile";
export { SkeletonTable } from "./DataTable";
export type { SkeletonTableProps } from "./DataTable";
export { SkeletonTimeline } from "./Timeline";
export { Stagger, StaggerItem, useReveal } from "./Stagger";
export type { StaggerItemProps, RevealProps } from "./Stagger";
export { REVEAL_WINDOW_MS, SKELETON_DELAY_MS, SKELETON_MIN_MS, STAGGER_MAX, COUNT_UP_S, EASE_OUT_STRONG } from "./loadingTiming";

// Form fields (P5). Labels always render; hint and error are wired with aria-describedby.
export { Field, FieldError, FieldHint, FieldMarker, useFieldIds } from "./Field";
export type { FieldBaseProps, FieldControlProps, FieldProps } from "./Field";
export { TextInput } from "./TextInput";
export type { TextInputProps } from "./TextInput";
export { TextArea } from "./TextArea";
export type { TextAreaProps } from "./TextArea";
export { Select } from "./Select";
export type { SelectOption, SelectProps } from "./Select";
export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";
export { RadioGroup } from "./RadioGroup";
export type { RadioGroupProps, RadioOption } from "./RadioGroup";
export { DateInput, dateInputValue, isoFromDateInput } from "./DateInput";
export type { DateInputProps } from "./DateInput";
export { MoneyInput, formatCentsPlain, parseMoneyToCents } from "./MoneyInput";
export type { MoneyInputProps } from "./MoneyInput";
export { SearchInput } from "./SearchInput";
export { ListToolbar } from "./ListToolbar";
export type { ListToolbarProps, ListSortOption } from "./ListToolbar";
export { ListFooter } from "./ListFooter";
// FILTERS: schema-driven filters (lib/listSchemas.ts, lib/useSchemaList.ts).
export { FilterBar, FieldEditor, describeFilter } from "./FilterBar";
export type { FilterBarProps } from "./FilterBar";
export { Popover } from "./Popover";
export { Toast } from "./Toast";
export type { ToastProps } from "./Toast";
// BOARDS: the shared kanban (components/ui/board).
export { Board, BoardSkeleton, useBoardController, initials } from "./board/Board";
export type { AgingTone, BoardCardModel, BoardColumnDef, BoardController, BoardProps } from "./board/Board";
export { default as MoveToMenu } from "./board/MoveToMenu";
export { boardKeyboardReducer, keyToAction, placeCard, KB_IDLE } from "./board/boardKeyboard";
export type { KbAction, KbColumn, KbContext, KbResult, KbState } from "./board/boardKeyboard";
export type { PopoverProps } from "./Popover";
export type { ListFooterProps } from "./ListFooter";
export type { SearchInputProps } from "./SearchInput";
export { useForm, validators } from "./useForm";
export type { Errors, UseFormOptions } from "./useForm";

// Time, schedule and list inputs (availability redesign). Values stay in the
// stored formats: "HH:MM" 24-hour times, "YYYY-MM-DD" dates, string arrays.
export { Switch } from "./Switch";
export type { SwitchProps } from "./Switch";
export { TimeInput, TimeField } from "./TimeInput";
export type { TimeInputProps, TimeFieldProps } from "./TimeInput";
export { TimeRangeInput } from "./TimeRangeInput";
export type { TimeRange, TimeRangeInputProps } from "./TimeRangeInput";
export { WeeklyHoursEditor, WEEKDAY_NAMES } from "./WeeklyHoursEditor";
export type { WeeklyHoursEditorProps, WeeklyWindowValue } from "./WeeklyHoursEditor";
export { ChipSelect } from "./ChipSelect";
export type { ChipOption, ChipSelectProps } from "./ChipSelect";
export { DateListInput, formatDateChip } from "./DateListInput";
export type { DateListInputProps } from "./DateListInput";
export { NumberStepper } from "./NumberStepper";
export type { NumberStepperProps } from "./NumberStepper";
export {
  findOverlaps,
  formatDuration,
  formatRange12,
  formatTime12,
  isTimeValue,
  minutesToTime,
  nextWindow,
  parseTimeInput,
  rangeError,
  slotCount,
  stepTime,
  timeOptions,
  timeToMinutes,
  validateWindows,
  weeklySlotTotal,
} from "./timeUtils";
export type { DayWindow } from "./timeUtils";
export {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconClose,
  IconCopy,
  IconDanger,
  IconInfo,
  IconMessage,
  IconMinus,
  IconNote,
  IconPlus,
  IconSuccess,
  IconWarning,
  IconFilter,
  IconColumns,
  IconBookmark,
  IconSearch,
  IconChevronLeft,
  IconDensity,
} from "./icons";

// Notices (NOTICES.md): every prerequisite, warning, disclaimer and banner.
export { Notice, resetNoticeDismissals } from "./Notice";
export type { NoticeProps, NoticeFix, NoticeTone, NoticeVariant, NoticeHeading } from "./Notice";
export { ErrorNotice, errorFix } from "./ErrorNotice";
export type { ErrorNoticeProps, NoticeAudience } from "./ErrorNotice";

// Page intro (copy-rules.md "Page intro pattern"): what, how, why, in either order.
export { PageIntro, PageIntroSkeleton, useIntroCollapsed, INTRO_STORAGE_KEY } from "./PageIntro";
export type { PageIntroProps, PageIntroOrder, PageIntroPart, PageIntroLabels, PageIntroAudience } from "./PageIntro";
