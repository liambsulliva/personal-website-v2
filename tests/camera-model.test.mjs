import assert from "node:assert/strict";
import { after, test } from "node:test";
import * as THREE from "three";
import { createCameraModel } from "../src/components/camera/model.ts";

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
  for (const fStop of [2.8, 4, 5.6, 8, 11, 16]) {
    model.setAperture(fStop);
    assert.ok(radius() < previous);
    assert.ok(radius() > 0);
    previous = radius();
  }
  assert.equal(iris.children.length, 9);
  model.dispose();
});

test("storage opens the side door and lowers the battery, then fully resets", () => {
  const model = createCameraModel();
  const door = model.root.getObjectByName("sd-door");
  const battery = model.root.getObjectByName("battery");
  const closed = battery.position.clone();
  model.pose(1, 0);
  assert.ok(Math.abs(door.rotation.y) > 1);
  assert.ok(battery.position.y < closed.y - 1);
  assert.equal(battery.position.x, closed.x);
  model.pose(0, 0);
  assert.ok(Math.abs(door.rotation.y) < 1e-9);
  assert.ok(battery.position.equals(closed));
  model.dispose();
});

test("the lens and detached cap can be picked through their visible geometry", () => {
  const model = createCameraModel();
  model.root.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  for (const [part, target] of [
    ["aperture", new THREE.Vector3(0.27, -0.06, 1.85)],
    ["cap", new THREE.Vector3(1.95, -1.15, 1.8)],
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
  });
  const disposed = new Set();
  for (const resource of resources)
    resource.addEventListener("dispose", () => disposed.add(resource));
  model.dispose();
  assert.equal(disposed.size, resources.size);
});
