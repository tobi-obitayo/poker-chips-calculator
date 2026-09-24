export type PlanInput = {
  players: number;
  totalChips: number;
  buyIn: number;
  colors: number;
  allowClose: boolean;
  combineColors: boolean;
  palette?: ChipColor[];
};

export type ChipColor = {
  name: string;
  hex: string;
  ink: "light" | "dark";
};

export type ChipStack = {
  value: number;
  count: number;
  colors: string[];
  colorHex: string;
  ink: "light" | "dark";
  palette: ChipColor[];
  chipShare: number;
  valueShare: number;
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

export const CHIP_COLORS: ChipColor[] = [
  { name: "Ivory", hex: "#f1e8d2", ink: "dark" },
  { name: "Coral", hex: "#d9533f", ink: "light" },
  { name: "Ocean", hex: "#2c6690", ink: "light" },
  { name: "Sage", hex: "#8fb596", ink: "dark" },
  { name: "Ink", hex: "#26292a", ink: "light" },
  { name: "Plum", hex: "#7a4f80", ink: "light" },
];

export const BASIC_COLORS: ChipColor[] = [
  { name: "White", hex: "#f4f1ea", ink: "dark" },
  { name: "Red", hex: "#cf3a2f", ink: "light" },
  { name: "Blue", hex: "#2459a8", ink: "light" },
  { name: "Green", hex: "#2f8a4e", ink: "light" },
  { name: "Black", hex: "#1f2222", ink: "light" },
  { name: "Yellow", hex: "#e9bb25", ink: "dark" },
  { name: "Orange", hex: "#e8742a", ink: "dark" },
  { name: "Purple", hex: "#6e3f9e", ink: "light" },
  { name: "Pink", hex: "#e883ab", ink: "dark" },
  { name: "Light blue", hex: "#72b6de", ink: "dark" },
  { name: "Gray", hex: "#8b908d", ink: "light" },
  { name: "Brown", hex: "#7a4a2c", ink: "light" },
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
  const candidates = [];

  for (let start = 0; start <= NICE_VALUES.length - denominations; start += 1) {
    const values = NICE_VALUES.slice(start, start + denominations);
    const counts = improveCounts(values, initial, target);
    const total = totalValue(values, counts);
    const drift = counts.reduce((sum, count, i) => sum + Math.abs(count - initial[i]), 0);
    candidates.push({ values, counts, total, distance: Math.abs(target - total), drift });
  }

  // Near-ties on total go to the stack whose smallest pile is largest (so players can make
  // change), then to the one closest to the small-chip curve.
  const closest = Math.min(...candidates.map((candidate) => candidate.distance));
  const tolerance = Math.max(closest, target * 0.03);
  return candidates
    .filter((candidate) => candidate.distance <= tolerance)
    .sort(
      (a, b) =>
        Math.min(...b.counts) - Math.min(...a.counts) ||
        a.drift - b.drift ||
        a.distance - b.distance,
    )[0];
}

function exactPlan(chips: number, denominations: number, target: number) {
  if (denominations === 1) {
    const value = Math.max(1, Math.round(target / chips));
    return {
      values: [value],
      counts: [chips],
      total: value * chips,
    };
  }

  let best:
    | { values: number[]; counts: number[]; total: number; score: number }
    | undefined;

  for (let start = 0; start <= NICE_VALUES.length - denominations; start += 1) {
    const baseValues = NICE_VALUES.slice(start, start + denominations);
    const initialCounts = distribute(chips, denominations);
    const highestIndex = denominations - 1;

    for (let highCount = 1; highCount <= initialCounts[highestIndex]; highCount += 1) {
      const counts = [...initialCounts];
      const moved = counts[highestIndex] - highCount;
      counts[0] += moved;
      counts[highestIndex] = highCount;
      const lowerTotal = baseValues
        .slice(0, highestIndex)
        .reduce((sum, value, index) => sum + value * counts[index], 0);
      const remainder = target - lowerTotal;
      if (remainder <= 0 || remainder % highCount !== 0) continue;
      const highest = remainder / highCount;
      if (highest < baseValues[highestIndex - 1]) continue;

      const values = [...baseValues];
      values[highestIndex] = highest;
      const jump = highest / baseValues[highestIndex - 1];
      const score = Math.abs(Math.log(jump / 2.5)) + moved * 0.08;
      if (!best || score < best.score) {
        best = { values, counts, total: target, score };
      }
    }
  }

  return best ?? cleanPlan(chips, denominations, target);
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

  const colorGroups: ChipColor[][] = Array.from(
    { length: denominations },
    () => [],
  );
  const chipColors = raw.palette?.length === CHIP_COLORS.length ? raw.palette : CHIP_COLORS;
  chipColors.slice(0, availableColors).forEach((color, index) => {
    colorGroups[Math.min(index, denominations - 1)].push(color);
  });

  const stacks = solution.values.map((value, index) => {
    const palette = colorGroups[index].length
      ? colorGroups[index]
      : [chipColors[index % chipColors.length]];
    const count = solution.counts[index];
    return {
      value: value / 100,
      count,
      colors: palette.map((color) => color.name),
      colorHex: palette[0].hex,
      ink: palette[0].ink,
      palette,
      chipShare: count / chipsPerPlayer,
      valueShare: (value * count) / solution.total,
    };
  });
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
