"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const THRESHOLD = 11;

type Props = {
  initialPositions: [number, number, number][];
  groupRefs: React.MutableRefObject<(THREE.Group | null)[]>;
};

export function ConstellationLines({ initialPositions, groupRefs }: Props) {
  const ref = useRef<THREE.LineSegments>(null!);
  const tmpA = useRef(new THREE.Vector3());
  const tmpB = useRef(new THREE.Vector3());

  // build the pair list init
  const pairs = useMemo(() => {
    const result: [number, number][] = [];
    for (let i = 0; i < initialPositions.length; i++) {
      for (let j = i + 1; j < initialPositions.length; j++) {
        const dx = initialPositions[i][0] - initialPositions[j][0];
        const dy = initialPositions[i][1] - initialPositions[j][1];
        const dz = initialPositions[i][2] - initialPositions[j][2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < THRESHOLD) {
          result.push([i, j]);
        }
      }
    }
    return result;
  }, [initialPositions]);

  // pre-allocated geometry
  const geometry = useMemo(() => {
    const verts = new Float32Array(pairs.length * 6); // 2 pts x 3 floats
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    return geo;
  }, [pairs]);

  useFrame((state) => {
    if (!ref.current) return;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;

    for (let k = 0; k < pairs.length; k++) {
      const [i, j] = pairs[k];
      const gi = groupRefs.current[i];
      const gj = groupRefs.current[j];

      if (gi) {
        gi.getWorldPosition(tmpA.current);
      } else {
        tmpA.current.set(...initialPositions[i]);
      }
      if (gj) {
        gj.getWorldPosition(tmpB.current);
      } else {
        tmpB.current.set(...initialPositions[j]);
      }

      pos[k * 6 + 0] = tmpA.current.x;
      pos[k * 6 + 1] = tmpA.current.y;
      pos[k * 6 + 2] = tmpA.current.z;
      pos[k * 6 + 3] = tmpB.current.x;
      pos[k * 6 + 4] = tmpB.current.y;
      pos[k * 6 + 5] = tmpB.current.z;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.13 + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#6366f1" transparent opacity={0.13} />
    </lineSegments>
  );
}
