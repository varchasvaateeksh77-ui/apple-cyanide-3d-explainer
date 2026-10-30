import * as THREE from 'three';

export interface StudioMaterialLibrary {
  skinMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
  hoodieMat: THREE.MeshStandardMaterial;
  hoodieCordMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  shoeMat: THREE.MeshStandardMaterial;
  eyeWhiteMat: THREE.MeshBasicMaterial;
  eyePupilMat: THREE.MeshBasicMaterial;
  mouthMat: THREE.MeshStandardMaterial;
  appleRedMat: THREE.MeshPhysicalMaterial;
  appleFleshMat: THREE.MeshStandardMaterial;
  appleSeedMat: THREE.MeshStandardMaterial;
  stemMat: THREE.MeshStandardMaterial;
  leafMat: THREE.MeshStandardMaterial;
  cyanideAtomMat: THREE.MeshPhysicalMaterial;
  nitrogenAtomMat: THREE.MeshPhysicalMaterial;
  bondMat: THREE.MeshStandardMaterial;
  mugMat: THREE.MeshPhysicalMaterial;
  bullseyeRugMat: THREE.MeshStandardMaterial;
  woodMat: THREE.MeshStandardMaterial;
  tealCabinetMat: THREE.MeshStandardMaterial;
  labFloorMat: THREE.MeshStandardMaterial;
  contactShadowMat: THREE.MeshBasicMaterial;
  disposeAll: () => void;
}

export function createBullseyeRugTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const rings = [
    { r: 248, color: '#c2410c' },
    { r: 205, color: '#e2e8f0' },
    { r: 162, color: '#c2410c' },
    { r: 118, color: '#e2e8f0' },
    { r: 74, color: '#c2410c' },
    { r: 34, color: '#e2e8f0' },
  ];

  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.fillStyle = ring.color;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLabGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.lineWidth = 3;
  const step = 64;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStudioMaterialLibrary(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): StudioMaterialLibrary {
  const maxAniso = renderer.capabilities.getMaxAnisotropy() || 1;
  const rugTex = createBullseyeRugTexture(maxAniso);
  const labTex = createLabGridTexture(maxAniso);
  const shadowTex = createContactShadowTexture();

  // Low-poly faceted skin (matches reference video's warm beige low-poly head)
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe6ccb2,
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  });

  // Chunky brown hair blocks
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  // Signature bright orange hoodie from reference video
  const hoodieMat = new THREE.MeshStandardMaterial({
    color: 0xe85d24,
    roughness: 0.55,
    metalness: 0.08,
  });

  const hoodieCordMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Blue jeans
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x3b66b0,
    roughness: 0.78,
    metalness: 0.05,
  });

  // Clean white blocky sneakers
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.12,
  });

  const eyeWhiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const eyePupilMat = new THREE.MeshBasicMaterial({
    color: 0x111827,
  });

  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x4a1d1f,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Glossy red apple skin with clearcoat
  const appleRedMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: isSoftwareGl ? 0 : 1.0,
    clearcoatRoughness: 0.12,
  });

  // Creamy apple interior flesh
  const appleFleshMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Dark brown/black apple seeds containing amygdalin
  const appleSeedMat = new THREE.MeshStandardMaterial({
    color: 0x291711,
    roughness: 0.25,
    metalness: 0.15,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.85,
    metalness: 0.05,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.45,
    metalness: 0.05,
  });

  const cyanideAtomMat = new THREE.MeshPhysicalMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.3,
  });

  const nitrogenAtomMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.3,
  });

  const bondMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.65,
  });

  const mugMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: isSoftwareGl ? 0 : 0.8,
  });

  const bullseyeRugMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: rugTex,
    roughness: 0.85,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.6,
    metalness: 0.05,
  });

  const tealCabinetMat = new THREE.MeshStandardMaterial({
    color: 0x569da1,
    roughness: 0.48,
    metalness: 0.1,
  });

  const labFloorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: labTex,
    roughness: 0.4,
    metalness: 0.2,
  });

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const allMaterials = [
    skinMat,
    hairMat,
    hoodieMat,
    hoodieCordMat,
    pantsMat,
    shoeMat,
    eyeWhiteMat,
    eyePupilMat,
    mouthMat,
    appleRedMat,
    appleFleshMat,
    appleSeedMat,
    stemMat,
    leafMat,
    cyanideAtomMat,
    nitrogenAtomMat,
    bondMat,
    mugMat,
    bullseyeRugMat,
    woodMat,
    tealCabinetMat,
    labFloorMat,
    contactShadowMat,
  ];

  const allTextures = [rugTex, labTex, shadowTex];

  return {
    skinMat,
    hairMat,
    hoodieMat,
    hoodieCordMat,
    pantsMat,
    shoeMat,
    eyeWhiteMat,
    eyePupilMat,
    mouthMat,
    appleRedMat,
    appleFleshMat,
    appleSeedMat,
    stemMat,
    leafMat,
    cyanideAtomMat,
    nitrogenAtomMat,
    bondMat,
    mugMat,
    bullseyeRugMat,
    woodMat,
    tealCabinetMat,
    labFloorMat,
    contactShadowMat,
    disposeAll: () => {
      allMaterials.forEach((m) => m.dispose());
      allTextures.forEach((t) => t.dispose());
    },
  };
}
