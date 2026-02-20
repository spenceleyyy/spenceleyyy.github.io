import * as THREE from "three";

export function initThreePlaceholder() {
  const container = document.getElementById("three-container");
  if (!container) return;

  // Replace the scene below with your own model loader (GLTF/GLB recommended).
  // Example loader path available in this repo: ../lib/three/GLTFLoader.js
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0.2, 6);

  const group = new THREE.Group();
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.4, 160, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.35, transparent: true })
  );
  const ring = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.12, transparent: true })
  );
  group.add(knot, ring);
  scene.add(group);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speed = prefersReduced ? 0.0005 : 0.0022;

  function resize() {
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    group.rotation.y += speed;
    group.rotation.x += speed * 0.6;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  animate();

  window.addEventListener("resize", resize);
}
