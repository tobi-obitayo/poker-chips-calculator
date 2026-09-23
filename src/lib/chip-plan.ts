export type PlanInput = {
  players: number;
  totalChips: number;
  buyIn: number;
  colors: number;
  allowClose: boolean;
  combineColors: boolean;
};

export type ChipStack = {
  value: number;
  count: number;
  colors: string[];
  colorHex: string;
  ink: "light" | "dark";
};

export type ChipPlan = {
  stacks: ChipStack[];
  chipsPerPlayer: number;
  chipsUsed: number;
  chipsLeft: number;
  valuePerPlayer: number;
  difference: number;
  smallBlind: number;
  bigBlind: number;
  isExact: boolean;
};

const CHIP_COLORS = [
  { name: "Ivory", hex: "#f3ead3", ink: "dark" as const },
  { name: "Coral", hex: "#e85d4a", ink: "light" as const },
  { name: "Ocean", hex: "#2f6d91", ink: "light" as const },
  { name: "Sage", hex: "#63886c", ink: "light" as const },
  { name: "Ink", hex: "#252927", ink: "light" as const },
  { name: "Plum", hex: "#7c537d", ink: "light" as const },
];

const NICE_VALUES = [
  1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2500, 5000, 10000,
  25000, 50000, 100000,
];

function distribute(total: number, groups: number) {
  const weights = [0.45, 0.27, 0.16, 0.08, 0.03, 0.01].slice(0, groups);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) =>
    Math.max(1, Math.floor((total * weight) / weightTotal)),
  );

  let assigned = counts.reduce((sum, count) => sum + count, 0);
  let cursor = 0;
  while (assigned < total) {
    counts[cursor % Math.max(1, groups - 1)] += 1;
    assigned += 1;
    cursor += 1;
  }
  while (assigned > total) {
    const index = counts.findIndex((count, i) => count > (counts[i + 1] ?? 1));
    if (index === -1) break;
    counts[index] -= 1;
    assigned -= 1;
  }
  return counts;
}

function totalValue(values: number[], counts: number[]) {
  return values.reduce((sum, value, index) => sum + value * counts[index], 0);
}

function improveCounts(values: number[], initial: number[], target: number) {
  const counts = [...initial];
  let current = totalValue(values, counts);

  for (let pass = 0; pass < 500; pass += 1) {
    let best:
      | { from: number; to: number; total: number; distance: number }
      | undefined;

    for (let from = 0; from < counts.length; from += 1) {
      for (let to = 0; to < counts.length; to += 1) {
        if (from === to || counts[from] <= 1) continue;
        const next = [...counts];
        next[from] -= 1;
        next[to] += 1;
        if (next.some((count, i) => i > 0 && next[i - 1] < count)) continue;
        const nextTotal = current - values[from] + values[to];
        const distance = Math.abs(target - nextTotal);
        if (distance < Math.abs(target - current) && (!best || distance < best.distance)) {
          best = { from, to, total: nextTotal, distance };
        }
      }
    }

    if (!best) break;
    counts[best.from] -= 1;
    counts[best.to] += 1;
    current = best.total;
  }

  return counts;
}

function cleanPlan(chips: number, denominations: number, target: number) {
  const initial = distribute(chips, denominations);
  let best: { values: number[]; counts: number[]; total: number } | undefined;

  for (let start = 0; start <= NICE_VALUES.length - denominations; start += 1) {
    const values = NICE_VALUES.slice(start, start + denominations);
    const counts = improveCounts(values, initial, target);
    const total = totalValue(values, counts);
    if (!best || Math.abs(target - total) < Math.abs(target - best.total)) {
      best = { values, counts, total };
    }
  }

  return best!;
}

function exactPlan(chips: number, denominations: number, target: number) {
  if (denominations === 1) {
    return {
      values: [Math.max(1, Math.round(target / chips))],
      counts: [chips],
      total: target,
    };
  }

  for (let start = 0; start <= NICE_VALUES.length - denominations; start += 1) {
    const values = NICE_VALUES.slice(start, start + denominations);
    const counts = distribute(chips, denominations);
    const highestIndex = denominations - 1;
    const moved = counts[highestIndex] - 1;
    counts[0] += moved;
    counts[highestIndex] = 1;
    const lowerTotal = values
      .slice(0, highestIndex)
      .reduce((sum, value, index) => sum + value * counts[index], 0);
    const highest = target - lowerTotal;
    if (highest >= values[highestIndex - 1] && highest > 0) {
      values[highestIndex] = highest;
      return { values, counts, total: target };
    }
  }

  return cleanPlan(chips, denominations, target);
}

export function makeChipPlan(raw: PlanInput): ChipPlan {
  const players = Math.max(2, Math.min(12, Math.round(raw.players)));
  const totalChips = Math.max(players, Math.round(raw.totalChips));
  const buyInCents = Math.max(1, Math.round(raw.buyIn * 100));
  const availableColors = Math.max(1, Math.min(6, Math.round(raw.colors)));
  const chipsPerPlayer = Math.max(1, Math.floor(totalChips / players));
  const denominations = Math.min(
    chipsPerPlayer,
    raw.combineColors ? Math.min(4, availableColors) : availableColors,
  );

  const solution = raw.allowClose
    ? cleanPlan(chipsPerPlayer, denominations, buyInCents)
    : exactPlan(chipsPerPlayer, denominations, buyInCents);

  const colorGroups: (typeof CHIP_COLORS)[] = Array.from(
    { length: denominations },
    () => [],
  );
  CHIP_COLORS.slice(0, availableColors).forEach((color, index) => {
    colorGroups[Math.min(index, denominations - 1)].push(color);
  });

  const stacks = solution.values.map((value, index) => ({
    value: value / 100,
    count: solution.counts[index],
    colors: colorGroups[index].map((color) => color.name),
    colorHex: colorGroups[index][0]?.hex ?? CHIP_COLORS[index].hex,
    ink: colorGroups[index][0]?.ink ?? "dark",
  }));
  const valuePerPlayer = solution.total / 100;
  const smallest = stacks[0]?.value ?? 0.01;

  return {
    stacks,
    chipsPerPlayer,
    chipsUsed: chipsPerPlayer * players,
    chipsLeft: totalChips - chipsPerPlayer * players,
    valuePerPlayer,
    difference: valuePerPlayer - buyInCents / 100,
    smallBlind: smallest,
    bigBlind: smallest * 2,
    isExact: solution.total === buyInCents,
  };
}

export function formatMoney(value: number) {
  if (value < 1) return `${Math.round(value * 100)}¢`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
