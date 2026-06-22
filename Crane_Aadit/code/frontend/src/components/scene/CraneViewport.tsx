import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import { ContainerYard } from "./ContainerYard";
import { GantryCraneModel } from "./GantryCraneModel";
import { SceneLighting, ScenePostProcessing } from "./SceneEnvironment";
import type { CraneTelemetryState } from "./types";

interface Props {
  telemetry: CraneTelemetryState;
}

function SceneContent({ telemetry }: Props) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[7, 5.5, 9]} fov={40} near={0.1} far={100} />
      <SceneLighting />
      <ContainerYard />
      <GantryCraneModel telemetry={telemetry} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={24}
        blur={2.5}
        far={12}
        color="#000000"
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={7}
        maxDistance={20}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3.2, 0]}
        autoRotate
        autoRotateSpeed={0.35}
      />
      <ScenePostProcessing />
    </>
  );
}

export function CraneViewport({ telemetry }: Props) {
  return (
    <div className="viewport">
      <div className="viewport__canvas-wrap">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <SceneContent telemetry={telemetry} />
          </Suspense>
        </Canvas>
      </div>
      <div className="viewport__vignette" aria-hidden />
      <div className="viewport__scanline" aria-hidden />
    </div>
  );
}
