"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import type { LandingSnippet } from "./snippet-data";

const LANG_COLORS: Record<string, string> = {
  typescript: "#3b82f6",
  python: "#facc15",
  rust: "#fb923c",
  sql: "#a78bfa",
  bash: "#4ade80",
};

// repulsion radius in NDC (0–2 range), and max push strength in NDC
const REPEL_RADIUS = 0.52;
const REPEL_MAX_NDC = 0.09;

type Props = {
  snippet: LandingSnippet;
  position: [number, number, number];
  rotation: [number, number, number];
  baseOpacity: number;
  mouseRef: { current: { x: number; y: number } };
  cardIndex: number;
  sharedGroupRefs: { current: (THREE.Group | null)[] };
};

export function FloatingSnippet({
  snippet,
  position,
  rotation,
  baseOpacity,
  mouseRef,
  cardIndex,
  sharedGroupRefs,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const divRef = useRef<HTMLDivElement>(null);
  // cached vector, avoids GC allocation every frame
  const projVec = useRef(new THREE.Vector3());
  const targetScaleRef = useRef(1);
  const [expanded, setExpanded] = useState(false);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeColor = LANG_COLORS[snippet.lang] ?? "#71717a";

  useFrame((state) => {
    if (!groupRef.current) return;

    // project home position → NDC
    projVec.current.set(position[0], position[1], position[2]);
    projVec.current.project(state.camera);

    // mouse in NDC (-1..1)
    const mx = (mouseRef.current.x / window.innerWidth) * 2 - 1;
    const my = -((mouseRef.current.y / window.innerHeight) * 2 - 1);

    // vector from mouse to card in NDC
    const dx = projVec.current.x - mx;
    const dy = projVec.current.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // repulsion (only when not expanded)
    let targetX = position[0];
    let targetY = position[1];
    if (!expanded) {
      const falloff = Math.max(0, 1 - dist / REPEL_RADIUS);
      const invDist = dist > 0.001 ? 1 / dist : 0;
      const repelNdcX = dx * invDist * falloff * REPEL_MAX_NDC;
      const repelNdcY = dy * invDist * falloff * REPEL_MAX_NDC;

      // convert NDC offset to world offset @ z-index
      const cam = state.camera as THREE.PerspectiveCamera;
      const camDist = Math.abs(position[2] - state.camera.position.z);
      const halfW = Math.tan((cam.fov * Math.PI) / 360) * camDist * cam.aspect;
      const halfH = Math.tan((cam.fov * Math.PI) / 360) * camDist;

      targetX = position[0] + repelNdcX * halfW;
      targetY = position[1] + repelNdcY * halfH;
    }

    // smooth lerp position
    groupRef.current.position.x +=
      (targetX - groupRef.current.position.x) * 0.06;
    groupRef.current.position.y +=
      (targetY - groupRef.current.position.y) * 0.06;

    // smooth lerp scale (expand on click)
    const curScale = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(
      curScale + (targetScaleRef.current - curScale) * 0.1
    );

    // brightness based on distance
    if (divRef.current) {
      const d = Math.abs(position[2] - state.camera.position.z);
      const dynamic = Math.max(0.06, 1 - Math.max(0, d - 13) * 0.08);
      divRef.current.style.opacity = String(Math.min(baseOpacity, dynamic));
    }
  });

  const handleClick = () => {
    const next = !expanded;
    setExpanded(next);
    targetScaleRef.current = next ? 1.65 : 1;

    // auto-collapse after 4 seconds
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    if (next) {
      expandTimerRef.current = setTimeout(() => {
        setExpanded(false);
        targetScaleRef.current = 1;
      }, 4000);
    }
  };

  return (
    <Float speed={0.45} rotationIntensity={0.05} floatIntensity={0.12}>
      <group
          ref={(el) => {
            groupRef.current = el!;
            sharedGroupRefs.current[cardIndex] = el;
          }}
          position={position}
          rotation={rotation}
        >
        <Html
          transform
          scale={0.3}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16, 0]}
        >
          <div
            ref={divRef}
            className="landing-3d-card"
            style={{
              opacity: baseOpacity,
              pointerEvents: "auto",
              cursor: "pointer",
              transition: "box-shadow 0.2s",
              boxShadow: expanded
                ? "0 0 32px 4px #6366f155, 0 2px 24px #0008"
                : undefined,
            }}
            onClick={handleClick}
          >
            <div className="l3c-header">
              <span className="l3c-title">{snippet.title}</span>
              <span
                className="l3c-badge"
                style={{
                  color: badgeColor,
                  borderColor: badgeColor + "55",
                  backgroundColor: badgeColor + "14",
                }}
              >
                {snippet.lang}
              </span>
            </div>
            <div
              className="l3c-code"
              dangerouslySetInnerHTML={{ __html: snippet.html }}
            />
          </div>
        </Html>
      </group>
    </Float>
  );
}
