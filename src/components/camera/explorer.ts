import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CAMERA_F_STOPS, createCameraModel, type CameraPart } from "./model";

const labels: Record<CameraPart, string> = {
  aperture: "Aperture",
  storage: "Battery & SD cards",
  cap: "Lens cap",
};
const fStops = CAMERA_F_STOPS;
const isPart = (value: string | undefined): value is CameraPart =>
  value === "aperture" || value === "storage" || value === "cap";

export function initializeExplorer(host: HTMLElement): () => void {
  const find = <T extends HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!;
  const viewport = find<HTMLDivElement>("[data-viewport]");
  const status = find<HTMLDivElement>("[data-status]");
  const hotspots = find<HTMLDivElement>("[data-hotspots]");
  const back = find<HTMLButtonElement>("[data-back]");
  const reset = find<HTMLButtonElement>("[data-reset]");
  const range = find<HTMLInputElement>("#aperture-range");
  const output = find<HTMLOutputElement>("[data-aperture-output]");
  const announcement = find<HTMLParagraphElement>("[data-announcement]");
  const panels = host.querySelectorAll<HTMLElement>("[data-panel]");
  const buttons = host.querySelectorAll<HTMLButtonElement>("[data-part]");
  const controller = new AbortController();
  const { signal } = controller;
  let selected: CameraPart | null = null;
  let returnFocus: HTMLElement | null = null;
  let changeView: (part: CameraPart | null, reset?: boolean) => void = () => {};
  let changeAperture: (value: number) => void = () => {};

  // The field notes remain usable even if WebGL cannot be initialized.
  function select(part: CameraPart | null, resetView = false) {
    if (part && !selected)
      returnFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    selected = part;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== (part ?? "overview");
    });
    buttons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.part === part)),
    );
    back.hidden = !part;
    find("[data-note-index]").textContent =
      `${part ? { aperture: "01", storage: "02", cap: "03" }[part] : "00"} / 03`;
    announcement.textContent = part
      ? `${labels[part]} close-up. Press Escape to return to the whole camera.`
      : "Whole camera view. Drag to rotate or choose a part.";
    host.dataset.view = part ?? "overview";
    changeView(part, resetView);
    if (
      part &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.dataset.hotspot
    ) {
      back.focus({ preventScroll: true });
    }
    if (!part && returnFocus?.isConnected) {
      // Hotspots are normally revealed on the next rendered frame.
      returnFocus.hidden = false;
      returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }
  }
  host.dataset.view = "overview";
  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        const part = button.dataset.part;
        if (isPart(part)) select(part);
      },
      { signal },
    ),
  );
  back.addEventListener("click", () => select(null), { signal });
  reset.addEventListener("click", () => select(null, true), { signal });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && selected) {
        event.preventDefault();
        select(null);
      }
    },
    { signal },
  );
  range.addEventListener(
    "input",
    () => {
      const value = fStops[Number(range.value)];
      output.value = `f/${value}`;
      range.setAttribute("aria-valuetext", `f/${value}`);
      changeAperture(value);
    },
    { signal },
  );

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    status.textContent =
      "The 3D view needs WebGL 2. You can still explore every part using the field notes below.";
    reset.hidden = true;
    host.dataset.renderer = "unavailable";
    return () => controller.abort();
  }

  const scene = new THREE.Scene();
  // Local studio reflections give the coated glass and metal rims their shape.
  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environment = pmrem.fromScene(studio, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  // Transparent clear preserves the exact shared Layout background color.
  renderer.setClearColor(0x0f0f0f, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Rotatable 3D diagram of a Sony alpha 7 III. Use arrow keys to rotate, plus and minus to zoom, or the labeled part buttons for close-ups.",
  );
  canvas.setAttribute("aria-describedby", "orbit-instructions");
  viewport.prepend(canvas);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enablePan = false;
  controls.minDistance = 2.1;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.7;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  controls.enableDamping = !reducedMotion.matches;
  const motionChanged = () => {
    controls.enableDamping = !reducedMotion.matches;
  };
  reducedMotion.addEventListener("change", motionChanged, { signal });

  scene.add(new THREE.HemisphereLight(0xdfebff, 0x665c50, 2.5));
  const light = (
    color: number,
    intensity: number,
    position: [number, number, number],
  ) => {
    const result = new THREE.DirectionalLight(color, intensity);
    result.position.set(...position);
    scene.add(result);
  };
  light(0xffead7, 5, [-3, 6, 5]);
  light(0xbbd9ff, 3, [4, 2, -3]);
  light(0xffffff, 1.5, [-4, 0, -2]);

  const model = createCameraModel();
  scene.add(model.root);
  // A subtle ground reference gives the floating exploded study scale.
  const ground = new THREE.GridHelper(12, 24, 0x292929, 0x1b1b1b);
  ground.position.y = -2.22;
  const groundMaterial = ground.material as THREE.Material;
  groundMaterial.transparent = true;
  groundMaterial.opacity = 0.38;
  scene.add(ground);

  let width = 1;
  let height = 1;
  const overviewTarget = new THREE.Vector3(0.45, -0.12, 0.95);
  const overviewDirection = new THREE.Vector3(-0.46, 0.28, 0.84).normalize();
  const overviewPosition = () =>
    overviewTarget
      .clone()
      .addScaledVector(overviewDirection, Math.max(8.6, 10.2 / camera.aspect));
  const savedPosition = new THREE.Vector3();
  const savedTarget = new THREE.Vector3();
  let hasSavedView = false;
  let storageOpen = 0;
  let apertureOpen = 0;
  type Transition = {
    started: number;
    fromPosition: THREE.Vector3;
    toPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromStorage: number;
    fromAperture: number;
    toStorage: number;
    toAperture: number;
  };
  let transition: Transition | null = null;
  let frame = 0;
  let disposed = false;
  let contextLost = false;
  const hotspotElements = [
    ...host.querySelectorAll<HTMLButtonElement>("[data-hotspot]"),
  ];
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function updateHotspots() {
    for (const element of hotspotElements) {
      const part = element.dataset.hotspot as CameraPart;
      projected.copy(model.anchors[part]).project(camera);
      const visible = !selected && projected.z > -1 && projected.z < 1;
      element.hidden = !visible;
      if (!visible) continue;
      // Keep annotations reachable at all orbit angles and on narrow screens.
      const x = THREE.MathUtils.clamp(
        (projected.x * 0.5 + 0.5) * width,
        24,
        Math.max(24, width - element.offsetWidth + 20),
      );
      const y = THREE.MathUtils.clamp(
        (-projected.y * 0.5 + 0.5) * height,
        24,
        height - 26,
      );
      element.style.transform = `translate(${x - 21}px, ${y - 21}px)`;
    }
  }

  function requestRender() {
    if (!frame && !disposed && !document.hidden && !contextLost)
      frame = requestAnimationFrame(render);
  }
  function render(time: number) {
    frame = 0;
    if (disposed || contextLost) return;
    if (transition) {
      const t = reducedMotion.matches
        ? 1
        : Math.min((time - transition.started) / 850, 1);
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(
        transition.fromPosition,
        transition.toPosition,
        ease,
      );
      controls.target.lerpVectors(
        transition.fromTarget,
        transition.toTarget,
        ease,
      );
      storageOpen = THREE.MathUtils.lerp(
        transition.fromStorage,
        transition.toStorage,
        ease,
      );
      apertureOpen = THREE.MathUtils.lerp(
        transition.fromAperture,
        transition.toAperture,
        ease,
      );
      model.pose(storageOpen, apertureOpen);
      if (t === 1) {
        transition = null;
        controls.enabled = true;
      }
    }
    const changed = controls.update();
    renderer.render(scene, camera);
    updateHotspots();
    if (transition || changed) requestRender();
  }
  controls.addEventListener("change", requestRender);
  changeAperture = (value) => {
    model.setAperture(value);
    requestRender();
  };

  changeView = (part, resetView = false) => {
    if (part && !hasSavedView) {
      savedPosition.copy(camera.position);
      savedTarget.copy(controls.target);
      hasSavedView = true;
    }
    let target: THREE.Vector3;
    let position: THREE.Vector3;
    const narrowScale = Math.max(1, 1 / camera.aspect);
    if (part === "aperture") {
      target = new THREE.Vector3(0.27, -0.06, 2.56);
      position = target
        .clone()
        .add(new THREE.Vector3(0.16, 0.12, 3.65 * narrowScale));
    } else if (part === "storage") {
      target = new THREE.Vector3(-1.2, -0.35, 0.2);
      position = target
        .clone()
        .add(new THREE.Vector3(-4.9, -1.1, 1.65).multiplyScalar(narrowScale));
    } else if (part === "cap") {
      target = new THREE.Vector3(2.08, -1.15, 2.61);
      position = target
        .clone()
        .add(new THREE.Vector3(-0.55, 0.18, 2.75 * narrowScale));
    } else {
      target =
        hasSavedView && !resetView
          ? savedTarget.clone()
          : overviewTarget.clone();
      position =
        hasSavedView && !resetView ? savedPosition.clone() : overviewPosition();
      hasSavedView = false;
    }
    // Flush damping before a scripted move, so the last drag cannot fight it.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    controls.enabled = false;
    transition = {
      started: performance.now(),
      fromPosition: camera.position.clone(),
      toPosition: position,
      fromTarget: controls.target.clone(),
      toTarget: target,
      fromStorage: storageOpen,
      fromAperture: apertureOpen,
      toStorage: part === "storage" ? 1 : 0,
      toAperture: part === "aperture" ? 1 : 0,
    };
    requestRender();
  };

  let initialSize = true;
  const resize = new ResizeObserver(() => {
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (initialSize) {
      camera.position.copy(overviewPosition());
      controls.target.copy(overviewTarget);
      initialSize = false;
    }
    requestRender();
  });
  resize.observe(viewport);

  // Select geometry only on a click/tap, never at the end of an orbit drag.
  let pointerDown: { x: number; y: number; id: number } | null = null;
  let dragged = false;
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary || event.button !== 0) {
        dragged = true;
        return;
      }
      pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragged = false;
    },
    { signal },
  );
  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (
        pointerDown &&
        Math.hypot(
          event.clientX - pointerDown.x,
          event.clientY - pointerDown.y,
        ) > 6
      )
        dragged = true;
    },
    { signal },
  );
  canvas.addEventListener(
    "pointercancel",
    () => {
      pointerDown = null;
    },
    { signal },
  );
  canvas.addEventListener(
    "pointerup",
    (event) => {
      const click =
        pointerDown && pointerDown.id === event.pointerId && !dragged;
      pointerDown = null;
      if (!click || transition) return;
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(model.root, true)[0];
      if (!hit) return;
      let object: THREE.Object3D | null = hit.object;
      while (object && !isPart(object.userData.part)) object = object.parent;
      if (object && isPart(object.userData.part)) select(object.userData.part);
    },
    { signal },
  );

  canvas.addEventListener(
    "keydown",
    (event) => {
      if (
        transition ||
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "=",
          "-",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target),
      );
      if (event.key === "ArrowLeft") spherical.theta -= 0.12;
      if (event.key === "ArrowRight") spherical.theta += 0.12;
      if (event.key === "ArrowUp") spherical.phi -= 0.12;
      if (event.key === "ArrowDown") spherical.phi += 0.12;
      if (["+", "="].includes(event.key)) spherical.radius *= 0.9;
      if (event.key === "-") spherical.radius *= 1.1;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi,
        controls.minPolarAngle,
        controls.maxPolarAngle,
      );
      spherical.radius = THREE.MathUtils.clamp(
        spherical.radius,
        controls.minDistance,
        controls.maxDistance,
      );
      camera.position
        .copy(controls.target)
        .add(new THREE.Vector3().setFromSpherical(spherical));
      requestRender();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestRender();
    },
    { signal },
  );
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      status.hidden = false;
      hotspots.hidden = true;
      status.textContent =
        "The 3D view was interrupted. Your field notes are still available. Reload the page if the view does not return.";
    },
    { signal },
  );
  canvas.addEventListener(
    "webglcontextrestored",
    () => {
      environment.dispose();
      environment = pmrem.fromScene(studio, 0.04);
      scene.environment = environment.texture;
      contextLost = false;
      status.hidden = true;
      hotspots.hidden = false;
      requestRender();
    },
    { signal },
  );
  if (window.matchMedia("(pointer: coarse)").matches)
    find("[data-orbit-hint]").textContent = "Drag to rotate · Pinch to zoom";
  status.hidden = true;
  hotspots.hidden = false;
  host.dataset.renderer = "ready";
  requestRender();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    controller.abort();
    resize.disconnect();
    controls.removeEventListener("change", requestRender);
    controls.dispose();
    model.dispose();
    ground.geometry.dispose();
    groundMaterial.dispose();
    environment.dispose();
    studio.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
