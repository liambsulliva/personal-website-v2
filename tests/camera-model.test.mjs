import assert from "node:assert/strict";
import { after, test } from "node:test";
import * as THREE from "three";
import {
  CAMERA_F_STOPS,
  createCameraModel,
} from "../src/components/camera/model.ts";

// Texture lettering needs a 2D canvas in the browser. Geometry, raycasting,
// transforms and disposal can be verified without a GPU or browser process.
const originalDocument = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({ fillRect() {}, fillText() {} }),
  }),
};
after(() => {
  globalThis.document = originalDocument;
});

test("all three parts are discoverable and geometry stays finite in each pose", () => {
  const model = createCameraModel();
  const parts = new Set();
  for (const [storage, aperture] of [
    [0, 0],
    [1, 0],
    [0, 1],
  ]) {
    model.pose(storage, aperture);
    model.root.updateMatrixWorld(true);
    model.root.traverse((object) => {
      if (object.userData.part) parts.add(object.userData.part);
      if (!object.isMesh) return;
      for (const value of object.geometry.getAttribute("position").array) {
        assert.ok(Number.isFinite(value), "non-finite geometry coordinate");
      }
      assert.ok(object.matrixWorld.elements.every(Number.isFinite));
    });
  }
  assert.deepEqual([...parts].sort(), ["aperture", "cap", "storage"]);
  model.dispose();
});

test("a higher f-number closes the iris while preserving its open center", () => {
  const model = createCameraModel();
  const iris = model.root.getObjectByName("aperture-iris");
  const radius = () => {
    const positions = iris.children[0].geometry.getAttribute("position");
    return Math.hypot(positions.getX(0), positions.getY(0));
  };
  let previous = Infinity;
  for (const fStop of CAMERA_F_STOPS) {
    model.setAperture(fStop);
    assert.ok(radius() < previous);
    assert.ok(radius() > 0);
    previous = radius();
  }
  assert.equal(iris.children.length, 7);
  model.dispose();
});

test("storage opens the side door and lowers the battery, then fully resets", () => {
  const model = createCameraModel();
  const door = model.root.getObjectByName("sd-door");
  const battery = model.root.getObjectByName("battery");
  const slots = model.root.getObjectByName("dual-card-slots");
  const cards = model.root.getObjectByName("memory-cards");
  const slotsClosed = slots.position.clone();
  const cardsClosed = cards.position.clone();
  const closed = battery.position.clone();
  model.pose(1, 0);
  assert.ok(Math.abs(door.rotation.y) > 1);
  assert.ok(battery.position.y < closed.y - 1);
  assert.equal(battery.position.x, closed.x);
  assert.ok(
    slots.position.equals(slotsClosed),
    "slot sockets stay in the body",
  );
  assert.ok(cards.position.x < cardsClosed.x - 0.3);
  model.pose(0, 0);
  assert.ok(Math.abs(door.rotation.y) < 1e-9);
  assert.ok(battery.position.equals(closed));
  assert.ok(cards.position.equals(cardsClosed));
  model.dispose();
});

test("the lens and detached cap can be picked through their visible geometry", () => {
  const model = createCameraModel();
  model.root.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  for (const [part, target] of [
    ["aperture", new THREE.Vector3(0.27, -0.06, 2.65)],
    ["cap", new THREE.Vector3(2.08, -1.15, 2.61)],
  ]) {
    raycaster.set(
      target.clone().add(new THREE.Vector3(0, 0, 5)),
      new THREE.Vector3(0, 0, -1),
    );
    const hit = raycaster.intersectObject(model.root, true)[0];
    assert.ok(hit, `no visible geometry for ${part}`);
    let object = hit.object;
    while (object && !object.userData.part) object = object.parent;
    assert.equal(object?.userData.part, part);
  }
  model.dispose();
});

test("all model geometries, materials and textures are disposed on exit", () => {
  const model = createCameraModel();
  const resources = new Set();
  model.root.traverse((object) => {
    if (!object.isMesh) return;
    resources.add(object.geometry);
    resources.add(object.material);
    if (object.material.map) resources.add(object.material.map);
    if (object.material.bumpMap) resources.add(object.material.bumpMap);
    if (object.isInstancedMesh) resources.add(object);
  });
  const disposed = new Set();
  for (const resource of resources)
    resource.addEventListener("dispose", () => disposed.add(resource));
  model.dispose();
  assert.equal(disposed.size, resources.size);
});

test("the lens barrel leaves the iris visible through the front element", () => {
  const model = createCameraModel();
  model.pose(0, 1);
  model.setAperture(16);
  model.root.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0.27 + 0.4, -0.06, 4),
    new THREE.Vector3(0, 0, -1),
  );
  const hits = raycaster
    .intersectObject(model.root, true)
    .filter(({ object }) => object.material.opacity > 0);
  assert.equal(hits[0]?.object.parent.name, "aperture-iris");
  model.dispose();
});

test("mode and compensation dials share the grip shoulder and rings remain separate", () => {
  const model = createCameraModel();
  for (const name of [
    "mode-dial",
    "exposure-compensation-dial",
    "shutter-power-switch",
  ]) {
    assert.ok(model.root.getObjectByName(name).position.x < 0);
  }
  const zoom = model.root.getObjectByName("zoom-ring");
  const focus = model.root.getObjectByName("focus-ring");
  assert.ok(focus.position.z > zoom.position.z);
  assert.ok(zoom.geometry.parameters.openEnded);
  assert.ok(focus.geometry.parameters.openEnded);
  model.dispose();
});
