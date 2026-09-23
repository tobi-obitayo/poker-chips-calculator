"use client";

import { Component, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { PokerSceneProps } from "@/components/poker-scene";

function TableLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="liquid-glass flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-ink/70">
        <span className="loading-chip" />
        Setting the table…
      </div>
    </div>
  );
}

const PokerScene = dynamic(() => import("@/components/poker-scene"), {
  ssr: false,
  loading: TableLoading,
});

function TableUnavailable() {
  return (
    <div className="absolute inset-0 grid place-items-center px-6">
      <div className="liquid-glass max-w-sm rounded-3xl p-6 text-center">
        <p className="text-base font-semibold text-ink">3D table unavailable</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          This browser couldn&apos;t start WebGL. Your chip breakdown is still listed below.
        </p>
      </div>
    </div>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <TableUnavailable /> : this.props.children;
  }
}

let webglSupport: boolean | undefined;

function detectWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const subscribe = () => () => {};

export function TableStage(props: PokerSceneProps) {
  const webgl = useSyncExternalStore(subscribe, detectWebGL, () => true);

  if (!webgl) return <TableUnavailable />;

  return (
    <SceneBoundary>
      <PokerScene {...props} />
    </SceneBoundary>
  );
}
