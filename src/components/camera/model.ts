import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type CameraPart = "aperture" | "storage" | "cap";

/** An original, deliberately simplified diagram; no remote model or textures. */
export function createCameraModel() {
  const root = new THREE.Group();
  const resources = new Set<
    THREE.BufferGeometry | THREE.Material | THREE.Texture
  >();
  const material = (color: number, roughness = 0.5, metalness = 0.1) => {
    const result = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
    });
    resources.add(result);
    return result;
  };
  const body = material(0x242629, 0.62, 0.35);
  const rubber = material(0x141619, 0.9);
  const edge = material(0x494c50, 0.42, 0.6);
  const black = material(0x080a0c, 0.48);
  const silver = material(0x90989d, 0.28, 0.8);
  const orange = material(0xa75b32, 0.4, 0.6);
  const gold = material(0xb79b53, 0.35, 0.65);
  const bladeMaterial = material(0x666d75, 0.45, 0.65);

  function mesh<M extends THREE.Material>(
    geometry: THREE.BufferGeometry,
    mat: M,
    parent: THREE.Object3D,
    position: [number, number, number],
    part?: CameraPart,
  ) {
    resources.add(geometry);
    const result = new THREE.Mesh(geometry, mat);
    result.position.set(...position);
    if (part) result.userData.part = part;
    parent.add(result);
    return result;
  }
  function box(
    size: [number, number, number],
    position: [number, number, number],
    mat = body,
    parent: THREE.Object3D = root,
    radius = 0.04,
    part?: CameraPart,
  ) {
    return mesh(
      new RoundedBoxGeometry(...size, 2, radius),
      mat,
      parent,
      position,
      part,
    );
  }
  // Cylinders and rings face forward along +Z; the camera back is -Z.
  function cylinder(
    radius: number,
    depth: number,
    position: [number, number, number],
    mat = body,
    parent: THREE.Object3D = root,
    part?: CameraPart,
  ) {
    const result = mesh(
      new THREE.CylinderGeometry(radius, radius, depth, 64),
      mat,
      parent,
      position,
      part,
    );
    result.rotation.x = Math.PI / 2;
    return result;
  }
  function ring(
    radius: number,
    tube: number,
    position: [number, number, number],
    mat = edge,
    parent: THREE.Object3D = root,
    part?: CameraPart,
  ) {
    return mesh(
      new THREE.TorusGeometry(radius, tube, 8, 80),
      mat,
      parent,
      position,
      part,
    );
  }
  function textLabel(
    text: string,
    width: number,
    height: number,
    position: [number, number, number],
    parent: THREE.Object3D = root,
    color = "#e1e2e3",
    background?: string,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = Math.max(64, Math.round((512 * height) / width));
    const ctx = canvas.getContext("2d")!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = color;
    ctx.font = `600 ${canvas.height * 0.67}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 12);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    resources.add(texture);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    resources.add(mat);
    return mesh(new THREE.PlaneGeometry(width, height), mat, parent, position);
  }

  // Body, sculpted right-hand grip, top shoulders and viewfinder housing.
  box([3.36, 1.91, 0.93], [0, 0, 0], body, root, 0.16);
  box([3.24, 0.25, 0.96], [0, 0.82, 0], rubber, root, 0.09);
  box([0.94, 1.96, 1.27], [-1.3, -0.015, 0.25], rubber, root, 0.2);
  box([0.81, 0.22, 0.96], [-1.3, 0.97, 0.25], body, root, 0.08);
  box([0.88, 0.49, 0.89], [0.2, 1.12, -0.02], body, root, 0.12);
  box([0.68, 0.12, 0.65], [0.2, 1.39, -0.1], rubber);
  box([0.43, 0.05, 0.42], [0.2, 1.47, -0.15], silver);
  box([0.29, 0.06, 0.4], [0.2, 1.5, -0.15], black);
  box([0.73, 0.47, 0.2], [0.2, 1.07, -0.56], rubber, root, 0.07);
  box([0.48, 0.28, 0.025], [0.2, 1.1, -0.67], black);
  textLabel("SONY", 0.63, 0.18, [0.2, 1.16, 0.442]);
  textLabel("α", 0.26, 0.29, [1.24, 0.53, 0.482]);
  textLabel("7 III", 0.31, 0.11, [1.28, 0.27, 0.486]);

  // Tiny grip grooves catch the studio lighting without a bitmap texture.
  for (let i = 0; i < 18; i++) {
    box(
      [0.022, 1.48, 0.012],
      [-1.62 + i * 0.033, -0.08, 0.89],
      body,
      root,
      0.005,
    );
  }
  const dial = (x: number, y: number, z: number, radius: number) => {
    const disk = cylinder(radius, 0.13, [x, y, z], rubber);
    disk.rotation.x = 0;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const tick = box(
        [0.02, 0.11, 0.03],
        [x + Math.cos(a) * radius, y, z + Math.sin(a) * radius],
        edge,
        root,
        0.004,
      );
      tick.rotation.y = -a;
    }
    return disk;
  };
  dial(-0.84, 1.035, -0.05, 0.3);
  dial(-1.39, 1.13, 0.52, 0.19);
  dial(1.04, 1.015, -0.03, 0.28);
  const modeLabel = textLabel("M  A  S  P", 0.4, 0.12, [-0.84, 1.108, -0.05]);
  modeLabel.rotation.x = -Math.PI / 2;
  const shutter = cylinder(0.115, 0.04, [-1.39, 1.21, 0.52], silver);
  shutter.rotation.x = 0;
  for (const x of [-1.78, 1.78]) {
    const lug = ring(0.095, 0.032, [x, 0.65, -0.04], silver);
    lug.rotation.y = Math.PI / 2;
  }

  // Rear screen and controls reward rotating the diagram all the way around.
  box([2.06, 1.34, 0.11], [0.15, -0.12, -0.54], rubber, root, 0.08);
  const screen = textLabel(
    "α7 III",
    1.82,
    1.08,
    [0.15, -0.1, -0.603],
    root,
    "#596569",
    "#111a1d",
  );
  screen.rotation.y = Math.PI;
  for (let i = 0; i < 4; i++)
    cylinder(0.065, 0.04, [-1.2, 0.55 - i * 0.32, -0.52], edge);
  ring(0.22, 0.048, [-1.24, -0.14, -0.55], edge);
  cylinder(0.12, 0.045, [-1.24, -0.14, -0.565], black);
  for (const x of [-1.42, 1.41]) {
    for (const y of [-0.74, 0.7]) cylinder(0.026, 0.012, [x, y, 0.478], silver);
  }

  const lens = new THREE.Group();
  lens.position.set(0.27, -0.06, 0.46);
  lens.userData.part = "aperture";
  root.add(lens);
  cylinder(0.85, 0.11, [0, 0, 0.025], orange, lens, "aperture");
  ring(0.79, 0.026, [0, 0, 0.09], silver, lens);
  cylinder(0.76, 0.39, [0, 0, 0.27], body, lens, "aperture");
  cylinder(0.81, 0.79, [0, 0, 0.77], rubber, lens, "aperture");
  cylinder(0.835, 0.18, [0, 0, 1.24], body, lens, "aperture");
  // Ribbed focus ring and engraved barrel rings.
  const ribGeometry = new THREE.BoxGeometry(0.018, 0.018, 0.67);
  resources.add(ribGeometry);
  for (let i = 0; i < 88; i++) {
    const a = (i / 88) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeometry, edge);
    rib.position.set(Math.cos(a) * 0.813, Math.sin(a) * 0.813, 0.79);
    rib.rotation.z = a;
    lens.add(rib);
  }
  for (const z of [0.17, 0.39, 0.43, 1.13, 1.17, 1.34])
    ring(0.805, 0.016, [0, 0, z], edge, lens);
  cylinder(0.757, 0.06, [0, 0, 1.35], black, lens, "aperture");
  ring(0.747, 0.027, [0, 0, 1.395], silver, lens, "aperture");
  ring(0.675, 0.04, [0, 0, 1.405], black, lens, "aperture");
  textLabel("FE  /  E-MOUNT", 0.64, 0.07, [0, 0.71, 1.427], lens, "#9b9d9f");
  textLabel("LENS STUDY", 0.43, 0.05, [0, -0.73, 1.427], lens, "#9b9d9f");

  // An annulus made of nine separate iris segments, with a real open center.
  const iris = new THREE.Group();
  iris.name = "aperture-iris";
  iris.position.z = 1.4;
  lens.add(iris);
  cylinder(0.61, 0.012, [0, 0, 1.38], black, lens);
  const irisBlades: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >[] = [];
  for (let i = 0; i < 9; i++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(18), 3),
    );
    const blade = mesh(
      geometry,
      bladeMaterial,
      iris,
      [0, 0, i * 0.0002],
      "aperture",
    );
    irisBlades.push(blade);
  }
  function setAperture(fNumber: number) {
    // Educational scaling keeps the opening legible even at f/16.
    const innerRadius = 0.48 * Math.sqrt(2.8 / fNumber);
    irisBlades.forEach((blade, index) => {
      const a = (index * Math.PI * 2) / 9;
      const b = ((index + 1) * Math.PI * 2) / 9 - 0.009;
      const outer = 0.64;
      const p = [
        Math.cos(a) * innerRadius,
        Math.sin(a) * innerRadius,
        0,
        Math.cos(a - 0.19) * outer,
        Math.sin(a - 0.19) * outer,
        0,
        Math.cos(b - 0.19) * outer,
        Math.sin(b - 0.19) * outer,
        0,
        Math.cos(a) * innerRadius,
        Math.sin(a) * innerRadius,
        0,
        Math.cos(b - 0.19) * outer,
        Math.sin(b - 0.19) * outer,
        0,
        Math.cos(b) * innerRadius,
        Math.sin(b) * innerRadius,
        0,
      ];
      const position = blade.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      position.copyArray(p);
      position.needsUpdate = true;
      blade.geometry.computeVertexNormals();
      blade.geometry.computeBoundingSphere();
    });
  }
  setAperture(2.8);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x365c6d,
    metalness: 0.25,
    roughness: 0.1,
    transparent: true,
    opacity: 0.5,
    clearcoat: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  resources.add(glassMaterial);
  const glass = mesh(
    new THREE.CircleGeometry(0.625, 80),
    glassMaterial,
    lens,
    [0, 0, 1.43],
    "aperture",
  );
  ring(0.59, 0.009, [0, 0, 1.437], material(0x437283, 0.2, 0.5), lens);

  // The SD door is on the photographer's right (-X from the front).
  box([0.07, 1.16, 0.75], [-1.8, -0.06, 0.07], black, root, 0.03, "storage");
  const cards = new THREE.Group();
  cards.position.set(-1.83, -0.06, 0.07);
  root.add(cards);
  for (let i = 0; i < 2; i++) {
    const y = i === 0 ? -0.27 : 0.22;
    box([0.025, 0.105, 0.52], [-0.015, y, 0], silver, cards, 0.012, "storage");
    box([0.25, 0.07, 0.43], [-0.09, y, 0], rubber, cards, 0.01, "storage");
    for (let j = 0; j < 7; j++)
      box(
        [0.05, 0.004, 0.032],
        [-0.19, y + 0.037, -0.15 + j * 0.05],
        gold,
        cards,
        0.001,
      );
    const label = textLabel(
      `${i === 0 ? "1" : "2"}  SD`,
      0.34,
      0.095,
      [-0.028, y + 0.13, 0],
      cards,
      "#b6bdc3",
    );
    label.rotation.y = -Math.PI / 2;
  }
  const door = new THREE.Group();
  door.name = "sd-door";
  door.position.set(-1.86, -0.06, -0.33);
  door.userData.part = "storage";
  root.add(door);
  box([0.1, 1.3, 0.84], [0, 0, 0.42], rubber, door, 0.04, "storage");
  box([0.025, 0.19, 0.18], [-0.062, 0.04, 0.65], edge, door, 0.02, "storage");
  const doorLabel = textLabel(
    "SD",
    0.22,
    0.12,
    [-0.055, 0.35, 0.45],
    door,
    "#9a9a9a",
  );
  doorLabel.rotation.y = -Math.PI / 2;

  const battery = new THREE.Group();
  battery.name = "battery";
  battery.position.set(-1.26, -0.85, 0.2);
  battery.userData.part = "storage";
  root.add(battery);
  box([0.57, 0.75, 0.65], [0, 0, 0], rubber, battery, 0.045, "storage");
  textLabel("NP-FZ100", 0.46, 0.09, [0, -0.06, 0.331], battery, "#b7b7b7");
  for (let i = 0; i < 3; i++)
    box(
      [0.07, 0.015, 0.16],
      [-0.12 + i * 0.12, 0.38, 0.1],
      gold,
      battery,
      0.003,
    );
  const batteryDoor = new THREE.Group();
  batteryDoor.position.set(-1.61, -0.99, 0.2);
  root.add(batteryDoor);
  box([0.7, 0.08, 0.8], [0.35, 0, 0], body, batteryDoor, 0.04, "storage");
  const socket = cylinder(0.075, 0.02, [0.2, -0.962, 0], silver);
  socket.rotation.x = 0;

  const cap = new THREE.Group();
  cap.name = "lens-cap";
  cap.position.set(1.95, -1.15, 1.8);
  cap.rotation.set(-0.15, -0.32, -0.18);
  cap.userData.part = "cap";
  root.add(cap);
  cylinder(0.72, 0.13, [0, 0, 0], rubber, cap, "cap");
  ring(0.694, 0.029, [0, 0, 0.075], edge, cap, "cap");
  cylinder(0.654, 0.025, [0, 0, 0.077], body, cap, "cap");
  for (const x of [-0.38, 0.38]) {
    box([0.22, 0.62, 0.05], [x, 0, 0.12], black, cap, 0.065, "cap");
    box([0.13, 0.39, 0.035], [x, 0, 0.151], rubber, cap, 0.025, "cap");
    for (let i = 0; i < 5; i++)
      box([0.1, 0.017, 0.01], [x, -0.12 + i * 0.06, 0.176], edge, cap, 0.003);
  }
  textLabel("SONY", 0.51, 0.14, [0, 0, 0.116], cap, "#9b9da0");

  const anchors: Record<CameraPart, THREE.Vector3> = {
    aperture: new THREE.Vector3(0.65, 0.27, 1.96),
    storage: new THREE.Vector3(-1.9, 0.18, 0.38),
    cap: new THREE.Vector3(2.38, -0.84, 1.94),
  };

  function pose(storage: number, aperture: number) {
    door.rotation.y = -storage * 1.65;
    cards.position.x = -1.6 - storage * 0.35;
    battery.position.y = -0.55 - storage * 1.1;
    batteryDoor.rotation.z = -storage * 1.7;
    glass.material.opacity = 0.5 * (1 - aperture);
  }
  pose(0, 0);

  return {
    root,
    anchors,
    setAperture,
    pose,
    dispose: () => resources.forEach((resource) => resource.dispose()),
  };
}
