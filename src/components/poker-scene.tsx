"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { motion } from "motion/react";
import * as THREE from "three";
import { formatMoney, type ChipColor, type ChipPlan, type ChipStack } from "@/lib/chip-plan";

const CHIP_R = 0.2;
const CHIP_H = 0.042;
const FELT_A = 1.7;
const FELT_R = 1.6;
const MAX_HERO_CHIPS = 18;

export type PokerSceneProps = {
  plan: ChipPlan;
  players: number;
  dealKey: number;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
};

function seeded(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBounce(t: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const x = t - 1.5 / d1;
    return n1 * x * x + 0.75;
  }
  if (t < 2.5 / d1) {
    const x = t - 2.25 / d1;
    return n1 * x * x + 0.9375;
  }
  const x = t - 2.625 / d1;
  return n1 * x * x + 0.984375;
}

function traceStadium<T extends THREE.Path>(path: T, a: number, r: number) {
  path.moveTo(-a, -r);
  path.lineTo(a, -r);
  path.absarc(a, 0, r, -Math.PI / 2, Math.PI / 2, false);
  path.lineTo(-a, r);
  path.absarc(-a, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return path;
}

// Walks the stadium perimeter by arc length, starting at the near-side center (+z).
function stadiumPoint(a: number, r: number, t: number) {
  const arc = Math.PI * r;
  const perimeter = 4 * a + 2 * arc;
  let s = (((t % 1) + 1) % 1) * perimeter;
  if (s < a) return { x: s, z: r, tx: 1, tz: 0 };
  s -= a;
  if (s < arc) {
    const b = Math.PI / 2 - s / r;
    return { x: a + r * Math.cos(b), z: r * Math.sin(b), tx: Math.sin(b), tz: -Math.cos(b) };
  }
  s -= arc;
  if (s < 2 * a) return { x: a - s, z: -r, tx: -1, tz: 0 };
  s -= 2 * a;
  if (s < arc) {
    const b = -Math.PI / 2 - s / r;
    return { x: -a + r * Math.cos(b), z: r * Math.sin(b), tx: Math.sin(b), tz: -Math.cos(b) };
  }
  s -= arc;
  return { x: -a + s, z: r, tx: 1, tz: 0 };
}

function makeFeltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const g = canvas.getContext("2d")!;

  const light = g.createRadialGradient(512, 250, 20, 512, 256, 640);
  light.addColorStop(0, "#4f9d77");
  light.addColorStop(0.42, "#2e7053");
  light.addColorStop(1, "#0f3325");
  g.fillStyle = light;
  g.fillRect(0, 0, 1024, 512);

  const image = g.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = (seeded(i * 0.37) - 0.5) * 16;
    image.data[i] += grain;
    image.data[i + 1] += grain;
    image.data[i + 2] += grain;
  }
  g.putImageData(image, 0, 0);

  g.strokeStyle = "rgba(242, 232, 204, 0.2)";
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(118, 96, 788, 320, 160);
  g.stroke();

  g.fillStyle = "rgba(242, 232, 204, 0.13)";
  g.font = "700 40px system-ui, -apple-system, Helvetica, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("S  T  A  C  K  E  D", 512, 162);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function insertColor(color: ChipColor) {
  return color.ink === "dark" ? "#b0412f" : "#f7f2e5";
}

function makeChipSideTexture(color: ChipColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const g = canvas.getContext("2d")!;
  g.fillStyle = color.hex;
  g.fillRect(0, 0, 512, 64);
  for (let k = 0; k < 8; k += 1) {
    const x = k * 64 + 16;
    g.fillStyle = insertColor(color);
    g.fillRect(x, 6, 32, 52);
    g.fillStyle = color.hex;
    g.fillRect(x + 9, 6, 4, 52);
    g.fillRect(x + 19, 6, 4, 52);
  }
  g.fillStyle = "rgba(0, 0, 0, 0.2)";
  g.fillRect(0, 0, 512, 5);
  g.fillRect(0, 59, 512, 5);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeChipFaceTexture(color: ChipColor, label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = color.hex;
  g.fillRect(0, 0, 256, 256);

  g.strokeStyle = insertColor(color);
  g.lineWidth = 22;
  for (let k = 0; k < 8; k += 1) {
    g.beginPath();
    g.arc(128, 128, 114, k * (Math.PI / 4) + 0.1, k * (Math.PI / 4) + Math.PI / 8 + 0.1);
    g.stroke();
  }

  g.fillStyle = color.ink === "dark" ? "#e2d5b6" : "rgba(250, 246, 236, 0.95)";
  g.beginPath();
  g.arc(128, 128, 74, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = color.hex;
  g.lineWidth = 3;
  g.setLineDash([6, 6]);
  g.beginPath();
  g.arc(128, 128, 64, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);

  const size = label.length <= 3 ? 58 : label.length <= 5 ? 44 : 34;
  g.fillStyle = color.ink === "dark" ? "#3b342b" : color.hex;
  g.font = `800 ${size}px system-ui, -apple-system, Helvetica, Arial, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(label, 128, 132);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function materialKey(color: ChipColor, value: number) {
  return `${color.hex}|${value}`;
}

function useChipMaterials(stacks: ChipStack[]) {
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial[]>();
    stacks.forEach((stack) => {
      stack.palette.forEach((color) => {
        const key = materialKey(color, stack.value);
        if (map.has(key)) return;
        const side = new THREE.MeshStandardMaterial({
          map: makeChipSideTexture(color),
          roughness: 0.55,
        });
        const face = new THREE.MeshStandardMaterial({
          map: makeChipFaceTexture(color, formatMoney(stack.value)),
          roughness: 0.42,
        });
        map.set(key, [side, face, face]);
      });
    });
    return map;
  }, [stacks]);

  useEffect(
    () => () => {
      materials.forEach((list) => {
        new Set(list).forEach((material) => {
          material.map?.dispose();
          material.dispose();
        });
      });
    },
    [materials],
  );

  return materials;
}

function ChipTooltip({ stack }: { stack: ChipStack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="chip-tooltip pointer-events-none w-56 rounded-2xl p-3.5 text-paper"
    >
      <div className="flex items-center gap-2.5">
        <span className="ui-chip ui-chip-sm" style={{ "--chip": stack.colorHex } as CSSProperties} />
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/50">
            {stack.colors.join(" + ")}
          </p>
          <p className="text-lg font-semibold leading-tight tracking-tight">{formatMoney(stack.value)} chip</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-white/8 p-2 text-center">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-paper/45">Count</p>
          <p className="text-sm font-semibold tabular-nums">×{stack.count}</p>
        </div>
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-paper/45">Of chips</p>
          <p className="text-sm font-semibold tabular-nums">{Math.round(stack.chipShare * 100)}%</p>
        </div>
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-paper/45">Of value</p>
          <p className="text-sm font-semibold tabular-nums">{Math.round(stack.valueShare * 100)}%</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-paper/55">Per player</span>
        <span className="font-semibold tabular-nums">{formatMoney(stack.value * stack.count)}</span>
      </div>
    </motion.div>
  );
}

function ChipStack3D({
  stack,
  materials,
  geometry,
  visibleCount,
  delay,
  position,
  rotationY = 0,
  scale = 1,
  seed,
  interactive = false,
  active = false,
  onHover,
  onSelect,
}: {
  stack: ChipStack;
  materials: Map<string, THREE.MeshStandardMaterial[]>;
  geometry: THREE.CylinderGeometry;
  visibleCount: number;
  delay: number;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  seed: number;
  interactive?: boolean;
  active?: boolean;
  onHover?: (hovering: boolean) => void;
  onSelect?: () => void;
}) {
  const chipRefs = useRef<(THREE.Mesh | null)[]>([]);
  const start = useRef<number | null>(null);
  const lift = useRef(0);
  const height = visibleCount * CHIP_H;

  const chips = useMemo(
    () =>
      Array.from({ length: visibleCount }, (_, i) => {
        const color = stack.palette[i % stack.palette.length];
        return {
          material: materials.get(materialKey(color, stack.value)),
          spin: Math.PI / 2 + (seeded(seed + i) - 0.5) * 0.4,
          dx: (seeded(seed + i * 3.1) - 0.5) * 0.014,
          dz: (seeded(seed + i * 7.3) - 0.5) * 0.014,
        };
      }),
    [materials, seed, stack, visibleCount],
  );

  useFrame(({ clock }, delta) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    lift.current = THREE.MathUtils.damp(lift.current, active ? 1 : 0, 9, delta);

    chipRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const local = t - delay - i * 0.045;
      const landed = easeOutBounce(Math.min(1, Math.max(0, local / 0.62)));
      const rest = CHIP_H / 2 + i * (CHIP_H + 0.024 * lift.current) + 0.16 * lift.current;
      mesh.visible = local > 0;
      mesh.position.y = rest + (1 - landed) * (1.8 + i * 0.03);
      mesh.rotation.z = (1 - landed) * 0.55 * (i % 2 ? 1 : -1);
    });
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {chips.map((chip, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            chipRefs.current[i] = mesh;
          }}
          geometry={geometry}
          material={chip.material}
          position={[chip.dx, CHIP_H / 2 + i * CHIP_H, chip.dz]}
          rotation={[0, chip.spin, 0]}
          visible={false}
          castShadow
          receiveShadow
        />
      ))}

      {interactive && (
        <mesh
          position={[0, (height + 0.3) / 2, 0]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover?.(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            onHover?.(false);
            document.body.style.cursor = "";
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.();
          }}
        >
          <cylinderGeometry args={[CHIP_R + 0.06, CHIP_R + 0.06, height + 0.3, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {interactive && active && (
        <Html
          position={[0, height + 0.5, 0]}
          center
          zIndexRange={[40, 0]}
          style={{ pointerEvents: "none" }}
        >
          <ChipTooltip stack={stack} />
        </Html>
      )}
    </group>
  );
}

function TableModel({
  plan,
  players,
  rotationY,
  materials,
  chipGeometry,
  seatDelay,
  dealKey,
}: {
  plan: ChipPlan;
  players: number;
  rotationY: number;
  materials: Map<string, THREE.MeshStandardMaterial[]>;
  chipGeometry: THREE.CylinderGeometry;
  seatDelay: number;
  dealKey: number;
}) {
  const group = useRef<THREE.Group>(null);
  const intro = useRef<number | null>(null);

  const parts = useMemo(() => {
    const felt = new THREE.ShapeGeometry(traceStadium(new THREE.Shape(), FELT_A, FELT_R + 0.04), 64);
    const uv = felt.attributes.uv;
    const pos = felt.attributes.position;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(
        i,
        (pos.getX(i) + FELT_A + FELT_R) / (2 * (FELT_A + FELT_R)),
        (pos.getY(i) + FELT_R) / (2 * FELT_R),
      );
    }
    felt.rotateX(-Math.PI / 2);

    const railShape = traceStadium(new THREE.Shape(), FELT_A, FELT_R + 0.36);
    railShape.holes.push(traceStadium(new THREE.Path(), FELT_A, FELT_R - 0.02));
    const rail = new THREE.ExtrudeGeometry(railShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.1,
      bevelSegments: 10,
      curveSegments: 72,
    });
    rail.rotateX(-Math.PI / 2);

    const apron = new THREE.ExtrudeGeometry(traceStadium(new THREE.Shape(), FELT_A, FELT_R + 0.46), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 4,
      curveSegments: 72,
    });
    apron.rotateX(-Math.PI / 2);

    const bed = new THREE.ExtrudeGeometry(traceStadium(new THREE.Shape(), FELT_A, FELT_R + 0.1), {
      depth: 0.16,
      bevelEnabled: false,
      curveSegments: 72,
    });
    bed.rotateX(-Math.PI / 2);

    return { felt, rail, apron, bed, feltMap: makeFeltTexture() };
  }, []);

  useEffect(
    () => () => {
      parts.felt.dispose();
      parts.rail.dispose();
      parts.apron.dispose();
      parts.bed.dispose();
      parts.feltMap.dispose();
    },
    [parts],
  );

  const seats = useMemo(
    () =>
      Array.from({ length: players }, (_, k) => {
        const t = (k + 0.5) / players;
        return {
          label: stadiumPoint(FELT_A, FELT_R + 0.82, t),
          stack: stadiumPoint(FELT_A, FELT_R - 0.52, t),
          cup: stadiumPoint(FELT_A, FELT_R + 0.17, t + 0.5 / players),
        };
      }),
    [players],
  );
  const dealer = stadiumPoint(FELT_A, FELT_R - 0.52, 1 / players);

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (intro.current === null) intro.current = clock.elapsedTime;
    const p = easeOutCubic(Math.min(1, (clock.elapsedTime - intro.current) / 1.5));
    group.current.position.y = -0.7 * (1 - p);
    group.current.rotation.y = rotationY - 0.45 * (1 - p);
    group.current.scale.setScalar(0.86 + 0.14 * p);
  });

  const seatStackSpacing = 0.29 * Math.min(1, 5 / Math.max(plan.stacks.length, 1));

  return (
    <group ref={group} rotation={[0, rotationY, 0]}>
      <mesh geometry={parts.bed} position={[0, -0.17, 0]} receiveShadow>
        <meshStandardMaterial color="#123526" roughness={1} />
      </mesh>
      <mesh geometry={parts.felt} position={[0, 0.002, 0]} receiveShadow>
        <meshStandardMaterial map={parts.feltMap} roughness={0.96} />
      </mesh>
      <mesh geometry={parts.rail} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#2a1e19"
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.45}
          sheen={0.4}
          sheenColor="#6b4a3a"
        />
      </mesh>
      <mesh geometry={parts.apron} position={[0, -0.24, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#6a4029" roughness={0.38} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>

      <mesh position={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.78, 1.05, 48]} />
        <meshPhysicalMaterial color="#3d2519" roughness={0.4} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, -1.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.45, 0.1, 64]} />
        <meshPhysicalMaterial color="#2e1c13" roughness={0.45} clearcoat={0.4} />
      </mesh>

      {seats.map((seat, k) => (
        <group key={k}>
          <group position={[seat.cup.x, 0.312, seat.cup.z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.1, 0.016, 12, 36]} />
              <meshStandardMaterial color="#c9c4bb" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.004, 0]}>
              <cylinderGeometry args={[0.092, 0.092, 0.006, 32]} />
              <meshStandardMaterial color="#121212" roughness={0.7} />
            </mesh>
          </group>

          <group key={`seat-stacks-${dealKey}`}>
            {plan.stacks.map((stack, j) => {
              const offset = (j - (plan.stacks.length - 1) / 2) * seatStackSpacing;
              return (
                <ChipStack3D
                  key={`${stack.value}-${j}`}
                  stack={stack}
                  materials={materials}
                  geometry={chipGeometry}
                  visibleCount={Math.min(6, Math.max(1, Math.ceil(stack.count / 3)))}
                  delay={seatDelay + k * 0.14 + j * 0.035}
                  position={[seat.stack.x + seat.stack.tx * offset, 0, seat.stack.z + seat.stack.tz * offset]}
                  rotationY={Math.atan2(-seat.stack.tz, seat.stack.tx)}
                  scale={0.62}
                  seed={k * 31 + j * 7}
                />
              );
            })}
          </group>

          <Html position={[seat.label.x, 0.34, seat.label.z]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
            <div className="seat-pill">P{k + 1}</div>
          </Html>
        </group>
      ))}

      <group position={[dealer.x, 0.02, dealer.z]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.035, 40]} />
          <meshStandardMaterial color="#f6f1e6" roughness={0.35} />
        </mesh>
        <Html position={[0, 0.03, 0]} center transform rotation={[-Math.PI / 2, 0, 0]} scale={0.1} style={{ pointerEvents: "none" }}>
          <span className="text-[11px] font-extrabold tracking-[0.12em] text-ink">D</span>
        </Html>
      </group>
    </group>
  );
}

function CameraRig({ distance, fov }: { distance: number; fov: number }) {
  const getState = useThree((state) => state.get);
  const controlsReady = useThree((state) => Boolean(state.controls));

  useEffect(() => {
    const state = getState();
    const camera = state.camera as THREE.PerspectiveCamera;
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    const direction = new THREE.Vector3(0, 0.76, 0.65).normalize();
    camera.position.copy(direction.multiplyScalar(distance));
    camera.fov = fov;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(0, -0.2, 0);
      controls.update();
    } else {
      camera.lookAt(0, -0.2, 0);
    }
  }, [getState, controlsReady, distance, fov]);

  return null;
}

function SceneContents({ plan, players, dealKey, activeIndex, onActiveChange }: PokerSceneProps) {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(size.height, 1);
  const portrait = aspect < 0.9;
  const fov = portrait ? 44 : 34;
  const halfFov = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const distance = portrait
    ? Math.max(9, 2.9 / (halfFov * aspect))
    : Math.max(7.8, 4.7 / (halfFov * aspect));

  const materials = useChipMaterials(plan.stacks);
  const chipGeometry = useMemo(() => new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 48), []);
  useEffect(() => () => chipGeometry.dispose(), [chipGeometry]);

  const heroSpacing = portrait ? 0.47 : 0.6;
  const heroStart = 1.0;
  const heroStep = 0.24;
  const seatDelay = heroStart + plan.stacks.length * heroStep + 0.7;

  return (
    <>
      <CameraRig distance={distance} fov={fov} />
      <ambientLight intensity={0.35} color="#fff4e2" />
      <spotLight
        position={[0.4, 7.5, 1.6]}
        angle={0.62}
        penumbra={0.85}
        intensity={3.2}
        decay={0}
        color="#ffe7c2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.45} color="#c9ddff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 4, 1]} color="#fff1dc" />
        <Lightformer form="rect" intensity={0.9} position={[-5, 1.5, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} color="#dfe9ff" />
        <Lightformer form="rect" intensity={0.7} position={[5, 1.5, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} color="#ffe2c4" />
      </Environment>

      <TableModel
        plan={plan}
        players={players}
        rotationY={portrait ? Math.PI / 2 : 0}
        materials={materials}
        chipGeometry={chipGeometry}
        seatDelay={seatDelay}
        dealKey={dealKey}
      />

      <group key={`hero-${dealKey}`}>
        {plan.stacks.map((stack, i) => (
          <ChipStack3D
            key={`${stack.value}-${i}`}
            stack={stack}
            materials={materials}
            geometry={chipGeometry}
            visibleCount={Math.min(stack.count, MAX_HERO_CHIPS)}
            delay={heroStart + i * heroStep}
            position={[(i - (plan.stacks.length - 1) / 2) * heroSpacing, 0.004, portrait ? 0 : 0.18]}
            seed={i * 101}
            interactive
            active={activeIndex === i}
            onHover={(hovering) => onActiveChange(hovering ? i : null)}
            onSelect={() => onActiveChange(activeIndex === i ? null : i)}
          />
        ))}
      </group>

      <ContactShadows position={[0, -1.42, 0]} scale={14} blur={2.6} opacity={0.42} far={3} resolution={512} color="#2a1d14" />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={distance * 0.72}
        maxDistance={distance * 1.2}
        minPolarAngle={0.3}
        maxPolarAngle={1.12}
        minAzimuthAngle={-0.75}
        maxAzimuthAngle={0.75}
        rotateSpeed={0.55}
      />
    </>
  );
}

export default function PokerScene(props: PokerSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 34, near: 0.1, far: 80, position: [0, 6, 5.2] }}
      onPointerMissed={() => props.onActiveChange(null)}
      className="touch-none"
    >
      <SceneContents {...props} />
    </Canvas>
  );
}
