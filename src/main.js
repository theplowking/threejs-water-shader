import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from './objects/Water';
import { Ground } from './objects/Ground';
import { setupUI } from './ui';
import { Boat } from './objects/Boat';

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Animation
const clock = new THREE.Clock();
clock.start();  // Start the clock
let lastTime = 0;  // Track last frame time

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Environment map
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('/threejs-water-shader/');
const environmentMap = cubeTextureLoader.load([
  'px.png', // positive x
  'nx.png', // negative x 
  'py.png', // positive y
  'ny.png', // negative y
  'pz.png', // positive z
  'nz.png'  // negative z
]);

const poolTexture = new THREE.TextureLoader().load('/threejs-water-shader/ocean_floor.png');

scene.background = environmentMap;
scene.environment = environmentMap;

// Camera position
camera.position.set(0.8, 0.03, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add some light to see the ground material
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const waterResolution = { size: 512 };
const water = new Water({
  environmentMap,
  resolution: waterResolution.size
});
scene.add(water);

const ground = new Ground({
  texture: poolTexture
});
scene.add(ground);

// Add boat
const boat = new Boat(water);
scene.add(boat.mesh);
world.addBody(boat.body);

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = clock.getElapsedTime();
  const delta = currentTime - lastTime;
  lastTime = currentTime;

  // Update water
  water.update(currentTime);

  // Update physics
  world.step(1/60, delta, 3);
  boat.update(currentTime);

  ground.update(currentTime);
  controls.update();
  renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
setupUI({ waterResolution, water, ground });
