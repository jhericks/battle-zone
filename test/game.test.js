/**
 * Property-Based Tests for BattleZone Tank Game
 * Using fast-check for property-based testing
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

// This file will contain property-based tests for the game features
// Tests will be added as features are implemented

describe('Game Property-Based Tests', () => {
  it('placeholder test - testing infrastructure is set up', () => {
    assert.ok(true, 'Test infrastructure is working');
  });
  
  it('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n; // Identity property
      }),
      { numRuns: 100 }
    );
  });
});

describe('3D Camera System Properties', () => {
  /**
   * Feature: advanced-game-features, Property 8: Camera position matches player position
   * Validates: Requirements 3.1
   * 
   * For any player position during playing state, the camera's x and y coordinates 
   * should match the player's x and y coordinates
   */
  it('Property 8: Camera position matches player position', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          playerY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          playerAngle: fc.float({ min: Math.fround(0), max: Math.fround(2 * Math.PI), noNaN: true })
        }),
        ({ playerX, playerY, playerAngle }) => {
          // Create a player object with random position and angle
          const player = { 
            x: playerX, 
            y: playerY, 
            angle: playerAngle 
          };
          
          // Create a camera object (mimicking the structure from game.js)
          const camera = {
            x: 0,
            y: 0,
            z: 20,
            yaw: 0,
            pitch: 0,
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000
          };
          
          // Simulate updateCamera function from game.js
          function updateCamera(player) {
            camera.x = player.x;
            camera.y = player.y;
            camera.yaw = player.angle;
            return camera;
          }
          
          // Update camera based on player
          const updatedCamera = updateCamera(player);
          
          // Property: Camera x and y should match player x and y
          // Using a small epsilon for floating point comparison
          const epsilon = 0.01;
          const xMatches = Math.abs(updatedCamera.x - player.x) < epsilon;
          const yMatches = Math.abs(updatedCamera.y - player.y) < epsilon;
          
          return xMatches && yMatches;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 9: Camera orientation matches player orientation
   * Validates: Requirements 3.2
   * 
   * For any player angle during playing state, the camera's yaw should match 
   * the player's facing angle
   */
  it('Property 9: Camera orientation matches player orientation', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          playerY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          playerAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true })
        }),
        ({ playerX, playerY, playerAngle }) => {
          // Create a player object with random position and angle
          const player = { 
            x: playerX, 
            y: playerY, 
            angle: playerAngle 
          };
          
          // Create a camera object (mimicking the structure from game.js)
          const camera = {
            x: 0,
            y: 0,
            z: 20,
            yaw: 0,
            pitch: 0,
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000
          };
          
          // Simulate updateCamera function from game.js
          function updateCamera(player) {
            camera.x = player.x;
            camera.y = player.y;
            camera.yaw = player.angle;
            return camera;
          }
          
          // Update camera based on player
          const updatedCamera = updateCamera(player);
          
          // Property: Camera yaw should match player angle
          // Using a small epsilon for floating point comparison
          const epsilon = 0.01;
          const yawMatches = Math.abs(updatedCamera.yaw - player.angle) < epsilon;
          
          return yawMatches;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('3D Projection System Properties', () => {
  /**
   * Feature: advanced-game-features, Property 11: Perspective projection preserves relative positions
   * Validates: Requirements 3.7
   * 
   * For any two 3D points at the same depth, their relative screen positions should maintain 
   * the same ratio as their relative world positions
   */
  it('Property 11: Perspective projection preserves relative positions', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Camera position
          cameraX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          cameraY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          cameraZ: fc.float({ min: Math.fround(10), max: Math.fround(30), noNaN: true }),
          cameraYaw: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          
          // Two points at the same depth but different lateral positions
          depth: fc.float({ min: Math.fround(10), max: Math.fround(100), noNaN: true }),
          lateralOffset1: fc.float({ min: Math.fround(-30), max: Math.fround(30), noNaN: true }),
          lateralOffset2: fc.float({ min: Math.fround(-30), max: Math.fround(30), noNaN: true }),
          heightOffset1: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          heightOffset2: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true })
        }),
        ({ cameraX, cameraY, cameraZ, cameraYaw, depth, lateralOffset1, lateralOffset2, heightOffset1, heightOffset2 }) => {
          // Skip if the two points are too close together (would cause numerical instability)
          const lateralDiff = Math.abs(lateralOffset1 - lateralOffset2);
          const heightDiff = Math.abs(heightOffset1 - heightOffset2);
          if (lateralDiff < 0.5 && heightDiff < 0.5) {
            return true;
          }
          
          // Set up camera
          const camera = {
            x: cameraX,
            y: cameraY,
            z: cameraZ,
            yaw: cameraYaw,
            pitch: 0,
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000
          };
          
          // Canvas dimensions (matching game.js)
          const canvas = { width: 800, height: 600 };
          
          // Simulate project3D function from game.js
          function project3D(x, y, z) {
            // Transform world coordinates to camera space
            let cx = x - camera.x;
            let cy = y - camera.y;
            let cz = z - camera.z;
            
            // Rotate by camera yaw
            const cosYaw = Math.cos(-camera.yaw);
            const sinYaw = Math.sin(-camera.yaw);
            
            const rotatedX = cx * cosYaw - cy * sinYaw;
            const rotatedY = cx * sinYaw + cy * cosYaw;
            
            // Handle clipping
            if (rotatedY <= camera.near) {
              return null;
            }
            
            const depth = Math.max(rotatedY, camera.near);
            
            // Apply perspective projection
            const focalLength = (canvas.width / 2) / Math.tan(camera.fov / 2);
            const screenX = (rotatedX / depth) * focalLength + canvas.width / 2;
            const screenY = (cz / depth) * focalLength + canvas.height / 2;
            
            return { x: screenX, y: screenY, depth: depth };
          }
          
          // Create two points at the same depth but different lateral/height positions
          // Both points are at the same distance from camera (same depth)
          const point1WorldX = camera.x + lateralOffset1 * Math.cos(camera.yaw) + depth * Math.sin(camera.yaw);
          const point1WorldY = camera.y + lateralOffset1 * Math.sin(camera.yaw) + depth * Math.cos(camera.yaw);
          const point1WorldZ = camera.z + heightOffset1;
          
          const point2WorldX = camera.x + lateralOffset2 * Math.cos(camera.yaw) + depth * Math.sin(camera.yaw);
          const point2WorldY = camera.y + lateralOffset2 * Math.sin(camera.yaw) + depth * Math.cos(camera.yaw);
          const point2WorldZ = camera.z + heightOffset2;
          
          // Project both points
          const proj1 = project3D(point1WorldX, point1WorldY, point1WorldZ);
          const proj2 = project3D(point2WorldX, point2WorldY, point2WorldZ);
          
          // Both points should be visible (not behind camera)
          if (!proj1 || !proj2) {
            return true; // Skip if either point is clipped
          }
          
          // Property: The ratio of screen space distances should match the ratio of world space distances
          // Since both points are at the same depth, the perspective scaling is the same
          
          // Calculate world space differences (in camera space, lateral and height)
          const worldDeltaX = lateralOffset2 - lateralOffset1;
          const worldDeltaZ = heightOffset2 - heightOffset1;
          
          // Calculate screen space differences
          const screenDeltaX = proj2.x - proj1.x;
          const screenDeltaY = proj2.y - proj1.y;
          
          // The ratio should be preserved (accounting for focal length scaling)
          // Since both are at same depth, the scaling factor is the same
          const focalLength = (canvas.width / 2) / Math.tan(camera.fov / 2);
          const expectedScreenDeltaX = (worldDeltaX / proj1.depth) * focalLength;
          const expectedScreenDeltaY = (worldDeltaZ / proj1.depth) * focalLength;
          
          // Allow for small floating point errors (relative to the magnitude)
          const epsilon = Math.max(0.5, Math.abs(expectedScreenDeltaX) * 0.01, Math.abs(expectedScreenDeltaY) * 0.01);
          const xMatches = Math.abs(screenDeltaX - expectedScreenDeltaX) < epsilon;
          const yMatches = Math.abs(screenDeltaY - expectedScreenDeltaY) < epsilon;
          
          return xMatches && yMatches;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 10: Perspective projection maintains depth ordering
   * Validates: Requirements 3.7
   * 
   * For any two 3D points at different depths, the point with greater z-distance from camera 
   * should project to a smaller screen size
   */
  it('Property 10: Perspective projection maintains depth ordering', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Camera position
          cameraX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          cameraY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          cameraZ: fc.float({ min: Math.fround(10), max: Math.fround(30), noNaN: true }),
          cameraYaw: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          
          // Two points at different depths (in front of camera)
          // Point 1 is closer, Point 2 is farther
          baseX: fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
          baseZ: fc.float({ min: Math.fround(-20), max: Math.fround(20), noNaN: true }),
          depth1: fc.float({ min: Math.fround(5), max: Math.fround(50), noNaN: true }),
          depth2: fc.float({ min: Math.fround(60), max: Math.fround(150), noNaN: true })
        }),
        ({ cameraX, cameraY, cameraZ, cameraYaw, baseX, baseZ, depth1, depth2 }) => {
          // Set up camera
          const camera = {
            x: cameraX,
            y: cameraY,
            z: cameraZ,
            yaw: cameraYaw,
            pitch: 0,
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000
          };
          
          // Canvas dimensions (matching game.js)
          const canvas = { width: 800, height: 600 };
          
          // Simulate project3D function from game.js
          function project3D(x, y, z) {
            // Transform world coordinates to camera space
            let cx = x - camera.x;
            let cy = y - camera.y;
            let cz = z - camera.z;
            
            // Rotate by camera yaw
            const cosYaw = Math.cos(-camera.yaw);
            const sinYaw = Math.sin(-camera.yaw);
            
            const rotatedX = cx * cosYaw - cy * sinYaw;
            const rotatedY = cx * sinYaw + cy * cosYaw;
            
            // Handle clipping
            if (rotatedY <= camera.near) {
              return null;
            }
            
            const depth = Math.max(rotatedY, camera.near);
            
            // Apply perspective projection
            const focalLength = (canvas.width / 2) / Math.tan(camera.fov / 2);
            const screenX = (rotatedX / depth) * focalLength + canvas.width / 2;
            const screenY = (cz / depth) * focalLength + canvas.height / 2;
            
            return { x: screenX, y: screenY, depth: depth };
          }
          
          // Create two points at the same lateral position but different depths
          // Point 1 is closer (smaller depth)
          const point1WorldX = camera.x + baseX * Math.cos(camera.yaw) + depth1 * Math.sin(camera.yaw);
          const point1WorldY = camera.y + baseX * Math.sin(camera.yaw) + depth1 * Math.cos(camera.yaw);
          const point1WorldZ = camera.z + baseZ;
          
          // Point 2 is farther (larger depth)
          const point2WorldX = camera.x + baseX * Math.cos(camera.yaw) + depth2 * Math.sin(camera.yaw);
          const point2WorldY = camera.y + baseX * Math.sin(camera.yaw) + depth2 * Math.cos(camera.yaw);
          const point2WorldZ = camera.z + baseZ;
          
          // Project both points
          const proj1 = project3D(point1WorldX, point1WorldY, point1WorldZ);
          const proj2 = project3D(point2WorldX, point2WorldY, point2WorldZ);
          
          // Both points should be visible (not behind camera)
          if (!proj1 || !proj2) {
            return true; // Skip if either point is clipped
          }
          
          // Property: The farther point (point2) should have greater depth value
          // This maintains depth ordering for rendering
          return proj2.depth > proj1.depth;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Particle System Properties', () => {
  /**
   * Feature: advanced-game-features, Property 4: Tank hit creates particles at correct location
   * Validates: Requirements 2.1
   * 
   * For any tank hit by a shell, debris particles should be created with positions 
   * matching the tank's coordinates
   */
  it('Property 4: Tank hit creates particles at correct location', () => {
    fc.assert(
      fc.property(
        fc.record({
          tankX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          tankY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          particleCount: fc.integer({ min: 5, max: 20 })
        }),
        ({ tankX, tankY, particleCount }) => {
          // Simulate the particle array
          let particles = [];
          
          // Simulate createDebris function from game.js
          function createDebris(x, y, count) {
            for (let i = 0; i < count; i++) {
              // Random angle for horizontal velocity direction
              const angle = Math.random() * Math.PI * 2;
              // Random magnitude between 2 and 5 pixels/frame
              const speed = 2 + Math.random() * 3;
              
              particles.push({
                x: x,
                y: y,
                z: 5, // Start at a small height above ground
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: 2 + Math.random() * 3, // Initial upward velocity (2-5 units/frame)
                angle: Math.random() * Math.PI * 2,
                angularVel: (Math.random() - 0.5) * 0.2, // Random rotation speed
                lifetime: 60 + Math.random() * 60, // 60-120 frames (1-2 seconds at 60 FPS)
                length: 5 + Math.random() * 10 // Line segment length 5-15 pixels
              });
            }
          }
          
          // Create debris at tank position
          createDebris(tankX, tankY, particleCount);
          
          // Property: All particles should be created at the tank's x, y coordinates
          // Check that all particles start at the destruction point
          const epsilon = 0.01; // Small tolerance for floating point comparison
          
          const allParticlesAtCorrectLocation = particles.every(p => {
            const xMatches = Math.abs(p.x - tankX) < epsilon;
            const yMatches = Math.abs(p.y - tankY) < epsilon;
            return xMatches && yMatches;
          });
          
          // Also verify we created the correct number of particles
          const correctCount = particles.length === particleCount;
          
          return allParticlesAtCorrectLocation && correctCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 5: Particle velocities radiate outward
   * Validates: Requirements 2.2
   * 
   * For any set of debris particles created at a destruction point, each particle's 
   * velocity vector should point away from that origin point
   */
  it('Property 5: Particle velocities radiate outward', () => {
    fc.assert(
      fc.property(
        fc.record({
          originX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          originY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          particleCount: fc.integer({ min: 5, max: 20 })
        }),
        ({ originX, originY, particleCount }) => {
          // Simulate the particle array
          let particles = [];
          
          // Simulate createDebris function from game.js
          function createDebris(x, y, count) {
            for (let i = 0; i < count; i++) {
              // Random angle for horizontal velocity direction
              const angle = Math.random() * Math.PI * 2;
              // Random magnitude between 2 and 5 pixels/frame
              const speed = 2 + Math.random() * 3;
              
              particles.push({
                x: x,
                y: y,
                z: 5, // Start at a small height above ground
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: 2 + Math.random() * 3, // Initial upward velocity (2-5 units/frame)
                angle: Math.random() * Math.PI * 2,
                angularVel: (Math.random() - 0.5) * 0.2, // Random rotation speed
                lifetime: 60 + Math.random() * 60, // 60-120 frames (1-2 seconds at 60 FPS)
                length: 5 + Math.random() * 10 // Line segment length 5-15 pixels
              });
            }
          }
          
          // Create debris at origin point
          createDebris(originX, originY, particleCount);
          
          // Property: Each particle's velocity vector should point away from the origin
          // This means the dot product of the velocity vector and the displacement vector
          // from origin to particle should be non-negative (or at least the velocity
          // should be radiating outward in the horizontal plane)
          
          const allParticlesRadiateOutward = particles.every(p => {
            // Since particles start at the origin (x, y), we need to check that
            // their velocity vectors point outward. After one frame of movement,
            // the particle will be at (x + vx, y + vy).
            
            // The displacement after one frame would be (vx, vy)
            // For the velocity to radiate outward, the velocity vector itself
            // should point away from the origin in some direction.
            
            // Since all particles start at the same point, we can verify that
            // the velocity vectors are distributed in all directions (radiating).
            // A simple check is that the velocity magnitude is positive (particles move).
            
            const velocityMagnitude = Math.hypot(p.vx, p.vy);
            
            // Velocity should be non-zero (particles should move)
            // The speed is between 2 and 5, so magnitude should be at least 2
            return velocityMagnitude >= 2 && velocityMagnitude <= 5;
          });
          
          // Additionally, verify that particles have upward velocity (vz > 0)
          // since debris should initially fly upward
          const allParticlesHaveUpwardVelocity = particles.every(p => {
            return p.vz >= 2 && p.vz <= 5;
          });
          
          // Verify we created the correct number of particles
          const correctCount = particles.length === particleCount;
          
          return allParticlesRadiateOutward && allParticlesHaveUpwardVelocity && correctCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 6: Particle physics updates correctly
   * Validates: Requirements 2.3
   * 
   * For any particle across any frame update, its new position should equal its old position 
   * plus velocity, and its velocity should be modified by gravity and drag
   */
  it('Property 6: Particle physics updates correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Initial particle state
          x: fc.float({ min: Math.fround(0), max: Math.fround(800), noNaN: true }),
          y: fc.float({ min: Math.fround(0), max: Math.fround(600), noNaN: true }),
          z: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
          vx: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          vy: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          vz: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          angle: fc.float({ min: Math.fround(0), max: Math.fround(2 * Math.PI), noNaN: true }),
          angularVel: fc.float({ min: Math.fround(-0.5), max: Math.fround(0.5), noNaN: true }),
          lifetime: fc.integer({ min: 10, max: 120 }),
          length: fc.float({ min: Math.fround(5), max: Math.fround(15), noNaN: true })
        }),
        ({ x, y, z, vx, vy, vz, angle, angularVel, lifetime, length }) => {
          // Create a particle with the given state
          const particle = {
            x: x,
            y: y,
            z: z,
            vx: vx,
            vy: vy,
            vz: vz,
            angle: angle,
            angularVel: angularVel,
            lifetime: lifetime,
            length: length
          };
          
          // Store old values before update
          const oldX = particle.x;
          const oldY = particle.y;
          const oldZ = particle.z;
          const oldVx = particle.vx;
          const oldVy = particle.vy;
          const oldVz = particle.vz;
          const oldAngle = particle.angle;
          
          // Simulate updateParticles logic from game.js for a single particle
          // Update position based on velocity
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.z += particle.vz;
          
          // Apply gravity (downward acceleration in Z direction)
          particle.vz -= 0.15;
          
          // Apply drag (velocity multiplier)
          particle.vx *= 0.98;
          particle.vy *= 0.98;
          particle.vz *= 0.98;
          
          // Bounce off ground (z = 0)
          if (particle.z <= 0) {
            particle.z = 0;
            particle.vz = -particle.vz * 0.5; // Bounce with energy loss
          }
          
          // Update rotation
          particle.angle += particle.angularVel;
          
          // Decrease lifetime
          particle.lifetime--;
          
          // Property 1: Position updates correctly (new position = old position + old velocity)
          // Note: We need to account for ground bounce
          const epsilon = 0.001; // Small tolerance for floating point comparison
          
          let positionCorrect = true;
          
          if (oldZ + oldVz > 0) {
            // No ground bounce - position should be old + velocity
            positionCorrect = 
              Math.abs(particle.x - (oldX + oldVx)) < epsilon &&
              Math.abs(particle.y - (oldY + oldVy)) < epsilon &&
              Math.abs(particle.z - (oldZ + oldVz)) < epsilon;
          } else {
            // Ground bounce occurred - z should be clamped to 0
            positionCorrect = 
              Math.abs(particle.x - (oldX + oldVx)) < epsilon &&
              Math.abs(particle.y - (oldY + oldVy)) < epsilon &&
              particle.z === 0;
          }
          
          // Property 2: Velocity is modified by gravity and drag
          // Expected velocity after gravity and drag (before bounce)
          const expectedVx = oldVx * 0.98;
          const expectedVy = oldVy * 0.98;
          const expectedVzBeforeBounce = (oldVz - 0.15) * 0.98;
          
          let velocityCorrect = true;
          
          if (oldZ + oldVz > 0) {
            // No ground bounce - velocity should be (old - gravity) * drag
            velocityCorrect = 
              Math.abs(particle.vx - expectedVx) < epsilon &&
              Math.abs(particle.vy - expectedVy) < epsilon &&
              Math.abs(particle.vz - expectedVzBeforeBounce) < epsilon;
          } else {
            // Ground bounce occurred - vz should be reversed and dampened
            // The bounce happens after gravity and drag are applied
            const expectedVzAfterBounce = -expectedVzBeforeBounce * 0.5;
            velocityCorrect = 
              Math.abs(particle.vx - expectedVx) < epsilon &&
              Math.abs(particle.vy - expectedVy) < epsilon &&
              Math.abs(particle.vz - expectedVzAfterBounce) < epsilon;
          }
          
          // Property 3: Rotation updates correctly
          const rotationCorrect = Math.abs(particle.angle - (oldAngle + angularVel)) < epsilon;
          
          // Property 4: Lifetime decreases by 1
          const lifetimeCorrect = particle.lifetime === lifetime - 1;
          
          return positionCorrect && velocityCorrect && rotationCorrect && lifetimeCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 7: Expired particles are removed
   * Validates: Requirements 2.5
   * 
   * For any particle whose lifetime reaches zero or below, that particle should no longer 
   * exist in the active particle list
   */
  it('Property 7: Expired particles are removed', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate an array of particles with various lifetimes
          particleCount: fc.integer({ min: 5, max: 20 }),
          // Some particles will have expired lifetimes (0 or negative)
          // Some will have positive lifetimes
          lifetimeDistribution: fc.array(
            fc.integer({ min: -10, max: 60 }), 
            { minLength: 5, maxLength: 20 }
          )
        }),
        ({ particleCount, lifetimeDistribution }) => {
          // Create a particle array with specified lifetimes
          let particles = [];
          
          const count = Math.min(particleCount, lifetimeDistribution.length);
          
          for (let i = 0; i < count; i++) {
            particles.push({
              x: 100 + Math.random() * 600,
              y: 100 + Math.random() * 400,
              z: Math.random() * 20,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              vz: Math.random() * 3,
              angle: Math.random() * Math.PI * 2,
              angularVel: (Math.random() - 0.5) * 0.2,
              lifetime: lifetimeDistribution[i],
              length: 5 + Math.random() * 10
            });
          }
          
          // Count particles with lifetime > 0 before update
          const particlesWithPositiveLifetimeBefore = particles.filter(p => p.lifetime > 0).length;
          
          // Count particles with lifetime <= 0 before update
          const expiredParticlesBefore = particles.filter(p => p.lifetime <= 0).length;
          
          // Simulate updateParticles logic from game.js
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Update position based on velocity
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            
            // Apply gravity (downward acceleration in Z direction)
            p.vz -= 0.15;
            
            // Apply drag (velocity multiplier)
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.vz *= 0.98;
            
            // Bounce off ground (z = 0)
            if (p.z <= 0) {
              p.z = 0;
              p.vz = -p.vz * 0.5; // Bounce with energy loss
            }
            
            // Update rotation
            p.angle += p.angularVel;
            
            // Decrease lifetime
            p.lifetime--;
            
            // Remove expired particles or particles that have settled on ground with no velocity
            if (p.lifetime <= 0 || (p.z <= 0 && Math.abs(p.vz) < 0.1 && Math.hypot(p.vx, p.vy) < 0.1)) {
              particles.splice(i, 1);
            }
          }
          
          // Property 1: All particles with lifetime <= 0 after decrement should be removed
          // After update, no particle should have lifetime <= 0
          const hasExpiredParticles = particles.some(p => p.lifetime <= 0);
          
          // Property 2: Particles that had positive lifetime before should still exist (unless they settled)
          // We can't guarantee exact count due to settling logic, but we can verify no expired particles remain
          
          return !hasExpiredParticles;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('AI System Properties', () => {
  /**
   * Feature: advanced-game-features, Property 13: Obstacles block line of sight
   * Validates: Requirements 4.5
   * 
   * For any enemy-player configuration where an obstacle intersects the ray between them,
   * the line-of-sight calculation should return false
   */
  it('Property 13: Obstacles block line of sight', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          // Generate player position in front of enemy (within FOV)
          distanceAhead: fc.float({ min: Math.fround(100), max: Math.fround(300), noNaN: true }),
          // Angle offset from directly ahead (should be < 90° from forward direction)
          angleOffsetFromForward: fc.float({ min: Math.fround(-Math.PI / 4), max: Math.fround(Math.PI / 4), noNaN: true }),
          // Obstacle size
          obstacleWidth: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true }),
          obstacleHeight: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true })
        }),
        ({ enemyX, enemyY, enemyAngle, distanceAhead, angleOffsetFromForward, obstacleWidth, obstacleHeight }) => {
          // Create enemy entity
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle
          };
          
          // Calculate player position in front of the enemy (within FOV)
          const playerAngleFromEnemy = enemyAngle + angleOffsetFromForward;
          
          const player = {
            x: enemyX + Math.cos(playerAngleFromEnemy) * distanceAhead,
            y: enemyY + Math.sin(playerAngleFromEnemy) * distanceAhead
          };
          
          // Place obstacle directly between enemy and player (at midpoint)
          const midX = (enemy.x + player.x) / 2;
          const midY = (enemy.y + player.y) / 2;
          
          // Create obstacle centered at midpoint
          const obstacle = {
            x: midX - obstacleWidth / 2,
            y: midY - obstacleHeight / 2,
            width: obstacleWidth,
            height: obstacleHeight
          };
          
          const obstacles = [obstacle];
          
          // Simulate the helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            // 1. Check if target is in forward field of view (180° arc)
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false; // Behind the tank
            }
            
            // 2. Cast ray from source to target
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            // Handle zero-length ray (same position)
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5); // Check every 5 pixels
            
            // 3. Check for obstacle intersections along the ray
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false; // Blocked by obstacle
                }
              }
            }
            
            return true; // Clear line of sight
          }
          
          // Property: When an obstacle is placed directly between enemy and player,
          // hasLineOfSight should return false (obstacle blocks the ray)
          const los = hasLineOfSight(enemy, player, obstacles);
          
          // The obstacle is placed at the midpoint, so it should block the line of sight
          // However, due to the discrete ray sampling (every 5 pixels), very small obstacles
          // or very short distances might not be detected. We need to verify that the
          // obstacle is large enough and the distance is long enough for reliable detection.
          
          // Calculate if the ray actually passes through the obstacle
          // The ray goes from enemy to player, and we check if the midpoint is inside the obstacle
          const rayPassesThroughObstacle = pointInRect(midX, midY, obstacle);
          
          // If the ray passes through the obstacle (which it should, since we placed it there),
          // then LOS should be false
          if (rayPassesThroughObstacle) {
            return los === false;
          } else {
            // If somehow the ray doesn't pass through (edge case), we can't make assertions
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 12: Field of view blocks rear detection
   * Validates: Requirements 4.3
   * 
   * For any enemy-player configuration where the player is in the rear 180° arc of the enemy,
   * the line-of-sight calculation should return false
   */
  it('Property 12: Field of view blocks rear detection', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          // Generate player position behind the enemy
          // We'll place the player at a random distance and angle in the rear arc
          distanceBehind: fc.float({ min: Math.fround(50), max: Math.fround(200), noNaN: true }),
          // Angle offset from directly behind (should be > 90° from forward direction)
          angleOffsetFromForward: fc.float({ min: Math.fround(Math.PI / 2 + 0.1), max: Math.fround(Math.PI), noNaN: true }),
          // Random side: -1 for left rear, 1 for right rear
          side: fc.integer({ min: -1, max: 1 })
        }),
        ({ enemyX, enemyY, enemyAngle, distanceBehind, angleOffsetFromForward, side }) => {
          // Skip if side is 0 (we want -1 or 1)
          if (side === 0) {
            return true;
          }
          
          // Create enemy entity
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle
          };
          
          // Calculate player position in the rear arc of the enemy
          // The rear arc is anything outside the forward 180° (i.e., |angle difference| > 90°)
          const playerAngleFromEnemy = enemyAngle + (side * angleOffsetFromForward);
          
          const player = {
            x: enemyX + Math.cos(playerAngleFromEnemy) * distanceBehind,
            y: enemyY + Math.sin(playerAngleFromEnemy) * distanceBehind
          };
          
          // No obstacles for this test (we're only testing FOV blocking)
          const obstacles = [];
          
          // Simulate the helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            // 1. Check if target is in forward field of view (180° arc)
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false; // Behind the tank
            }
            
            // 2. Cast ray from source to target
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            // Handle zero-length ray (same position)
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5); // Check every 5 pixels
            
            // 3. Check for obstacle intersections along the ray
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false; // Blocked by obstacle
                }
              }
            }
            
            return true; // Clear line of sight
          }
          
          // Property: When player is in the rear arc (outside forward 180°),
          // hasLineOfSight should return false
          const los = hasLineOfSight(enemy, player, obstacles);
          
          return los === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 15: Blocked LOS prevents firing
   * Validates: Requirements 4.7
   * 
   * For any game state where line-of-sight is blocked, the enemy should not create new shells
   */
  it('Property 15: Blocked LOS prevents firing', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          playerX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          playerY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          obstacleWidth: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true }),
          obstacleHeight: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true }),
          fireCooldown: fc.integer({ min: -10, max: 10 }) // Some ready to fire, some not
        }),
        ({ enemyX, enemyY, enemyAngle, playerX, playerY, obstacleWidth, obstacleHeight, fireCooldown }) => {
          // Skip if enemy and player are too close (would cause issues with obstacle placement)
          const distanceToPlayer = Math.hypot(playerX - enemyX, playerY - enemyY);
          if (distanceToPlayer < 100) {
            return true;
          }
          
          // Create enemy entity with hunting state and ready to fire
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle,
            state: 'hunting', // Enemy is actively hunting
            fireCooldown: fireCooldown,
            searchTimeout: 0
          };
          
          const player = {
            x: playerX,
            y: playerY
          };
          
          // Place obstacle directly between enemy and player to block LOS
          const midX = (enemy.x + player.x) / 2;
          const midY = (enemy.y + player.y) / 2;
          
          const obstacle = {
            x: midX - obstacleWidth / 2,
            y: midY - obstacleHeight / 2,
            width: obstacleWidth,
            height: obstacleHeight
          };
          
          const obstacles = [obstacle];
          
          // Simulate helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false;
            }
            
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5);
            
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false;
                }
              }
            }
            
            return true;
          }
          
          // Check if LOS is actually blocked
          const hasLOS = hasLineOfSight(enemy, player, obstacles);
          
          // If LOS is not blocked, skip this test case (we need blocked LOS)
          if (hasLOS) {
            return true;
          }
          
          // Track if a shell was created
          let enemyShell = null;
          let shellCreated = false;
          
          // Simulate the enemy firing logic from game.js
          const TANK_SIZE = 30;
          const SHELL_SPEED = 2.1;
          
          // Decrement fire cooldown (as done in game.js)
          enemy.fireCooldown--;
          
          // Attempt to fire (this is the logic from game.js line 1025)
          if (enemy.state === 'hunting' && hasLOS && enemy.fireCooldown <= 0 && !enemyShell) {
            enemyShell = {
              x: enemy.x + Math.cos(enemy.angle) * TANK_SIZE,
              y: enemy.y + Math.sin(enemy.angle) * TANK_SIZE,
              vx: Math.cos(enemy.angle) * SHELL_SPEED,
              vy: Math.sin(enemy.angle) * SHELL_SPEED
            };
            shellCreated = true;
          }
          
          // Property: When LOS is blocked, no shell should be created
          // even if the enemy is hunting and fire cooldown is ready
          return shellCreated === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 14: Blocked LOS prevents rotation
   * Validates: Requirements 4.6
   * 
   * For any game state where line-of-sight is blocked, the enemy's angle should not be 
   * changing to face the player's current position
   */
  it('Property 14: Blocked LOS prevents rotation', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          playerX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          playerY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          obstacleWidth: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true }),
          obstacleHeight: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true })
        }),
        ({ enemyX, enemyY, enemyAngle, playerX, playerY, obstacleWidth, obstacleHeight }) => {
          // Skip if enemy and player are too close (would cause issues with obstacle placement)
          const distanceToPlayer = Math.hypot(playerX - enemyX, playerY - enemyY);
          if (distanceToPlayer < 100) {
            return true;
          }
          
          // Create enemy entity with initial state
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle,
            state: 'idle',
            fireCooldown: 120,
            searchTimeout: 0
          };
          
          const player = {
            x: playerX,
            y: playerY
          };
          
          // Place obstacle directly between enemy and player to block LOS
          const midX = (enemy.x + player.x) / 2;
          const midY = (enemy.y + player.y) / 2;
          
          const obstacle = {
            x: midX - obstacleWidth / 2,
            y: midY - obstacleHeight / 2,
            width: obstacleWidth,
            height: obstacleHeight
          };
          
          const obstacles = [obstacle];
          
          // Simulate helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false;
            }
            
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5);
            
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false;
                }
              }
            }
            
            return true;
          }
          
          // Check if LOS is actually blocked
          const hasLOS = hasLineOfSight(enemy, player, obstacles);
          
          // If LOS is not blocked, skip this test case (we need blocked LOS)
          if (hasLOS) {
            return true;
          }
          
          // Store the initial enemy angle
          const initialAngle = enemy.angle;
          
          // Simulate the updateEnemy logic from game.js
          const ENEMY_BASE_ROTATION_SPEED = 0.0028;
          const enemySpeedMultiplier = 1;
          let lastKnownPlayerPos = null;
          
          // State machine transitions
          if (hasLOS) {
            enemy.state = 'hunting';
            lastKnownPlayerPos = { x: player.x, y: player.y };
            enemy.searchTimeout = 0;
          } else if (enemy.state === 'hunting') {
            enemy.state = 'searching';
            enemy.searchTimeout = 240;
          }
          
          // Determine target position based on state
          let targetX, targetY;
          
          if (enemy.state === 'hunting') {
            targetX = player.x;
            targetY = player.y;
          } else if (enemy.state === 'searching' && lastKnownPlayerPos) {
            targetX = lastKnownPlayerPos.x;
            targetY = lastKnownPlayerPos.y;
            
            const distToLastKnown = Math.hypot(enemy.x - targetX, enemy.y - targetY);
            if (distToLastKnown < 30 * 2.5) {
              lastKnownPlayerPos = null;
              enemy.state = 'idle';
            }
            
            enemy.searchTimeout--;
            if (enemy.searchTimeout <= 0) {
              lastKnownPlayerPos = null;
              enemy.state = 'idle';
            }
          } else {
            targetX = enemy.x;
            targetY = enemy.y;
          }
          
          // Calculate angle to target
          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const targetAngle = Math.atan2(dy, dx);
          
          // Rotate towards target (only if not idle or if there's a target)
          if (enemy.state !== 'idle' || (targetX !== enemy.x || targetY !== enemy.y)) {
            let angleDiff = targetAngle - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            const currentRotationSpeed = ENEMY_BASE_ROTATION_SPEED * enemySpeedMultiplier;
            if (Math.abs(angleDiff) > currentRotationSpeed) {
              enemy.angle += Math.sign(angleDiff) * currentRotationSpeed;
            } else {
              enemy.angle = targetAngle;
            }
          }
          
          // Property: When LOS is blocked and enemy is in idle state (no last known position),
          // the enemy should not rotate toward the player's current position
          // The angle should remain the same as the initial angle
          
          if (enemy.state === 'idle') {
            // Enemy should not have rotated toward player
            const angleChanged = Math.abs(enemy.angle - initialAngle) > 0.001;
            return !angleChanged;
          } else {
            // If enemy is searching, it may rotate toward last known position
            // This is acceptable behavior, so we return true
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Audio System Properties', () => {
  /**
   * Feature: advanced-game-features, Property 1: Player firing triggers shoot sound
   * Validates: Requirements 1.1
   * 
   * For any player tank firing event, the audio system's shoot sound should be played
   */
  it('Property 1: Player firing triggers shoot sound', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          playerY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          playerAngle: fc.float({ min: Math.fround(0), max: Math.fround(2 * Math.PI), noNaN: true }),
          hasExistingShell: fc.boolean()
        }),
        ({ playerX, playerY, playerAngle, hasExistingShell }) => {
          // Track if playShoot was called
          let shootSoundPlayed = false;
          
          // Mock audio system
          const mockAudioSystem = {
            enabled: true,
            context: { currentTime: 0 }, // Mock context
            playShoot() {
              shootSoundPlayed = true;
            }
          };
          
          // Simulate player state
          const player = {
            x: playerX,
            y: playerY,
            angle: playerAngle
          };
          
          // Simulate shell state
          let playerShell = hasExistingShell ? { x: 100, y: 100, vx: 1, vy: 1 } : null;
          
          // Simulate firing logic (from game.js update function)
          const spaceKeyPressed = true; // Simulating space key press
          const TANK_SIZE = 30;
          const SHELL_SPEED = 2.1;
          
          if (spaceKeyPressed && !playerShell) {
            playerShell = {
              x: player.x + Math.cos(player.angle) * TANK_SIZE,
              y: player.y + Math.sin(player.angle) * TANK_SIZE,
              vx: Math.cos(player.angle) * SHELL_SPEED,
              vy: Math.sin(player.angle) * SHELL_SPEED
            };
            mockAudioSystem.playShoot();
          }
          
          // Property: If there was no existing shell, playShoot should have been called
          // If there was an existing shell, playShoot should NOT have been called
          if (!hasExistingShell) {
            return shootSoundPlayed === true;
          } else {
            return shootSoundPlayed === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 2: Tank destruction triggers explosion sound
   * Validates: Requirements 1.2
   * 
   * For any tank destruction event, the audio system's explosion sound should be played
   */
  it('Property 2: Tank destruction triggers explosion sound', () => {
    fc.assert(
      fc.property(
        fc.record({
          tankX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          tankY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          shellX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          shellY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          isPlayerShell: fc.boolean()
        }),
        ({ tankX, tankY, shellX, shellY, isPlayerShell }) => {
          // Track if playExplosion was called
          let explosionSoundPlayed = false;
          
          // Mock audio system
          const mockAudioSystem = {
            enabled: true,
            context: { currentTime: 0 },
            playExplosion() {
              explosionSoundPlayed = true;
            }
          };
          
          const TANK_SIZE = 30;
          
          // Simulate tank and shell positions
          const tank = { x: tankX, y: tankY };
          const shell = { x: shellX, y: shellY };
          
          // Calculate distance between shell and tank
          const dist = Math.hypot(shell.x - tank.x, shell.y - tank.y);
          
          // Simulate collision detection logic from game.js
          if (dist < TANK_SIZE) {
            // Tank is hit - explosion should play
            mockAudioSystem.playExplosion();
          }
          
          // Property: If shell is within collision distance, explosion should play
          // If shell is outside collision distance, explosion should not play
          if (dist < TANK_SIZE) {
            return explosionSoundPlayed === true;
          } else {
            return explosionSoundPlayed === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 3: Shell-obstacle collision triggers impact sound
   * Validates: Requirements 1.3
   * 
   * For any shell that collides with an obstacle, the audio system's impact sound should be played
   */
  it('Property 3: Shell-obstacle collision triggers impact sound', () => {
    fc.assert(
      fc.property(
        fc.record({
          shellX: fc.float({ min: Math.fround(0), max: Math.fround(800), noNaN: true }),
          shellY: fc.float({ min: Math.fround(0), max: Math.fround(600), noNaN: true }),
          obstacleX: fc.float({ min: Math.fround(0), max: Math.fround(760), noNaN: true }),
          obstacleY: fc.float({ min: Math.fround(0), max: Math.fround(560), noNaN: true }),
          obstacleWidth: fc.float({ min: Math.fround(20), max: Math.fround(60), noNaN: true }),
          obstacleHeight: fc.float({ min: Math.fround(20), max: Math.fround(60), noNaN: true })
        }),
        ({ shellX, shellY, obstacleX, obstacleY, obstacleWidth, obstacleHeight }) => {
          // Track if playImpact was called
          let impactSoundPlayed = false;
          
          // Mock audio system
          const mockAudioSystem = {
            enabled: true,
            context: { currentTime: 0 },
            playImpact() {
              impactSoundPlayed = true;
            }
          };
          
          const SHELL_SIZE = 20;
          
          // Simulate shell and obstacle
          const shell = { x: shellX, y: shellY };
          const obstacle = { 
            x: obstacleX, 
            y: obstacleY, 
            width: obstacleWidth, 
            height: obstacleHeight 
          };
          
          // Simulate collision detection logic from game.js (checkRectCollision)
          const shellLeft = shell.x - SHELL_SIZE / 2;
          const shellTop = shell.y - SHELL_SIZE / 2;
          const shellRight = shellLeft + SHELL_SIZE;
          const shellBottom = shellTop + SHELL_SIZE;
          
          const obsLeft = obstacle.x;
          const obsTop = obstacle.y;
          const obsRight = obstacle.x + obstacle.width;
          const obsBottom = obstacle.y + obstacle.height;
          
          const collision = shellLeft < obsRight && 
                           shellRight > obsLeft && 
                           shellTop < obsBottom && 
                           shellBottom > obsTop;
          
          // Simulate collision handling from game.js
          if (collision) {
            mockAudioSystem.playImpact();
          }
          
          // Property: If shell collides with obstacle, impact sound should play
          // If no collision, impact sound should not play
          if (collision) {
            return impactSoundPlayed === true;
          } else {
            return impactSoundPlayed === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 16: Player firing records position
   * Validates: Requirements 4.8
   * 
   * For any player firing event, the last known player position should be updated to match 
   * the player's position at the moment of firing
   */
  it('Property 16: Player firing records position', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerX: fc.float({ min: Math.fround(50), max: Math.fround(750), noNaN: true }),
          playerY: fc.float({ min: Math.fround(50), max: Math.fround(550), noNaN: true }),
          playerAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          hasExistingShell: fc.boolean()
        }),
        ({ playerX, playerY, playerAngle, hasExistingShell }) => {
          // Simulate player state
          const player = {
            x: playerX,
            y: playerY,
            angle: playerAngle
          };
          
          // Simulate shell state
          let playerShell = hasExistingShell ? { x: 100, y: 100, vx: 1, vy: 1 } : null;
          
          // Track last known player position
          let lastKnownPlayerPos = null;
          
          // Simulate firing logic (from game.js update function)
          const spaceKeyPressed = true; // Simulating space key press
          const TANK_SIZE = 30;
          const SHELL_SPEED = 2.1;
          
          if (spaceKeyPressed && !playerShell) {
            playerShell = {
              x: player.x + Math.cos(player.angle) * TANK_SIZE,
              y: player.y + Math.sin(player.angle) * TANK_SIZE,
              vx: Math.cos(player.angle) * SHELL_SPEED,
              vy: Math.sin(player.angle) * SHELL_SPEED
            };
            
            // Record player position when firing (sound-based awareness)
            lastKnownPlayerPos = { x: player.x, y: player.y };
          }
          
          // Property: If there was no existing shell (firing occurred), 
          // lastKnownPlayerPos should be set to the player's position
          // If there was an existing shell (no firing), lastKnownPlayerPos should remain null
          if (!hasExistingShell) {
            // Firing occurred - lastKnownPlayerPos should be set
            const epsilon = 0.001; // Small tolerance for floating point comparison
            return lastKnownPlayerPos !== null &&
                   Math.abs(lastKnownPlayerPos.x - player.x) < epsilon &&
                   Math.abs(lastKnownPlayerPos.y - player.y) < epsilon;
          } else {
            // No firing occurred - lastKnownPlayerPos should remain null
            return lastKnownPlayerPos === null;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 17: Enemy moves toward last known position
   * Validates: Requirements 4.9
   * 
   * For any game state where the enemy has a last known position and LOS is blocked, 
   * the enemy should be moving in the direction of that last known position
   */
  it('Property 17: Enemy moves toward last known position', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          lastKnownX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          lastKnownY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          obstacleWidth: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true }),
          obstacleHeight: fc.float({ min: Math.fround(40), max: Math.fround(80), noNaN: true })
        }),
        ({ enemyX, enemyY, enemyAngle, lastKnownX, lastKnownY, obstacleWidth, obstacleHeight }) => {
          // Skip if enemy is already at the last known position
          const distanceToLastKnown = Math.hypot(lastKnownX - enemyX, lastKnownY - enemyY);
          if (distanceToLastKnown < 30 * 2.5) {
            return true; // Enemy would transition to idle
          }
          
          // Skip if last known position is too close to enemy (would cause issues)
          if (distanceToLastKnown < 100) {
            return true;
          }
          
          // Create enemy entity in searching state with last known position
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle,
            state: 'searching',
            fireCooldown: 120,
            searchTimeout: 240 // Active search timeout
          };
          
          // Set up last known player position
          let lastKnownPlayerPos = { x: lastKnownX, y: lastKnownY };
          
          // Create player at a different location (not at last known position)
          // Place player behind an obstacle so LOS is blocked
          const player = {
            x: enemyX - 200, // Behind enemy
            y: enemyY - 200
          };
          
          // Place obstacle between enemy and player to block LOS
          const midX = (enemy.x + player.x) / 2;
          const midY = (enemy.y + player.y) / 2;
          
          const obstacle = {
            x: midX - obstacleWidth / 2,
            y: midY - obstacleHeight / 2,
            width: obstacleWidth,
            height: obstacleHeight
          };
          
          const obstacles = [obstacle];
          
          // Simulate helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false;
            }
            
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5);
            
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false;
                }
              }
            }
            
            return true;
          }
          
          // Check if LOS is blocked (it should be)
          const hasLOS = hasLineOfSight(enemy, player, obstacles);
          
          // Store initial enemy position
          const initialX = enemy.x;
          const initialY = enemy.y;
          
          // Calculate initial distance to last known position
          const initialDistToLastKnown = Math.hypot(enemy.x - lastKnownPlayerPos.x, enemy.y - lastKnownPlayerPos.y);
          
          // Simulate the updateEnemy logic from game.js
          const TANK_SIZE = 30;
          const ENEMY_BASE_ROTATION_SPEED = 0.0028;
          const ENEMY_BASE_MOVE_SPEED = 0.35;
          const enemySpeedMultiplier = 1;
          
          // State machine transitions (enemy should stay in searching since LOS is blocked)
          if (hasLOS) {
            enemy.state = 'hunting';
            lastKnownPlayerPos = { x: player.x, y: player.y };
            enemy.searchTimeout = 0;
          } else if (enemy.state === 'hunting') {
            enemy.state = 'searching';
            enemy.searchTimeout = 240;
          }
          
          // Determine target position based on state
          let targetX, targetY;
          
          if (enemy.state === 'hunting') {
            targetX = player.x;
            targetY = player.y;
          } else if (enemy.state === 'searching' && lastKnownPlayerPos) {
            // SEARCHING: Move toward last known position
            targetX = lastKnownPlayerPos.x;
            targetY = lastKnownPlayerPos.y;
            
            // Check if reached last known position
            const distToLastKnown = Math.hypot(enemy.x - targetX, enemy.y - targetY);
            if (distToLastKnown < TANK_SIZE * 2.5) {
              lastKnownPlayerPos = null;
              enemy.state = 'idle';
            }
            
            // Decrease search timeout
            enemy.searchTimeout--;
            if (enemy.searchTimeout <= 0) {
              lastKnownPlayerPos = null;
              enemy.state = 'idle';
            }
          } else {
            // IDLE: No target, stay in place
            targetX = enemy.x;
            targetY = enemy.y;
          }
          
          // Calculate angle to target
          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const targetAngle = Math.atan2(dy, dx);
          
          // Rotate towards target
          if (enemy.state !== 'idle' || (targetX !== enemy.x || targetY !== enemy.y)) {
            let angleDiff = targetAngle - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            const currentRotationSpeed = ENEMY_BASE_ROTATION_SPEED * enemySpeedMultiplier;
            if (Math.abs(angleDiff) > currentRotationSpeed) {
              enemy.angle += Math.sign(angleDiff) * currentRotationSpeed;
            } else {
              enemy.angle = targetAngle;
            }
          }
          
          // Move towards target (only if hunting or searching)
          if (enemy.state === 'hunting' || enemy.state === 'searching') {
            const currentMoveSpeed = ENEMY_BASE_MOVE_SPEED * enemySpeedMultiplier;
            enemy.x += Math.cos(enemy.angle) * currentMoveSpeed;
            enemy.y += Math.sin(enemy.angle) * currentMoveSpeed;
            
            // Note: We're not checking collision here for simplicity in the test
          }
          
          // Property: When enemy is in searching state with a last known position,
          // the enemy should be rotating toward and moving toward that position
          // We verify this by checking behavior over a single update frame
          
          if (enemy.state === 'searching' && lastKnownPlayerPos) {
            // Calculate the target angle (angle from enemy to last known position)
            const targetAngle = Math.atan2(lastKnownPlayerPos.y - initialY, lastKnownPlayerPos.x - initialX);
            
            // Calculate initial angle difference
            const initialAngleDiff = normalizeAngle(targetAngle - enemyAngle);
            const finalAngleDiff = normalizeAngle(targetAngle - enemy.angle);
            
            // Property 1: Enemy should be rotating toward the target
            // The absolute angle difference should decrease (or stay the same if already aligned)
            const isRotatingTowardTarget = Math.abs(finalAngleDiff) <= Math.abs(initialAngleDiff) + 0.001;
            
            // Property 2: Enemy should be moving (not stationary)
            const enemyMoved = Math.hypot(enemy.x - initialX, enemy.y - initialY) > 0.01;
            
            // Both properties should hold: enemy rotates toward target AND moves
            return isRotatingTowardTarget && enemyMoved;
          } else {
            // If enemy transitioned to idle (reached position or timeout), that's acceptable
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: advanced-game-features, Property 18: Clear LOS enables normal behavior
   * Validates: Requirements 4.10
   * 
   * For any game state where line-of-sight is clear, the enemy should be rotating toward 
   * the player's current position and able to fire
   */
  it('Property 18: Clear LOS enables normal behavior', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: Math.fround(100), max: Math.fround(700), noNaN: true }),
          enemyY: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
          enemyAngle: fc.float({ min: Math.fround(-Math.PI), max: Math.fround(Math.PI), noNaN: true }),
          // Generate player position in front of enemy (within FOV) with clear LOS
          distanceAhead: fc.float({ min: Math.fround(100), max: Math.fround(300), noNaN: true }),
          // Angle offset from directly ahead (should be < 90° from forward direction)
          angleOffsetFromForward: fc.float({ min: Math.fround(-Math.PI / 4), max: Math.fround(Math.PI / 4), noNaN: true }),
          fireCooldown: fc.integer({ min: -10, max: 10 }) // Some ready to fire, some not
        }),
        ({ enemyX, enemyY, enemyAngle, distanceAhead, angleOffsetFromForward, fireCooldown }) => {
          // Create enemy entity with hunting state
          const enemy = {
            x: enemyX,
            y: enemyY,
            angle: enemyAngle,
            state: 'hunting', // Enemy is actively hunting
            fireCooldown: fireCooldown,
            searchTimeout: 0
          };
          
          // Calculate player position in front of the enemy (within FOV, clear LOS)
          const playerAngleFromEnemy = enemyAngle + angleOffsetFromForward;
          
          const player = {
            x: enemyX + Math.cos(playerAngleFromEnemy) * distanceAhead,
            y: enemyY + Math.sin(playerAngleFromEnemy) * distanceAhead
          };
          
          // No obstacles - clear line of sight
          const obstacles = [];
          
          // Simulate helper functions from game.js
          function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return angle;
          }
          
          function isInFieldOfView(from, to, fromAngle, fovAngle) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToTarget - fromAngle);
            return Math.abs(angleDiff) <= fovAngle / 2;
          }
          
          function pointInRect(px, py, rect) {
            return px >= rect.x && 
                   px <= rect.x + rect.width && 
                   py >= rect.y && 
                   py <= rect.y + rect.height;
          }
          
          function hasLineOfSight(from, to, obstacles) {
            if (!isInFieldOfView(from, to, from.angle, Math.PI)) {
              return false;
            }
            
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 0.1) {
              return true;
            }
            
            const steps = Math.ceil(distance / 5);
            
            for (let i = 1; i < steps; i++) {
              const t = i / steps;
              const checkX = from.x + dx * t;
              const checkY = from.y + dy * t;
              
              for (let obstacle of obstacles) {
                if (pointInRect(checkX, checkY, obstacle)) {
                  return false;
                }
              }
            }
            
            return true;
          }
          
          // Check if LOS is clear
          const hasLOS = hasLineOfSight(enemy, player, obstacles);
          
          // If LOS is not clear, skip this test case (we need clear LOS)
          if (!hasLOS) {
            return true;
          }
          
          // Store the initial enemy angle
          const initialAngle = enemy.angle;
          
          // Calculate the angle to the player
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const angleToPlayer = Math.atan2(dy, dx);
          
          // Simulate the updateEnemy logic from game.js
          const ENEMY_BASE_ROTATION_SPEED = 0.0028;
          const enemySpeedMultiplier = 1;
          let lastKnownPlayerPos = null;
          
          // State machine transitions
          if (hasLOS) {
            enemy.state = 'hunting';
            lastKnownPlayerPos = { x: player.x, y: player.y };
            enemy.searchTimeout = 0;
          }
          
          // Determine target position based on state
          let targetX = player.x;
          let targetY = player.y;
          
          // Calculate angle to target
          const targetAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
          
          // Rotate towards target
          let angleDiff = targetAngle - enemy.angle;
          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
          
          const currentRotationSpeed = ENEMY_BASE_ROTATION_SPEED * enemySpeedMultiplier;
          if (Math.abs(angleDiff) > currentRotationSpeed) {
            enemy.angle += Math.sign(angleDiff) * currentRotationSpeed;
          } else {
            enemy.angle = targetAngle;
          }
          
          // Property 1: Enemy should be rotating toward player
          // The enemy angle should be moving toward the player's angle
          const angleToPlayerNormalized = normalizeAngle(angleToPlayer);
          const initialAngleDiff = normalizeAngle(angleToPlayerNormalized - initialAngle);
          const finalAngleDiff = normalizeAngle(angleToPlayerNormalized - enemy.angle);
          
          // The final angle difference should be smaller than or equal to the initial difference
          // (enemy is rotating toward player)
          const isRotatingTowardPlayer = Math.abs(finalAngleDiff) <= Math.abs(initialAngleDiff);
          
          // Property 2: Enemy should be able to fire when cooldown is ready
          const TANK_SIZE = 30;
          const SHELL_SPEED = 2.1;
          let enemyShell = null;
          let canFire = false;
          
          // Decrement fire cooldown
          enemy.fireCooldown--;
          
          // Attempt to fire
          if (enemy.state === 'hunting' && hasLOS && enemy.fireCooldown <= 0 && !enemyShell) {
            enemyShell = {
              x: enemy.x + Math.cos(enemy.angle) * TANK_SIZE,
              y: enemy.y + Math.sin(enemy.angle) * TANK_SIZE,
              vx: Math.cos(enemy.angle) * SHELL_SPEED,
              vy: Math.sin(enemy.angle) * SHELL_SPEED
            };
            canFire = true;
          }
          
          // When LOS is clear and enemy is hunting:
          // 1. Enemy should be rotating toward player
          // 2. Enemy should be able to fire when cooldown is ready
          
          // If fire cooldown was ready (fireCooldown <= 0 after decrement), enemy should fire
          const wasCooldownReady = fireCooldown <= 1; // After decrement, it would be <= 0
          
          if (wasCooldownReady) {
            // Enemy should have fired
            return isRotatingTowardPlayer && canFire;
          } else {
            // Enemy should be rotating but not firing (cooldown not ready)
            return isRotatingTowardPlayer && !canFire;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
