import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface HarmonicScene3DProps {
  currentStep: number;
  rowCount: number;
  width: number;
  height: number;
  isFollowEnabled: boolean;
  isTailEnabled: boolean;
}

export const HarmonicScene3D: React.FC<HarmonicScene3DProps> = ({
  currentStep,
  rowCount,
  width,
  height,
  isFollowEnabled,
  isTailEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    instancedMesh: THREE.InstancedMesh;
    grid: THREE.GridHelper;
    pointLight: THREE.PointLight;
  } | null>(null);

  // Layout Constants
  const laneWidth = 12;
  const laneSpacing = 4;
  const maxBlocksPerRow = isTailEnabled ? 40 : 1;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070709);
    scene.fog = new THREE.FogExp2(0x070709, 0.01);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(2, 0.8, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0x111111,
      metalness: 0.9,
      roughness: 0.1
    });

    const maxInstances = (rowCount + 1) * maxBlocksPerRow;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    scene.add(instancedMesh);

    const grid = new THREE.GridHelper(2000, 100, 0x1d1d21, 0x1d1d21);
    grid.position.y = -1;
    scene.add(grid);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 50, 150);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    sceneRef.current = { scene, camera, renderer, instancedMesh, grid, pointLight };

    return () => {
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [rowCount, maxBlocksPerRow]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.renderer.setSize(width, height);
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
    }
  }, [width, height]);

  useEffect(() => {
    const update = () => {
      if (!sceneRef.current) return;
      const { scene, camera, renderer, instancedMesh, grid, pointLight } = sceneRef.current;

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      let instanceIdx = 0;

      const N = currentStep;
      const transitionWidth = 0.5;

      for (let v = 1; v <= rowCount + 1; v++) {
        const movementValue = v === 1 ? 1 : v - 1;
        const curCount = Math.floor(N / movementValue);
        const nextTrig = (curCount + 1) * movementValue;
        const dist = nextTrig - N;
        
        let animatedCount = curCount;
        if (dist < transitionWidth) {
          const t = 1 - (dist / transitionWidth);
          const easedT = t * t * (3 - 2 * t);
          animatedCount = curCount + easedT;
        }

        const hue = (movementValue * 137.5) % 360;
        color.setHSL(hue / 360, 0.7, 0.6);

        const blocksToShow = isTailEnabled ? maxBlocksPerRow : 1;
        for (let k = 0; k < blocksToShow; k++) {
          const blockCount = animatedCount - k;
          if (blockCount < 0) break;

          const x = blockCount * laneWidth;
          const y = (v - 1) * -laneSpacing;
          const z = 0;

          dummy.position.set(x, 0, y);
          dummy.scale.set(1, 1, 1);
          if (k > 0) {
            dummy.scale.multiplyScalar(Math.max(0.1, 1 - k / blocksToShow));
          }
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(instanceIdx, dummy.matrix);
          instancedMesh.setColorAt(instanceIdx, color);
          instanceIdx++;
        }
      }

      instancedMesh.count = instanceIdx;
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      // Track leader (v=1)
      const curCountL = Math.floor(N);
      const distL = (curCountL + 1) - N;
      let animCountL = curCountL;
      if (distL < transitionWidth) {
        const t = 1 - (distL / transitionWidth);
        const easedT = t * t * (3 - 2 * t);
        animCountL = curCountL + easedT;
      }
      const focusX = animCountL * laneWidth;

      if (isFollowEnabled) {
        camera.position.x = focusX - 40;
        camera.position.y = 25;
        camera.position.z = 25;
        camera.lookAt(focusX + 10, -rowCount * laneSpacing * 0.2, -rowCount * laneSpacing * 0.5);
      } else {
        camera.position.set(-50, 60, 60);
        camera.lookAt(focusX, 0, -rowCount * laneSpacing * 0.5);
      }

      pointLight.position.x = focusX;
      grid.position.x = Math.floor(focusX / 40) * 40;

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [currentStep, rowCount, isFollowEnabled, isTailEnabled]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};