"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 260;

type Props = { mouseRef: { current: { x: number; y: number } } };

export function ParticleField({ mouseRef }: Props) {
  const ref = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = -(Math.random() * 30);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    // drift particles upward
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += 0.0025;
      if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    // subtle whole-field shift toward mouse — gives parallax without camera tilt
    const mx = mouseRef.current.x / window.innerWidth - 0.5;
    const my = mouseRef.current.y / window.innerHeight - 0.5;
    ref.current.position.x += (-mx * 1.2 - ref.current.position.x) * 0.018;
    ref.current.position.y += (my * 0.8 - ref.current.position.y) * 0.018;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#6366f1"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}
