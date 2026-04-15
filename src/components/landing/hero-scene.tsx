"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { FloatingSnippet } from "./floating-snippet";
import { ConstellationLines } from "./constellation-lines";
import { ParticleField } from "./particle-field";
import { LANDING_SNIPPETS } from "./snippet-data";

type CardDef = {
  snippet: (typeof LANDING_SNIPPETS)[number];
  position: [number, number, number];
  rotation: [number, number, number];
  baseOpacity: number;
};

/**
 * grid-based card placement with jitter
 */
function generateCards(count: number): CardDef[] {
  const layers = [
    { zMin: -2,  zMax: -8,  opacity: 0.92, frac: 0.27, xSpread: 22, ySpread: 10, xGap: 5.5 },
    { zMin: -9,  zMax: -17, opacity: 0.70, frac: 0.36, xSpread: 22, ySpread: 13, xGap: 0 },
    { zMin: -18, zMax: -26, opacity: 0.32, frac: 0.37, xSpread: 26, ySpread: 15, xGap: 0 },
  ];

  const snippets = [...LANDING_SNIPPETS].sort(() => Math.random() - 0.5);
  let snippetIdx = 0;
  const cards: CardDef[] = [];

  for (const layer of layers) {
    const n = Math.max(1, Math.round(count * layer.frac));
    const cols = Math.ceil(Math.sqrt(n * 1.6));
    const rows = Math.ceil(n / cols);
    const cellW = layer.xSpread / Math.max(cols - 1, 1);
    const cellH = layer.ySpread / Math.max(rows - 1, 1);

    const pts: [number, number][] = [];
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pts.length >= n) break outer;
        const xBase = cols > 1 ? (c / (cols - 1) - 0.5) * layer.xSpread : 0;
        const yBase = rows > 1 ? (r / (rows - 1) - 0.5) * layer.ySpread : 0;
        // skip center column for front layer to avoid hero text overlap
        if (layer.xGap > 0 && Math.abs(xBase) < layer.xGap) continue;
        pts.push([
          xBase + (Math.random() - 0.5) * cellW * 0.65,
          yBase + (Math.random() - 0.5) * cellH * 0.65,
        ]);
      }
    }

    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }

    for (let i = 0; i < pts.length; i++) {
      const z = layer.zMin + Math.random() * (layer.zMax - layer.zMin);
      cards.push({
        snippet: snippets[snippetIdx++ % snippets.length],
        position: [pts[i][0], pts[i][1], z] as [number, number, number],
        rotation: [
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.06,
        ] as [number, number, number],
        baseOpacity: layer.opacity,
      });
    }
  }

  return cards.slice(0, count);
}

function SceneContent({ cardCount }: { cardCount: number }) {
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cards = useMemo(() => generateCards(cardCount), [cardCount]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    state.camera.position.z -= 0.0018;
  });

  return (
    <>
      <color attach="background" args={["#09090b"]} />

      {cards.map((card, i) => (
        <FloatingSnippet
          key={i}
          {...card}
          mouseRef={mouseRef}
          cardIndex={i}
          sharedGroupRefs={groupRefs}
        />
      ))}

      <ConstellationLines
        initialPositions={cards.map((c) => c.position)}
        groupRefs={groupRefs}
      />

      <ParticleField mouseRef={mouseRef} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.65}
          luminanceSmoothing={0.85}
          intensity={0.55}
        />
      </EffectComposer>
    </>
  );
}

export function HeroScene() {
  const [cardCount] = useState(() => {
    if (typeof window === "undefined") return 22;
    const mobile = window.innerWidth < 768;
    const lowEnd =
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4;
    return mobile || lowEnd ? 10 : 22;
  });

  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 62 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent cardCount={cardCount} />
    </Canvas>
  );
}
