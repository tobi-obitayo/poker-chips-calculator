"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleHelp, SlidersHorizontal } from "lucide-react";
import { SetupMenu } from "@/components/setup-menu";
import { TableStage } from "@/components/table-stage";
import { ChipDock, HelpDialog, MetricCards } from "@/components/table-hud";
import { makeChipPlan, type PlanInput } from "@/lib/chip-plan";

const DEFAULTS: PlanInput = {
  players: 4,
  totalChips: 100,
  buyIn: 5,
  colors: 4,
  allowClose: true,
  combineColors: false,
};

function CloudBackdrop() {
  return (
    <div className="backdrop pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <span className="cloud cloud-a" />
      <span className="cloud cloud-b" />
      <span className="cloud cloud-c" />
      <span className="cloud cloud-d" />
      <span className="grain absolute inset-0" />
    </div>
  );
}

export default function Home() {
  const [draft, setDraft] = useState(DEFAULTS);
  const [submitted, setSubmitted] = useState<PlanInput | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [dealKey, setDealKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const plan = useMemo(() => (submitted ? makeChipPlan(submitted) : null), [submitted]);
  const hasTable = Boolean(submitted && plan);

  function deal() {
    setSubmitted(draft);
    setDealKey((key) => key + 1);
    setActiveIndex(null);
    setMenuOpen(false);
  }

  function openMenu() {
    if (submitted) setDraft(submitted);
    setMenuOpen(true);
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden text-ink">
      <CloudBackdrop />

      {submitted && plan && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <TableStage
            plan={plan}
            players={submitted.players}
            dealKey={dealKey}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
          />
        </motion.div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
        <div className="liquid-glass pointer-events-auto flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4">
          <span className="ui-chip ui-chip-sm" style={{ "--chip": "#26292a" } as CSSProperties} />
          <span className="text-xs font-bold tracking-[0.22em]">STACKED</span>
        </div>

        <AnimatePresence>
          {hasTable && !menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-auto flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="How the stacks are calculated"
                className="liquid-glass grid size-10 place-items-center rounded-full text-ink/65 transition hover:text-ink"
              >
                <CircleHelp className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={openMenu}
                className="liquid-glass flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink/80 transition hover:text-ink"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Table settings</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {submitted && plan && !menuOpen && (
          <motion.div
            key={`hud-${dealKey}`}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between pb-4 pt-20 sm:pb-6 sm:pt-24"
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-auto">
              <MetricCards plan={plan} input={submitted} />
            </div>
            <div className="flex flex-col items-center gap-3 px-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 6, times: [0, 0.15, 0.8, 1], delay: 2.4 }}
                className="rounded-full bg-ink/70 px-3 py-1.5 text-[11px] font-medium text-paper backdrop-blur"
              >
                Drag to orbit · hover or tap a stack for details
              </motion.p>
              <div className="pointer-events-auto w-full">
                <ChipDock
                  plan={plan}
                  players={submitted.players}
                  activeIndex={activeIndex}
                  onActiveChange={setActiveIndex}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu"
            className={`absolute inset-0 z-40 flex overflow-y-auto px-4 pb-6 pt-20 sm:py-20 ${
              hasTable ? "bg-paper/25 backdrop-blur-md" : ""
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            onClick={(event) => {
              if (hasTable && event.target === event.currentTarget) setMenuOpen(false);
            }}
          >
            <SetupMenu
              value={draft}
              onChange={setDraft}
              onSubmit={deal}
              editing={hasTable}
              onClose={hasTable ? () => setMenuOpen(false) : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && plan && (
        <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} plan={plan} input={submitted} />
      )}
    </main>
  );
}
