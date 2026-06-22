import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LiftedContainer } from "./ContainerYard";
import { tempToColor, type CraneTelemetryState } from "./types";

interface Props {
  telemetry: CraneTelemetryState;
}

function CraneLeg({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main leg column */}
      <mesh castShadow receiveShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[0.35, 7, 0.35]} />
        <meshStandardMaterial color="#2a3344" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Cross bracing */}
      <mesh position={[0.15, 2, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.08, 2.5, 0.08]} />
        <meshStandardMaterial color="#1e2636" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.16, 1.2]} />
        <meshStandardMaterial color="#151b26" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Wheel bogey */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.9, 0.2, 0.6]} />
        <meshStandardMaterial color="#0f141c" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function MotorHousing({ position, tempRatio, isHot }: { position: [number, number, number]; tempRatio: number; isHot: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const color = tempToColor(tempRatio);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const pulse = isHot ? 0.6 + Math.sin(clock.elapsedTime * 4) * 0.4 : 0.3;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissive.set(color);
    mat.emissiveIntensity = pulse * tempRatio;
    glowRef.current.intensity = isHot ? 2 + Math.sin(clock.elapsedTime * 3) : 0.5;
    glowRef.current.color.set(color);
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.22, 0.25, 0.5, 16]} />
        <meshStandardMaterial color="#1a2230" metalness={0.9} roughness={0.25} emissive="#000000" emissiveIntensity={0} />
      </mesh>
      <pointLight ref={glowRef} distance={3} decay={2} />
      {isHot && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

export function GantryCraneModel({ telemetry }: Props) {
  const trolleyRef = useRef<THREE.Group>(null);
  const spreaderRef = useRef<THREE.Group>(null);
  const hookYRef = useRef(2.8);

  const targetHookY = 4.2 - telemetry.loadRatio * 2.2;
  const trolleyX = Math.sin(performance.now() * 0.0003) * 1.5;

  useFrame(({ clock }) => {
    hookYRef.current = THREE.MathUtils.lerp(hookYRef.current, targetHookY, 0.04);

    if (trolleyRef.current) {
      trolleyRef.current.position.x = THREE.MathUtils.lerp(
        trolleyRef.current.position.x,
        trolleyX,
        0.02,
      );
    }

    if (spreaderRef.current) {
      const vib = telemetry.vibration * 80;
      spreaderRef.current.rotation.z = Math.sin(clock.elapsedTime * 12) * vib * 0.002;
      spreaderRef.current.position.y = hookYRef.current;
      if (trolleyRef.current) {
        spreaderRef.current.position.x = trolleyRef.current.position.x;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <CraneLeg position={[-4.5, 0, 0]} />
      <CraneLeg position={[4.5, 0, 0]} />

      {/* Main girder beam */}
      <mesh castShadow receiveShadow position={[0, 7.2, 0]}>
        <boxGeometry args={[10, 0.5, 0.6]} />
        <meshStandardMaterial color="#3a4556" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Beam underside rail */}
      <mesh position={[0, 6.85, 0]}>
        <boxGeometry args={[9.8, 0.08, 0.15]} />
        <meshStandardMaterial color="#555f70" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Trolley assembly */}
      <group ref={trolleyRef} position={[0, 6.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.35, 0.9]} />
          <meshStandardMaterial color="#252d3a" metalness={0.85} roughness={0.3} />
        </mesh>
        <MotorHousing position={[-0.45, 0.1, 0]} tempRatio={telemetry.tempRatio} isHot={telemetry.isHot} />
        <MotorHousing position={[0.45, 0.1, 0]} tempRatio={telemetry.tempRatio * 0.85} isHot={telemetry.isHot} />

        {/* Hoist drum */}
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.6, 16]} />
          <meshStandardMaterial color="#1a2230" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Cables */}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, -1.5, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 3, 6]} />
            <meshStandardMaterial color="#888" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Spreader + container */}
      <group ref={spreaderRef} position={[0, 2.8, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[2.8, 0.12, 0.4]} />
          <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Corner twist locks */}
        {([-1.2, 1.2] as const).flatMap((x) =>
          ([-0.15, 0.15] as const).map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.08, z]}>
              <boxGeometry args={[0.12, 0.2, 0.12]} />
              <meshStandardMaterial color="#666" metalness={0.9} roughness={0.2} />
            </mesh>
          )),
        )}
        <LiftedContainer />
      </group>

      {/* Status beacon */}
      <mesh position={[0, 7.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={telemetry.isHot ? "#ff6039" : "#53ff59"}
          emissive={telemetry.isHot ? "#ff6039" : "#53ff59"}
          emissiveIntensity={telemetry.isHot ? 2 : 1}
        />
      </mesh>
    </group>
  );
}
