"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function SemesterOrbit({ compact = false }: { compact?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, compact ? 6.5 : 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeometry = new THREE.IcosahedronGeometry(compact ? 1.08 : 1.25, 3);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x6674e8,
      roughness: 0.18,
      metalness: 0.08,
      transmission: 0.22,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const wireGeometry = new THREE.IcosahedronGeometry(compact ? 1.16 : 1.34, 2);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xc6ccff,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    group.add(wire);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x6574e7,
      transparent: true,
      opacity: 0.3,
    });

    const rings: THREE.Mesh[] = [];
    [1.72, 2.15, 2.52].forEach((radius, index) => {
      const geometry = new THREE.TorusGeometry(radius, index === 1 ? 0.014 : 0.009, 10, 160);
      const ring = new THREE.Mesh(geometry, ringMaterial.clone());
      ring.rotation.x = Math.PI / (2.6 + index * 0.4);
      ring.rotation.y = index * 0.7;
      ring.rotation.z = index * 0.45;
      rings.push(ring);
      group.add(ring);
    });

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = compact ? 60 : 95;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const theta = i * 2.399963229728653;
      const radius = 2.45 + ((i * 37) % 41) / 35;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(theta * 1.7) * (1.45 + (i % 7) * 0.07);
      positions[i * 3 + 2] = Math.sin(theta) * radius * 0.55;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x8e99f5,
      size: compact ? 0.025 : 0.032,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    group.add(particles);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0xffffff, 24, 20);
    keyLight.position.set(3.5, 3, 5);
    scene.add(keyLight);
    const accentLight = new THREE.PointLight(0x6574e7, 18, 18);
    accentLight.position.set(-4, -2, 3);
    scene.add(accentLight);

    const target = { x: 0, y: 0 };
    const pointerHandler = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 0.55;
      target.y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 0.4;
    };
    mount.addEventListener("pointermove", pointerHandler);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frame = 0;
    const clock = new THREE.Clock();
    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion) {
        group.rotation.y += (target.x - group.rotation.y) * 0.025;
        group.rotation.x += (-target.y - group.rotation.x) * 0.025;
        core.rotation.y = elapsed * 0.18;
        core.rotation.x = Math.sin(elapsed * 0.42) * 0.12;
        wire.rotation.y = -elapsed * 0.12;
        wire.rotation.z = elapsed * 0.08;
        const ring0 = rings[0];
        const ring1 = rings[1];
        const ring2 = rings[2];
        if (ring0) ring0.rotation.z += 0.0018;
        if (ring1) ring1.rotation.y -= 0.0015;
        if (ring2) ring2.rotation.x += 0.0012;
        particles.rotation.y = elapsed * 0.035;
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(renderFrame);
    };
    renderFrame();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", pointerHandler);
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [compact]);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}
