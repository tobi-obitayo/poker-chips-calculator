"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  formatMoney,
  makeChipPlan,
  type ChipPlan,
  type PlanInput,
} from "@/lib/chip-plan";

const DEFAULTS: PlanInput = {
  players: 4,
  totalChips: 100,
  buyIn: 5,
  colors: 4,
  allowClose: true,
  combineColors: false,
};

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-12 items-center rounded-xl border border-ink/10 bg-paper p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Remove a player"
        onClick={() => onChange(Math.max(2, value - 1))}
        className="size-9 rounded-lg text-ink/60 hover:bg-ink/5"
      >
        <Minus />
      </Button>
      <div className="min-w-16 flex-1 text-center">
        <span className="font-display text-xl font-semibold">{value}</span>
        <span className="ml-1.5 text-xs text-ink/50">players</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Add a player"
        onClick={() => onChange(Math.min(12, value + 1))}
        className="size-9 rounded-lg text-ink/60 hover:bg-ink/5"
      >
        <Plus />
      </Button>
    </div>
  );
}

function SettingToggle({
  checked,
  onCheckedChange,
  title,
  detail,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-ink/8 bg-paper/60 p-4">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 data-checked:bg-coral"
        aria-label={title}
      />
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/50">{detail}</p>
      </div>
    </div>
  );
}

function MathStep({
  number,
  label,
  equation,
  detail,
}: {
  number: string;
  label: string;
  equation: string;
  detail: string;
}) {
  return (
    <div className="math-step rounded-2xl border border-ink/10 bg-paper/80 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-coral">
          {number} · {label}
        </span>
        <span className="size-1.5 rounded-full bg-sage" />
      </div>
      <p className="mt-3 font-display text-lg font-semibold tracking-[-0.03em]">{equation}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-ink/45">{detail}</p>
    </div>
  );
}

function PerspectiveTable({
  plan,
  players,
  dealKey,
}: {
  plan: ChipPlan;
  players: number;
  dealKey: number;
}) {
  const visiblePlayers = Math.min(players, 6);

  return (
    <div className="table-scene">
      <div className="table-shadow" />
      <div className="poker-table">
        <div className="felt-grid" />
        <div className="table-mark">
          <span>STACKED</span>
          <small>{formatMoney(plan.valuePerPlayer)} / PLAYER</small>
        </div>

        <div key={dealKey} className="chip-tray" aria-label="Animated chip stacks">
          {plan.stacks.map((stack, stackIndex) => (
            <div
              className="table-stack"
              key={`${stack.value}-${stackIndex}`}
              style={{ animationDelay: `${420 + stackIndex * 150}ms` }}
            >
              <div className="chip-column">
                {Array.from({ length: Math.min(stack.count, 7) }, (_, chipIndex) => (
                  <span
                    key={chipIndex}
                    className="table-chip"
                    style={{
                      backgroundColor: stack.colorHex,
                      color: stack.ink === "light" ? "#fffaf0" : "#272b28",
                      bottom: `${chipIndex * 4}px`,
                    }}
                  >
                    {chipIndex === Math.min(stack.count, 7) - 1 && formatMoney(stack.value)}
                  </span>
                ))}
              </div>
              <small>×{stack.count}</small>
            </div>
          ))}
        </div>
      </div>

      {Array.from({ length: visiblePlayers }, (_, index) => (
        <div key={index} className={`player-seat seat-${index + 1}`}>
          <span className="player-dot">{index + 1}</span>
          <span className="player-label">Player {index + 1}</span>
        </div>
      ))}
      {players > visiblePlayers && (
        <div className="more-players">+{players - visiblePlayers} more</div>
      )}
    </div>
  );
}

export default function Home() {
  const [draft, setDraft] = useState(DEFAULTS);
  const [submitted, setSubmitted] = useState(DEFAULTS);
  const [dealKey, setDealKey] = useState(0);
  const plan = useMemo(() => makeChipPlan(submitted), [submitted]);

  function update<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function deal() {
    setSubmitted(draft);
    setDealKey((key) => key + 1);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <div className="noise pointer-events-none fixed inset-0 opacity-40" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="relative grid size-9 place-items-center rounded-full bg-ink text-paper">
            <span className="absolute inset-1 rounded-full border border-dashed border-paper/50" />
            <span className="font-display text-xs font-bold">S</span>
          </div>
          <span className="font-display text-sm font-bold tracking-[0.24em]">STACKED</span>
        </div>
        <p className="hidden items-center gap-2 text-xs font-medium text-ink/50 sm:flex">
          <span className="size-1.5 rounded-full bg-sage" />
          Poker night, minus the math
        </p>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-10 md:pt-14">
        <div className="mb-10 max-w-3xl md:mb-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
            <Sparkles className="size-3" />
            Stack calculator
          </div>
          <h1 className="font-display text-5xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-7xl">
            Deal the chips.
            <br />
            <span className="font-serif italic text-coral">Skip the math.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink/55">
            Tell us what&apos;s in the case and what everyone is buying in for.
            We&apos;ll build balanced stacks with plenty of small chips for easy betting.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[28px] border border-ink/10 bg-cream p-5 shadow-[0_24px_70px_rgba(34,38,34,0.06)] sm:p-7">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="eyebrow">01 / Set the table</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">Your game</h2>
              </div>
              <Users className="size-5 text-ink/30" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-2.5 text-xs text-ink/60">Players</Label>
                <Stepper value={draft.players} onChange={(value) => update("players", value)} />
              </div>
              <div>
                <Label htmlFor="buy-in" className="mb-2.5 text-xs text-ink/60">
                  Buy-in per player
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-sm text-ink/40">$</span>
                  <Input
                    id="buy-in"
                    type="number"
                    min={0.01}
                    step={0.25}
                    value={draft.buyIn}
                    onChange={(event) => update("buyIn", Math.max(0.01, Number(event.target.value)))}
                    className="h-12 rounded-xl border-ink/10 bg-paper pl-7 font-display text-base shadow-none focus-visible:border-coral focus-visible:ring-coral/15"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="chips" className="mb-2.5 text-xs text-ink/60">
                  Total chips available
                </Label>
                <Input
                  id="chips"
                  type="number"
                  min={draft.players}
                  value={draft.totalChips}
                  onChange={(event) => update("totalChips", Math.max(1, Number(event.target.value)))}
                  className="h-12 rounded-xl border-ink/10 bg-paper font-display text-base shadow-none focus-visible:border-coral focus-visible:ring-coral/15"
                />
              </div>
            </div>

            <div className="my-7 h-px bg-ink/8" />

            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <Label className="text-xs text-ink/60">Chip colors / values</Label>
                  <p className="mt-1 text-[11px] text-ink/40">How many kinds are in your case?</p>
                </div>
                <span className="font-display text-xl font-semibold">{draft.colors}</span>
              </div>
              <Slider
                min={2}
                max={6}
                step={1}
                value={[draft.colors]}
                onValueChange={(value) =>
                  update("colors", Array.isArray(value) ? value[0] : value)
                }
                className="[&_[data-slot=slider-range]]:bg-coral [&_[data-slot=slider-thumb]]:border-coral"
              />
              <div className="mt-2 flex justify-between px-0.5 text-[10px] font-semibold text-ink/30">
                {[2, 3, 4, 5, 6].map((value) => <span key={value}>{value}</span>)}
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <SettingToggle
                checked={draft.allowClose}
                onCheckedChange={(checked) => update("allowClose", checked)}
                title="A close buy-in is okay"
                detail="Favor familiar, easy-to-remember chip values over an exact total."
              />
              <SettingToggle
                checked={draft.combineColors}
                onCheckedChange={(checked) => update("combineColors", checked)}
                title="Colors can share a value"
                detail="Combine colors when it makes the stack simpler to count and play."
              />
            </div>

            <Button
              type="button"
              onClick={deal}
              className="mt-6 h-12 w-full rounded-xl bg-ink px-5 text-sm font-semibold text-paper shadow-lg shadow-ink/10 hover:bg-ink/90"
            >
              Build my stacks
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-[#d9d1c0] shadow-[0_30px_90px_rgba(34,38,34,0.14)]">
            <div className="relative p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">02 / Watch the math</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-sage text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-xs font-semibold text-ink/60">
                      {plan.isExact ? "Exact buy-in found" : "Cleanest close match"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(DEFAULTS);
                    setSubmitted(DEFAULTS);
                    setDealKey((key) => key + 1);
                  }}
                  className="rounded-full border border-ink/10 bg-paper/40 p-2 text-ink/45 transition hover:bg-paper hover:text-ink"
                  aria-label="Reset calculator"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>

              <div key={`math-${dealKey}`} className="math-sequence mt-6 grid gap-2 sm:grid-cols-3">
                <MathStep
                  number="1"
                  label="Divide"
                  equation={`${submitted.totalChips} ÷ ${submitted.players} = ${plan.chipsPerPlayer}`}
                  detail="Physical chips available per player."
                />
                <MathStep
                  number="2"
                  label="Weight"
                  equation="45% → 27% → 16%"
                  detail="More small chips, progressively fewer large ones."
                />
                <MathStep
                  number="3"
                  label="Price"
                  equation={`${plan.chipsPerPlayer} chips = ${formatMoney(plan.valuePerPlayer)}`}
                  detail={plan.isExact ? "Values land exactly on your buy-in." : "Values favor clean, playable amounts."}
                />
              </div>

              <div key={`table-${dealKey}`} className="mt-4">
                <PerspectiveTable
                  plan={plan}
                  players={submitted.players}
                  dealKey={dealKey}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="grid grid-cols-3 rounded-2xl border border-ink/10 bg-paper/70 p-4">
                  <div>
                    <p className="table-summary-label">Each player</p>
                    <p className="table-summary-value">{formatMoney(plan.valuePerPlayer)}</p>
                  </div>
                  <div className="border-x border-ink/10 px-3">
                    <p className="table-summary-label">Chips / player</p>
                    <p className="table-summary-value">{plan.chipsPerPlayer}</p>
                  </div>
                  <div className="pl-3">
                    <p className="table-summary-label">Reserve</p>
                    <p className="table-summary-value">{plan.chipsLeft}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-ink px-5 py-4 text-paper">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-paper/40">Start blinds</p>
                  <p className="mt-1 whitespace-nowrap font-display text-lg font-semibold">
                    {formatMoney(plan.smallBlind)} / {formatMoney(plan.bigBlind)}
                  </p>
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-ink/10 bg-paper/70">
                {plan.stacks.map((stack, index) => (
                  <div
                    key={`${stack.value}-legend-${index}`}
                    className="flex items-center gap-3 border-b border-ink/8 px-4 py-2.5 last:border-0"
                  >
                    <span className="mini-chip" style={{ backgroundColor: stack.colorHex }} />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {stack.colors.join(" + ")}
                    </span>
                    <span className="text-xs text-ink/45">
                      {formatMoney(stack.value)} × {stack.count}
                    </span>
                    <span className="w-14 text-right font-display text-xs font-semibold">
                      {formatMoney(stack.value * stack.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center gap-3 border-t border-ink/8 bg-paper/35 px-5 py-4 sm:px-7">
              <CircleDollarSign className="size-4 text-coral" />
              <p className="text-[11px] leading-relaxed text-ink/50">
                The labels on your chips are optional—agree on tonight&apos;s color values before the first hand.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-16 rounded-[28px] border border-ink/10 bg-cream p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow">The walkthrough</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
                What is the algorithm doing?
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink/55">
                It is not randomly assigning values. Every answer follows the same three rules so the
                stacks stay fair, practical, and easy to count.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              <li className="walkthrough-card">
                <span>01</span>
                <h3>Split fairly</h3>
                <p>Divide all physical chips by the player count. Any remainder stays in the bank for rebuys.</p>
              </li>
              <li className="walkthrough-card">
                <span>02</span>
                <h3>Shape the stack</h3>
                <p>Allocate about 45%, 27%, 16%, then 8% to ascending values, so small bets stay easy.</p>
              </li>
              <li className="walkthrough-card">
                <span>03</span>
                <h3>Fit the buy-in</h3>
                <p>Try familiar values like 5¢, 10¢, 25¢, and 50¢, then swap counts until the total is closest.</p>
              </li>
            </ol>
          </div>
        </section>
      </section>
    </main>
  );
}
