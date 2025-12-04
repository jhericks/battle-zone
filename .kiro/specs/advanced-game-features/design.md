# Design Document

## Overview

This design document outlines the architecture and implementation approach for adding major enhancements to the existing BattleZone-style tank game:

1. **Retro Audio System**: Web Audio API-based sound effects including shooting, explosions, impacts, game over events, and continuous engine sounds
2. **Particle System**: Physics-based debris effects when tanks are destroyed
3. **3D First-Person Renderer**: Simple polygon-based 3D graphics with perspective projection
4. **Intelligent Enemy AI**: Directional line-of-sight detection and sound-based awareness
5. **Difficulty Balancing**: Enemy aim error system, slower enemy projectiles, and progressive difficulty curve
6. **Enhanced Controls**: Intuitive WASD movement and rotation controls
7. **Expanded Playfield**: Larger game area with clear boundaries and wider field of vision

The design maintains the existing game architecture while adding new modular systems that integrate cleanly with the current entity-based structure. The retro aesthetic is preserved through wireframe 3D rendering and synthesized audio effects.

## Architecture

### High-Level Component Structure

```
Game Core (existing)
├── Game Loop (requestAnimationFrame)
├── State Management (start, playing, gameOver)
├── Entity Management (player, enemy, shells, obstacles)
└── Input Handling (keyboard events)

New Systems (to be added)
├── Audio System
│   ├── Sound Generator (Web Audio API)
│   └── Sound Effect Manager
├── Particle System
│   ├── Particle Pool
│   └── Physics Updater
├── 3D Renderer
│   ├── Camera System
│   ├── 3D Projection
│   └── Wireframe Renderer
└── AI System
    ├── Line-of-Sight Calculator
    ├── Field-of-View Checker
    └── Last Known Position Tracker
```

### Integration Approach

The new systems will be integrated as follows:

1. **Audio System**: Hook into existing collision detection and state transition points
2. **Particle System**: Triggered when tank destruction occurs, updated in main game loop
3. **3D Renderer**: Replace existing 2D canvas rendering with 3D projection system
4. **AI System**: Enhance existing `updateEnemy()` function with LOS and awareness logic

## Components and Interfaces

### 1. Audio System

**Purpose**: Generate and play retro-style sound effects using Web Audio API

**Key Components**:
- `AudioContext`: Web Audio API context for sound generation
- `createShootSound()`: Generates short, high-pitched laser-like sound
- `createExplosionSound()`: Generates bass-heavy explosion with noise
- `createImpactSound()`: Generates metallic clang sound
- `createGameOverSound()`: Generates descending tone sequence

**Interface**:
```javascript
const audioSystem = {
    context: null,
    enabled: true,
    
    init() {
        // Initialize AudioContext
    },
    
    playShoot() {
        // Play shooting sound
    },
    
    playExplosion() {
        // Play explosion sound
    },
    
    playImpact() {
        // Play impact sound
    },
    
    playGameOver() {
        // Play game over sound
    }
};
```

**Sound Design**:
- **Shoot**: 100ms oscillator sweep from 800Hz to 400Hz (triangle wave)
- **Explosion**: 500ms white noise with low-pass filter sweep + bass tone
- **Impact**: 150ms metallic clang using multiple oscillators
- **Game Over**: 2-second descending tone sequence
- **Engine Idle**: Continuous low-frequency oscillator (40-60Hz) with subtle modulation
- **Engine Acceleration**: Pitch increases to 80-120Hz, volume increases 50%, adds harmonic overtones

### 2. Particle System

**Purpose**: Create and animate debris particles when tanks are destroyed

**Key Components**:
- `particles`: Array of active particle objects
- `createDebris(x, y, count)`: Spawns particles at destruction point
- `updateParticles()`: Updates particle physics each frame
- `drawParticles()`: Renders particles as purple line segments

**Particle Object Structure**:
```javascript
{
    x: number,           // Current X position
    y: number,           // Current Y position
    vx: number,          // X velocity
    vy: number,          // Y velocity
    angle: number,       // Rotation angle
    angularVel: number,  // Rotation speed
    lifetime: number,    // Remaining frames
    length: number       // Line segment length
}
```

**Physics**:
- Initial velocity: Random direction, magnitude 2-5 pixels/frame
- Gravity: 0.15 pixels/frame² downward acceleration
- Drag: 0.98 velocity multiplier per frame
- Lifetime: 60-120 frames (1-2 seconds at 60 FPS)
- Particle count: 12-16 per explosion

### 3. 3D Renderer

**Purpose**: Transform game from 2D top-down to 3D first-person perspective

**Key Components**:
- `camera`: Object storing 3D position and orientation
- `project3D(x, y, z)`: Projects 3D world coordinates to 2D screen coordinates
- `draw3DBox(x, y, z, width, height, depth)`: Draws wireframe rectangular prism
- `draw3DTank(x, y, z, angle)`: Draws simple 3D tank model
- `drawGroundGrid()`: Draws perspective grid for spatial reference

**Camera Structure**:
```javascript
{
    x: number,        // World X position (from player)
    y: number,        // World Y position (from player)
    z: number,        // Eye height (fixed, e.g., 20 units)
    yaw: number,      // Horizontal rotation (from player angle)
    pitch: number,    // Vertical rotation (fixed at 0 for now)
    fov: number,      // Field of view in radians (e.g., Math.PI / 3)
    near: number,     // Near clipping plane
    far: number       // Far clipping plane
}
```

**3D Projection Math**:
```
1. Transform world coordinates to camera space:
   - Translate by camera position
   - Rotate by camera yaw
   
2. Apply perspective projection:
   - screenX = (x / z) * focalLength + canvas.width / 2
   - screenY = (-y / z) * focalLength + canvas.height / 2  // Note: negated Y for correct orientation
   - focalLength = canvas.width / (2 * tan(fov / 2))
   
3. Z-axis correction:
   - The Y coordinate is negated during projection to ensure correct vertical orientation
   - Without negation, 3D models render upside down
   - This correction ensures objects with positive Z values appear above the ground plane
```

**3D Models**:
- **Tank**: Composite model with trapezoidal prism body (25 units wide, 35 units deep at bottom for treads, 28 units deep at top, 12 units tall) + cube turret (14x12x10) positioned on top + rectangular barrel (25 units long, 3x3 cross-section) extending from turret
- **Obstacle**: Rectangular prism matching 2D dimensions with height, rendered with opaque faces
- **Shell**: Small cube or sphere wireframe
- **Ground**: Grid of lines extending to horizon

**Rendering Pipeline**:
1. Draw ground grid
2. Collect all visible faces from all entities (obstacles, tanks, shells)
3. Apply back-face culling: calculate face normal using cross product, compute dot product with view direction, cull faces with dotProduct ≤ 0
4. Sort remaining faces by distance from camera (farthest to nearest)
5. For each face in sorted order:
   - Fill face with black color (creates opaque appearance)
   - Draw purple wireframe edges on top
6. Draw particles (if visible in 3D space)

**Back-Face Culling Algorithm**:
- Calculate face normal: `normal = cross(edge1, edge2)`
- Calculate view direction: `viewDir = normalize(faceCenter - cameraPos)`
- Compute visibility: `dotProduct = dot(normal, viewDir)`
- Cull if `dotProduct ≤ 0` (face pointing away from camera)

### 4. AI System Enhancement

**Purpose**: Add directional line-of-sight and sound-based awareness to enemy AI

**Key Components**:
- `hasLineOfSight(from, to)`: Checks if target is visible
- `isInFieldOfView(from, to, fromAngle, fovAngle)`: Checks if target is in front arc
- `lastKnownPlayerPos`: Stores position where player was last detected
- `enemyState`: Tracks AI state (hunting, searching, idle)

**Enemy State Machine**:
```
States:
- HUNTING: Has line-of-sight, actively pursuing and firing
- SEARCHING: Lost sight, moving to last known position
- IDLE: No awareness, stationary or patrolling

Transitions:
- IDLE → HUNTING: Gains line-of-sight OR hears player fire
- HUNTING → SEARCHING: Loses line-of-sight
- SEARCHING → HUNTING: Regains line-of-sight
- SEARCHING → IDLE: Reaches last known position without finding player
```

**Line-of-Sight Algorithm**:
```javascript
function hasLineOfSight(from, to) {
    // 1. Check if target is in forward field of view (180° arc)
    const angleToTarget = Math.atan2(to.y - from.y, to.x - from.x);
    const angleDiff = normalizeAngle(angleToTarget - from.angle);
    if (Math.abs(angleDiff) > Math.PI / 2) {
        return false; // Behind the tank
    }
    
    // 2. Cast ray from source to target
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 5); // Check every 5 pixels
    
    // 3. Check for obstacle intersections
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
```

**Sound Awareness**:
- When player fires, store `lastKnownPlayerPos = { x: player.x, y: player.y }`
- Enemy transitions to SEARCHING state if not already HUNTING
- Enemy moves toward last known position
- Clear last known position after timeout or when reached

### 5. Difficulty Balancing System

**Purpose**: Create fair, progressive difficulty through enemy aim error and projectile speed differences

**Key Components**:
- `calculateAimError(score)`: Returns aim offset in radians based on current difficulty
- `ENEMY_SHELL_SPEED_MULTIPLIER`: Constant defining enemy shell speed as fraction of player speed (0.6)
- `MIN_AIM_ERROR`: Minimum guaranteed miss angle for first shot (15 degrees)
- `MAX_AIM_ERROR`: Maximum aim error at score 0 (20-25 degrees)
- `AIM_IMPROVEMENT_RATE`: How quickly aim improves with score

**Aim Error Formula**:
```javascript
function calculateAimError(score) {
    // First shot always misses significantly
    if (score === 0 && !enemy.hasFiredOnce) {
        return (Math.random() - 0.5) * 2 * MIN_AIM_ERROR;
    }
    
    // Progressive improvement: starts at MAX_AIM_ERROR, approaches but never reaches 0
    const baseError = MAX_AIM_ERROR / (1 + score * AIM_IMPROVEMENT_RATE);
    const minError = 3 * (Math.PI / 180); // Always at least 3 degrees of error
    const actualError = Math.max(baseError, minError);
    
    // Random offset within error range
    return (Math.random() - 0.5) * 2 * actualError;
}
```

**Difficulty Curve Design**:
- Score 0 (Level 1): 20-25° aim error, guaranteed first miss
- Score 5: ~10° aim error
- Score 10: ~6° aim error
- Score 20+: ~3° aim error (never perfect)

**Shell Speed Balancing**:
- Player shell speed: Base speed (e.g., 8 pixels/frame)
- Enemy shell speed: 60% of player speed (4.8 pixels/frame)
- Gives player time to react and dodge

### 6. Control System Redesign

**Purpose**: Replace dual-tread controls with intuitive WASD movement

**Control Mapping**:
```javascript
const controls = {
    'w': () => moveForward(),      // Move in facing direction
    's': () => moveBackward(),     // Move opposite to facing direction
    'a': () => rotateLeft(),       // Rotate counter-clockwise
    'd': () => rotateRight(),      // Rotate clockwise
    ' ': () => fireShell()         // Fire (unchanged)
};
```

**Movement Implementation**:
- Forward/Backward: Apply velocity in direction of `player.angle`
- Rotation: Modify `player.angle` by rotation speed constant
- Simultaneous input: Allow W+A, W+D, S+A, S+D combinations for diagonal movement while rotating

**Acceleration System**:
```javascript
const TANK_MAX_SPEED = 3.0;           // pixels per frame
const TANK_ACCELERATION = 0.15;       // pixels per frame²
const TANK_DECELERATION = 0.2;        // pixels per frame² (slightly faster stop)

player = {
    // ... existing properties ...
    velocity: 0,                       // Current speed (-MAX_SPEED to +MAX_SPEED)
    targetVelocity: 0                  // Desired speed based on input
};

function updatePlayerMovement() {
    // Set target based on input
    if (keys['w']) targetVelocity = TANK_MAX_SPEED;
    else if (keys['s']) targetVelocity = -TANK_MAX_SPEED;
    else targetVelocity = 0;
    
    // Smoothly interpolate toward target
    if (velocity < targetVelocity) {
        velocity = Math.min(velocity + TANK_ACCELERATION, targetVelocity);
    } else if (velocity > targetVelocity) {
        velocity = Math.max(velocity - TANK_DECELERATION, targetVelocity);
    }
    
    // Apply velocity to position
    player.x += Math.cos(player.angle) * velocity;
    player.y += Math.sin(player.angle) * velocity;
}
```

**Acceleration Feel**:
- Time to max speed: ~20 frames (0.33 seconds at 60 FPS) - feels responsive but weighty
- Time to stop: ~15 frames (0.25 seconds) - slightly quicker for better control
- Creates tank-like momentum without feeling sluggish

**UI Updates**:
- Update start screen instructions: "WASD to move/rotate, SPACE to fire"
- Remove references to Q/A/W/S dual-tread controls

### 7. Playfield Expansion System

**Purpose**: Create larger tactical space with clear boundaries and better visibility

**Playfield Configuration**:
```javascript
const PLAYFIELD_WIDTH = 2000;   // Up from ~800
const PLAYFIELD_HEIGHT = 2000;  // Up from ~600
const VIEWPORT_WIDTH = 800;     // Canvas size unchanged
const VIEWPORT_HEIGHT = 600;
const FOV = Math.PI / 2;        // 90 degrees (up from ~60)
```

**Boundary Rendering**:
- Draw purple wireframe walls at playfield edges
- Walls rendered as 3D rectangular prisms (height: 50 units)
- Visible from distance to provide spatial awareness

**Boundary Collision**:
- Prevent player/enemy movement beyond `[0, PLAYFIELD_WIDTH]` x `[0, PLAYFIELD_HEIGHT]`
- Destroy shells that reach boundaries
- Optional: Play impact sound/effect when shell hits boundary

**Obstacle Scaling**:
- Original playfield: ~800x600 with 3-4 obstacles
- New playfield: 2000x2000 (6.9x area)
- Scale to ~20-25 obstacles to maintain similar density
- Distribute obstacles across playfield using spatial distribution algorithm

**Camera FOV**:
- Increase field of vision from ~60° to 90°
- Adjust projection matrix focal length accordingly
- Provides better peripheral awareness in first-person view

## Data Models

### Extended Enemy Object

```javascript
enemy = {
    // Existing properties
    x: number,
    y: number,
    angle: number,
    fireCooldown: number,
    
    // New properties for AI
    state: 'idle' | 'hunting' | 'searching',
    lastKnownPlayerPos: { x: number, y: number } | null,
    searchTimeout: number,  // Frames to search before giving up
    
    // New properties for difficulty
    hasFiredOnce: boolean   // Track if enemy has fired at least once (for guaranteed first miss)
}
```

### Particle Object

```javascript
particle = {
    x: number,
    y: number,
    z: number,           // For 3D rendering
    vx: number,
    vy: number,
    vz: number,          // For 3D physics
    angle: number,
    angularVel: number,
    lifetime: number,
    length: number,
    color: string        // PURPLE with alpha
}
```

### Camera Object

```javascript
camera = {
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    fov: number,        // Updated to Math.PI / 2 (90 degrees)
    near: number,
    far: number
}
```

### Audio Engine State

```javascript
engineSound = {
    oscillator: OscillatorNode | null,
    gainNode: GainNode | null,
    isPlaying: boolean,
    currentFrequency: number,
    targetFrequency: number,
    currentGain: number,
    targetGain: number
}
```

### Playfield Configuration

```javascript
playfield = {
    width: 2000,
    height: 2000,
    obstacleCount: 20,  // Scaled from original 3-4
    boundaries: [
        { x: 0, y: 0, width: 2000, height: 10 },      // Top wall
        { x: 0, y: 1990, width: 2000, height: 10 },   // Bottom wall
        { x: 0, y: 0, width: 10, height: 2000 },      // Left wall
        { x: 1990, y: 0, width: 10, height: 2000 }    // Right wall
    ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Audio System Properties

Property 1: Player firing triggers shoot sound
*For any* player tank firing event, the audio system's shoot sound should be played
**Validates: Requirements 1.1**

Property 2: Tank destruction triggers explosion sound
*For any* tank destruction event, the audio system's explosion sound should be played
**Validates: Requirements 1.2**

Property 3: Shell-obstacle collision triggers impact sound
*For any* shell that collides with an obstacle, the audio system's impact sound should be played
**Validates: Requirements 1.3**

### Particle System Properties

Property 4: Tank hit creates particles at correct location
*For any* tank hit by a shell, debris particles should be created with positions matching the tank's coordinates
**Validates: Requirements 2.1**

Property 5: Particle velocities radiate outward
*For any* set of debris particles created at a destruction point, each particle's velocity vector should point away from that origin point
**Validates: Requirements 2.2**

Property 6: Particle physics updates correctly
*For any* particle across any frame update, its new position should equal its old position plus velocity, and its velocity should be modified by gravity and drag
**Validates: Requirements 2.3**

Property 7: Expired particles are removed
*For any* particle whose lifetime reaches zero or below, that particle should no longer exist in the active particle list
**Validates: Requirements 2.5**

### 3D Rendering Properties

Property 8: Camera position matches player position
*For any* player position during playing state, the camera's x and y coordinates should match the player's x and y coordinates
**Validates: Requirements 3.1**

Property 9: Camera orientation matches player orientation
*For any* player angle during playing state, the camera's yaw should match the player's facing angle
**Validates: Requirements 3.2**

Property 10: Perspective projection maintains depth ordering
*For any* two 3D points at different depths, the point with greater z-distance from camera should project to a smaller screen size
**Validates: Requirements 3.7**

Property 11: Perspective projection preserves relative positions
*For any* two 3D points at the same depth, their relative screen positions should maintain the same ratio as their relative world positions
**Validates: Requirements 3.7**

### AI System Properties

Property 12: Field of view blocks rear detection
*For any* enemy-player configuration where the player is in the rear 180° arc of the enemy, the line-of-sight calculation should return false
**Validates: Requirements 4.3**

Property 13: Obstacles block line of sight
*For any* enemy-player configuration where an obstacle intersects the ray between them, the line-of-sight calculation should return false
**Validates: Requirements 4.5**

Property 14: Blocked LOS prevents rotation
*For any* game state where line-of-sight is blocked, the enemy's angle should not be changing to face the player's current position
**Validates: Requirements 4.6**

Property 15: Blocked LOS prevents firing
*For any* game state where line-of-sight is blocked, the enemy should not create new shells
**Validates: Requirements 4.7**

Property 16: Player firing records position
*For any* player firing event, the last known player position should be updated to match the player's position at the moment of firing
**Validates: Requirements 4.8**

Property 17: Enemy moves toward last known position
*For any* game state where the enemy has a last known position and LOS is blocked, the enemy should be moving in the direction of that last known position
**Validates: Requirements 4.9**

Property 18: Clear LOS enables normal behavior
*For any* game state where line-of-sight is clear, the enemy should be rotating toward the player's current position and able to fire
**Validates: Requirements 4.10**

### Engine Sound Properties

Property 19: Idle engine sound plays when stationary
*For any* game state where the player tank has zero velocity, the engine sound should be playing at idle frequency and volume
**Validates: Requirements 1.5**

Property 20: Engine sound increases with movement
*For any* game state where the player tank is moving, the engine sound frequency and gain should be higher than idle values
**Validates: Requirements 1.6**

Property 21: Engine sound transitions smoothly
*For any* two consecutive frames where engine state changes, the frequency and gain changes should be gradual (bounded by maximum delta per frame)
**Validates: Requirements 1.7**

### Difficulty Balance Properties

Property 22: Enemy firing applies aim error
*For any* enemy firing event, the actual firing angle should differ from the perfect aim angle by some non-zero error amount
**Validates: Requirements 5.1**

Property 23: Aim error decreases with score
*For any* two scores where score A < score B, the maximum aim error at score A should be greater than or equal to the maximum aim error at score B
**Validates: Requirements 5.3**

Property 24: Aim error never reaches zero
*For any* score value, the calculated aim error range should always include a minimum non-zero error threshold
**Validates: Requirements 5.3**

Property 25: Enemy shell speed is 60% of player speed
*For any* enemy shell created, its speed should equal 0.6 times the player shell speed
**Validates: Requirements 5.4**

Property 26: Enemy fires only one shell at a time
*For any* game state, the enemy should have at most one active shell
**Validates: Requirements 5.5**

### Control System Properties

Property 27: W key moves player forward
*For any* player state, pressing W should result in position change in the direction of player.angle
**Validates: Requirements 5.6**

Property 28: S key moves player backward
*For any* player state, pressing S should result in position change opposite to player.angle
**Validates: Requirements 5.7**

Property 29: A key rotates player left
*For any* player state, pressing A should result in player.angle decreasing
**Validates: Requirements 5.8**

Property 30: D key rotates player right
*For any* player state, pressing D should result in player.angle increasing
**Validates: Requirements 5.9**

Property 31: Space key fires shell
*For any* player state with no active shell, pressing SPACE should create a new shell
**Validates: Requirements 5.10**

Property 34: Tank acceleration is gradual
*For any* two consecutive frames where movement input is active, the change in velocity should not exceed the acceleration constant
**Validates: Requirements 5.12, 5.14**

Property 35: Tank deceleration is gradual
*For any* two consecutive frames where no movement input is active, the change in velocity should not exceed the deceleration constant
**Validates: Requirements 5.13, 5.14**

### Playfield Properties

Property 32: Tanks cannot move beyond boundaries
*For any* tank position after movement update, the x and y coordinates should be within [0, PLAYFIELD_WIDTH] and [0, PLAYFIELD_HEIGHT]
**Validates: Requirements 5.15**

Property 33: Shells are destroyed at boundaries
*For any* shell whose position is outside playfield bounds, that shell should not exist in the active shell list
**Validates: Requirements 5.16**

## Error Handling

### Audio System Errors

**Browser Compatibility**:
- Check for Web Audio API support before initialization
- Gracefully degrade to silent mode if audio is unavailable
- Handle AudioContext creation failures

**User Interaction Requirement**:
- Web Audio API requires user gesture to start
- Initialize audio context on first user input (key press or click)
- Display message if audio fails to initialize

### 3D Rendering Errors

**Division by Zero**:
- Check for zero or negative z-values before projection
- Clamp z-values to minimum threshold (e.g., 0.1)
- Skip rendering objects behind camera (z <= 0)

**Canvas Context**:
- Verify canvas and 2D context exist before rendering
- Handle canvas resize events to update projection matrix

### AI System Errors

**Invalid Positions**:
- Validate entity positions are within world bounds
- Handle null/undefined enemy or player objects
- Default to idle behavior if calculations fail

**Ray Casting Edge Cases**:
- Handle zero-length rays (enemy and player at same position)
- Prevent infinite loops in ray stepping
- Limit ray distance to reasonable maximum

## Testing Strategy

### Unit Testing

**Audio System Tests**:
- Test sound generation functions create valid audio nodes
- Test sound playback triggers at correct game events
- Test graceful degradation when audio unavailable
- Test engine sound state transitions (idle to acceleration)
- Test engine sound frequency and gain calculations

**Particle System Tests**:
- Test particle creation at specified positions
- Test particle removal after lifetime expires
- Test particle pool management

**3D Projection Tests**:
- Test projection math with known input/output pairs
- Test depth ordering calculations
- Test camera transformation matrices

**AI System Tests**:
- Test line-of-sight with clear path returns true
- Test line-of-sight with obstacle returns false
- Test field-of-view angle calculations
- Test last known position updates on player fire

**Difficulty System Tests**:
- Test aim error calculation for various scores
- Test first shot guaranteed miss at score 0
- Test aim error never reaches zero
- Test enemy shell speed is 60% of player speed
- Test enemy one-shell-at-a-time constraint

**Control System Tests**:
- Test WASD key mappings produce correct movement
- Test rotation direction for A and D keys
- Test forward/backward movement relative to facing angle

**Playfield Tests**:
- Test boundary collision prevents tank movement
- Test shells are destroyed at boundaries
- Test obstacle count scales with playfield size
- Test FOV is at least 90 degrees

### Property-Based Testing

The testing strategy will use **fast-check** (JavaScript property-based testing library) to verify the correctness properties defined above.

**Test Configuration**:
- Minimum 100 iterations per property test
- Use appropriate generators for game entities (positions, angles, velocities)
- Seed random number generator for reproducibility

**Generator Strategies**:
- **Positions**: Generate random x, y coordinates within canvas bounds
- **Angles**: Generate random angles in range [0, 2π]
- **Velocities**: Generate random velocity vectors with magnitude constraints
- **Obstacles**: Generate random rectangular obstacles within bounds
- **Game States**: Generate valid game state configurations

**Property Test Examples**:

1. **Particle Velocity Radiation** (Property 4):
```javascript
fc.assert(
  fc.property(
    fc.record({
      x: fc.float({ min: 0, max: 800 }),
      y: fc.float({ min: 0, max: 600 }),
      count: fc.integer({ min: 5, max: 20 })
    }),
    ({ x, y, count }) => {
      const particles = createDebris(x, y, count);
      return particles.every(p => {
        const dx = p.vx;
        const dy = p.vy;
        // Velocity should point away from origin
        const dotProduct = dx * (p.x - x) + dy * (p.y - y);
        return dotProduct >= 0;
      });
    }
  ),
  { numRuns: 100 }
);
```

2. **Line-of-Sight Obstacle Blocking** (Property 12):
```javascript
fc.assert(
  fc.property(
    fc.record({
      enemyX: fc.float({ min: 100, max: 700 }),
      enemyY: fc.float({ min: 100, max: 500 }),
      playerX: fc.float({ min: 100, max: 700 }),
      playerY: fc.float({ min: 100, max: 500 }),
      obstacleX: fc.float({ min: 100, max: 700 }),
      obstacleY: fc.float({ min: 100, max: 500 })
    }),
    (config) => {
      // Place obstacle directly between enemy and player
      const midX = (config.enemyX + config.playerX) / 2;
      const midY = (config.enemyY + config.playerY) / 2;
      const obstacle = { x: midX - 20, y: midY - 20, width: 40, height: 40 };
      
      const enemy = { x: config.enemyX, y: config.enemyY, angle: 0 };
      const player = { x: config.playerX, y: config.playerY };
      
      const los = hasLineOfSight(enemy, player, [obstacle]);
      return los === false;
    }
  ),
  { numRuns: 100 }
);
```

3. **Camera Position Tracking** (Property 8):
```javascript
fc.assert(
  fc.property(
    fc.record({
      playerX: fc.float({ min: 50, max: 750 }),
      playerY: fc.float({ min: 50, max: 550 }),
      playerAngle: fc.float({ min: 0, max: 2 * Math.PI })
    }),
    ({ playerX, playerY, playerAngle }) => {
      const player = { x: playerX, y: playerY, angle: playerAngle };
      const camera = updateCamera(player);
      
      return Math.abs(camera.x - player.x) < 0.01 &&
             Math.abs(camera.y - player.y) < 0.01;
    }
  ),
  { numRuns: 100 }
);
```

4. **Aim Error Monotonic Decrease** (Property 23):
```javascript
fc.assert(
  fc.property(
    fc.record({
      scoreA: fc.integer({ min: 0, max: 50 }),
      scoreB: fc.integer({ min: 0, max: 50 })
    }),
    ({ scoreA, scoreB }) => {
      if (scoreA >= scoreB) return true; // Only test when A < B
      
      const errorA = calculateMaxAimError(scoreA);
      const errorB = calculateMaxAimError(scoreB);
      
      return errorA >= errorB;
    }
  ),
  { numRuns: 100 }
);
```

5. **Boundary Collision Prevention** (Property 32):
```javascript
fc.assert(
  fc.property(
    fc.record({
      tankX: fc.float({ min: -100, max: 2100 }),
      tankY: fc.float({ min: -100, max: 2100 }),
      angle: fc.float({ min: 0, max: 2 * Math.PI }),
      speed: fc.float({ min: 1, max: 10 })
    }),
    ({ tankX, tankY, angle, speed }) => {
      const tank = { x: tankX, y: tankY, angle, speed };
      updateTankPosition(tank);
      applyBoundaryConstraints(tank);
      
      return tank.x >= 0 && tank.x <= PLAYFIELD_WIDTH &&
             tank.y >= 0 && tank.y <= PLAYFIELD_HEIGHT;
    }
  ),
  { numRuns: 100 }
);
```

6. **Enemy Shell Speed Ratio** (Property 25):
```javascript
fc.assert(
  fc.property(
    fc.record({
      playerShellSpeed: fc.float({ min: 5, max: 15 })
    }),
    ({ playerShellSpeed }) => {
      const enemyShell = createEnemyShell(playerShellSpeed);
      const expectedSpeed = playerShellSpeed * 0.6;
      
      return Math.abs(enemyShell.speed - expectedSpeed) < 0.01;
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**End-to-End Scenarios**:
- Test complete game flow with all new features enabled
- Test feature interactions (e.g., particles in 3D view, sounds with AI behavior)
- Test performance with multiple particles and 3D rendering

**Cross-Feature Tests**:
- Verify audio plays correctly during 3D rendering
- Verify particles render correctly in 3D space
- Verify AI behavior works correctly in 3D environment

### Manual Testing

**Visual Verification**:
- Verify 3D perspective looks correct and natural
- Verify particle effects are visually satisfying
- Verify wireframe rendering maintains retro aesthetic

**Audio Verification**:
- Verify sounds are appropriately retro-styled
- Verify sound timing matches visual events
- Verify audio levels are balanced

**Gameplay Verification**:
- Verify AI behavior feels intelligent and fair
- Verify line-of-sight mechanics are intuitive
- Verify first-person controls feel responsive

## Implementation Notes

### Performance Considerations

**3D Rendering**:
- Limit number of line segments drawn per frame
- Use opaque rendering with black-filled faces and purple wireframe edges
- Apply back-face culling to reduce face count by ~50%
- Cull objects outside view frustum
- Sort all faces globally by depth every frame for correct occlusion
- Face sorting is O(n log n) but necessary for proper depth ordering

**Particle System**:
- Use object pooling to avoid garbage collection
- Limit maximum active particles (e.g., 100)
- Remove particles that move off-screen

**Audio System**:
- Reuse audio nodes when possible
- Limit concurrent sounds (e.g., max 5 simultaneous)
- Use short sound durations to reduce memory usage
- Keep engine sound oscillator running continuously, modulate frequency/gain
- Use smooth transitions (linear ramps) for engine sound changes to avoid clicks

**Difficulty System**:
- Store aim error calculation in constants for easy tuning
- Track enemy.hasFiredOnce flag to implement guaranteed first miss
- Use Math.random() for aim error to ensure unpredictability

**Playfield System**:
- Use spatial hashing or grid-based distribution for obstacle placement
- Render only visible portions of large playfield (viewport culling)
- Scale obstacle count proportionally: (new_area / old_area) * old_count

### Browser Compatibility

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs**:
- Canvas 2D Context (widely supported)
- Web Audio API (check for support)
- requestAnimationFrame (widely supported)

### Code Organization

**File Structure** (maintaining single-file approach):
```javascript
// Constants
// ... existing constants ...
// ... new constants for audio, particles, 3D, difficulty, playfield ...

// Difficulty System
const ENEMY_SHELL_SPEED_MULTIPLIER = 0.6;
const MIN_AIM_ERROR = 15 * (Math.PI / 180);
const MAX_AIM_ERROR = 25 * (Math.PI / 180);
const AIM_IMPROVEMENT_RATE = 0.1;
function calculateAimError(score) { ... }

// Audio System
const audioSystem = { ... };
const engineSound = { ... };
function updateEngineSound(isMoving) { ... }

// Particle System
let particles = [];
function createDebris() { ... }
function updateParticles() { ... }
function drawParticles() { ... }

// 3D Renderer
const camera = { ... };
function project3D() { ... }
function draw3DBox() { ... }
function draw3DTank() { ... }

// AI System
function hasLineOfSight() { ... }
function isInFieldOfView() { ... }

// Playfield System
const PLAYFIELD_WIDTH = 2000;
const PLAYFIELD_HEIGHT = 2000;
function applyBoundaryConstraints(entity) { ... }
function initializeObstacles() { ... }

// Control System
function handleWASDInput() { ... }

// ... existing game code with modifications ...
```

### Migration Strategy

**Phase 1: Audio System**
- Add audio system without breaking existing functionality
- Hook into existing collision and state transition points
- Test independently

**Phase 2: Particle System**
- Add particle system alongside existing rendering
- Trigger on tank destruction
- Test in 2D view first

**Phase 3: AI Enhancement**
- Enhance existing enemy AI with LOS and awareness
- Maintain backward compatibility with existing behavior
- Test with 2D rendering

**Phase 4: 3D Renderer**
- Implement 3D projection and camera system
- Convert existing draw functions to 3D
- Test with all other features enabled

**Phase 5: Difficulty Balancing**
- Implement aim error calculation system
- Add enemy shell speed multiplier
- Test difficulty progression across score ranges

**Phase 6: Control System Redesign**
- Replace dual-tread controls with WASD
- Update UI instructions
- Test movement and rotation feel

**Phase 7: Playfield Expansion**
- Increase playfield dimensions
- Add boundary walls and collision
- Scale obstacle count
- Widen camera FOV
- Test spatial awareness and gameplay flow

This phased approach allows incremental testing and reduces risk of breaking existing functionality.
