"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { BASIC_COLORS, CHIP_COLORS, type ChipColor } from "@/lib/chip-plan";

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  decimals?: boolean;
};

export function GlassStepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  decimals = false,
}: StepperProps) {
  const [flash, setFlash] = useState<{ id: number; side: "minus" | "plus" } | null>(null);
  const [text, setText] = useState<string | null>(null);

  function clamp(next: number) {
    const rounded = decimals ? Math.round(next * 100) / 100 : Math.round(next);
    return Math.min(max, Math.max(min, rounded));
  }

  function nudge(direction: -1 | 1) {
    onChange(clamp(value + direction * step));
    setFlash({ id: Date.now(), side: direction < 0 ? "minus" : "plus" });
  }

  function commit() {
    if (text === null) return;
    const parsed = Number(text);
    if (text.trim() !== "" && Number.isFinite(parsed)) onChange(clamp(parsed));
    setText(null);
  }

  return (
    <div className="glass-well flex items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:block sm:py-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
        {label}
      </p>
      <div className="flex w-44 items-center gap-1.5 sm:mt-2 sm:w-auto">
        {(["minus", "plus"] as const).map((side) => {
          const isMinus = side === "minus";
          const disabled = isMinus ? value <= min : value >= max;
          const button = (
            <motion.button
              key={side}
              type="button"
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
              disabled={disabled}
              onClick={() => nudge(isMinus ? -1 : 1)}
              aria-label={`${isMinus ? "Decrease" : "Increase"} ${label.toLowerCase()}`}
              className="glass-key relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl text-ink/70 disabled:opacity-35"
            >
              {flash?.side === side && (
                <motion.span
                  key={flash.id}
                  initial={{ opacity: 0.9, scale: 0.4 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle,rgba(52,211,153,0.55),transparent_65%)]"
                />
              )}
              {isMinus ? <Minus className="relative size-4" /> : <Plus className="relative size-4" />}
            </motion.button>
          );

          if (isMinus) return button;
          return (
            <div key="value-and-plus" className="contents">
              <label className="flex min-w-0 flex-1 items-baseline justify-center gap-0.5">
                {prefix && <span className="text-sm font-medium text-ink/40">{prefix}</span>}
                <input
                  inputMode={decimals ? "decimal" : "numeric"}
                  aria-label={label}
                  value={text ?? String(value)}
                  onChange={(event) => setText(event.target.value)}
                  onBlur={commit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      nudge(1);
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      nudge(-1);
                    }
                  }}
                  className="w-full min-w-0 bg-transparent text-center text-xl font-semibold tracking-tight text-ink tabular-nums outline-none sm:text-2xl"
                />
                {suffix && <span className="text-xs font-medium text-ink/40">{suffix}</span>}
              </label>
              {button}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChipColorSlider({
  value,
  onChange,
  palette,
  onPaletteChange,
}: {
  value: number;
  onChange: (value: number) => void;
  palette: ChipColor[];
  onPaletteChange: (palette: ChipColor[]) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const editingSlot = editing !== null && editing < value ? editing : null;
  const isDefault = palette.every((color, i) => color.hex === CHIP_COLORS[i].hex);

  function pick(color: ChipColor) {
    if (editingSlot === null) return;
    onPaletteChange(palette.map((current, i) => (i === editingSlot ? color : current)));
    setEditing(null);
  }

  return (
    <div className="glass-well rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          Chip colors in your case
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">{value} colors</p>
      </div>
      <p className="mt-1 text-[11px] text-ink/45">Tap a chip to match the colors you actually have.</p>

      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {palette.map((color, index) => {
          const active = index < value;
          const selected = editingSlot === index;
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => {
                if (!active) onChange(Math.max(2, index + 1));
                setEditing(selected ? null : index);
              }}
              animate={{
                y: selected ? -4 : active ? 0 : 4,
                opacity: active ? 1 : 0.32,
                scale: active ? 1 : 0.86,
              }}
              whileHover={{ y: selected ? -4 : -3 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex flex-col items-center gap-1.5"
              aria-label={`Change color of chip ${index + 1} (${color.name})`}
              aria-expanded={selected}
            >
              <span
                className={`ui-chip rounded-full ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-white/60" : ""}`}
                style={{ "--chip": color.hex } as CSSProperties}
              />
              <span className="max-w-full truncate text-[9px] font-medium text-ink/55">{color.name}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {editingSlot !== null && (
          <motion.div
            key="swatches"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-white/55 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
                Chip {editingSlot + 1} color
              </p>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {BASIC_COLORS.map((color) => {
                  const current = palette[editingSlot].hex === color.hex;
                  const takenBy = palette.findIndex(
                    (other, i) => i !== editingSlot && i < value && other.hex === color.hex,
                  );
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      disabled={takenBy !== -1}
                      onClick={() => pick(color)}
                      title={takenBy !== -1 ? `${color.name} is already chip ${takenBy + 1}` : color.name}
                      aria-label={`${color.name}${takenBy !== -1 ? ", already used" : ""}`}
                      className="group flex flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-full border border-black/10 shadow-sm transition group-enabled:group-hover:scale-110 ${
                          current ? "ring-2 ring-ink ring-offset-2" : ""
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {current && (
                          <Check className={`size-3.5 ${color.ink === "dark" ? "text-ink" : "text-white"}`} />
                        )}
                      </span>
                      <span className="text-[9px] font-medium text-ink/55">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {new Set(palette.slice(0, value).map((color) => color.hex)).size < value && (
        <p className="mt-2 text-[11px] font-medium text-coral">
          Two chips share a color. Tap one to change it so values stay easy to tell apart.
        </p>
      )}

      {!isDefault && (
        <button
          type="button"
          onClick={() => {
            onPaletteChange(CHIP_COLORS);
            setEditing(null);
          }}
          className="mt-2 text-[11px] font-medium text-ink/50 underline-offset-2 hover:text-ink hover:underline"
        >
          Reset to default colors
        </button>
      )}

      <Slider
        min={2}
        max={6}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
        aria-label="Number of chip colors"
        className="glass-slider mt-4"
      />
      <div className="mt-2 flex justify-between px-0.5 text-[10px] font-semibold tabular-nums text-ink/35">
        {[2, 3, 4, 5, 6].map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}

export function GlowToggle({
  checked,
  onCheckedChange,
  title,
  detail,
  tone,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  detail: string;
  tone: "emerald" | "amber";
}) {
  const glow =
    tone === "emerald"
      ? { track: "#10b981", shadow: "0 0 18px rgba(16,185,129,0.55)" }
      : { track: "#f59e0b", shadow: "0 0 18px rgba(245,158,11,0.55)" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="glass-well flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left transition hover:bg-white/45"
    >
      <motion.span
        animate={{
          backgroundColor: checked ? glow.track : "rgba(37,42,39,0.14)",
          boxShadow: checked ? glow.shadow : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.25 }}
        className={`mt-0.5 flex h-6 w-11 shrink-0 rounded-full p-0.5 ${checked ? "justify-end" : "justify-start"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className="size-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
        />
      </motion.span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink/50">{detail}</span>
      </span>
    </button>
  );
}
