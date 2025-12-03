# Implementation Plan

- [x] 1. Set up testing infrastructure
  - Install fast-check library for property-based testing
  - Create test file structure
  - Set up test runner configuration
  - _Requirements: All (testing foundation)_

- [x] 2. Implement Audio System
  - Create AudioContext and sound generation functions
  - Implement playShoot(), playExplosion(), playImpact(), playGameOver()
  - Use Web Audio API with oscillators and noise for retro sounds
  - Handle browser compatibility and user gesture requirements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for player firing sound
  - **Property 1: Player firing triggers shoot sound**
  - **Validates: Requirements 1.1**

- [x] 2.2 Write property test for explosion sound
  - **Property 2: Tank destruction triggers explosion sound**
  - **Validates: Requirements 1.2**

- [x] 2.3 Write property test for impact sound
  - **Property 3: Shell-obstacle collision triggers impact sound**
  - **Validates: Requirements 1.3**

- [x] 3. Integrate audio into existing game events
  - Hook playShoot() into player and enemy firing logic
  - Hook playExplosion() into tank destruction logic
  - Hook playImpact() into shell-obstacle collision detection
  - Hook playGameOver() into game over state transition
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement Particle System
  - Create particle array and particle object structure
  - Implement createDebris(x, y, count) function
  - Implement updateParticles() with physics (velocity, gravity, drag)
  - Implement drawParticles() for 2D rendering
  - Add particle lifecycle management (lifetime countdown and removal)
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 4.1 Write property test for particle creation location
  - **Property 4: Tank hit creates particles at correct location**
  - **Validates: Requirements 2.1**

- [ ]* 4.2 Write property test for particle velocity radiation
  - **Property 5: Particle velocities radiate outward**
  - **Validates: Requirements 2.2**

- [ ]* 4.3 Write property test for particle physics
  - **Property 6: Particle physics updates correctly**
  - **Validates: Requirements 2.3**

- [ ]* 4.4 Write property test for particle removal
  - **Property 7: Expired particles are removed**
  - **Validates: Requirements 2.5**

- [x] 5. Integrate particles into tank destruction
  - Call createDebris() when player shell hits enemy
  - Call createDebris() when enemy shell hits player
  - Add updateParticles() to main game loop
  - Add drawParticles() to rendering pipeline
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Line-of-Sight system
  - Create hasLineOfSight(from, to, obstacles) function
  - Implement ray casting algorithm with obstacle intersection checks
  - Create isInFieldOfView(from, to, fromAngle, fovAngle) helper
  - Add field-of-view check (180° forward arc)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for field of view blocking
  - **Property 12: Field of view blocks rear detection**
  - **Validates: Requirements 4.3**

- [ ]* 7.2 Write property test for obstacle blocking
  - **Property 13: Obstacles block line of sight**
  - **Validates: Requirements 4.5**

- [x] 8. Implement Enemy AI enhancements
  - Add enemy state machine (idle, hunting, searching)
  - Add lastKnownPlayerPos tracking
  - Modify updateEnemy() to use hasLineOfSight()
  - Implement searching behavior (move toward last known position)
  - Update enemy rotation and firing to respect LOS
  - _Requirements: 4.4, 4.6, 4.7, 4.10, 4.11_

- [ ]* 8.1 Write property test for blocked LOS prevents rotation
  - **Property 14: Blocked LOS prevents rotation**
  - **Validates: Requirements 4.6**

- [ ]* 8.2 Write property test for blocked LOS prevents firing
  - **Property 15: Blocked LOS prevents firing**
  - **Validates: Requirements 4.7**

- [ ]* 8.3 Write property test for clear LOS enables behavior
  - **Property 18: Clear LOS enables normal behavior**
  - **Validates: Requirements 4.10**

- [x] 9. Implement sound-based awareness
  - Record player position when player fires shell
  - Update lastKnownPlayerPos on player fire event
  - Trigger enemy searching state when player fires
  - _Requirements: 4.8, 4.9_

- [ ]* 9.1 Write property test for position recording
  - **Property 16: Player firing records position**
  - **Validates: Requirements 4.8**

- [ ]* 9.2 Write property test for enemy movement toward last known position
  - **Property 17: Enemy moves toward last known position**
  - **Validates: Requirements 4.9**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement 3D Camera System
  - Create camera object with position, yaw, pitch, fov
  - Implement updateCamera(player) to sync with player position and angle
  - Set camera z (eye height) to elevated position
  - _Requirements: 3.1, 3.2_

- [x] 11.1 Write property test for camera position tracking
  - **Property 8: Camera position matches player position**
  - **Validates: Requirements 3.1**

- [x] 11.2 Write property test for camera orientation tracking
  - **Property 9: Camera orientation matches player orientation**
  - **Validates: Requirements 3.2**

- [x] 12. Implement 3D Projection System
  - Create project3D(x, y, z) function for perspective projection
  - Calculate focal length from FOV
  - Transform world coordinates to camera space
  - Apply perspective division
  - Handle clipping (objects behind camera)
  - _Requirements: 3.6, 3.7_

- [x] 12.1 Write property test for depth ordering
  - **Property 10: Perspective projection maintains depth ordering**
  - **Validates: Requirements 3.7**

- [x] 12.2 Write property test for relative position preservation
  - **Property 11: Perspective projection preserves relative positions**
  - **Validates: Requirements 3.7**

- [x] 13. Implement 3D Wireframe Rendering
  - Create draw3DLine(x1, y1, z1, x2, y2, z2) helper
  - Implement draw3DBox(x, y, z, width, height, depth) for obstacles
  - Implement draw3DTank(x, y, z, angle) for tank models
  - Implement drawGroundGrid() for spatial reference
  - _Requirements: 3.3, 3.4, 3.5, 3.8_

- [x] 14. Convert game rendering to 3D
  - Replace drawGame() with draw3DGame()
  - Update camera each frame based on player
  - Render ground grid first
  - Sort and render obstacles as 3D boxes
  - Render enemy tank as 3D model
  - Render shells as 3D objects
  - Render particles in 3D space
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 15. Update particle system for 3D
  - Add z coordinate to particle objects
  - Add vz (vertical velocity) to particles
  - Update particle physics to handle 3D movement
  - Update drawParticles() to use 3D projection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Polish and optimization
  - Add object culling (don't render objects outside view frustum)
  - Optimize particle count and rendering
  - Tune audio levels and timing
  - Adjust AI behavior parameters for gameplay feel
  - Test performance and optimize as needed
  - _Requirements: All_
