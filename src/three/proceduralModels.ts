import * as THREE from 'three';
import { StudioMaterialLibrary } from './proceduralMaterials';
import {
  CharacterExpression,
  CharacterProp,
  EnvironmentStage,
} from '../timeline/explainerData';

export interface HeroCharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftBrow: THREE.Mesh;
  rightBrow: THREE.Mesh;
  leftPupil: THREE.Mesh;
  rightPupil: THREE.Mesh;
  leftUpperLid: THREE.Mesh;
  rightUpperLid: THREE.Mesh;
  mouthMesh: THREE.Mesh;
  smileMesh: THREE.Mesh;
  props: {
    wholeApple: THREE.Group;
    halvedApple: THREE.Group;
    cyanideVial: THREE.Group;
    coffeeMug: THREE.Group;
  };
  updateCharacter: (
    time: number,
    expression: CharacterExpression,
    prop: CharacterProp,
    stage: EnvironmentStage
  ) => void;
}

export interface EnvironmentRig {
  root: THREE.Group;
  bedroomNightGroup: THREE.Group;
  seedLabGroup: THREE.Group;
  hypoxiaStreetGroup: THREE.Group;
  kitchenDayGroup: THREE.Group;
  orbitingMolecules: THREE.Group;
  giantAppleCore: THREE.Group;
  fallingParticles: THREE.InstancedMesh;
  updateEnvironment: (time: number, stage: EnvironmentStage) => void;
}

function createRoundedBoxGeometry(
  w: number,
  h: number,
  d: number,
  bevel = 0.03
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2 - bevel;
  const hh = h / 2 - bevel;
  shape.moveTo(-hw, -hh - bevel);
  shape.lineTo(hw, -hh - bevel);
  shape.quadraticCurveTo(hw + bevel, -hh - bevel, hw + bevel, -hh);
  shape.lineTo(hw + bevel, hh);
  shape.quadraticCurveTo(hw + bevel, hh + bevel, hw, hh + bevel);
  shape.lineTo(-hw, hh + bevel);
  shape.quadraticCurveTo(-hw - bevel, hh + bevel, -hw - bevel, hh);
  shape.lineTo(-hw - bevel, -hh);
  shape.quadraticCurveTo(-hw - bevel, -hh - bevel, -hw, -hh - bevel);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geo.center();
  return geo;
}

function createAppleMeshGroup(
  mats: StudioMaterialLibrary,
  halved: boolean
): THREE.Group {
  const group = new THREE.Group();

  if (!halved) {
    // Solid plump 3D apple body with crown lobes and base taper
    const mainBodyGeo = new THREE.SphereGeometry(0.135, 24, 20);
    mainBodyGeo.scale(1.05, 0.96, 1.05);
    const mainBody = new THREE.Mesh(mainBodyGeo, mats.appleRedMat);
    mainBody.castShadow = true;
    group.add(mainBody);

    // Upper crown lobes creating the natural apple dimple around the stem
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 16, 14),
        mats.appleRedMat
      );
      lobe.position.set(Math.cos(angle) * 0.042, 0.042, Math.sin(angle) * 0.042);
      group.add(lobe);
    }
  } else {
    // Halved apple showing creamy flesh + 5 dark amygdalin seeds in the core
    const halfGeo = new THREE.SphereGeometry(
      0.15,
      20,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    );
    const rind = new THREE.Mesh(halfGeo, mats.appleRedMat);
    rind.rotation.x = -Math.PI / 2;
    group.add(rind);

    const faceGeo = new THREE.CircleGeometry(0.148, 20);
    const face = new THREE.Mesh(faceGeo, mats.appleFleshMat);
    face.position.z = 0.002;
    group.add(face);

    // 5 black seeds arranged in a 5-point star inside the apple core
    const seedGeo = new THREE.ConeGeometry(0.018, 0.052, 8);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const seed = new THREE.Mesh(seedGeo, mats.appleSeedMat);
      seed.position.set(Math.cos(angle) * 0.045, Math.sin(angle) * 0.045, 0.012);
      seed.rotation.z = angle + Math.PI / 2;
      seed.scale.set(1, 1, 0.55);
      group.add(seed);
    }
  }

  // Stem & Leaf (secondary + accent details)
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.014, 0.08, 8);
  const stem = new THREE.Mesh(stemGeo, mats.stemMat);
  stem.position.set(0, 0.14, 0);
  stem.rotation.z = -0.2;
  group.add(stem);

  const leafGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const leaf = new THREE.Mesh(leafGeo, mats.leafMat);
  leaf.scale.set(1.6, 0.35, 0.8);
  leaf.position.set(0.038, 0.155, 0);
  leaf.rotation.z = 0.35;
  group.add(leaf);

  return group;
}

function createCyanideMoleculeCluster(
  mats: StudioMaterialLibrary,
  scale = 1
): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  // H - C ≡ N linear molecular structure
  const cAtom = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 16),
    mats.cyanideAtomMat
  );
  group.add(cAtom);

  const nAtom = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    mats.nitrogenAtomMat
  );
  nAtom.position.set(0.16, 0, 0);
  group.add(nAtom);

  const hAtom = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 14, 14),
    mats.hoodieCordMat
  );
  hAtom.position.set(-0.13, 0, 0);
  group.add(hAtom);

  // Triple bond between C and N
  const bondGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8);
  bondGeo.rotateZ(Math.PI / 2);
  [-0.022, 0, 0.022].forEach((offsetY) => {
    const bond = new THREE.Mesh(bondGeo, mats.bondMat);
    bond.position.set(0.08, offsetY, 0);
    group.add(bond);
  });

  // Single bond between H and C
  const hcBond = new THREE.Mesh(bondGeo, mats.bondMat);
  hcBond.position.set(-0.065, 0, 0);
  group.add(hcBond);

  return group;
}

function createCoffeeMugGroup(mats: StudioMaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.078, 0.21, 18),
    mats.mugMat
  );
  body.castShadow = true;
  group.add(body);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.015, 10, 18, Math.PI),
    mats.mugMat
  );
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.08, 0, 0);
  group.add(handle);

  const coffeeTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.076, 16),
    mats.hairMat
  );
  coffeeTop.rotation.x = -Math.PI / 2;
  coffeeTop.position.y = 0.096;
  group.add(coffeeTop);

  return group;
}

export function createHeroCharacter(
  mats: StudioMaterialLibrary
): HeroCharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Contact shadow disc grounded at y = 0.015
  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    mats.contactShadowMat
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  root.add(shadowDisc);

  // 1. Legs & Sneakers (grounded at y = 0)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, 0.72, 0);
  bodyGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, 0.72, 0);
  bodyGroup.add(rightLegPivot);

  const legGeo = createRoundedBoxGeometry(0.24, 0.58, 0.26, 0.02);
  const shoeGeo = createRoundedBoxGeometry(0.26, 0.15, 0.34, 0.025);

  const leftLegMesh = new THREE.Mesh(legGeo, mats.pantsMat);
  leftLegMesh.position.y = -0.29;
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);

  const leftShoeMesh = new THREE.Mesh(shoeGeo, mats.shoeMat);
  leftShoeMesh.position.set(0, -0.64, 0.04);
  leftShoeMesh.castShadow = true;
  leftLegPivot.add(leftShoeMesh);

  const rightLegMesh = new THREE.Mesh(legGeo, mats.pantsMat);
  rightLegMesh.position.y = -0.29;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);

  const rightShoeMesh = new THREE.Mesh(shoeGeo, mats.shoeMat);
  rightShoeMesh.position.set(0, -0.64, 0.04);
  rightShoeMesh.castShadow = true;
  rightLegPivot.add(rightShoeMesh);

  // 2. Blocky Orange Hoodie Torso (matching reference video!)
  const torsoGeo = createRoundedBoxGeometry(0.62, 0.72, 0.36, 0.045);
  const torsoMesh = new THREE.Mesh(torsoGeo, mats.hoodieMat);
  torsoMesh.position.set(0, 1.06, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyGroup.add(torsoMesh);

  // Kangaroo front pocket on the hoodie
  const pocketGeo = createRoundedBoxGeometry(0.38, 0.21, 0.06, 0.02);
  const pocketMesh = new THREE.Mesh(pocketGeo, mats.hoodieMat);
  pocketMesh.position.set(0, 0.86, 0.175);
  bodyGroup.add(pocketMesh);

  // Two vertical white drawstring cords on chest (signature detail from reference video!)
  const cordGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.24, 10);
  const leftCord = new THREE.Mesh(cordGeo, mats.hoodieCordMat);
  leftCord.position.set(-0.055, 1.18, 0.185);
  bodyGroup.add(leftCord);

  const rightCord = new THREE.Mesh(cordGeo, mats.hoodieCordMat);
  rightCord.position.set(0.055, 1.18, 0.185);
  bodyGroup.add(rightCord);

  // Hoodie neck collar
  const collarGeo = new THREE.TorusGeometry(0.16, 0.048, 10, 20);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, mats.hoodieMat);
  collarMesh.position.set(0, 1.41, 0.01);
  bodyGroup.add(collarMesh);

  // 3. Articulated Left & Right Arms
  const armGeo = createRoundedBoxGeometry(0.19, 0.54, 0.2, 0.03);
  const handGeo = createRoundedBoxGeometry(0.15, 0.15, 0.15, 0.03);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.4, 1.35, 0);
  bodyGroup.add(leftArmPivot);

  const leftSleeve = new THREE.Mesh(armGeo, mats.hoodieMat);
  leftSleeve.position.y = -0.24;
  leftSleeve.castShadow = true;
  leftArmPivot.add(leftSleeve);

  const leftHand = new THREE.Mesh(handGeo, mats.skinMat);
  leftHand.position.y = -0.55;
  leftArmPivot.add(leftHand);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.4, 1.35, 0);
  bodyGroup.add(rightArmPivot);

  const rightSleeve = new THREE.Mesh(armGeo, mats.hoodieMat);
  rightSleeve.position.y = -0.24;
  rightSleeve.castShadow = true;
  rightArmPivot.add(rightSleeve);

  const rightHand = new THREE.Mesh(handGeo, mats.skinMat);
  rightHand.position.y = -0.55;
  rightArmPivot.add(rightHand);

  // Prop attachment anchor in right hand
  const propAnchor = new THREE.Group();
  propAnchor.position.set(-0.04, -0.56, 0.14);
  rightArmPivot.add(propAnchor);

  const wholeApple = createAppleMeshGroup(mats, false);
  const halvedApple = createAppleMeshGroup(mats, true);
  const cyanideVial = createCyanideMoleculeCluster(mats, 1.15);
  const coffeeMug = createCoffeeMugGroup(mats);

  propAnchor.add(wholeApple);
  propAnchor.add(halvedApple);
  propAnchor.add(cyanideVial);
  propAnchor.add(coffeeMug);

  // 4. Low-Poly Faceted Head & Expressive Face (matching reference video!)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.46, 0);
  bodyGroup.add(headPivot);

  const headGeo = new THREE.IcosahedronGeometry(0.285, 2);
  headGeo.scale(1.02, 1.06, 0.95);
  const headMesh = new THREE.Mesh(headGeo, mats.skinMat);
  headMesh.position.y = 0.25;
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  // Subtle low-poly nose wedge
  const noseGeo = new THREE.ConeGeometry(0.038, 0.075, 4);
  const noseMesh = new THREE.Mesh(noseGeo, mats.skinMat);
  noseMesh.rotation.x = Math.PI / 2;
  noseMesh.position.set(0, 0.24, 0.28);
  headPivot.add(noseMesh);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.06, 0.11, 0.08);
  const leftEar = new THREE.Mesh(earGeo, mats.skinMat);
  leftEar.position.set(-0.28, 0.24, 0);
  headPivot.add(leftEar);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.28;
  headPivot.add(rightEar);

  // Chunky Low-Poly Brown Hair Blocks (7 distinct blocks for the sculpted tuft)
  const hairGroup = new THREE.Group();
  hairGroup.position.y = 0.25;
  headPivot.add(hairGroup);

  const hairBlocks: Array<{
    size: [number, number, number];
    pos: [number, number, number];
    rot: [number, number, number];
  }> = [
    { size: [0.58, 0.16, 0.54], pos: [0, 0.24, -0.02], rot: [0.05, 0, 0] },
    { size: [0.22, 0.18, 0.24], pos: [-0.16, 0.28, 0.15], rot: [0.2, 0.15, -0.18] },
    { size: [0.24, 0.2, 0.25], pos: [0.02, 0.3, 0.18], rot: [-0.18, 0.08, 0.08] },
    { size: [0.22, 0.17, 0.24], pos: [0.18, 0.27, 0.14], rot: [0.15, -0.2, 0.15] },
    { size: [0.14, 0.28, 0.48], pos: [-0.26, 0.12, -0.04], rot: [0, 0, 0.1] },
    { size: [0.14, 0.28, 0.48], pos: [0.26, 0.12, -0.04], rot: [0, 0, -0.1] },
    { size: [0.54, 0.32, 0.16], pos: [0, 0.08, -0.22], rot: [-0.1, 0, 0] },
  ];

  for (const b of hairBlocks) {
    const geo = createRoundedBoxGeometry(b.size[0], b.size[1], b.size[2], 0.02);
    const mesh = new THREE.Mesh(geo, mats.hairMat);
    mesh.position.set(...b.pos);
    mesh.rotation.set(...b.rot);
    mesh.castShadow = true;
    hairGroup.add(mesh);
  }

  // Eyes (Sclera + Pupil + Animatable Eyelid)
  const scleraGeo = new THREE.SphereGeometry(0.055, 16, 12);
  scleraGeo.scale(1, 1, 0.4);
  const pupilGeo = new THREE.SphereGeometry(0.028, 14, 10);
  pupilGeo.scale(1, 1, 0.45);
  const lidGeo = new THREE.BoxGeometry(0.12, 0.06, 0.06);

  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.095, 0.28, 0.245);
  headPivot.add(leftEyeGroup);

  const leftSclera = new THREE.Mesh(scleraGeo, mats.eyeWhiteMat);
  leftEyeGroup.add(leftSclera);

  const leftPupil = new THREE.Mesh(pupilGeo, mats.eyePupilMat);
  leftPupil.position.z = 0.018;
  leftEyeGroup.add(leftPupil);

  const leftUpperLid = new THREE.Mesh(lidGeo, mats.skinMat);
  leftUpperLid.position.set(0, 0.055, 0.015);
  leftEyeGroup.add(leftUpperLid);

  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.095, 0.28, 0.245);
  headPivot.add(rightEyeGroup);

  const rightSclera = new THREE.Mesh(scleraGeo, mats.eyeWhiteMat);
  rightEyeGroup.add(rightSclera);

  const rightPupil = new THREE.Mesh(pupilGeo, mats.eyePupilMat);
  rightPupil.position.z = 0.018;
  rightEyeGroup.add(rightPupil);

  const rightUpperLid = new THREE.Mesh(lidGeo, mats.skinMat);
  rightUpperLid.position.set(0, 0.055, 0.015);
  rightEyeGroup.add(rightUpperLid);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.115, 0.032, 0.045);
  const leftBrow = new THREE.Mesh(browGeo, mats.hairMat);
  leftBrow.position.set(-0.095, 0.365, 0.258);
  headPivot.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, mats.hairMat);
  rightBrow.position.set(0.095, 0.365, 0.258);
  headPivot.add(rightBrow);

  // Mouth (neutral/open capsule + happy curved smile)
  const mouthGeo = createRoundedBoxGeometry(0.1, 0.032, 0.04, 0.01);
  const mouthMesh = new THREE.Mesh(mouthGeo, mats.mouthMat);
  mouthMesh.position.set(0, 0.15, 0.255);
  headPivot.add(mouthMesh);

  const smileGeo = new THREE.TorusGeometry(0.048, 0.014, 8, 16, Math.PI);
  const smileMesh = new THREE.Mesh(smileGeo, mats.mouthMat);
  smileMesh.rotation.x = Math.PI;
  smileMesh.position.set(0, 0.165, 0.258);
  smileMesh.visible = false;
  headPivot.add(smileMesh);

  const updateCharacter = (
    time: number,
    expression: CharacterExpression,
    prop: CharacterProp,
    stage: EnvironmentStage
  ) => {
    // 1. Toggle active hand prop
    wholeApple.visible = prop === 'whole_apple' || prop === 'bitten_apple';
    halvedApple.visible = prop === 'halved_apple_seeds';
    cyanideVial.visible = prop === 'crushed_seeds_vial';
    coffeeMug.visible = prop === 'coffee_mug';

    // Rotate cyanide molecule prop if active
    if (cyanideVial.visible) {
      cyanideVial.rotation.y = time * 2.2;
      cyanideVial.rotation.z = Math.sin(time * 3) * 0.3;
    }

    // 2. Breathing & Walking animation
    const breathe = Math.sin(time * 2.6) * 0.012;
    bodyGroup.position.y = breathe;

    if (stage === 'hypoxia_street') {
      // Walking & staggering through the 150-seed hypoxia street
      const walkCycle = time * 4.5;
      leftLegPivot.rotation.x = Math.sin(walkCycle) * 0.32;
      rightLegPivot.rotation.x = -Math.sin(walkCycle) * 0.32;
      bodyGroup.rotation.z = Math.sin(walkCycle * 0.5) * 0.04;
    } else {
      leftLegPivot.rotation.x = 0;
      rightLegPivot.rotation.x = 0;
      bodyGroup.rotation.z = 0;
    }

    // 3. Arm choreography matching the reference video
    // Right arm holds the prop up toward chest/face
    rightArmPivot.rotation.x = -0.85 + Math.sin(time * 2.2) * 0.08;
    rightArmPivot.rotation.z = -0.22;

    // Left arm waves during transition / resolution or rests naturally
    if (time >= 11.2 && time <= 16.5) {
      // Gesturing to the seed lab molecules
      leftArmPivot.rotation.x = -0.65 + Math.sin(time * 3.5) * 0.15;
      leftArmPivot.rotation.z = 0.25;
    } else if (time >= 23.4 && time <= 26.8) {
      // Friendly wave in kitchen (just like reference video!)
      leftArmPivot.rotation.z = 2.35 + Math.sin(time * 7.0) * 0.22;
      leftArmPivot.rotation.x = -0.2;
    } else {
      leftArmPivot.rotation.x = Math.sin(time * 1.8) * 0.06;
      leftArmPivot.rotation.z = 0.08;
    }

    // 4. Head movement & natural blinking
    headPivot.rotation.y = Math.sin(time * 1.3) * 0.12;
    headPivot.rotation.x = Math.cos(time * 1.7) * 0.04;

    const blinkPhase = time % 3.4;
    const isBlinking = blinkPhase > 3.22 && blinkPhase < 3.36;

    // 5. Facial expressions (eyebrows, eyelids, pupils, mouth)
    if (expression === 'curious') {
      leftBrow.rotation.z = 0.08;
      rightBrow.rotation.z = -0.14;
      leftBrow.position.y = 0.368;
      rightBrow.position.y = 0.378;
      leftUpperLid.position.y = isBlinking ? 0.01 : 0.055;
      rightUpperLid.position.y = isBlinking ? 0.01 : 0.055;
      mouthMesh.visible = true;
      smileMesh.visible = false;
      mouthMesh.scale.set(0.9, 1.0, 1.0);
    } else if (expression === 'shocked') {
      // Furrowed/raised brows + wide eyes + open 'O' mouth for CYANIDE reveal
      leftBrow.rotation.z = -0.22;
      rightBrow.rotation.z = 0.22;
      leftBrow.position.y = 0.372;
      rightBrow.position.y = 0.372;
      leftUpperLid.position.y = isBlinking ? 0.01 : 0.062;
      rightUpperLid.position.y = isBlinking ? 0.01 : 0.062;
      mouthMesh.visible = true;
      smileMesh.visible = false;
      mouthMesh.scale.set(0.85, 1.9 + Math.sin(time * 8) * 0.25, 1.0);
    } else if (expression === 'dizzy') {
      // Half-closed heavy eyelids during cellular hypoxia
      leftBrow.rotation.z = 0.24;
      rightBrow.rotation.z = -0.24;
      leftBrow.position.y = 0.36;
      rightBrow.position.y = 0.36;
      leftUpperLid.position.y = 0.025;
      rightUpperLid.position.y = 0.025;
      headPivot.rotation.z = Math.sin(time * 3.2) * 0.08;
      mouthMesh.visible = true;
      smileMesh.visible = false;
      mouthMesh.scale.set(1.15, 1.3, 1.0);
    } else {
      // 'happy' or 'confident'
      leftBrow.rotation.z = 0.06;
      rightBrow.rotation.z = -0.06;
      leftBrow.position.y = 0.375;
      rightBrow.position.y = 0.375;
      leftUpperLid.position.y = isBlinking ? 0.01 : 0.058;
      rightUpperLid.position.y = isBlinking ? 0.01 : 0.058;
      headPivot.rotation.z = 0;
      mouthMesh.visible = false;
      smileMesh.visible = true;
    }

    // Subtle eye glance tracking
    leftPupil.position.x = Math.sin(time * 1.5) * 0.012;
    rightPupil.position.x = Math.sin(time * 1.5) * 0.012;
  };

  return {
    root,
    bodyGroup,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    leftBrow,
    rightBrow,
    leftPupil,
    rightPupil,
    leftUpperLid,
    rightUpperLid,
    mouthMesh,
    smileMesh,
    props: {
      wholeApple,
      halvedApple,
      cyanideVial,
      coffeeMug,
    },
    updateCharacter,
  };
}

export function createEnvironmentStages(
  mats: StudioMaterialLibrary
): EnvironmentRig {
  const root = new THREE.Group();

  // =========================================================================
  // STAGE 1: Bedroom Night (0:00 - 11.2s) - Matches Reference Video Scene 1!
  // =========================================================================
  const bedroomNightGroup = new THREE.Group();
  root.add(bedroomNightGroup);

  const bedroomFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
  );
  bedroomFloor.rotation.x = -Math.PI / 2;
  bedroomFloor.receiveShadow = true;
  bedroomNightGroup.add(bedroomFloor);

  // Signature Bullseye Target Rug under the character (y = 0.02 to prevent Z-fighting)
  const bullseyeRug = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 36),
    mats.bullseyeRugMat
  );
  bullseyeRug.rotation.x = -Math.PI / 2;
  bullseyeRug.position.set(0, 0.02, 0.1);
  bullseyeRug.receiveShadow = true;
  bedroomNightGroup.add(bullseyeRug);

  // Back wall
  const bedroomWall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 9),
    new THREE.MeshStandardMaterial({ color: 0x26354a, roughness: 0.9 })
  );
  bedroomWall.position.set(0, 4.5, -2.4);
  bedroomNightGroup.add(bedroomWall);

  // Night Window with Moon & Stars on the right
  const windowFrame = new THREE.Group();
  windowFrame.position.set(1.25, 1.85, -2.35);
  bedroomNightGroup.add(windowFrame);

  const nightGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.3),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  windowFrame.add(nightGlass);

  const moonDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 20),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  moonDisc.position.set(-0.35, 0.25, 0.02);
  windowFrame.add(moonDisc);

  // Bed on the left
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-1.55, 0, -1.1);
  bedroomNightGroup.add(bedGroup);

  const bedFrame = new THREE.Mesh(
    createRoundedBoxGeometry(1.4, 0.38, 2.0, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
  );
  bedFrame.position.y = 0.19;
  bedGroup.add(bedFrame);

  const blanket = new THREE.Mesh(
    createRoundedBoxGeometry(1.36, 0.22, 1.45, 0.04),
    mats.pantsMat
  );
  blanket.position.set(0, 0.42, 0.22);
  bedGroup.add(blanket);

  const pillow = new THREE.Mesh(
    createRoundedBoxGeometry(0.85, 0.16, 0.42, 0.04),
    mats.shoeMat
  );
  pillow.position.set(0, 0.48, -0.68);
  bedGroup.add(pillow);

  // Warm Bedside Lamp (matches reference video's glowing table lamp!)
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.55, 0, -1.85);
  bedroomNightGroup.add(lampGroup);

  const nightStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.62, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 })
  );
  nightStand.position.y = 0.31;
  lampGroup.add(nightStand);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.04, 0.32, 10),
    mats.shoeMat
  );
  lampStem.position.y = 0.78;
  lampGroup.add(lampStem);

  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.24, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      side: THREE.DoubleSide,
    })
  );
  lampShade.position.y = 0.96;
  lampGroup.add(lampShade);

  // =========================================================================
  // STAGE 2: Seed Core & Cyanide Molecular Lab (11.2 - 18.0s)
  // =========================================================================
  const seedLabGroup = new THREE.Group();
  root.add(seedLabGroup);

  const labFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    mats.labFloorMat
  );
  labFloor.rotation.x = -Math.PI / 2;
  seedLabGroup.add(labFloor);

  // Giant Cross-Section Apple Core behind the character showing the 5 amygdalin seeds
  const giantAppleCore = createAppleMeshGroup(mats, true);
  giantAppleCore.scale.setScalar(6.5);
  giantAppleCore.position.set(0, 1.55, -1.75);
  seedLabGroup.add(giantAppleCore);

  // Orbiting 3D HCN Molecules
  const orbitingMolecules = new THREE.Group();
  orbitingMolecules.position.set(0, 1.35, 0);
  seedLabGroup.add(orbitingMolecules);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const mol = createCyanideMoleculeCluster(mats, 1.35);
    mol.position.set(
      Math.cos(angle) * 1.15,
      (i % 2 === 0 ? 0.25 : -0.25),
      Math.sin(angle) * 1.15
    );
    mol.rotation.y = -angle;
    orbitingMolecules.add(mol);
  }

  // =========================================================================
  // STAGE 3: 150-Seed Hypoxia Street (18.0 - 23.4s) - Matches Reference Scene 3!
  // =========================================================================
  const hypoxiaStreetGroup = new THREE.Group();
  root.add(hypoxiaStreetGroup);

  const streetRoad = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 20),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.75 })
  );
  streetRoad.rotation.x = -Math.PI / 2;
  hypoxiaStreetGroup.add(streetRoad);

  // Stylized low-poly trees & streetlamps flanking the road (matching Week 3 in reference)
  const treeFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.7,
    flatShading: true,
  });

  [-1.8, 1.8].forEach((sideX, idx) => {
    for (let z = -5; z <= -1; z += 2.2) {
      const tree = new THREE.Group();
      tree.position.set(sideX + (idx === 0 ? -0.2 : 0.2), 0, z);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.9, 8),
        mats.stemMat
      );
      trunk.position.y = 0.45;
      tree.add(trunk);

      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55, 1),
        treeFoliageMat
      );
      canopy.position.y = 1.25;
      tree.add(canopy);
      hypoxiaStreetGroup.add(tree);
    }
  });

  // =========================================================================
  // STAGE 4: Bright Teal Kitchen (23.4 - 30.0s) - Matches Reference Day 30!
  // =========================================================================
  const kitchenDayGroup = new THREE.Group();
  root.add(kitchenDayGroup);

  const kitchenFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 })
  );
  kitchenFloor.rotation.x = -Math.PI / 2;
  kitchenFloor.receiveShadow = true;
  kitchenDayGroup.add(kitchenFloor);

  const kitchenWall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 9),
    new THREE.MeshStandardMaterial({ color: 0xfef9eb, roughness: 0.85 })
  );
  kitchenWall.position.set(0, 4.5, -2.1);
  kitchenDayGroup.add(kitchenWall);

  // Teal Lower Kitchen Cabinets & Wooden Countertop (exact match to Day 30 in reference!)
  const cabinetBase = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.95, 0.9),
    mats.tealCabinetMat
  );
  cabinetBase.position.set(0, 0.475, -1.6);
  kitchenDayGroup.add(cabinetBase);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.08, 0.96),
    mats.shoeMat
  );
  counterTop.position.set(0, 0.98, -1.6);
  kitchenDayGroup.add(counterTop);

  // Upper Teal Cabinet on the left
  const upperCabinet = new THREE.Mesh(
    createRoundedBoxGeometry(1.1, 1.35, 0.55, 0.03),
    mats.tealCabinetMat
  );
  upperCabinet.position.set(-1.35, 2.15, -1.8);
  kitchenDayGroup.add(upperCabinet);

  // Wooden Wall Shelf with 3 Jars on the right
  const wallShelf = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.06, 0.35),
    mats.shoeMat
  );
  wallShelf.position.set(0.65, 1.78, -1.9);
  kitchenDayGroup.add(wallShelf);

  for (let i = 0; i < 3; i++) {
    const jar = new THREE.Group();
    jar.position.set(0.28 + i * 0.34, 1.92, -1.9);
    const jarBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.2, 14),
      mats.shoeMat
    );
    const jarLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.084, 0.084, 0.05, 14),
      mats.woodMat
    );
    jarLid.position.y = 0.11;
    jar.add(jarBody, jarLid);
    kitchenDayGroup.add(jar);
  }

  // Potted Green Plants on the right counter
  const plantGroup = new THREE.Group();
  plantGroup.position.set(1.15, 1.02, -1.5);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.26, 14),
    new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 })
  );
  pot.position.y = 0.13;
  plantGroup.add(pot);

  const cactusStem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.32, 8, 12),
    mats.leafMat
  );
  cactusStem.position.y = 0.38;
  plantGroup.add(cactusStem);
  kitchenDayGroup.add(plantGroup);

  // Hanging Teal Dome Pendant Lamp at top right (exact match to Day 30 in reference!)
  const pendantGroup = new THREE.Group();
  pendantGroup.position.set(0.75, 2.45, -0.6);
  kitchenDayGroup.add(pendantGroup);

  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.2, 8),
    mats.eyePupilMat
  );
  cord.position.y = 0.6;
  pendantGroup.add(cord);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x334e58, roughness: 0.4 })
  );
  pendantGroup.add(dome);

  const pendantBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  pendantBulb.position.y = -0.05;
  pendantGroup.add(pendantBulb);

  // =========================================================================
  // Instanced Atmospheric Particles (Stars / Apple Seeds / Snowflakes)
  // =========================================================================
  const particleCount = 60;
  const particleGeo = new THREE.OctahedronGeometry(0.025, 0);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const fallingParticles = new THREE.InstancedMesh(
    particleGeo,
    particleMat,
    particleCount
  );
  fallingParticles.frustumCulled = false;
  root.add(fallingParticles);

  const _dummy = new THREE.Object3D();
  const particleSeeds = Array.from({ length: particleCount }, (_, i) => ({
    x: ((i * 73) % 100) / 25 - 2.0,
    y: ((i * 37) % 100) / 30 + 0.2,
    z: -((i * 53) % 100) / 35 + 0.8,
    speed: 0.35 + (i % 5) * 0.12,
  }));

  const updateEnvironment = (time: number, stage: EnvironmentStage) => {
    bedroomNightGroup.visible = stage === 'bedroom_night';
    seedLabGroup.visible = stage === 'seed_lab';
    hypoxiaStreetGroup.visible = stage === 'hypoxia_street';
    kitchenDayGroup.visible = stage === 'kitchen_day';

    if (stage === 'seed_lab') {
      orbitingMolecules.rotation.y = time * 0.85;
      orbitingMolecules.rotation.z = Math.sin(time * 1.2) * 0.12;
      giantAppleCore.rotation.z = Math.sin(time * 0.8) * 0.08;
    }

    // Update falling snow/seed particles
    fallingParticles.visible = stage !== 'kitchen_day';
    if (fallingParticles.visible) {
      for (let i = 0; i < particleCount; i++) {
        const p = particleSeeds[i];
        const y = ((p.y - time * p.speed) % 3.2 + 3.2) % 3.2;
        _dummy.position.set(
          p.x + Math.sin(time + i) * 0.08,
          y,
          p.z
        );
        _dummy.rotation.set(time * 1.5, i, 0);
        const s = stage === 'seed_lab' ? 1.3 : 0.85;
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        fallingParticles.setMatrixAt(i, _dummy.matrix);
      }
      fallingParticles.instanceMatrix.needsUpdate = true;
    }
  };

  return {
    root,
    bedroomNightGroup,
    seedLabGroup,
    hypoxiaStreetGroup,
    kitchenDayGroup,
    orbitingMolecules,
    giantAppleCore,
    fallingParticles,
    updateEnvironment,
  };
}
