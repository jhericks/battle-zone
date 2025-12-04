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

- [x] 4.1 Write property test for particle creation location
  - **Property 4: Tank hit creates particles at correct location**
  - **Validates: Requirements 2.1**

- [x] 4.2 Write property test for particle velocity radiation
  - **Property 5: Particle velocities radiate outward**
  - **Validates: Requirements 2.2**

- [x] 4.3 Write property test for particle physics
  - **Property 6: Particle physics updates correctly**
  - **Validates: Requirements 2.3**

- [x] 4.4 Write property test for particle removal
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

- [x] 7.1 Write property test for field of view blocking
  - **Property 12: Field of view blocks rear detection**
  - **Validates: Requirements 4.3**

- [x] 7.2 Write property test for obstacle blocking
  - **Property 13: Obstacles block line of sight**
  - **Validates: Requirements 4.5**

- [x] 8. Implement Enemy AI enhancements
  - Add enemy state machine (idle, hunting, searching)
  - Add lastKnownPlayerPos tracking
  - Modify updateEnemy() to use hasLineOfSight()
  - Implement searching behavior (move toward last known position)
  - Update enemy rotation and firing to respect LOS
  - _Requirements: 4.4, 4.6, 4.7, 4.10, 4.11_

- [x] 8.1 Write property test for blocked LOS prevents rotation
  - **Property 14: Blocked LOS prevents rotation**
  - **Validates: Requirements 4.6**

- [x] 8.2 Write property test for blocked LOS prevents firing
  - **Property 15: Blocked LOS prevents firing**
  - **Validates: Requirements 4.7**

- [x] 8.3 Write property test for clear LOS enables behavior
  - **Property 18: Clear LOS enables normal behavior**
  - **Validates: Requirements 4.10**

- [x] 9. Implement sound-based awareness
  - Record player position when player fires shell
  - Update lastKnownPlayerPos on player fire event
  - Trigger enemy searching state when player fires
  - _Requirements: 4.8, 4.9_

- [x] 9.1 Write property test for position recording
  - **Property 16: Player firing records position**
  - **Validates: Requirements 4.8**

- [x] 9.2 Write property test for enemy movement toward last known position
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

- [x] 14.1 Implement opaque rendering with back-face culling
  - Implement face normal calculation using cross product
  - Add back-face culling using dot product of face normal and view direction
  - Create global face collection and sorting system (all faces from all objects)
  - Sort faces by distance from camera (farthest to nearest)
  - Fill each face with black color before drawing purple wireframe edges
  - Ensure objects are opaque and you cannot see through them
  - _Requirements: 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

- [x] 14.2 Redesign enemy tank 3D model
  - Create trapezoidal prism body (25 wide, 35 deep at bottom, 28 deep at top, 12 tall)
  - Add cube turret (14x12x10) positioned on top of body
  - Add rectangular barrel (25 long, 3x3 cross-section) extending from turret
  - Fix Z-axis orientation by negating Y coordinate in projection
  - Apply back-face culling to tank model
  - Ensure tank renders right-side up with treads on ground
  - _Requirements: 3.5, 3.7, 3.9, 3.10, 3.11_

- [ ] 14.3 Re-enable enemy AI and player vulnerability
  - Remove early return in updateEnemy() to restore enemy movement
  - Uncomment game over logic when enemy shell hits player
  - Test that enemy tank moves and fires correctly
  - Test that player dies when hit by enemy shell
  - _Note: These were temporarily disabled for tank model debugging_

- [x] 15. Update particle system for 3D
  - Add z coordinate to particle objects
  - Add vz (vertical velocity) to particles
  - Update particle physics to handle 3D movement
  - Update drawParticles() to use 3D projection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement continuous engine sound system
  - Create engineSound object with oscillator and gain nodes
  - Implement updateEngineSound(isMoving) function
  - Add smooth frequency/gain transitions using linear ramps
  - Set idle frequency (40-60Hz) and acceleration frequency (80-120Hz)
  - Integrate into game loop to update based on player velocity
  - _Requirements: 1.5, 1.6, 1.7_

- [ ]* 17.1 Write property test for idle engine sound
  - **Property 19: Idle engine sound plays when stationary**
  - **Validates: Requirements 1.5**

- [ ]* 17.2 Write property test for engine sound increase
  - **Property 20: Engine sound increases with movement**
  - **Validates: Requirements 1.6**

- [ ]* 17.3 Write property test for smooth engine transitions
  - **Property 21: Engine sound transitions smoothly**
  - **Validates: Requirements 1.7**

- [x] 18. Implement difficulty balancing system
  - Add difficulty constants (MIN_AIM_ERROR, MAX_AIM_ERROR, AIM_IMPROVEMENT_RATE)
  - Create calculateAimError(score) function
  - Add enemy.hasFiredOnce flag to track first shot
  - Modify enemy firing logic to apply aim error offset
  - Set ENEMY_SHELL_SPEED_MULTIPLIER to 0.6
  - Apply speed multiplier when creating enemy shells
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 18.1 Write property test for aim error application
  - **Property 22: Enemy firing applies aim error**
  - **Validates: Requirements 5.1**

- [ ]* 18.2 Write property test for aim error decrease
  - **Property 23: Aim error decreases with score**
  - **Validates: Requirements 5.3**

- [ ]* 18.3 Write property test for minimum aim error
  - **Property 24: Aim error never reaches zero**
  - **Validates: Requirements 5.3**

- [ ]* 18.4 Write property test for enemy shell speed
  - **Property 25: Enemy shell speed is 60% of player speed**
  - **Validates: Requirements 5.4**

- [ ]* 18.5 Write property test for one shell constraint
  - **Property 26: Enemy fires only one shell at a time**
  - **Validates: Requirements 5.5**

- [x] 19. Implement tank acceleration system
  - Add player.velocity and player.targetVelocity properties
  - Add TANK_MAX_SPEED, TANK_ACCELERATION, TANK_DECELERATION constants
  - Modify updatePlayerMovement() to use acceleration/deceleration
  - Smoothly interpolate velocity toward target based on input
  - Apply velocity to position instead of instant movement
  - _Requirements: 5.12, 5.13, 5.14_

- [ ]* 19.1 Write property test for gradual acceleration
  - **Property 34: Tank acceleration is gradual**
  - **Validates: Requirements 5.12, 5.14**

- [ ]* 19.2 Write property test for gradual deceleration
  - **Property 35: Tank deceleration is gradual**
  - **Validates: Requirements 5.13, 5.14**

- [x] 20. Redesign control system to WASD
  - Update key event handlers to use W/A/S/D instead of Q/A/W/S
  - Map W to forward, S to backward, A to rotate left, D to rotate right
  - Update start screen instructions to show "WASD to move/rotate, SPACE to fire"
  - Remove dual-tread control logic
  - Test all control combinations
  - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

- [ ]* 20.1 Write property test for W key forward movement
  - **Property 27: W key moves player forward**
  - **Validates: Requirements 5.6**

- [ ]* 20.2 Write property test for S key backward movement
  - **Property 28: S key moves player backward**
  - **Validates: Requirements 5.7**

- [ ]* 20.3 Write property test for A key rotation
  - **Property 29: A key rotates player left**
  - **Validates: Requirements 5.8**

- [ ]* 20.4 Write property test for D key rotation
  - **Property 30: D key rotates player right**
  - **Validates: Requirements 5.9**

- [ ]* 20.5 Write property test for Space key firing
  - **Property 31: Space key fires shell**
  - **Validates: Requirements 5.10**

- [x] 21. Expand playfield and add boundaries
  - Set PLAYFIELD_WIDTH and PLAYFIELD_HEIGHT to 2000
  - Create boundary wall objects at playfield edges
  - Implement applyBoundaryConstraints(entity) function
  - Apply constraints to player and enemy movement
  - Destroy shells that reach boundaries
  - Render boundary walls as 3D wireframe prisms
  - _Requirements: 5.13, 5.14, 5.15, 5.16_

- [ ]* 21.1 Write property test for boundary constraints
  - **Property 32: Tanks cannot move beyond boundaries**
  - **Validates: Requirements 5.15**

- [ ]* 21.2 Write property test for shell destruction at boundaries
  - **Property 33: Shells are destroyed at boundaries**
  - **Validates: Requirements 5.16**

- [x] 22. Scale obstacles for larger playfield
  - Calculate obstacle count based on area ratio (new_area / old_area * old_count)
  - Update initializeObstacles() to create ~20-25 obstacles
  - Distribute obstacles across larger playfield using spatial distribution
  - Ensure obstacles don't spawn too close to player/enemy start positions
  - _Requirements: 5.17_

- [x] 23. Widen field of vision
  - Update camera.fov to Math.PI / 2 (90 degrees)
  - Recalculate focal length based on new FOV
  - Test rendering with wider perspective
  - _Requirements: 5.12_

- [x] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Polish and optimization
  - Add object culling (don't render objects outside view frustum)
  - Optimize particle count and rendering
  - Tune audio levels and timing
  - Adjust AI behavior parameters for gameplay feel
  - Test difficulty curve across score ranges
  - Tune acceleration/deceleration feel
  - Test performance and optimize as needed
  - _Requirements: All_
