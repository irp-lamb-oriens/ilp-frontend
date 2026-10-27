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
export type { SearchInputProps } from "./SearchInput";
export { useForm, validators } from "./useForm";
export type { Errors, UseFormOptions } from "./useForm";
