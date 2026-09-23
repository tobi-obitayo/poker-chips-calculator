"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { CHIP_COLORS } from "@/lib/chip-plan";

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
    <div className="glass-well rounded-2xl p-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
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
                  className="w-full min-w-0 bg-transparent text-center text-2xl font-semibold tracking-tight text-ink tabular-nums outline-none"
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
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="glass-well rounded-2xl p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          Chip colors in your case
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">{value} colors</p>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {CHIP_COLORS.map((color, index) => {
          const active = index < value;
          const selectable = index >= 1;
          return (
            <motion.button
              key={color.name}
              type="button"
              disabled={!selectable}
              onClick={() => onChange(index + 1)}
              animate={{
                y: active ? 0 : 4,
                opacity: active ? 1 : 0.32,
                scale: active ? 1 : 0.86,
              }}
              whileHover={selectable ? { y: -3 } : undefined}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex flex-col items-center gap-1.5 disabled:cursor-default"
              aria-label={selectable ? `Use ${index + 1} chip colors` : `${color.name} chip`}
            >
              <span className="ui-chip" style={{ "--chip": color.hex } as CSSProperties} />
              <span className="text-[9px] font-medium text-ink/50">{color.name}</span>
            </motion.button>
          );
        })}
      </div>

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
