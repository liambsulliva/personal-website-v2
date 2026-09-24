import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type CameraPart = "aperture" | "storage" | "cap";

// Sony ILCE-7M3 + SEL2870 at 28 mm. Approximately 0.028 scene units/mm.
// +Z is the lens, -Z the LCD; the photographer's right is -X.
// Control placement: Sony Help Guide, Names of parts, pp. 22–30.
// https://helpguide.sony.net/ilc/1720/v1/en/print.pdf
export const CAMERA_F_STOPS = [3.5, 5.6, 8, 11, 16, 22] as const;
const IRIS_BLADES = 7;
type Point = [number, number, number];

/** Locally built geometry; the STL studies are references, never runtime assets. */
export function createCameraModel() {
  const root = new THREE.Group();
  root.name = "sony-a7iii";
  const resources = new Set<
    THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.InstancedMesh
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
  const body = material(0x202123, 0.53, 0.28);
  const rubber = material(0x151617, 0.88, 0.02);
  const ribbedRubber = material(0x18191b, 0.72, 0.08);
  const edge = material(0x343638, 0.43, 0.35);
  const black = material(0x08090a, 0.55, 0.05);
  const silver = material(0x969a9e, 0.3, 0.82);
  const orange = material(0xb75f37, 0.38, 0.62);
  const gold = material(0xb79b53, 0.35, 0.65);
  const white = material(0xd3d4d0, 0.6, 0.05);
  const bladeMaterial = material(0x34383e, 0.39, 0.65);

  // Fine, deterministic leather grain, rather than oversized grip stripes.
  const grainData = new Uint8Array(128 * 128 * 4);
  let seed = 71;
  for (let i = 0; i < grainData.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 75 + (seed % 150);
    grainData.set([value, value, value, 255], i);
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(7, 7);
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.generateMipmaps = true;
  grain.needsUpdate = true;
  resources.add(grain);
  rubber.bumpMap = grain;
  rubber.bumpScale = 0.009;

  function group(name: string, position: Point, parent: THREE.Object3D = root) {
    const result = new THREE.Group();
    result.name = name;
    result.position.set(...position);
    parent.add(result);
    return result;
  }
  function mesh<M extends THREE.Material>(
    geometry: THREE.BufferGeometry,
    mat: M,
    parent: THREE.Object3D,
    position: Point,
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
    size: Point,
    position: Point,
    mat = body,
    parent: THREE.Object3D = root,
    radius = 0.025,
    part?: CameraPart,
  ) {
    return mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, ...size.map((n) => n / 2)),
      ),
      mat,
      parent,
      position,
      part,
    );
  }
  // Cylinders and rings face +Z. A group rotates the complete assembly.
  function cylinder(
    radius: number,
    depth: number,
    position: Point,
    mat = body,
    parent: THREE.Object3D = root,
    part?: CameraPart,
  ) {
    const geometry = new THREE.CylinderGeometry(radius, radius, depth, 64);
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, mat, parent, position, part);
  }
  function ring(
    radius: number,
    tube: number,
    position: Point,
    mat = edge,
    parent: THREE.Object3D = root,
  ) {
    return mesh(
      new THREE.TorusGeometry(radius, tube, 8, 96),
      mat,
      parent,
      position,
    );
  }
  function annulus(
    outer: number,
    inner: number,
    z: number,
    mat: THREE.MeshStandardMaterial,
    parent: THREE.Object3D,
  ) {
    return mesh(new THREE.RingGeometry(inner, outer, 96), mat, parent, [
      0,
      0,
      z,
    ]);
  }
  function profile(
    points: [number, number][],
    depth: number,
    position: Point,
    mat = body,
    parent: THREE.Object3D = root,
    bevel = 0.04,
  ) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    geometry.translate(0, 0, -depth / 2);
    return mesh(geometry, mat, parent, position);
  }
  function textLabel(
    text: string,
    width: number,
    height: number,
    position: Point,
    parent: THREE.Object3D = root,
    color = "#d7d9da",
    background?: string,
    font = "Arial, sans-serif",
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
    ctx.font = `600 ${canvas.height * 0.7}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 12);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    resources.add(texture);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    resources.add(mat);
    return mesh(new THREE.PlaneGeometry(width, height), mat, parent, position);
  }
  const rearLabel = (
    text: string,
    width: number,
    height: number,
    position: Point,
    parent: THREE.Object3D = root,
    color?: string,
  ) => {
    const label = textLabel(text, width, height, position, parent, color);
    label.rotation.y = Math.PI;
    return label;
  };
  // Instancing keeps hundreds of actual teeth to one draw call per ring.
  function ribs(
    radius: number,
    depth: number,
    z: number,
    count: number,
    parent: THREE.Object3D,
    mat = ribbedRubber,
    toothWidth = 0.018,
  ) {
    const geometry = new THREE.BoxGeometry(0.019, toothWidth, depth);
    resources.add(geometry);
    const result = new THREE.InstancedMesh(geometry, mat, count);
    resources.add(result);
    const transform = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      transform.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z,
      );
      transform.rotation.z = angle;
      transform.updateMatrix();
      result.setMatrixAt(i, transform.matrix);
    }
    result.instanceMatrix.needsUpdate = true;
    parent.add(result);
    return result;
  }
  function dial(
    name: string,
    position: Point,
    radius: number,
    depth: number,
    axis: "top" | "front" | "back",
    count = 48,
  ) {
    const result = group(name, position);
    if (axis === "top") result.rotation.x = -Math.PI / 2;
    if (axis === "back") result.rotation.y = Math.PI;
    cylinder(radius, depth, [0, 0, 0], ribbedRubber, result);
    ribs(radius, depth * 0.76, 0, count, result, edge, 0.016);
    cylinder(radius - 0.014, 0.018, [0, 0, depth / 2], body, result);
    ring(radius - 0.019, 0.008, [0, 0, depth / 2 + 0.01], edge, result);
    return result;
  }
  function button(
    name: string,
    position: Point,
    radius: number,
    axis: "top" | "back",
    label?: string,
  ) {
    const result = group(name, position);
    if (axis === "top") result.rotation.x = -Math.PI / 2;
    else result.rotation.y = Math.PI;
    cylinder(radius + 0.017, 0.018, [0, 0, 0], black, result);
    cylinder(radius, 0.04, [0, 0, 0.017], body, result);
    if (label) {
      const marking = textLabel(
        label,
        radius * 1.65,
        radius * 0.85,
        [0, 0, 0.04],
        result,
      );
      if (axis === "top") marking.rotation.z = Math.PI;
    }
    return result;
  }
  function screw(position: Point, axis: "front" | "back" | "bottom" = "front") {
    const result = group("body-screw", position);
    if (axis === "back") result.rotation.y = Math.PI;
    if (axis === "bottom") result.rotation.x = Math.PI / 2;
    cylinder(0.026, 0.009, [0, 0, 0], edge, result);
    box([0.032, 0.006, 0.002], [0, 0, 0.005], black, result, 0.001);
    box([0.006, 0.032, 0.002], [0, 0, 0.005], black, result, 0.001);
  }

  // The shallow mirrorless chassis has a separate die-cast shoulder and base.
  const shellOutline: [number, number][] = [
    [-1.65, -0.98],
    [1.58, -0.98],
    [1.67, -0.88],
    [1.67, 0.79],
    [1.56, 0.96],
    [0.84, 1.0],
    [-0.5, 1.0],
    [-1.55, 0.94],
    [-1.67, 0.78],
  ];
  profile(shellOutline, 0.84, [0, 0, 0], body).name = "body-shell";
  box([3.26, 0.085, 0.94], [0, -1.022, 0], black, root, 0.035).name =
    "base-plate";
  // The seam sits just outside the shell, avoiding coplanar shoulder panels.
  for (const z of [-0.464, 0.464])
    box([3.1, 0.012, 0.008], [0, 0.836, z], black, root, 0.003);
  box([0.58, 1.55, 0.055], [1.33, -0.17, 0.46], rubber, root, 0.025);

  // Lofted asymmetric grip: rounded palm edge, finger recess and sloped shoulder.
  const gripCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.43, 0, -0.57),
      new THREE.Vector3(0.2, 0, -0.55),
      new THREE.Vector3(0.32, 0, -0.2),
      new THREE.Vector3(0.28, 0, 0.2),
      new THREE.Vector3(0.34, 0, 0.49),
      new THREE.Vector3(0.19, 0, 0.7),
      new THREE.Vector3(-0.12, 0, 0.77),
      new THREE.Vector3(-0.43, 0, 0.55),
    ],
    true,
    "centripetal",
  );
  function gripLoft(
    name: string,
    levels: [number, number, number][],
    mat: THREE.MeshStandardMaterial,
  ) {
    const points = gripCurve.getPoints(64).slice(0, 64);
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (const [y, scale, shift] of levels) {
      points.forEach((p, i) => {
        positions.push(-1.29 + p.x * scale, y, 0.25 + p.z * scale + shift);
        uvs.push(i / 64, (y + 1.06) / 2.1);
      });
    }
    for (let row = 0; row < levels.length - 1; row++) {
      for (let i = 0; i < 64; i++) {
        const a = row * 64 + i,
          b = row * 64 + ((i + 1) % 64);
        indices.push(a, a + 64, b, b, a + 64, b + 64);
      }
    }
    // Separate cap vertices avoid smoothing the flat end into the side wall.
    for (const [row, reverse] of [
      [0, true],
      [levels.length - 1, false],
    ] as const) {
      const [y, scale, shift] = levels[row];
      const center = positions.length / 3;
      positions.push(-1.29, y, 0.25 + shift);
      uvs.push(0.5, 0.5);
      for (const p of points) {
        positions.push(-1.29 + p.x * scale, y, 0.25 + p.z * scale + shift);
        uvs.push(p.x + 0.5, p.z + 0.5);
      }
      for (let i = 0; i < 64; i++) {
        const a = center + 1 + i,
          b = center + 1 + ((i + 1) % 64);
        indices.push(center, reverse ? a : b, reverse ? b : a);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const result = mesh(geometry, mat, root, [0, 0, 0]);
    result.name = name;
    return result;
  }
  gripLoft(
    "sculpted-grip",
    [
      [-1.02, 0.88, -0.015],
      [-0.94, 0.98, 0],
      [-0.72, 1, 0],
      [0.34, 1, -0.025],
      [0.61, 0.94, -0.005],
      [0.77, 0.99, 0.01],
    ],
    rubber,
  );
  gripLoft(
    "grip-top-plate",
    [
      [0.77, 0.99, 0.01],
      [0.85, 1.015, 0.01],
      [0.98, 0.91, -0.025],
      [1.005, 0.85, -0.05],
    ],
    body,
  );
  box([0.17, 0.32, 0.03], [-1.05, 0.32, 0.957], black, root, 0.065).name =
    "infrared-sensor";

  // Angular EVF roof, stepped hot shoe, recessed glass and soft eyecup.
  profile(
    [
      [-0.56, 0.9],
      [-0.49, 1.16],
      [-0.25, 1.47],
      [0.55, 1.47],
      [0.79, 1.16],
      [0.83, 0.9],
    ],
    0.88,
    [0, 0, -0.015],
    body,
    root,
    0.045,
  ).name = "viewfinder-housing";
  const sony = textLabel(
    "SONY",
    0.66,
    0.19,
    [0.15, 1.215, 0.478],
    root,
    "#f2f2ee",
    undefined,
    "Georgia, serif",
  );
  sony.name = "sony-wordmark";
  textLabel("α", 0.28, 0.31, [1.33, 0.66, 0.486]);
  textLabel("7", 0.17, 0.18, [1.26, 0.405, 0.49]);
  textLabel("III", 0.15, 0.11, [1.42, 0.4, 0.49]);
  const shoe = group("multi-interface-shoe", [0.15, 1.532, -0.09]);
  box([0.49, 0.025, 0.56], [0, 0, 0], black, shoe, 0.012);
  box([0.39, 0.016, 0.44], [0, 0.019, 0], silver, shoe, 0.008);
  box([0.3, 0.018, 0.46], [0, 0.033, 0], black, shoe, 0.005);
  for (const x of [-0.226, 0.226]) {
    box([0.035, 0.064, 0.52], [x, 0.03, 0], silver, shoe, 0.006);
    box([0.08, 0.018, 0.5], [x * 0.91, 0.065, 0], silver, shoe, 0.005);
  }
  for (let i = 0; i < 12; i++)
    box(
      [0.015, 0.005, 0.042],
      [-0.14 + i * 0.025, 0.047, 0.19],
      gold,
      shoe,
      0.001,
    );
  cylinder(0.03, 0.008, [0.15, 1.565, -0.12], silver).rotation.x = -Math.PI / 2;
  box([1.04, 0.67, 0.18], [0.15, 1.06, -0.52], black, root, 0.16);
  box([0.98, 0.62, 0.16], [0.15, 1.07, -0.635], rubber, root, 0.15).name =
    "viewfinder-eyecup";
  box([0.69, 0.4, 0.013], [0.15, 1.08, -0.724], edge, root, 0.055);
  box([0.61, 0.33, 0.016], [0.15, 1.08, -0.736], black, root, 0.04);
  box(
    [0.5, 0.27, 0.008],
    [0.15, 1.08, -0.748],
    material(0x142127, 0.19, 0.42),
    root,
    0.025,
  );
  box([0.16, 0.065, 0.015], [0.15, 0.803, -0.732], black, root, 0.014).name =
    "eye-sensor";
  const diopter = dial(
    "diopter-dial",
    [-0.438, 1.02, -0.56],
    0.105,
    0.09,
    "front",
    24,
  );
  diopter.rotation.y = -Math.PI / 2;

  // Both top dials belong on the photographer's right; the left shoulder is bare.
  const mode = dial(
    "mode-dial",
    [-0.76, 1.105, -0.035],
    0.29,
    0.155,
    "top",
    56,
  );
  const modes = ["P", "A", "S", "M", "1", "2", "SCN", "S&Q", "▰", "AUTO"];
  modes.forEach((text, i) => {
    const angle = (i / modes.length) * Math.PI * 2 + 0.3;
    const label = textLabel(
      text,
      text.length > 2 ? 0.115 : 0.073,
      0.067,
      [Math.sin(angle) * 0.207, Math.cos(angle) * 0.207, 0.09],
      mode,
      text === "AUTO" ? "#82b877" : undefined,
    );
    label.rotation.z = -angle;
  });
  cylinder(0.105, 0.006, [0, 0, 0.089], body, mode);
  box([0.035, 0.01, 0.055], [-0.76, 1.015, 0.32], white, root, 0.003);
  const exposure = dial(
    "exposure-compensation-dial",
    [-1.43, 1.08, -0.22],
    0.257,
    0.13,
    "top",
    56,
  );
  for (let i = 0; i < 21; i++) {
    const a = -2.2 + i * 0.22;
    const mark = box(
      [0.008, i % 3 === 0 ? 0.049 : 0.022, 0.002],
      [Math.sin(a) * 0.219, Math.cos(a) * 0.219, 0.079],
      white,
      exposure,
      0.001,
    );
    mark.rotation.z = -a;
    if (i % 3 === 0) {
      const label = textLabel(
        String(i / 3 - 3),
        0.075,
        0.062,
        [Math.sin(a) * 0.152, Math.cos(a) * 0.152, 0.081],
        exposure,
      );
      label.rotation.z = -a;
    }
  }
  textLabel("±", 0.065, 0.067, [0, 0, 0.081], exposure);
  const shutter = group("shutter-power-switch", [-1.3, 1.012, 0.72]);
  shutter.rotation.x = -Math.PI / 2 - 0.12;
  cylinder(0.199, 0.052, [0, 0, 0], black, shutter);
  cylinder(0.182, 0.04, [0, 0, 0.029], edge, shutter);
  ring(0.139, 0.012, [0, 0, 0.057], silver, shutter);
  cylinder(0.128, 0.033, [0, 0, 0.061], body, shutter);
  box([0.095, 0.16, 0.043], [0.145, -0.04, 0.023], body, shutter, 0.014);
  textLabel("ON", 0.073, 0.045, [-0.155, 0.11, 0.058], shutter).rotation.z =
    Math.PI;
  textLabel("OFF", 0.092, 0.045, [0.135, 0.14, 0.058], shutter).rotation.z =
    Math.PI;
  button("custom-c1", [-1.39, 1.015, 0.35], 0.077, "top", "C1");
  button("custom-c2", [-1.13, 1.03, 0.32], 0.077, "top", "C2");
  dial("front-command-dial", [-1.28, 0.718, 0.9], 0.208, 0.105, "top", 44);
  dial("rear-command-dial", [-0.96, 0.825, -0.463], 0.225, 0.13, "top", 48);
  const sensorMark = group("sensor-plane-mark", [1.07, 1.034, -0.18]);
  sensorMark.rotation.x = -Math.PI / 2;
  ring(0.037, 0.005, [0, 0, 0], white, sensorMark);
  box([0.13, 0.008, 0.002], [0, 0, 0], white, sensorMark, 0.001);
  for (let i = 0; i < 4; i++)
    box(
      [0.105, 0.004, 0.014],
      [1.29, 1.025, 0.13 + i * 0.043],
      black,
      root,
      0.005,
    );
  for (const x of [-0.5, 0.83]) {
    for (let i = 0; i < 3; i++)
      box(
        [0.019, 0.068, 0.008],
        [x + i * 0.032, 0.975, 0.485],
        black,
        root,
        0.006,
      );
  }
  cylinder(0.063, 0.025, [-0.74, 0.645, 0.493], black);
  cylinder(
    0.044,
    0.028,
    [-0.74, 0.645, 0.508],
    material(0x4e3022, 0.18, 0.1),
  ).name = "af-illuminator";
  const release = group("lens-release", [-0.65, -0.57, 0.545]);
  release.rotation.z = -0.35;
  box([0.14, 0.3, 0.08], [0, 0, 0], body, release, 0.05);
  box([0.086, 0.21, 0.025], [0, 0, 0.047], edge, release, 0.035);

  // Metal strap eyes with triangular split rings and black protectors.
  for (const side of [-1, 1]) {
    const lug = group("strap-lug", [side * 1.73, 0.69, -0.02]);
    lug.rotation.y = (side * Math.PI) / 2;
    box([0.17, 0.2, 0.045], [0, 0, 0], edge, lug, 0.045);
    ring(0.055, 0.025, [0, 0, 0.039], silver, lug);
    const triangle = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0.015, 0.07),
        new THREE.Vector3(-0.115, -0.18, 0.09),
        new THREE.Vector3(0.115, -0.18, 0.09),
      ],
      true,
      "centripetal",
    );
    mesh(
      new THREE.TubeGeometry(triangle, 24, 0.017, 6, true),
      silver,
      lug,
      [0, 0, 0],
    );
    box([0.19, 0.085, 0.043], [0, -0.17, 0.091], rubber, lug, 0.018);
  }

  // Rear: tilting 3-inch LCD, hinge rails, full button layout and thumb rest.
  box([2.29, 1.47, 0.052], [0.43, -0.198, -0.482], edge, root, 0.055).name =
    "monitor-hinge-frame";
  for (const x of [-0.43, 1.29])
    box([0.135, 0.38, 0.08], [x, -0.45, -0.528], black, root, 0.02);
  box([2.25, 1.46, 0.1], [0.43, -0.205, -0.558], rubber, root, 0.058).name =
    "rear-monitor";
  box([2.1, 1.28, 0.016], [0.43, -0.18, -0.617], black, root, 0.025);
  const screen = textLabel(
    "",
    2.02,
    1.17,
    [0.43, -0.162, -0.628],
    root,
    "#a9b6b8",
    "#11191c",
  );
  screen.rotation.y = Math.PI;
  rearLabel("SONY", 0.31, 0.081, [0.43, -0.871, -0.619], root, "#acafaf");
  button("custom-c3", [1.38, 0.71, -0.493], 0.089, "back", "C3");
  const menu = button("menu-button", [0.98, 0.71, -0.493], 0.092, "back");
  menu.scale.x = 1.4;
  textLabel("MENU", 0.21, 0.063, [0, 0, 0.041], menu);
  button("movie-button", [-0.48, 0.73, -0.507], 0.09, "back");
  const rec = cylinder(
    0.045,
    0.006,
    [-0.48, 0.73, -0.553],
    material(0xa13228, 0.45),
  );
  rec.rotation.y = Math.PI;
  button("af-on-button", [-0.89, 0.56, -0.512], 0.1, "back");
  rearLabel("AF-ON", 0.245, 0.074, [-0.89, 0.707, -0.535]);
  button("ael-button", [-1.35, 0.6, -0.522], 0.087, "back");
  rearLabel("AEL", 0.18, 0.077, [-1.36, 0.762, -0.533]);
  box([0.31, 1.09, 0.12], [-1.48, -0.1, -0.503], rubber, root, 0.13).name =
    "rear-thumb-rest";
  const joystick = group("multi-selector", [-0.98, 0.284, -0.534]);
  joystick.rotation.y = Math.PI;
  cylinder(0.119, 0.026, [0, 0, 0], black, joystick);
  cylinder(0.074, 0.088, [0, 0, 0.037], rubber, joystick);
  ring(0.064, 0.012, [0, 0, 0.084], edge, joystick);
  for (const [x, y] of [
    [0, 0],
    [-0.026, 0],
    [0.026, 0],
    [0, -0.026],
    [0, 0.026],
  ])
    cylinder(0.007, 0.005, [x, y, 0.085], black, joystick);
  button("function-button", [-0.99, -0.015, -0.514], 0.08, "back", "Fn");
  const control = dial(
    "rear-control-wheel",
    [-1.0, -0.407, -0.526],
    0.238,
    0.047,
    "back",
    64,
  );
  ring(0.182, 0.008, [0, 0, 0.035], black, control);
  cylinder(0.097, 0.052, [0, 0, 0.041], body, control);
  ring(0.097, 0.007, [0, 0, 0.069], edge, control);
  textLabel("DISP", 0.11, 0.055, [0, 0.143, 0.04], control);
  textLabel("ISO", 0.084, 0.056, [0.15, 0, 0.04], control);
  for (const offset of [0, 0.012]) {
    for (const y of [-0.02, 0.02])
      box(
        [0.042, 0.005, 0.002],
        [-0.15 + offset, y + offset, 0.04],
        white,
        control,
        0.001,
      );
    for (const x of [-0.021, 0.021])
      box(
        [0.005, 0.04, 0.002],
        [-0.15 + x + offset, offset, 0.04],
        white,
        control,
        0.001,
      );
  }
  textLabel("▼", 0.041, 0.034, [0, -0.146, 0.04], control);
  const playback = button(
    "playback-button",
    [-0.86, -0.812, -0.507],
    0.077,
    "back",
  );
  const playIcon = new THREE.Shape()
    .moveTo(-0.022, -0.03)
    .lineTo(0.034, 0)
    .lineTo(-0.022, 0.03);
  mesh(new THREE.ShapeGeometry(playIcon), white, playback, [0, 0, 0.041]);
  button("custom-c4", [-1.23, -0.812, -0.507], 0.077, "back", "C4");
  const trash = group("delete-icon", [-1.23, -0.962, -0.49]);
  trash.rotation.y = Math.PI;
  box([0.064, 0.006, 0.002], [0, 0.024, 0], white, trash, 0.001);
  box([0.041, 0.005, 0.002], [0, -0.03, 0], white, trash, 0.001);
  for (const x of [-0.022, 0, 0.022])
    box([0.004, 0.047, 0.002], [x, -0.003, 0], white, trash, 0.001);
  box(
    [0.044, 0.085, 0.01],
    [-1.6, -0.787, -0.477],
    material(0x372821, 0.35),
    root,
    0.015,
  ).name = "card-access-lamp";

  // Three flush rubber covers on the connector side, including pull notches.
  for (const [y, z, h, w, label] of [
    [0.34, 0.16, 0.88, 0.3, "MIC"],
    [0.31, -0.23, 0.94, 0.3, "HDMI"],
    [-0.61, -0.01, 0.64, 0.69, "MULTI  USB"],
  ] as const) {
    box([0.048, h, w], [1.715, y, z], black, root, 0.025);
    box([0.035, h - 0.035, w - 0.03], [1.747, y, z], rubber, root, 0.021);
    box([0.014, 0.085, 0.09], [1.77, y - h * 0.34, z], edge, root, 0.015);
    const marking = textLabel(label, w * 0.85, 0.053, [1.77, y, z]);
    marking.rotation.y = Math.PI / 2;
  }
  for (const p of [
    [1.58, -0.9, 0.45],
    [-0.86, -0.9, 0.45],
    [1.6, 0.79, 0.43],
  ] as Point[])
    screw(p);
  for (const p of [
    [1.57, -0.92, -0.47],
    [-1.56, -0.92, -0.47],
    [1.56, 0.51, -0.47],
  ] as Point[])
    screw(p, "back");

  // E-mount flange and SEL2870 barrel: stepped base, broad zoom ring, narrow
  // focus ring, hood bayonet and recessed 55 mm filter thread. No aperture ring.
  const lens = group("fe-28-70-oss", [0.27, -0.06, 0.495]);
  lens.userData.part = "aperture";
  cylinder(0.886, 0.095, [0, 0, 0.005], body, lens);
  cylinder(0.869, 0.037, [0, 0, 0.066], orange, lens);
  ring(0.858, 0.016, [0, 0, 0.085], orange, lens);
  cylinder(0.82, 0.037, [0, 0, 0.097], silver, lens);
  cylinder(0.814, 0.31, [0, 0, 0.265], body, lens);
  ring(0.818, 0.013, [0, 0, 0.135], edge, lens);
  const barrelProfile = [
    [0.8, 0.39],
    [0.86, 0.43],
    [0.99, 0.61],
    [1.008, 0.66],
    [1.015, 0.77],
    [1.015, 1.68],
    [1.006, 1.76],
    [1.006, 2.13],
    [0.979, 2.2],
    [0.96, 2.25],
    [0.78, 2.25],
    [0.755, 2.18],
    [0.737, 2.06],
    [0.67, 1.94],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const barrelGeometry = new THREE.LatheGeometry(barrelProfile, 96);
  barrelGeometry.rotateX(Math.PI / 2);
  // Lathe's +Y axis becomes +Z.
  mesh(barrelGeometry, body, lens, [0, 0, 0]);
  const ringBand = (radius: number, depth: number, z: number) => {
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      depth,
      96,
      1,
      true,
    );
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, ribbedRubber, lens, [0, 0, z]);
  };
  ringBand(1.018, 0.78, 1.22).name = "zoom-ring";
  ribs(1.021, 0.746, 1.22, 144, lens, ribbedRubber, 0.024).name =
    "zoom-ring-ribs";
  ringBand(1.01, 0.34, 1.929).name = "focus-ring";
  ribs(1.013, 0.306, 1.929, 144, lens, ribbedRubber, 0.021).name =
    "focus-ring-ribs";
  for (const [r, z] of [
    [0.819, 0.41],
    [0.991, 0.633],
    [1.013, 0.79],
    [1.022, 0.824],
    [1.024, 1.616],
    [1.014, 1.72],
    [1.016, 1.753],
    [1.016, 2.105],
    [0.992, 2.17],
    [0.963, 2.249],
  ])
    ring(r, 0.009, [0, 0, z], edge, lens);
  // Tangent labels follow the barrel, so the scale reads from above/behind.
  const barrelLabel = (
    text: string,
    angle: number,
    z: number,
    width: number,
    height: number,
    radius: number,
    color?: string,
  ) => {
    const label = textLabel(
      text,
      width,
      height,
      [Math.sin(angle) * radius, Math.cos(angle) * radius, z],
      lens,
      color,
    );
    // Rotate around the optical axis after orienting the decal on the tangent.
    label.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    label.quaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        Math.PI,
      ),
    );
    label.quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        -angle,
      ),
    );
    return label;
  };
  for (const [i, value] of [28, 35, 50, 70].entries())
    barrelLabel(String(value), -0.07 + i * 0.4, 0.717, 0.14, 0.078, 1.024);
  barrelLabel("│", -0.07, 0.522, 0.055, 0.083, 0.937);
  barrelLabel("FE 3.5-5.6/28-70 OSS", 0, 0.283, 0.74, 0.085, 0.824);
  barrelLabel("SONY", -1.45, 0.286, 0.36, 0.11, 0.824, "#eeeeeb");
  cylinder(0.038, 0.008, [0, 0.818, 0.145], white, lens).rotation.x =
    -Math.PI / 2;
  annulus(0.957, 0.754, 2.261, black, lens);
  for (const z of [2.185, 2.209, 2.232, 2.251])
    ring(0.768, 0.008, [0, 0, z], edge, lens);
  ring(0.941, 0.012, [0, 0, 2.275], edge, lens);
  // Front-face engraving follows the rim, rather than a floating label strip.
  const arcText = (
    text: string,
    radius: number,
    start: number,
    span: number,
  ) => {
    [...text].forEach((letter, i) => {
      if (letter === " ") return;
      const angle = start + (i / (text.length - 1) - 0.5) * span;
      const label = textLabel(
        letter,
        0.046,
        0.067,
        [Math.sin(angle) * radius, Math.cos(angle) * radius, 2.278],
        lens,
        "#b2b5b5",
      );
      label.rotation.z = -angle;
    });
  };
  arcText("FE 3.5-5.6/28-70 OSS", 0.856, 0, 1.65);
  arcText("SONY   Ø55", 0.856, Math.PI, 1.0);

  // Recessed optical stack and seven-blade iris, matching the original SEL2870.
  const iris = group("aperture-iris", [0, 0, 1.981], lens);
  cylinder(0.704, 0.015, [0, 0, 1.958], black, lens);
  const irisBlades: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >[] = [];
  for (let i = 0; i < IRIS_BLADES; i++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(18), 3),
    );
    irisBlades.push(
      mesh(geometry, bladeMaterial, iris, [0, 0, i * 0.0006], "aperture"),
    );
  }
  function setAperture(fNumber: number) {
    // A magnified iris preserves a readable opening in the teaching view.
    const inner =
      0.54 * Math.sqrt(3.5 / THREE.MathUtils.clamp(fNumber, 3.5, 22));
    irisBlades.forEach((blade, i) => {
      const a = (i * Math.PI * 2) / IRIS_BLADES,
        b = ((i + 1) * Math.PI * 2) / IRIS_BLADES - 0.005,
        outer = 0.709;
      const p = [
        Math.cos(a) * inner,
        Math.sin(a) * inner,
        0,
        Math.cos(a - 0.21) * outer,
        Math.sin(a - 0.21) * outer,
        0,
        Math.cos(b - 0.21) * outer,
        Math.sin(b - 0.21) * outer,
        0,
        Math.cos(a) * inner,
        Math.sin(a) * inner,
        0,
        Math.cos(b - 0.21) * outer,
        Math.sin(b - 0.21) * outer,
        0,
        Math.cos(b) * inner,
        Math.sin(b) * inner,
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
  setAperture(3.5);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x233e42,
    metalness: 0.32,
    roughness: 0.105,
    transparent: true,
    opacity: 0.83,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    iridescence: 0.45,
    iridescenceIOR: 1.34,
  });
  resources.add(glassMaterial);
  const glassGeometry = new THREE.SphereGeometry(
    1.84,
    80,
    20,
    0,
    Math.PI * 2,
    0,
    0.405,
  );
  glassGeometry.rotateX(Math.PI / 2);
  const glass = mesh(
    glassGeometry,
    glassMaterial,
    lens,
    [0, 0, 0.325],
    "aperture",
  );
  glass.name = "front-optical-element";
  ring(0.724, 0.014, [0, 0, 2.047], material(0x354448, 0.24, 0.6), lens);
  ring(0.67, 0.007, [0, 0, 2.063], material(0x42424c, 0.25, 0.48), lens);

  // SD door (photographer's right), dual card slots and separate battery hatch.
  box(
    [0.022, 1.3, 0.76],
    [-1.848, -0.08, -0.015],
    black,
    root,
    0.028,
    "storage",
  );
  const slots = group("dual-card-slots", [-1.866, -0.06, 0.015]);
  slots.userData.part = "storage";
  const cards = group("memory-cards", [0.21, 0, 0], slots);
  for (let i = 0; i < 2; i++) {
    const y = i === 0 ? -0.29 : 0.25;
    box([0.024, 0.108, 0.52], [0, y, 0], edge, slots, 0.012, "storage");
    box([0.25, 0.066, 0.44], [-0.09, y, 0], black, cards, 0.008, "storage");
    for (let j = 0; j < 9; j++)
      box(
        [0.058, 0.004, 0.027],
        [-0.19, y + 0.036, -0.176 + j * 0.044],
        gold,
        cards,
        0.001,
      );
    const label = textLabel(
      `${i === 0 ? "1" : "2"}  SD`,
      0.3,
      0.08,
      [-0.002, y + 0.2, 0],
      slots,
      "#b6bdc3",
    );
    label.rotation.y = -Math.PI / 2;
  }
  const door = group("sd-door", [-1.844, -0.06, -0.393]);
  door.userData.part = "storage";
  box([0.06, 1.4, 0.785], [0, 0, 0.392], rubber, door, 0.027, "storage");
  box([0.01, 1.3, 0.7], [-0.035, 0, 0.392], body, door, 0.018, "storage");
  for (const y of [-0.49, 0.49])
    box([0.095, 0.15, 0.085], [0, y, 0.014], body, door, 0.025, "storage");
  box([0.018, 0.14, 0.13], [-0.047, 0.34, 0.16], black, door, 0.014, "storage");
  for (let i = 0; i < 3; i++)
    box(
      [0.006, 0.009, 0.105],
      [-0.059, 0.309 + i * 0.025, 0.16],
      edge,
      door,
      0.002,
      "storage",
    );
  const doorLabel = textLabel(
    "N",
    0.16,
    0.18,
    [-0.043, 0.05, 0.4],
    door,
    "#757b80",
  );
  doorLabel.rotation.y = -Math.PI / 2;
  const battery = group("battery", [-1.26, -0.6, 0.2]);
  battery.userData.part = "storage";
  box([0.57, 0.75, 0.65], [0, 0, 0], rubber, battery, 0.045, "storage");
  textLabel("SONY", 0.32, 0.09, [0, 0.16, 0.331], battery, "#b7b7b7");
  textLabel("NP-FZ100", 0.46, 0.08, [0, -0.06, 0.331], battery, "#b7b7b7");
  for (let i = 0; i < 3; i++)
    box(
      [0.07, 0.015, 0.16],
      [-0.12 + i * 0.12, 0.38, 0.1],
      gold,
      battery,
      0.003,
    );
  const batteryDoor = group("battery-door", [-1.61, -1.062, 0.2]);
  box([0.7, 0.054, 0.79], [0.35, 0, 0], body, batteryDoor, 0.03, "storage");
  box(
    [0.18, 0.013, 0.15],
    [0.4, -0.034, 0.14],
    black,
    batteryDoor,
    0.023,
    "storage",
  );
  const socket = group("tripod-socket", [0.27, -1.078, -0.025]);
  socket.rotation.x = Math.PI / 2;
  cylinder(0.139, 0.018, [0, 0, 0], edge, socket);
  cylinder(0.081, 0.02, [0, 0, 0.01], silver, socket);
  cylinder(0.054, 0.024, [0, 0, 0.019], black, socket);
  ring(0.056, 0.007, [0, 0, 0.032], silver, socket);
  for (const p of [
    [1.46, -1.07, 0.23],
    [1.46, -1.07, -0.29],
    [-0.65, -1.07, -0.3],
  ] as Point[])
    screw(p, "bottom");

  // ALC-F55S-style center-pinch cap, sized to the lens's 55 mm filter thread.
  const cap = group("lens-cap", [2.08, -1.15, 2.61]);
  cap.rotation.set(-0.15, -0.32, -0.18);
  cap.userData.part = "cap";
  cylinder(0.805, 0.095, [0, 0, 0], rubber, cap, "cap");
  ribs(0.805, 0.066, 0, 96, cap, body, 0.019);
  ring(0.78, 0.016, [0, 0, 0.051], edge, cap);
  cylinder(0.749, 0.025, [0, 0, 0.059], body, cap, "cap");
  for (const x of [-0.4, 0.4]) {
    box([0.285, 0.63, 0.028], [x, 0, 0.082], black, cap, 0.065, "cap");
    box([0.205, 0.45, 0.032], [x, 0, 0.108], rubber, cap, 0.035, "cap");
    for (let i = 0; i < 6; i++)
      box(
        [0.17, 0.017, 0.009],
        [x, -0.153 + i * 0.061, 0.129],
        edge,
        cap,
        0.003,
      );
  }
  textLabel(
    "SONY",
    0.53,
    0.139,
    [0, 0, 0.084],
    cap,
    "#c3c5c4",
    undefined,
    "Georgia, serif",
  );

  const anchors: Record<CameraPart, THREE.Vector3> = {
    aperture: new THREE.Vector3(0.85, 0.3, 2.8),
    storage: new THREE.Vector3(-1.89, 0.18, 0.35),
    cap: new THREE.Vector3(2.48, -0.83, 2.73),
  };
  function pose(storage: number, aperture: number) {
    door.rotation.y = -storage * 1.65;
    cards.position.x = 0.21 - storage * 0.35;
    battery.position.y = -0.6 - storage * 1.16;
    batteryDoor.rotation.z = -storage * 1.7;
    glass.material.opacity = 0.83 * (1 - aperture);
  }
  pose(0, 0);

  // Batch opaque, stationary trim by material. Named controls, transparent
  // decals, instanced teeth and moving parts retain their own geometry.
  for (const parent of [root, lens, cap]) {
    const batches = new Map<
      string,
      THREE.Mesh<THREE.BufferGeometry, THREE.Material>[]
    >();
    for (const child of parent.children) {
      if (
        !(child instanceof THREE.Mesh) ||
        child instanceof THREE.InstancedMesh ||
        child.name ||
        Array.isArray(child.material) ||
        child.material.transparent
      )
        continue;
      const key = `${child.material.uuid}:${child.userData.part ?? ""}`;
      const batch = batches.get(key) ?? [];
      batch.push(child);
      batches.set(key, batch);
    }
    for (const batch of batches.values()) {
      if (batch.length < 2) continue;
      const geometries = batch.map((object) => {
        object.updateMatrix();
        const geometry = object.geometry.index
          ? object.geometry.toNonIndexed()
          : object.geometry.clone();
        return geometry.applyMatrix4(object.matrix);
      });
      const geometry = mergeGeometries(geometries);
      geometries.forEach((geometry) => geometry.dispose());
      if (!geometry) continue;
      const combined = mesh(
        geometry,
        batch[0].material,
        parent,
        [0, 0, 0],
        batch[0].userData.part,
      );
      combined.name = "batched-trim";
      for (const object of batch) {
        parent.remove(object);
        resources.delete(object.geometry);
        object.geometry.dispose();
      }
    }
  }
  return {
    root,
    anchors,
    setAperture,
    pose,
    dispose: () => resources.forEach((resource) => resource.dispose()),
  };
}
