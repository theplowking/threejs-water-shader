import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import waterVertexShader from './shaders/water.vert?raw';
import waterFragmentShader from './shaders/water.frag?raw';
import causticsVertexShader from './shaders/caustics.vert?raw';
import causticsFragmentShader from './shaders/caustics.frag?raw';
import { Pane } from 'tweakpane';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping; // Better color reproduction
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Environment map
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('/');
const environmentMap = await cubeTextureLoader.loadAsync([
  'px.png', // positive x
  'nx.png', // negative x 
  'py.png', // positive y
  'ny.png', // negative y
  'pz.png', // positive z
  'nz.png'  // negative z
]);

const poolTexture = new THREE.TextureLoader().load('/pool_tile.jpg');

scene.background = environmentMap;
scene.environment = environmentMap;

// Camera position
camera.position.set(2, 0.5, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Water mesh
const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512);
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 0.9 },

    uEnvironmentMap: { value: environmentMap },

    uWavesAmplitude: { value: 0.05 },
    uWavesFrequency: { value: 1.0 },
    uWavesSpeed: { value: 0.25 },
    uWavesPersistence: { value: 0.3 },
    uWavesLacunarity: { value: 1.6 },
    uWavesIterations: { value: 7 },

    uTroughColor: { value: new THREE.Color('#186691') },
    uSurfaceColor: { value: new THREE.Color('#9bd8c0') },
    uPeakColor: { value: new THREE.Color('#ffffff') },
    uPeakThreshold: { value: 0.08 },
    uTroughThreshold: { value: -0.05 },
    uPeakTransition: { value: 0.05 },
    uTroughTransition: { value: 0.2 },

    uFresnelBias: { value: 0.25 },
    uFresnelScale: { value: 0.25 },
    uFresnelPower: { value: 0.5 }
  },
  transparent: true,
  depthTest: true,
  side: THREE.DoubleSide
});

const groundMaterial = new THREE.ShaderMaterial({
  vertexShader: causticsVertexShader,
  fragmentShader: causticsFragmentShader,
  uniforms: {
    uTexture: { value: poolTexture },
    uTime: { value: 0 },
    uCausticsIntensity: { value: 1.0 },
    uCausticsScale: { value: 10.0 },
    uCausticsSpeed: { value: 0.5 },
    uCausticsThickness: { value: 0.35 },
    uCausticsOffset: { value: 0.75 }
  },
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5;
water.position.y = 0;
scene.add(water);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(2, 2);
// Bottom
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI * 0.5;
ground.position.y = -0.3;
scene.add(ground);

// Add some light to see the ground material
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Animation
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Update water
  waterMaterial.uniforms.uTime.value = elapsedTime;

  // Update caustics
  groundMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();


// ---- UI CODE -----

// Tweakpane
const pane = new Pane();

// Water parameters folder
const waterFolder = pane.addFolder({ title: 'Water' });

// Big waves
const wavesFolder = waterFolder.addFolder({ title: 'Waves' });
wavesFolder.addBinding(waterMaterial.uniforms.uWavesAmplitude, 'value', {
  min: 0, max: 5, label: 'Amplitude'
});
wavesFolder.addBinding(waterMaterial.uniforms.uWavesFrequency, 'value', {
  min: 0.1, max: 10, step: 0.1, label: 'Frequency'
});
wavesFolder.addBinding(waterMaterial.uniforms.uWavesPersistence, 'value', {
  min: 0, max: 1, step: 0.001, label: 'Persistence'
});
wavesFolder.addBinding(waterMaterial.uniforms.uWavesLacunarity, 'value', {
  min: 0, max: 3, step: 0.001, label: 'Lacunarity'
});
wavesFolder.addBinding(waterMaterial.uniforms.uWavesIterations, 'value', {
  min: 1, max: 8, step: 1, label: 'Iterations'
});
wavesFolder.addBinding(waterMaterial.uniforms.uWavesSpeed, 'value', {
  min: 0, max: 1, step: 0.001, label: 'Speed'
});

// Color
const colorFolder = waterFolder.addFolder({ title: 'Color' });

colorFolder.addBinding(waterMaterial.uniforms.uOpacity, 'value', {
  min: 0, max: 1, step: 0.01, label: 'Opacity'
});

colorFolder.addBinding(waterMaterial.uniforms.uTroughColor, 'value', {
  label: 'Trough Color', view: 'color', color: { type: 'float' }
});
colorFolder.addBinding(waterMaterial.uniforms.uSurfaceColor, 'value', {
  label: 'Surface Color', view: 'color', color: { type: 'float' }
});
colorFolder.addBinding(waterMaterial.uniforms.uPeakColor, 'value', {
  label: 'Peak Color',
  view: 'color',
  color: { type: 'float' }
});
colorFolder.addBinding(waterMaterial.uniforms.uPeakThreshold, 'value', {
  min: -0.1,
  max: 0.1,
  label: 'Peak Threshold'
});
colorFolder.addBinding(waterMaterial.uniforms.uPeakTransition, 'value', {
  min: 0,
  max: 0.1,
  label: 'Peak Transition'
});
colorFolder.addBinding(waterMaterial.uniforms.uTroughThreshold, 'value', {
  min: -0.1,
  max: 0.1,
  label: 'Trough Threshold'
});
colorFolder.addBinding(waterMaterial.uniforms.uTroughTransition, 'value', {
  min: 0,
  max: 0.1,
  label: 'Trough Transition'
});

// Fresnel
const fresnelFolder = waterFolder.addFolder({ title: 'Fresnel' });
fresnelFolder.addBinding(waterMaterial.uniforms.uFresnelBias, 'value', {
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Bias'
});
fresnelFolder.addBinding(waterMaterial.uniforms.uFresnelScale, 'value', {
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Scale'
});
fresnelFolder.addBinding(waterMaterial.uniforms.uFresnelPower, 'value', {
  min: 0,
  max: 1,
  step: 0.001,
  label: 'Power'
});

// Add Caustics controls
const causticsFolder = waterFolder.addFolder({ title: 'Caustics' });
causticsFolder.addBinding(groundMaterial.uniforms.uCausticsIntensity, 'value', {
  min: 0,
  max: 2,
  step: 0.01,
  label: 'Intensity'
});
causticsFolder.addBinding(groundMaterial.uniforms.uCausticsScale, 'value', {
  min: 0,
  max: 20,
  step: 0.1,
  label: 'Scale'
});
causticsFolder.addBinding(groundMaterial.uniforms.uCausticsSpeed, 'value', {
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Speed'
});
causticsFolder.addBinding(groundMaterial.uniforms.uCausticsOffset, 'value', {
  min: 0,
  max: 2,
  step: 0.01,
  label: 'Offset'
});
causticsFolder.addBinding(groundMaterial.uniforms.uCausticsThickness, 'value', {
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Thickness'
});