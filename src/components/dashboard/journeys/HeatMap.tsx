"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { color } from "@/styles/tokens";
import { type BehaviorDevice, type BehaviorHeat, type Cell, type HeatLayer, cellBox, DEVICE_WIDTH, heatOf } from "./behaviorApi";
import s from "./behavior.module.scss";

const VIEW_H = 640;
const MAX_CANVAS_H = 4096;

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const mix = (a: [number, number, number], b: [number, number, number], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as [number, number, number];

/** Cool to hot, from the design tokens: light blue, navy, red (no amber fills: rules.md keeps amber for notices). */
function ramp(t: number): [number, number, number] {
  const cool = rgb(color.accent);
  const warm = rgb(color.navy);
  const hot = rgb(color.error);
  return t < 0.5 ? mix(cool, warm, t / 0.5) : mix(warm, hot, (t - 0.5) / 0.5);
}

function drawCells(ctx: CanvasRenderingContext2D, cells: Cell[], grid: { cols: number; rows: number }, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  if (!cells.length) return;
  const max = Math.max(...cells.map((c) => c[2]));
  // Pass 1: intensity as alpha.
  for (const [col, row, n] of cells) {
    const { cx, cy, cw } = cellBox(col, row, grid, w, h);
    const r = Math.max(14, cw * 1.8);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const a = 0.15 + 0.85 * heatOf(n, max);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  // Pass 2: color each pixel by its intensity.
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (!a) continue;
    const [r, g, b] = ramp(a / 255);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = Math.min(215, Math.round(a * 1.15));
  }
  ctx.putImageData(img, 0, 0);
}

function drawBands(ctx: CanvasRenderingContext2D, values: number[], w: number, h: number, mode: "fade" | "heat") {
  ctx.clearRect(0, 0, w, h);
  const bandH = h / values.length;
  const max = Math.max(...values, 0);
  values.forEach((v, i) => {
    if (mode === "fade") {
      // Fewer people reached here: darker.
      const [r, g, b] = rgb(color.navy);
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(0.78, (1 - v) * 0.78)})`;
    } else {
      const t = max ? v / max : 0;
      const [r, g, b] = ramp(t);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.12 + 0.5 * t})`;
    }
    ctx.fillRect(0, i * bandH, w, bandH + 1);
  });
}

/**
 * The page with its heat layer on top. The page itself is shown behind the
 * layer in a frame (the public page, loaded as a visitor on this device
 * width would see it); scrolling the map scrolls the page with it. When the
 * page cannot be shown, the layer is drawn on a plain page outline.
 */
export default function HeatMap({ path, device, layer, heat }: { path: string; device: BehaviorDevice; layer: HeatLayer; heat: BehaviorHeat }) {
  const W = DEVICE_WIDTH[device];
  const outer = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [docH, setDocH] = useState(heat.avgDocH ?? 3000);
  const [showPage, setShowPage] = useState(true);
  const [pageOk, setPageOk] = useState(false);

  // Fit the device width into the space we have.
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, Math.max(0.2, (el.clientWidth - 2) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W]);

  useEffect(() => {
    setPageOk(false);
    setDocH(heat.avgDocH ?? 3000);
  }, [path, device, heat.avgDocH]);

  const measure = useCallback(() => {
    try {
      const doc = frame.current?.contentDocument;
      const h = doc ? Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0) : 0;
      if (h > 200) {
        setDocH(h);
        setPageOk(true);
      }
    } catch {
      setPageOk(false);
    }
  }, []);

  const onLoad = useCallback(() => {
    measure();
    // Images and late sections change the height: measure again.
    window.setTimeout(measure, 1200);
    window.setTimeout(measure, 3500);
  }, [measure]);

  const onScroll = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    try {
      frame.current?.contentWindow?.scrollTo(0, sc.scrollTop / scale);
    } catch {
      // the page frame is optional
    }
  }, [scale]);

  const dispW = Math.round(W * scale);
  const dispH = Math.round(docH * scale);
  const cw = Math.max(160, Math.round(dispW / 2));
  const ch = Math.max(100, Math.min(MAX_CANVAS_H, Math.round(dispH / 2)));

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (layer === "scroll") drawBands(ctx, heat.reach, cw, ch, "fade");
    else if (layer === "attention") drawBands(ctx, heat.attention, cw, ch, "heat");
    else drawCells(ctx, layer === "rage" ? heat.rageCells : layer === "dead" ? heat.deadCells : heat.cells, heat.grid, cw, ch);
  }, [layer, heat, cw, ch]);

  const marks = useMemo(() => {
    if (layer === "scroll") return heat.reach.map((r, i) => ({ top: (i / heat.reach.length) * 100, text: `${Math.round(r * 100)}% got here` }));
    if (layer === "attention") {
      const max = Math.max(...heat.attention, 0);
      return heat.attention.map((a, i) => ({ top: (i / heat.attention.length) * 100, text: max && a >= max * 0.6 ? `${Math.round(a * 100)}% of time` : "" })).filter((m) => m.text);
    }
    return [];
  }, [layer, heat]);

  const src = `${path}${path.includes("?") ? "&" : "?"}ilp_heat=1`;
  const empty = layer === "clicks" ? !heat.cells.length : layer === "rage" ? !heat.rageCells.length : layer === "dead" ? !heat.deadCells.length : !heat.views;

  return (
    <div ref={outer} className={s.heatOuter}>
      <div className={s.heatBar}>
        <label className={s.toggle}>
          <input type="checkbox" checked={showPage} onChange={(e) => setShowPage(e.target.checked)} />
          Show the page behind the map
        </label>
        <span className={s.heatMeta}>
          {W}px wide, {docH.toLocaleString("en-US")}px tall{scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ""}
        </span>
      </div>
      <div ref={scroller} className={s.heatScroll} style={{ height: VIEW_H }} onScroll={onScroll} tabIndex={0} role="group" aria-label={`Heat map of ${path}. The same figures are in the tables below.`}>
        <div className={s.heatPage} style={{ width: dispW, height: dispH }}>
          {showPage && (
            <div className={s.frameWrap} style={{ width: dispW, height: VIEW_H }}>
              <iframe
                ref={frame}
                key={`${src}|${W}`}
                src={src}
                title={`The page ${path} as visitors see it`}
                className={s.frame}
                style={{ width: W, height: VIEW_H / scale, transform: `scale(${scale})` }}
                onLoad={onLoad}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          )}
          {(!showPage || !pageOk) && <div className={s.outline} aria-hidden="true" />}
          <canvas ref={canvas} width={cw} height={ch} className={s.heatCanvas} style={{ width: dispW, height: dispH }} aria-hidden="true" />
          {marks.map((m) => (
            <span key={m.top} className={s.mark} style={{ top: `${m.top}%` }}>
              {m.text}
            </span>
          ))}
        </div>
      </div>
      {empty && <p className={s.heatEmpty}>Nothing recorded for this layer in this period.</p>}
      <ul className={s.scale} aria-hidden="true">
        {layer === "scroll" ? (
          <>
            <li>Clear: everyone saw it</li>
            <li>Dark: few people got this far</li>
          </>
        ) : (
          <>
            <li><span className={s.swCool} />Fewer</li>
            <li><span className={s.swWarm} />More</li>
            <li><span className={s.swHot} />Most</li>
          </>
        )}
      </ul>
    </div>
  );
}
