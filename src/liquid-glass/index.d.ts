import type * as React from "react";
import type { MotionValue } from "motion/react";

/* ------------------------------ quality / config ------------------------------ */

export type QualityTier = "ultra" | "high" | "balanced" | "low" | "css";
export type QualitySetting = QualityTier | "auto";

export interface QualityProfile {
  mapDpr: number;
  dispersion: boolean;
  rimInFilter: boolean;
  blurPass: boolean;
  /** how many visible glass surfaces may refract at once (the rest render CSS glass) */
  budget: number;
  moveBase: number;
  moveMaxPx: number;
  idleMaxPx: number;
}

export const TIERS: QualityTier[];
export const PROFILES: Record<QualityTier, QualityProfile>;

/** "auto" lets the frame-time governor adapt; a tier name pins it. */
export function setQuality(tier: QualitySetting): void;
export function getQualityName(): QualityTier;
export function getDetectedQuality(): QualityTier;
export function isAutoQuality(): boolean;
export function subscribeQuality(listener: () => void): () => void;
export function onGovernorSample(fn: (s: { fps: number; p75: number; tier: QualityTier }) => void): () => void;
export function keepSampling(): void;
/** Re-renders when the tier changes. */
export function useQuality(): [QualityTier, QualityProfile];

export function configureLiquidGlass(options?: { mode?: "auto" | "refraction" | "css"; quality?: QualitySetting }): void;
export function supportsSvgBackdrop(): boolean;
export function isIOS(): boolean;
export function getGlassStats(): { total: number; visible: number; refracting: number; budget: number };
export function subscribeGlassStats(listener: () => void): () => void;

/* ---------------------------------- glass ---------------------------------- */

type Num = number | MotionValue<number>;

export interface LiquidGlassProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDragStart" | "onDragEnd" | "style"> {
  width?: number;
  height?: number;
  radius?: number;
  bezelWidth?: number;
  glassThickness?: number;
  refractiveIndex?: number;
  bezelType?: "convex" | "circle" | "concave" | "lip";
  variant?: "regular" | "clear";
  dim?: number;
  /** rainbow fringe at the rim (default 0.04 on the high / ultra tiers, else 0) */
  dispersion?: number;
  /** colour boost of the refracted backdrop (1 = off) */
  saturation?: number;
  glow?: number;
  blur?: number;
  refraction?: number;
  restRefraction?: number;
  specularOpacity?: number;
  specularSaturation?: number;
  magnify?: number;
  restMagnify?: number;
  tint?: number;
  tintColor?: string;
  activeTint?: number;
  shadow?: number;
  fallbackBlur?: number;
  restScale?: number;
  activeScale?: number;
  jelly?: number;
  active?: boolean | MotionValue<number>;
  holdMs?: number;
  /** higher keeps refracting first when more glass is visible than the tier's budget */
  priority?: number;
  onPressChange?: (pressed: boolean) => void;
  draggable?: boolean | "x" | "y";
  dragConstraints?: React.RefObject<Element | null> | { top?: number; left?: number; right?: number; bottom?: number };
  dragElastic?: number | boolean;
  x?: MotionValue<number>;
  y?: MotionValue<number>;
  style?: React.CSSProperties;
  onDragStart?: (...args: any[]) => void;
  onDragEnd?: (...args: any[]) => void;
}
export const LiquidGlass: React.ForwardRefExoticComponent<LiquidGlassProps & React.RefAttributes<HTMLDivElement>>;

export interface LiquidFilterProps {
  id: string;
  width: number;
  height: number;
  maps: { displacement: string; specular?: string | null; magnify?: string | null; maxDisplacement: number };
  blur?: Num;
  dispersion?: Num;
  scaleRatio?: Num;
  specularOpacity?: Num;
  specularSaturation?: Num;
  magnifyingScale?: Num;
  blurPass?: boolean;
  rim?: boolean;
}
export const LiquidFilter: React.NamedExoticComponent<LiquidFilterProps>;

export interface LiquidMergeProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  smoothing?: Num;
  bezelWidth?: number;
  glassThickness?: number;
  refractiveIndex?: number;
  bezelType?: LiquidGlassProps["bezelType"];
  refraction?: Num;
  dispersion?: number;
  tint?: number;
  tintColor?: string;
  specularOpacity?: number;
  shadow?: number;
  fallbackBlur?: number;
  priority?: number;
}
export const LiquidMerge: React.ForwardRefExoticComponent<LiquidMergeProps & React.RefAttributes<HTMLDivElement>>;

export interface LiquidBlobProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDragStart" | "onDragEnd"> {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  radius?: number;
  restScale?: number;
  activeScale?: number;
  jelly?: number;
  active?: boolean | MotionValue<number>;
  onPressChange?: (pressed: boolean) => void;
  draggable?: boolean | "x" | "y";
  dragConstraints?: LiquidGlassProps["dragConstraints"];
  dragElastic?: number | boolean;
  dragSnapToOrigin?: boolean;
  x?: MotionValue<number>;
  y?: MotionValue<number>;
  onDragStart?: (...args: any[]) => void;
  onDragEnd?: (...args: any[]) => void;
}
export const LiquidBlob: React.ForwardRefExoticComponent<LiquidBlobProps & React.RefAttributes<HTMLDivElement>>;

/* --------------------------------- presets --------------------------------- */

type GlassPass = Omit<LiquidGlassProps, "children" | "width" | "height">;

export interface NavItem {
  value: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  ariaLabel?: string;
}

export interface LiquidNavProps extends GlassPass {
  items: NavItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  itemWidth?: number;
  height?: number;
  padding?: number;
  label?: string;
  indicatorProps?: Partial<LiquidGlassProps>;
}
export function LiquidNav(props: LiquidNavProps): React.JSX.Element;

export interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}
export interface LiquidBottomNavProps {
  items: NavItem[];
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string) => void;
  action?: ActionButton;
  itemWidth?: number;
  height?: number;
  padding?: number;
  gap?: number;
  actionSize?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  [glassProp: string]: any;
}
export function LiquidBottomNav(props: LiquidBottomNavProps): React.JSX.Element;

export interface LiquidTopNavProps {
  title?: React.ReactNode;
  leading?: { icon: React.ReactNode; label: string; onClick?: () => void };
  trailing?: { icon: React.ReactNode; label: string; onClick?: () => void }[];
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}
export function LiquidTopNav(props: LiquidTopNavProps): React.JSX.Element;

export interface LiquidIconButtonProps extends GlassPass {
  icon: React.ReactNode;
  label: string;
  size?: number;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
}
export const LiquidIconButton: React.ForwardRefExoticComponent<LiquidIconButtonProps & React.RefAttributes<HTMLDivElement>>;

export function LiquidScrollEdge(props: { position?: "top" | "bottom"; height?: number; blur?: number; radius?: number; className?: string; style?: React.CSSProperties }): React.JSX.Element;

export interface LiquidSwitchProps extends GlassPass {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  height?: number;
  onColor?: string;
  offColor?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  thumb?: (progress: MotionValue<number>) => React.ReactNode;
  trackOff?: React.ReactNode;
  trackOn?: React.ReactNode;
  holdMs?: number;
}
export function LiquidSwitch(props: LiquidSwitchProps): React.JSX.Element;

export function LiquidThemeSwitch(props: { theme: "light" | "dark"; onChange: (theme: "light" | "dark") => void; height?: number } & GlassPass): React.JSX.Element;

export interface LiquidSliderProps extends GlassPass {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  width?: number;
  color?: string;
  trackHeight?: number;
}
export function LiquidSlider(props: LiquidSliderProps): React.JSX.Element;

export const LiquidSearchbox: React.ForwardRefExoticComponent<GlassPass & { width?: number; onSubmit?: (query: string) => void; placeholder?: string } & React.RefAttributes<HTMLDivElement>>;
export const LiquidButton: React.ForwardRefExoticComponent<GlassPass & { width?: number; height?: number; onClick?: React.MouseEventHandler; children?: React.ReactNode } & React.RefAttributes<HTMLDivElement>>;
export const LiquidMagnifier: React.ForwardRefExoticComponent<GlassPass & { width?: number; height?: number; magnify?: number; dragConstraints?: LiquidGlassProps["dragConstraints"] } & React.RefAttributes<HTMLDivElement>>;

export function LiquidSplitLens(props: { width?: number; height?: number; smoothing?: number; auto?: boolean; [k: string]: any }): React.JSX.Element;

export interface SwipePage {
  key: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
}
export function LiquidSwipeView(props: {
  pages: SwipePage[];
  width?: number;
  height?: number;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  itemWidth?: number;
  barHeight?: number;
  edge?: boolean;
  edgeRadius?: number;
  className?: string;
  style?: React.CSSProperties;
  tabsProps?: Record<string, any>;
}): React.JSX.Element;
export function LiquidSwipeTabs(props: {
  items: { value: string; label?: React.ReactNode; icon?: React.ReactNode }[];
  progress: MotionValue<number>;
  onSeek?: (position: number, final: boolean) => void;
  itemWidth?: number;
  height?: number;
  padding?: number;
  smoothing?: number;
  label?: string;
  className?: string;
}): React.JSX.Element;

export function SunIcon(props?: React.SVGProps<SVGSVGElement>): React.JSX.Element;
export function MoonIcon(props?: React.SVGProps<SVGSVGElement>): React.JSX.Element;

export const SURFACES: Record<"convex" | "circle" | "concave" | "lip", (x: number) => number>;
export function startLiquidFavicon(options?: Record<string, any>): () => void;
export function renderLiquidFavicon(options?: { size?: number; phase?: number }): HTMLCanvasElement;
