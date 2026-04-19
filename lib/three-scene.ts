import * as THREE from "three";

const DESKTOP_NODE_COUNT = 140;
const MOBILE_NODE_MULTIPLIER = 0.4;
const NETWORK_RADIUS = 13;
const NETWORK_DEPTH = 11;
const EDGE_THRESHOLD_DESKTOP = 5.2;
const EDGE_THRESHOLD_MOBILE = 4.4;
const MAX_EDGES_PER_NODE = 4;
const CAMERA_Z = 27;
const BASE_ROTATION_SPEED = 0.045;
const POINTER_STRENGTH = 1.35;
const EDGE_PULSE_SPEED = 1.7;

function supportsWebGL(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");

    return context !== null;
  } catch {
    return false;
  }
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createNodePositions(nodeCount: number): Float32Array {
  const positions = new Float32Array(nodeCount * 3);

  for (let index = 0; index < nodeCount; index += 1) {
    const arrayIndex = index * 3;
    positions[arrayIndex] = randomInRange(-NETWORK_RADIUS, NETWORK_RADIUS);
    positions[arrayIndex + 1] = randomInRange(-NETWORK_RADIUS, NETWORK_RADIUS);
    positions[arrayIndex + 2] = randomInRange(-NETWORK_DEPTH, NETWORK_DEPTH);
  }

  return positions;
}

function createEdgePairs(
  positions: Float32Array,
  nodeCount: number,
  threshold: number,
  maxEdgesPerNode: number
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const edgeCounts = new Array<number>(nodeCount).fill(0);
  const thresholdSquared = threshold * threshold;

  for (let source = 0; source < nodeCount; source += 1) {
    for (let target = source + 1; target < nodeCount; target += 1) {
      if (
        edgeCounts[source] >= maxEdgesPerNode ||
        edgeCounts[target] >= maxEdgesPerNode
      ) {
        continue;
      }

      const sourceIndex = source * 3;
      const targetIndex = target * 3;

      const dx = positions[sourceIndex] - positions[targetIndex];
      const dy = positions[sourceIndex + 1] - positions[targetIndex + 1];
      const dz = positions[sourceIndex + 2] - positions[targetIndex + 2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;

      if (distanceSquared <= thresholdSquared) {
        pairs.push([source, target]);
        edgeCounts[source] += 1;
        edgeCounts[target] += 1;
      }
    }
  }

  return pairs;
}

export interface ThreeSceneOptions {
  container: HTMLDivElement;
  mobileBreakpoint?: number;
}

export interface ThreeSceneHandle {
  webglAvailable: boolean;
  dispose: () => void;
}

export function createThreeScene({
  container,
  mobileBreakpoint = 768
}: ThreeSceneOptions): ThreeSceneHandle {
  if (!supportsWebGL()) {
    return {
      webglAvailable: false,
      dispose: () => undefined
    };
  }

  const isMobile = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const nodeCount = isMobile
    ? Math.floor(DESKTOP_NODE_COUNT * MOBILE_NODE_MULTIPLIER)
    : DESKTOP_NODE_COUNT;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.setAttribute("role", "presentation");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    56,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, CAMERA_Z);

  const networkGroup = new THREE.Group();
  scene.add(networkGroup);

  const nodePositions = createNodePositions(nodeCount);
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: "#00d4ff",
    size: isMobile ? 0.13 : 0.16,
    transparent: true,
    opacity: 0.88,
    sizeAttenuation: true
  });

  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  networkGroup.add(points);

  const edgePairs = createEdgePairs(
    nodePositions,
    nodeCount,
    isMobile ? EDGE_THRESHOLD_MOBILE : EDGE_THRESHOLD_DESKTOP,
    MAX_EDGES_PER_NODE
  );

  const edgePositionArray = new Float32Array(edgePairs.length * 6);
  const edgeColorArray = new Float32Array(edgePairs.length * 6);
  const pulsePhases = new Float32Array(edgePairs.length);
  const cyan = new THREE.Color("#00d4ff");

  for (let edgeIndex = 0; edgeIndex < edgePairs.length; edgeIndex += 1) {
    const [source, target] = edgePairs[edgeIndex];
    const sourceIndex = source * 3;
    const targetIndex = target * 3;
    const edgeArrayIndex = edgeIndex * 6;

    edgePositionArray[edgeArrayIndex] = nodePositions[sourceIndex];
    edgePositionArray[edgeArrayIndex + 1] = nodePositions[sourceIndex + 1];
    edgePositionArray[edgeArrayIndex + 2] = nodePositions[sourceIndex + 2];
    edgePositionArray[edgeArrayIndex + 3] = nodePositions[targetIndex];
    edgePositionArray[edgeArrayIndex + 4] = nodePositions[targetIndex + 1];
    edgePositionArray[edgeArrayIndex + 5] = nodePositions[targetIndex + 2];

    edgeColorArray[edgeArrayIndex] = cyan.r;
    edgeColorArray[edgeArrayIndex + 1] = cyan.g;
    edgeColorArray[edgeArrayIndex + 2] = cyan.b;
    edgeColorArray[edgeArrayIndex + 3] = cyan.r;
    edgeColorArray[edgeArrayIndex + 4] = cyan.g;
    edgeColorArray[edgeArrayIndex + 5] = cyan.b;

    pulsePhases[edgeIndex] = randomInRange(0, Math.PI * 2);
  }

  const edgeGeometry = new THREE.BufferGeometry();
  const edgeColorAttribute = new THREE.BufferAttribute(edgeColorArray, 3);

  edgeGeometry.setAttribute("position", new THREE.BufferAttribute(edgePositionArray, 3));
  edgeGeometry.setAttribute("color", edgeColorAttribute);

  const edgeMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: isMobile ? 0.26 : 0.35
  });

  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  networkGroup.add(edges);

  const ambientLight = new THREE.AmbientLight("#88b9ff", 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight("#00d4ff", 0.9);
  directionalLight.position.set(8, 10, 10);
  scene.add(directionalLight);

  let targetPointerX = 0;
  let targetPointerY = 0;
  let frameId = 0;
  const clock = new THREE.Clock();
  const pulseEdges = !isMobile && !prefersReducedMotion;
  const green = new THREE.Color("#00ff88");

  const handleResize = (): void => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) {
      return;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
    targetPointerX = normalizedX * POINTER_STRENGTH;
    targetPointerY = normalizedY * POINTER_STRENGTH;
  };

  if (!isMobile && !prefersReducedMotion) {
    window.addEventListener("pointermove", handlePointerMove, {passive: true});
  }

  window.addEventListener("resize", handleResize);

  const animate = (): void => {
    frameId = window.requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    networkGroup.rotation.y += BASE_ROTATION_SPEED * 0.0025;
    networkGroup.rotation.x = THREE.MathUtils.lerp(
      networkGroup.rotation.x,
      targetPointerY * 0.04,
      0.04
    );
    networkGroup.rotation.z = Math.sin(elapsed * 0.15) * 0.03;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPointerX, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -targetPointerY, 0.03);
    camera.lookAt(0, 0, 0);

    if (pulseEdges) {
      for (let edgeIndex = 0; edgeIndex < edgePairs.length; edgeIndex += 1) {
        const pulse =
          (Math.sin(elapsed * EDGE_PULSE_SPEED + pulsePhases[edgeIndex]) + 1) * 0.5;
        const blend = 0.2 + pulse * 0.7;
        const red = THREE.MathUtils.lerp(cyan.r, green.r, blend);
        const greenChannel = THREE.MathUtils.lerp(cyan.g, green.g, blend);
        const blue = THREE.MathUtils.lerp(cyan.b, green.b, blend);

        const colorArrayIndex = edgeIndex * 6;
        edgeColorArray[colorArrayIndex] = red;
        edgeColorArray[colorArrayIndex + 1] = greenChannel;
        edgeColorArray[colorArrayIndex + 2] = blue;
        edgeColorArray[colorArrayIndex + 3] = red;
        edgeColorArray[colorArrayIndex + 4] = greenChannel;
        edgeColorArray[colorArrayIndex + 5] = blue;
      }

      edgeColorAttribute.needsUpdate = true;
      edgeMaterial.opacity = 0.25 + Math.sin(elapsed * 0.9) * 0.08;
    }

    renderer.render(scene, camera);
  };

  animate();

  return {
    webglAvailable: true,
    dispose: () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);

      pointsGeometry.dispose();
      pointsMaterial.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      renderer.dispose();
      scene.clear();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
