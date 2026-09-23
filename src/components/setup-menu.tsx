"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { ChipColorSlider, GlassStepper, GlowToggle } from "@/components/setup-controls";
import { formatMoney, makeChipPlan, type PlanInput } from "@/lib/chip-plan";

export function SetupMenu({
  value,
  onChange,
  onSubmit,
  onClose,
  editing,
}: {
  value: PlanInput;
  onChange: (value: PlanInput) => void;
  onSubmit: () => void;
  onClose?: () => void;
  editing: boolean;
}) {
  const preview = useMemo(() => makeChipPlan(value), [value]);
  const notEnoughChips = value.totalChips < value.players;
  const invalidBuyIn = !(value.buyIn > 0);
  const blocked = notEnoughChips || invalidBuyIn;

  function update<K extends keyof PlanInput>(key: K, next: PlanInput[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <motion.form
      onSubmit={(event) => {
        event.preventDefault();
        if (!blocked) onSubmit();
      }}
      initial={{ opacity: 0, y: 40, scale: 0.94, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(18px)" }}
      transition={{ type: "spring", stiffness: 170, damping: 24, mass: 0.9 }}
      className="liquid-glass relative w-full max-w-[560px] overflow-hidden rounded-[34px] p-5 sm:p-7"
      aria-labelledby="setup-title"
    >
      <div className="liquid-sheen pointer-events-none absolute inset-0" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/40">
            {editing ? "Adjust tonight's game" : "Before the first hand"}
          </p>
          <h1 id="setup-title" className="mt-1.5 text-[28px] font-semibold tracking-[-0.04em] text-ink">
            Set the table
          </h1>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close table settings"
            className="glass-key grid size-10 place-items-center rounded-full text-ink/55 transition hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="relative mt-5 grid gap-2.5 sm:grid-cols-3">
        <GlassStepper
          label="Players"
          value={value.players}
          onChange={(next) => update("players", next)}
          min={2}
          max={12}
          step={1}
        />
        <GlassStepper
          label="Buy-in"
          value={value.buyIn}
          onChange={(next) => update("buyIn", next)}
          min={0.25}
          max={10000}
          step={1}
          prefix="$"
          decimals
        />
        <GlassStepper
          label="Total chips"
          value={value.totalChips}
          onChange={(next) => update("totalChips", next)}
          min={2}
          max={2000}
          step={10}
        />
      </div>

      <div className="relative mt-2.5">
        <ChipColorSlider value={value.colors} onChange={(next) => update("colors", next)} />
      </div>

      <div className="relative mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <GlowToggle
          tone="emerald"
          checked={value.allowClose}
          onCheckedChange={(next) => update("allowClose", next)}
          title="Close buy-in is okay"
          detail="Round to familiar chip values."
        />
        <GlowToggle
          tone="amber"
          checked={value.combineColors}
          onCheckedChange={(next) => update("combineColors", next)}
          title="Colors can share a value"
          detail="Fewer values, simpler counting."
        />
      </div>

      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-4 px-1" aria-live="polite">
          {blocked ? (
            <p className="text-xs font-medium text-coral">
              {notEnoughChips
                ? "Add chips — every player needs at least one."
                : "Enter a buy-in above $0."}
            </p>
          ) : (
            <>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/40">Each stack</p>
                <p className="text-lg font-semibold tabular-nums text-ink">
                  <AnimatedNumber value={preview.valuePerPlayer} format={formatMoney} />
                </p>
              </div>
              <div className="h-8 w-px bg-ink/10" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/40">Chips</p>
                <p className="text-lg font-semibold tabular-nums text-ink">
                  <AnimatedNumber value={preview.chipsPerPlayer} />
                </p>
              </div>
            </>
          )}
        </div>
        <motion.button
          type="submit"
          disabled={blocked}
          whileHover={blocked ? undefined : { y: -1 }}
          whileTap={blocked ? undefined : { scale: 0.97 }}
          className="group flex h-13 items-center justify-center gap-2 rounded-2xl bg-ink px-6 text-sm font-semibold text-paper shadow-[0_14px_30px_rgba(20,24,22,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {editing ? "Update the table" : "Deal the chips"}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </motion.button>
      </div>
    </motion.form>
  );
}
