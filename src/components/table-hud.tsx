"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/animated-number";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney, type ChipPlan, type PlanInput } from "@/lib/chip-plan";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: -14, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { type: "spring" as const, stiffness: 200, damping: 24, delay },
});

export function MetricCards({ plan, input }: { plan: ChipPlan; input: PlanInput }) {
  return (
    <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:justify-center sm:px-0">
      <motion.div {...rise(0.55)} className="glass-card min-w-[180px] snap-start rounded-2xl px-4 py-3">
        <p className="metric-label">
          <span className="text-coral">1</span> Divide
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-ink">
          <AnimatedNumber value={input.totalChips} /> ÷ <AnimatedNumber value={input.players} /> ={" "}
          <AnimatedNumber value={plan.chipsPerPlayer} />
        </p>
        <p className="text-[10px] text-ink/45">chips for each player</p>
      </motion.div>

      <motion.div {...rise(0.65)} className="glass-card min-w-[200px] snap-start rounded-2xl px-4 py-3">
        <p className="metric-label">
          <span className="text-coral">2</span> Weight
        </p>
        <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-ink/8">
          {plan.stacks.map((stack, i) => (
            <motion.span
              key={`${stack.value}-${i}`}
              initial={{ width: 0 }}
              animate={{ width: `${stack.chipShare * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.8 + i * 0.08 }}
              style={{ backgroundColor: stack.colorHex }}
              className="h-full border-r border-white/60 last:border-0"
            />
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-ink/45">more small chips, fewer big ones</p>
      </motion.div>

      <motion.div {...rise(0.75)} className="glass-card min-w-[180px] snap-start rounded-2xl px-4 py-3">
        <p className="metric-label">
          <span className="text-coral">3</span> Price
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-ink">
          <AnimatedNumber value={plan.chipsPerPlayer} /> chips ={" "}
          <AnimatedNumber value={plan.valuePerPlayer} format={formatMoney} />
        </p>
        <p className="text-[10px] text-ink/45">
          {plan.isExact
            ? "exactly your buy-in"
            : `${plan.difference > 0 ? "+" : "−"}${formatMoney(Math.abs(plan.difference))} for cleaner values`}
        </p>
      </motion.div>
    </div>
  );
}

export function BlindsBadge({ plan }: { plan: ChipPlan }) {
  return (
    <div className="blinds-badge flex items-center gap-3 rounded-full py-1.5 pl-2 pr-4 text-paper">
      <span className="grid size-8 place-items-center rounded-full bg-white/10 text-[9px] font-bold tracking-wider">
        L1
      </span>
      <div className="leading-tight">
        <p className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-paper/50">
          <span className="live-dot" /> Blinds
        </p>
        <p className="text-sm font-semibold tabular-nums">
          <AnimatedNumber value={plan.smallBlind} format={formatMoney} /> /{" "}
          <AnimatedNumber value={plan.bigBlind} format={formatMoney} />
        </p>
      </div>
    </div>
  );
}

export function ChipDock({
  plan,
  players,
  activeIndex,
  onActiveChange,
}: {
  plan: ChipPlan;
  players: number;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24, delay: 0.9 }}
      className="liquid-glass mx-auto flex w-fit max-w-full flex-col gap-2 rounded-[26px] p-2 sm:flex-row sm:items-center"
    >
      <div className="no-scrollbar flex gap-1 overflow-x-auto" onMouseLeave={() => onActiveChange(null)}>
        {plan.stacks.map((stack, i) => (
          <button
            key={`${stack.value}-${i}`}
            type="button"
            onMouseEnter={() => onActiveChange(i)}
            onFocus={() => onActiveChange(i)}
            onBlur={() => onActiveChange(null)}
            onClick={() => onActiveChange(activeIndex === i ? null : i)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-2.5 py-2 text-left transition ${
              activeIndex === i ? "bg-white/80 shadow-sm" : "hover:bg-white/45"
            }`}
          >
            <span className="ui-chip ui-chip-sm" style={{ "--chip": stack.colorHex } as CSSProperties} />
            <span className="leading-tight">
              <span className="block text-sm font-semibold tabular-nums text-ink">{formatMoney(stack.value)}</span>
              <span className="block text-[10px] tabular-nums text-ink/50">×{stack.count}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-ink/8 px-2 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
        <div className="leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">Table</p>
          <p className="text-sm font-semibold tabular-nums text-ink">
            <AnimatedNumber value={plan.valuePerPlayer * players} format={formatMoney} />
          </p>
        </div>
        <div className="leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">Reserve</p>
          <p className="text-sm font-semibold tabular-nums text-ink">
            <AnimatedNumber value={plan.chipsLeft} /> chips
          </p>
        </div>
        <BlindsBadge plan={plan} />
      </div>
    </motion.div>
  );
}

export function HelpDialog({
  open,
  onOpenChange,
  plan,
  input,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ChipPlan;
  input: PlanInput;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="liquid-glass max-h-[88dvh] overflow-y-auto rounded-[28px] p-6 ring-0 sm:max-w-lg">
        <DialogHeader>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral">How it works</p>
          <DialogTitle className="text-2xl font-semibold tracking-tight text-ink">
            How your stacks were built
          </DialogTitle>
          <DialogDescription className="text-ink/55">
            Three rules, applied in order, using the numbers you entered.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 space-y-3">
          <li className="glass-well rounded-2xl p-4">
            <p className="metric-label">
              <span className="text-coral">1</span> Split the chips fairly
            </p>
            <p className="mt-2 text-sm text-ink/70">
              {input.totalChips} chips ÷ {input.players} players ={" "}
              <strong className="text-ink">{plan.chipsPerPlayer} chips each</strong>.{" "}
              {plan.chipsLeft > 0
                ? `The ${plan.chipsLeft} left over stay in the bank for rebuys.`
                : "Nothing is left over."}
            </p>
          </li>

          <li className="glass-well rounded-2xl p-4">
            <p className="metric-label">
              <span className="text-coral">2</span> Weight toward small chips
            </p>
            <p className="mt-2 text-sm text-ink/70">
              Counts start from a 45 / 27 / 16 / 8 / 3 / 1% curve, smallest value first, so small bets and
              making change stay easy. Step 3 may nudge a few chips between colors.
            </p>
            <div className="mt-3 space-y-1.5">
              {plan.stacks.map((stack, i) => (
                <div key={`${stack.value}-${i}`} className="flex items-center gap-2 text-xs">
                  <span className="w-10 font-semibold tabular-nums text-ink">{formatMoney(stack.value)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stack.chipShare * 100}%` }}
                      transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.15 + i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stack.colorHex }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-ink/55">×{stack.count}</span>
                </div>
              ))}
            </div>
          </li>

          <li className="glass-well rounded-2xl p-4">
            <p className="metric-label">
              <span className="text-coral">3</span> Price each color
            </p>
            <p className="mt-2 text-sm text-ink/70">
              {input.allowClose
                ? "Tries runs of familiar values (1¢, 5¢, 25¢, $1…), then moves one chip at a time between colors until the total is as close to your buy-in as possible."
                : "Keeps familiar values for the small chips, then solves the top chip's value so the stack lands exactly on your buy-in."}
            </p>
            <div className="mt-3 space-y-1 text-xs tabular-nums">
              {plan.stacks.map((stack, i) => (
                <div key={`${stack.value}-price-${i}`} className="flex justify-between text-ink/60">
                  <span>
                    {formatMoney(stack.value)} × {stack.count}
                  </span>
                  <span>{formatMoney(stack.value * stack.count)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-ink/10 pt-1.5 text-sm font-semibold text-ink">
                <span>Each player</span>
                <span>{formatMoney(plan.valuePerPlayer)}</span>
              </div>
            </div>
          </li>
        </ol>

        <p className="text-xs leading-relaxed text-ink/50">
          Starting blinds use the smallest chip: {formatMoney(plan.smallBlind)} small blind,{" "}
          {formatMoney(plan.bigBlind)} big blind.
        </p>
      </DialogContent>
    </Dialog>
  );
}
