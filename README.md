# Stacked

Stacked turns a poker buy-in and a box of chips into balanced player stacks, then
deals them onto an interactive 3D poker table.

1. **Set the table**: pick players, buy-in, total chips, and how many chip colors
   you have. You can also allow a close-but-clean buy-in, or let colors share a value.
2. **Deal the chips**: the table animates in and the chips drop onto the felt one
   color at a time, first the reference stack in the center, then a stack at each seat.
3. **Inspect**: hover or tap a center stack (or a chip in the bottom dock) to see its
   count, share of chips, share of value, and per-player total. Drag to orbit.
4. **How it works**: the `?` button explains the three-step algorithm using your numbers.

## The algorithm

1. **Split**: `total chips ÷ players`, rounded down. The remainder stays in the bank.
2. **Weight**: counts start from a 45 / 27 / 16 / 8 / 3 / 1% curve, smallest value first.
3. **Price**:
   - *Close buy-in okay*: try each run of familiar values (1¢, 2¢, 5¢, 10¢, 25¢, 50¢,
     $1, …), move one chip at a time between colors toward the target, and keep the
     closest total. When totals are within 3%, prefer the stack with no tiny piles.
   - *Exact*: keep familiar values for the lower chips and solve the top chip's value
     so the stack equals the buy-in exactly.

Starting blinds are the smallest chip and double that.

## Stack

Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Motion, and React Three Fiber
(`three`, `@react-three/fiber`, `@react-three/drei`). The table, chips, and textures
are generated in code, so there are no external model files. If WebGL is unavailable,
the app shows a fallback message and keeps the chip breakdown.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal.

## Checks

```bash
npm run lint
npm run build
```
