import { Environment, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function SceneLighting() {
  return (
    <>
      <color attach="background" args={["#060708"]} />
      <fog attach="fog" args={["#060708", 18, 45]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#0551ef" />
      <pointLight position={[0, 8, 4]} intensity={0.6} color="#eeff53" distance={20} />
      <spotLight
        position={[0, 12, 0]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.8}
        castShadow
        color="#ffffff"
      />
      <Environment preset="night" />
      <Stars radius={80} depth={40} count={800} factor={3} saturation={0} fade speed={0.3} />
    </>
  );
}

export function ScenePostProcessing() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.015}
        bokehScale={3}
        height={480}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.65} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
