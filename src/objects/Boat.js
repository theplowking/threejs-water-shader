import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Boat {
    /**
     * @param {import('./Water').Water} water - The water surface instance
     */
    constructor(water) {
        this.water = water;
        // Create boat mesh
        const boatGeometry = new THREE.BoxGeometry(2, 1, 4);
        const boatMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        this.mesh = new THREE.Mesh(boatGeometry, boatMaterial);
        
        // Create physics body
        this.body = new CANNON.Body({
            mass: 10,
            position: new CANNON.Vec3(0, 2, 0),
            angularDamping: 0.8,
            linearDamping: 0.3
        });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)));
        
        // Initialize controls state
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        // Setup event listeners
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    update(time) {
        // Calculate buoyancy forces
        const corners = [
            new CANNON.Vec3(-1, -0.5, -2),
            new CANNON.Vec3(1, -0.5, -2),
            new CANNON.Vec3(-1, -0.5, 2),
            new CANNON.Vec3(1, -0.5, 2)
        ];

        corners.forEach(corner => {
            const worldPoint = this.body.position.vadd(
                this.body.quaternion.vmult(corner)
            );
            const waterHeight = this.water.getWaterHeightAt(worldPoint.x, worldPoint.z);
            const depth = waterHeight - worldPoint.y;
            
            if (depth > 0) {
                const buoyancyForce = depth * 40;
                const force = new CANNON.Vec3(0, buoyancyForce, 0);
                this.body.applyLocalForce(force, corner);
            }
        });

        // Apply boat movement forces
        const forwardForce = 50;
        const turnForce = 25;
        
        if (this.keys.ArrowUp) {
            this.body.applyLocalForce(new CANNON.Vec3(0, 0, -forwardForce), new CANNON.Vec3(0, 0, 0));
        }
        if (this.keys.ArrowDown) {
            this.body.applyLocalForce(new CANNON.Vec3(0, 0, forwardForce), new CANNON.Vec3(0, 0, 0));
        }
        if (this.keys.ArrowLeft) {
            this.body.applyTorque(new CANNON.Vec3(0, turnForce, 0));
        }
        if (this.keys.ArrowRight) {
            this.body.applyTorque(new CANNON.Vec3(0, -turnForce, 0));
        }

        // Apply drag forces to resist sideways movement
        const velocity = this.body.velocity;
        const localVel = this.body.quaternion.inverse().vmult(velocity);
        
        // Strong resistance to sideways (x) movement
        const lateralDrag = -30;
        const sideForce = new CANNON.Vec3(localVel.x * lateralDrag, 0, 0);
        this.body.applyLocalForce(sideForce, new CANNON.Vec3(0, 0, 0));
        
        // Moderate resistance to forward/backward (z) movement
        const longitudinalDrag = -5;
        const forwardForceResistance = new CANNON.Vec3(0, 0, localVel.z * longitudinalDrag);
        this.body.applyLocalForce(forwardForceResistance, new CANNON.Vec3(0, 0, 0));

        // Sync Three.js mesh with physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}
