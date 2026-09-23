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
import { formatMoney, makeChipPlan, type PlanInput } from "@/lib/chip-plan";

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

          <section className="relative overflow-hidden rounded-[28px] bg-ink text-paper shadow-[0_30px_90px_rgba(34,38,34,0.18)]">
            <div className="absolute -right-20 -top-20 size-64 rounded-full border border-paper/5" />
            <div className="absolute -right-8 -top-8 size-40 rounded-full border border-paper/5" />
            <div className="relative p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-paper/40">02 / Tonight&apos;s stack</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-sage text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-xs font-semibold text-paper/70">
                      {plan.isExact ? "Exact buy-in" : "Clean values, closest fit"}
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
                  className="rounded-full border border-paper/10 p-2 text-paper/40 transition hover:border-paper/25 hover:text-paper"
                  aria-label="Reset calculator"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>

              <div className="mt-8 flex flex-col justify-between gap-8 border-b border-paper/10 pb-8 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-medium text-paper/40">Each player gets</p>
                  <p className="mt-1 font-display text-5xl font-semibold tracking-[-0.04em]">
                    {formatMoney(plan.valuePerPlayer)}
                  </p>
                  <p className="mt-2 text-xs text-paper/40">
                    {plan.chipsPerPlayer} chips per stack
                    {!plan.isExact && (
                      <span className="ml-2 text-gold">
                        {plan.difference > 0 ? "+" : "−"}
                        {formatMoney(Math.abs(plan.difference))} vs target
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-paper/10 bg-paper/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-paper/35">
                    Start blinds at
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold">
                    {formatMoney(plan.smallBlind)} / {formatMoney(plan.bigBlind)}
                  </p>
                </div>
              </div>

              <div key={dealKey} className="deal-in mt-8">
                <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper/30">
                  <span>Chip value</span>
                  <span>Quantity</span>
                  <span className="w-16 text-right">Subtotal</span>
                </div>
                <div className="space-y-2.5">
                  {plan.stacks.map((stack, index) => (
                    <div
                      key={`${stack.value}-${index}`}
                      className="stack-row grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-paper/8 bg-paper/[0.045] p-3.5"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="chip relative grid size-11 shrink-0 place-items-center rounded-full font-display text-[10px] font-bold shadow-lg"
                          style={{
                            backgroundColor: stack.colorHex,
                            color: stack.ink === "light" ? "#fffaf0" : "#272b28",
                          }}
                        >
                          <span className="absolute inset-[4px] rounded-full border border-dashed border-current opacity-50" />
                          <span className="relative">{formatMoney(stack.value)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-base font-semibold">
                            {formatMoney(stack.value)}
                          </p>
                          <p className="truncate text-[11px] text-paper/35">
                            {stack.colors.join(" + ")}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-paper/8 px-3 py-1.5 font-display text-sm font-semibold">
                        × {stack.count}
                      </div>
                      <p className="w-16 text-right font-display text-sm text-paper/65">
                        {formatMoney(stack.value * stack.count)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-paper/[0.045] p-4">
                <div>
                  <p className="summary-label">In play</p>
                  <p className="summary-value">{plan.chipsUsed}</p>
                </div>
                <div className="border-x border-paper/8 px-3">
                  <p className="summary-label">Reserve</p>
                  <p className="summary-value">{plan.chipsLeft}</p>
                </div>
                <div className="pl-2">
                  <p className="summary-label">Table value</p>
                  <p className="summary-value">{formatMoney(plan.valuePerPlayer * submitted.players)}</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-3 border-t border-paper/8 bg-black/10 px-5 py-4 sm:px-8">
              <CircleDollarSign className="size-4 text-gold" />
              <p className="text-[11px] leading-relaxed text-paper/40">
                Tip: color matters more than what&apos;s printed. Agree on values before the first hand.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
