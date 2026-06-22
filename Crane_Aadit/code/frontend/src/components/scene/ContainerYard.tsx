import { useMemo } from "react";
import * as THREE from "three";

const CONTAINER_COLORS = ["#1a2744", "#243352", "#2d3f5c", "#ffffff", "#e8ecf0"];

function ContainerStack({ position, count, color }: { position: [number, number, number]; count: number; color: string }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0.65 + i * 1.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 1.2, 1.1]} />
          <meshStandardMaterial
            color={color}
            metalness={0.65}
            roughness={0.35}
            envMapIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ContainerYard() {
  const stacks = useMemo(() => {
    const items: { pos: [number, number, number]; count: number; color: string }[] = [];
    for (let x = -8; x <= 8; x += 2.8) {
      for (let z = -6; z <= 2; z += 2.2) {
        if (Math.abs(x) < 3 && z > -2) continue;
        items.push({
          pos: [x, 0, z],
          count: 1 + Math.floor(Math.random() * 3),
          color: CONTAINER_COLORS[Math.floor(Math.random() * CONTAINER_COLORS.length)],
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.2} roughness={0.85} />
      </mesh>
      <gridHelper args={[40, 40, "#1a2332", "#121820"]} position={[0, 0.02, 0]} />
      {stacks.map((s, i) => (
        <ContainerStack key={i} position={s.pos} count={s.count} color={s.color} />
      ))}
    </group>
  );
}

export function LiftedContainer() {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.25, 1.15]} />
        <meshStandardMaterial
          color="#0551ef"
          metalness={0.75}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Ribbed detail lines */}
      {[-0.4, 0, 0.4].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[2.48, 1.23, 0.02]} />
          <meshStandardMaterial color="#0446c4" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Wireframe highlight */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.52, 1.27, 1.17)]} />
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}
