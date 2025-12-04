const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PURPLE = '#a855f7';
const TANK_SIZE = 30;
const SHELL_SIZE = 20;
const OBSTACLE_SIZE = 40;
const ROTATION_SPEED = 0.007;
const MOVE_SPEED = 0.7;
const SHELL_SPEED = 2.1;
const ENEMY_BASE_MOVE_SPEED = 0.175;
const ENEMY_BASE_ROTATION_SPEED = 0.0028;
const ENEMY_FIRE_COOLDOWN = 120; // frames
const ENEMY_SPEED_INCREASE = 1.1; // 10% increase per kill

// Tank acceleration constants (tuned for better feel)
const TANK_MAX_SPEED = 3.0;           // pixels per frame
const TANK_ACCELERATION = 0.18;       // pixels per frame² (slightly faster for responsiveness)
const TANK_DECELERATION = 0.22;       // pixels per frame² (slightly faster stop for better control)

// Difficulty balancing constants (tuned for better gameplay feel)
const MIN_AIM_ERROR = 15 * (Math.PI / 180); // 15 degrees minimum for first shot
const MAX_AIM_ERROR = 20 * (Math.PI / 180); // 20 degrees maximum at score 0 (reduced for better challenge)
const AIM_IMPROVEMENT_RATE = 0.12; // How quickly aim improves with score (slower progression)
const ENEMY_SHELL_SPEED_MULTIPLIER = 0.6; // Enemy shells are 60% of player speed

/**
 * Calculate aim error offset based on current score
 * @param {number} score - Current player score
 * @param {boolean} isFirstShot - True if this is the enemy's first shot ever
 * @returns {number} Aim error offset in radians
 */
function calculateAimError(score, isFirstShot) {
    // First shot always misses significantly
    if (isFirstShot) {
        return (Math.random() - 0.5) * 2 * MIN_AIM_ERROR;
    }
    
    // Progressive improvement: starts at MAX_AIM_ERROR, approaches but never reaches 0
    const baseError = MAX_AIM_ERROR / (1 + score * AIM_IMPROVEMENT_RATE);
    const minError = 3 * (Math.PI / 180); // Always at least 3 degrees of error
    const actualError = Math.max(baseError, minError);
    
    // Random offset within error range
    return (Math.random() - 0.5) * 2 * actualError;
}

// Playfield constants
const PLAYFIELD_WIDTH = 2000;
const PLAYFIELD_HEIGHT = 2000;

// Optimization constants
// These values are tuned for optimal performance and visual quality balance
const MAX_PARTICLES = 80; // Maximum active particles (reduced for better performance)
const PARTICLE_CULL_DISTANCE = 700; // Don't render particles beyond this distance
const FRUSTUM_CULL_DISTANCE = 1000; // Don't render objects beyond this distance (optimized)
const AUDIO_MAX_VOLUME = 0.22; // Tuned for better audio balance
const GRID_RENDER_DISTANCE = 500; // Reduced grid rendering distance for performance

// Audio System
const audioSystem = {
    context: null,
    enabled: false,
    
    init() {
        try {
            // Create AudioContext (with vendor prefixes for compatibility)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                return false;
            }
            
            this.context = new AudioContext();
            this.enabled = true;
            
            // Initialize engine sound
            this.initEngineSound();
            
            return true;
        } catch (e) {
            console.warn('Failed to initialize audio:', e);
            return false;
        }
    },
    
    initEngineSound() {
        if (!this.context) return;
        
        // Create oscillator and gain nodes for continuous engine sound
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Use sawtooth wave for engine-like sound
        oscillator.type = 'sawtooth';
        
        // Start at idle frequency
        oscillator.frequency.setValueAtTime(50, this.context.currentTime);
        
        // Start at zero volume (will ramp up when game starts)
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        
        // Start the oscillator (it runs continuously)
        oscillator.start();
        
        // Store references
        this.engineSound = {
            oscillator: oscillator,
            gainNode: gainNode,
            isPlaying: false,
            currentFrequency: 50,
            targetFrequency: 50,
            currentGain: 0,
            targetGain: 0
        };
    },
    
    // Resume audio context (required for user gesture in some browsers)
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },
    
    playShoot() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        const duration = 0.07; // Slightly shorter for snappier feel
        
        // Create oscillator for laser-like sound
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Triangle wave for retro sound
        oscillator.type = 'triangle';
        
        // Frequency sweep from 800Hz to 400Hz
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + duration);
        
        // Volume envelope - tuned for better balance
        gainNode.gain.setValueAtTime(AUDIO_MAX_VOLUME, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    },
    
    playExplosion() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        const duration = 0.4; // Shortened for snappier feel
        
        // Create noise buffer for explosion
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        // Low-pass filter for bass-heavy sound
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        const gainNode = this.context.createGain();
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Volume envelope - tuned for better balance
        gainNode.gain.setValueAtTime(AUDIO_MAX_VOLUME * 1.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // Add bass tone
        const bassOsc = this.context.createOscillator();
        const bassGain = this.context.createGain();
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.context.destination);
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(80, now);
        bassOsc.frequency.exponentialRampToValueAtTime(40, now + duration);
        
        bassGain.gain.setValueAtTime(AUDIO_MAX_VOLUME, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        noise.start(now);
        noise.stop(now + duration);
        bassOsc.start(now);
        bassOsc.stop(now + duration);
    },
    
    playImpact() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        const duration = 0.10; // Shorter for snappier feel
        
        // Create multiple oscillators for metallic clang
        const frequencies = [200, 300, 400];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, now);
            
            // Quick decay for metallic sound - tuned for better balance
            gainNode.gain.setValueAtTime(AUDIO_MAX_VOLUME * 0.7, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now + index * 0.007);
            oscillator.stop(now + duration);
        });
    },
    
    playGameOver() {
        if (!this.enabled || !this.context) return;
        
        const now = this.context.currentTime;
        
        // Descending tone sequence
        const notes = [440, 392, 349, 330, 294]; // A, G, F, E, D
        const noteDuration = 0.35; // Slightly faster
        
        notes.forEach((freq, index) => {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + index * noteDuration);
            
            // Envelope for each note - tuned for better balance
            const startTime = now + index * noteDuration;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(AUDIO_MAX_VOLUME * 1.2, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + noteDuration);
        });
    },
    
    /**
     * Update engine sound based on player movement
     * @param {boolean} isMoving - True if player is moving, false if stationary
     */
    updateEngineSound(isMoving) {
        if (!this.enabled || !this.context || !this.engineSound) return;
        
        const now = this.context.currentTime;
        const engine = this.engineSound;
        
        // Define frequency and gain ranges
        const IDLE_FREQUENCY = 50;      // 40-60Hz range, using middle value
        const ACCEL_FREQUENCY = 100;    // 80-120Hz range, using middle value
        const IDLE_GAIN = 0.08;         // Low volume for idle
        const ACCEL_GAIN = 0.15;        // Higher volume for acceleration
        const TRANSITION_TIME = 0.3;    // Smooth transition over 0.3 seconds
        
        // Determine target values based on movement state
        if (isMoving) {
            engine.targetFrequency = ACCEL_FREQUENCY;
            engine.targetGain = ACCEL_GAIN;
            engine.isPlaying = true;
        } else {
            engine.targetFrequency = IDLE_FREQUENCY;
            engine.targetGain = IDLE_GAIN;
            engine.isPlaying = true;
        }
        
        // Apply smooth transitions using linear ramps
        // Cancel any scheduled changes first
        engine.oscillator.frequency.cancelScheduledValues(now);
        engine.gainNode.gain.cancelScheduledValues(now);
        
        // Set current values
        engine.oscillator.frequency.setValueAtTime(engine.currentFrequency, now);
        engine.gainNode.gain.setValueAtTime(engine.currentGain, now);
        
        // Ramp to target values
        engine.oscillator.frequency.linearRampToValueAtTime(engine.targetFrequency, now + TRANSITION_TIME);
        engine.gainNode.gain.linearRampToValueAtTime(engine.targetGain, now + TRANSITION_TIME);
        
        // Update current values for next call
        engine.currentFrequency = engine.targetFrequency;
        engine.currentGain = engine.targetGain;
    },
    
    /**
     * Stop engine sound (for game over or pause)
     */
    stopEngineSound() {
        if (!this.enabled || !this.context || !this.engineSound) return;
        
        const now = this.context.currentTime;
        const engine = this.engineSound;
        
        // Fade out smoothly
        engine.gainNode.gain.cancelScheduledValues(now);
        engine.gainNode.gain.setValueAtTime(engine.currentGain, now);
        engine.gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        
        engine.currentGain = 0;
        engine.targetGain = 0;
        engine.isPlaying = false;
    }
};

// Particle System
let particles = [];

// 3D Camera System
const camera = {
    x: 0,           // World X position (synced with player)
    y: 0,           // World Y position (synced with player)
    z: 20,          // Eye height (elevated above ground)
    yaw: 0,         // Horizontal rotation (synced with player angle)
    pitch: 0,       // Vertical rotation (fixed at 0 for now)
    fov: Math.PI / 2,  // Field of view in radians (90 degrees)
    near: 0.1,      // Near clipping plane
    far: 1000       // Far clipping plane
};

/**
 * Update camera to match player position and orientation
 * @param {Object} player - Player object with x, y, angle properties
 * @returns {Object} Updated camera object
 */
function updateCamera(player) {
    // Sync camera position with player position
    camera.x = player.x;
    camera.y = player.y;
    // z remains at fixed eye height
    
    // Sync camera yaw with player facing angle
    camera.yaw = player.angle;
    
    return camera;
}

// 3D Projection System

/**
 * Project 3D world coordinates to 2D screen coordinates
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate (height)
 * @returns {Object|null} Screen coordinates {x, y, depth} or null if behind camera or culled
 */
function project3D(x, y, z) {
    // 1. Transform world coordinates to camera space
    
    // Translate to camera position
    let cx = x - camera.x;
    let cy = y - camera.y;
    let cz = z - camera.z;
    
    // Rotate by camera yaw (horizontal rotation)
    // Adjust camera angle to align with player's coordinate system
    // Player at 270° should be looking "forward" in camera space
    const adjustedYaw = -(camera.yaw - Math.PI / 2);
    const cosYaw = Math.cos(adjustedYaw);
    const sinYaw = Math.sin(adjustedYaw);
    
    const rotatedX = cx * cosYaw - cy * sinYaw;
    const rotatedY = cx * sinYaw + cy * cosYaw;
    
    // In camera space:
    // - rotatedX is left/right (positive = right)
    // - rotatedY is forward/backward (positive = forward/away from camera)
    // - cz is up/down (positive = up)
    
    // 2. Handle clipping (objects behind camera or too far)
    // If object is behind or too close to camera, don't render
    if (rotatedY <= camera.near) {
        return null;
    }
    
    // Frustum culling: don't render objects beyond far distance
    if (rotatedY > FRUSTUM_CULL_DISTANCE) {
        return null;
    }
    
    // Clamp to prevent extreme values
    const depth = Math.max(rotatedY, camera.near);
    
    // 3. Apply perspective projection
    // Calculate focal length from field of view
    const focalLength = (canvas.width / 2) / Math.tan(camera.fov / 2);
    
    // Perspective division: project 3D point onto 2D screen
    // The further away (larger depth), the smaller the screen coordinates
    const screenX = (rotatedX / depth) * focalLength + canvas.width / 2;
    const screenY = (cz / depth) * focalLength + canvas.height / 2;
    
    return {
        x: screenX,
        y: screenY,
        depth: depth  // Store depth for sorting and culling
    };
}

// 3D Wireframe Rendering

/**
 * Draw a 3D line from (x1, y1, z1) to (x2, y2, z2) with screen-space culling
 * @param {number} x1 - Start X coordinate in world space
 * @param {number} y1 - Start Y coordinate in world space
 * @param {number} z1 - Start Z coordinate in world space
 * @param {number} x2 - End X coordinate in world space
 * @param {number} y2 - End Y coordinate in world space
 * @param {number} z2 - End Z coordinate in world space
 * @returns {boolean} True if line was drawn, false if clipped
 */
function draw3DLine(x1, y1, z1, x2, y2, z2) {
    // Project both endpoints to screen space
    const p1 = project3D(x1, y1, z1);
    const p2 = project3D(x2, y2, z2);
    
    // Skip if either point is behind camera or culled
    if (!p1 || !p2) {
        return false;
    }
    
    // Screen-space culling: skip lines completely off-screen
    const margin = 50; // Small margin to avoid clipping visible lines
    if ((p1.x < -margin && p2.x < -margin) || 
        (p1.x > canvas.width + margin && p2.x > canvas.width + margin) ||
        (p1.y < -margin && p2.y < -margin) || 
        (p1.y > canvas.height + margin && p2.y > canvas.height + margin)) {
        return false;
    }
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    return true;
}

/**
 * Draw a 3D wireframe box (rectangular prism)
 * @param {number} x - Center X coordinate in world space
 * @param {number} y - Center Y coordinate in world space
 * @param {number} z - Center Z coordinate in world space (bottom of box)
 * @param {number} width - Width of box (X dimension)
 * @param {number} height - Height of box (Z dimension, vertical)
 * @param {number} depth - Depth of box (Y dimension)
 */
function draw3DBox(x, y, z, width, height, depth) {
    // Calculate the 8 vertices of the box
    // Bottom face (z = z)
    const x1 = x - width / 2;
    const x2 = x + width / 2;
    const y1 = y - depth / 2;
    const y2 = y + depth / 2;
    const z1 = z;
    const z2 = z + height;
    
    // Define the 8 corners
    const vertices = [
        // Bottom face
        [x1, y1, z1], // 0: front-left-bottom
        [x2, y1, z1], // 1: front-right-bottom
        [x2, y2, z1], // 2: back-right-bottom
        [x1, y2, z1], // 3: back-left-bottom
        // Top face
        [x1, y1, z2], // 4: front-left-top
        [x2, y1, z2], // 5: front-right-top
        [x2, y2, z2], // 6: back-right-top
        [x1, y2, z2]  // 7: back-left-top
    ];
    
    // Define the 12 edges (pairs of vertex indices)
    const edges = [
        // Bottom face
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Top face
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical edges
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    // Draw all edges
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    
    for (let edge of edges) {
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        draw3DLine(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
    }
}

/**
 * Draw a 3D wireframe tank model
 * @param {number} x - Tank X coordinate in world space
 * @param {number} y - Tank Y coordinate in world space
 * @param {number} z - Tank Z coordinate in world space (ground level)
 * @param {number} angle - Tank facing angle in radians
 */
function draw3DTank(x, y, z, angle) {
    // Tank dimensions
    const bodyWidth = 20;
    const bodyDepth = 15;
    const bodyHeight = 10;
    
    const turretWidth = 12;
    const turretDepth = 10;
    const turretHeight = 8;
    
    const barrelLength = 15;
    const barrelRadius = 2;
    
    // Calculate rotated positions for tank body
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Body vertices (rotated around tank center)
    const bodyVertices = [];
    const halfWidth = bodyWidth / 2;
    const halfDepth = bodyDepth / 2;
    
    // Bottom face
    for (let i = 0; i < 4; i++) {
        const localX = (i === 0 || i === 3) ? -halfWidth : halfWidth;
        const localY = (i === 0 || i === 1) ? -halfDepth : halfDepth;
        
        const rotatedX = x + localX * cos - localY * sin;
        const rotatedY = y + localX * sin + localY * cos;
        
        bodyVertices.push([rotatedX, rotatedY, z]);
    }
    
    // Top face
    for (let i = 0; i < 4; i++) {
        const localX = (i === 0 || i === 3) ? -halfWidth : halfWidth;
        const localY = (i === 0 || i === 1) ? -halfDepth : halfDepth;
        
        const rotatedX = x + localX * cos - localY * sin;
        const rotatedY = y + localX * sin + localY * cos;
        
        bodyVertices.push([rotatedX, rotatedY, z + bodyHeight]);
    }
    
    // Draw body edges
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    
    const bodyEdges = [
        // Bottom face
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Top face
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical edges
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    for (let edge of bodyEdges) {
        const v1 = bodyVertices[edge[0]];
        const v2 = bodyVertices[edge[1]];
        draw3DLine(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
    }
    
    // Turret vertices (on top of body, centered)
    const turretVertices = [];
    const turretHalfWidth = turretWidth / 2;
    const turretHalfDepth = turretDepth / 2;
    const turretZ = z + bodyHeight;
    
    // Bottom face
    for (let i = 0; i < 4; i++) {
        const localX = (i === 0 || i === 3) ? -turretHalfWidth : turretHalfWidth;
        const localY = (i === 0 || i === 1) ? -turretHalfDepth : turretHalfDepth;
        
        const rotatedX = x + localX * cos - localY * sin;
        const rotatedY = y + localX * sin + localY * cos;
        
        turretVertices.push([rotatedX, rotatedY, turretZ]);
    }
    
    // Top face
    for (let i = 0; i < 4; i++) {
        const localX = (i === 0 || i === 3) ? -turretHalfWidth : turretHalfWidth;
        const localY = (i === 0 || i === 1) ? -turretHalfDepth : turretHalfDepth;
        
        const rotatedX = x + localX * cos - localY * sin;
        const rotatedY = y + localX * sin + localY * cos;
        
        turretVertices.push([rotatedX, rotatedY, turretZ + turretHeight]);
    }
    
    // Draw turret edges
    const turretEdges = [
        // Bottom face
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Top face
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical edges
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    for (let edge of turretEdges) {
        const v1 = turretVertices[edge[0]];
        const v2 = turretVertices[edge[1]];
        draw3DLine(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
    }
    
    // Draw barrel (simple line extending forward from turret)
    const barrelStartX = x;
    const barrelStartY = y;
    const barrelStartZ = turretZ + turretHeight / 2;
    
    const barrelEndX = x + cos * barrelLength;
    const barrelEndY = y + sin * barrelLength;
    const barrelEndZ = barrelStartZ;
    
    draw3DLine(barrelStartX, barrelStartY, barrelStartZ, barrelEndX, barrelEndY, barrelEndZ);
    
    // Draw barrel outline (top and bottom lines for thickness)
    draw3DLine(
        barrelStartX, barrelStartY, barrelStartZ + barrelRadius,
        barrelEndX, barrelEndY, barrelEndZ + barrelRadius
    );
    draw3DLine(
        barrelStartX, barrelStartY, barrelStartZ - barrelRadius,
        barrelEndX, barrelEndY, barrelEndZ - barrelRadius
    );
}

/**
 * Draw a ground grid for spatial reference (optimized)
 */
function drawGroundGrid() {
    ctx.strokeStyle = PURPLE + '30'; // Purple with lower opacity for subtlety
    ctx.lineWidth = 1;
    
    const gridSize = 100; // Distance between grid lines
    
    // Use optimized grid render distance instead of full frustum distance
    const minX = Math.floor((camera.x - GRID_RENDER_DISTANCE) / gridSize) * gridSize;
    const maxX = Math.ceil((camera.x + GRID_RENDER_DISTANCE) / gridSize) * gridSize;
    const minY = Math.floor((camera.y - GRID_RENDER_DISTANCE) / gridSize) * gridSize;
    const maxY = Math.ceil((camera.y + GRID_RENDER_DISTANCE) / gridSize) * gridSize;
    
    // Draw grid lines parallel to X axis (running along Y direction)
    // Skip every other line for better performance
    for (let x = minX; x <= maxX; x += gridSize * 2) {
        draw3DLine(x, minY, 0, x, maxY, 0);
    }
    
    // Draw grid lines parallel to Y axis (running along X direction)
    // Skip every other line for better performance
    for (let y = minY; y <= maxY; y += gridSize * 2) {
        draw3DLine(minX, y, 0, maxX, y, 0);
    }
}

// Line-of-Sight System

/**
 * Normalize angle to range [-PI, PI]
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/**
 * Check if target is within field of view
 * @param {Object} from - Source entity with x, y, angle properties
 * @param {Object} to - Target entity with x, y properties
 * @param {number} fromAngle - Source facing angle in radians
 * @param {number} fovAngle - Field of view angle in radians (e.g., Math.PI for 180°)
 * @returns {boolean} True if target is within FOV
 */
function isInFieldOfView(from, to, fromAngle, fovAngle) {
    // Calculate angle from source to target
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angleToTarget = Math.atan2(dy, dx);
    
    // Calculate angle difference
    const angleDiff = normalizeAngle(angleToTarget - fromAngle);
    
    // Check if within FOV (half angle on each side)
    return Math.abs(angleDiff) <= fovAngle / 2;
}

/**
 * Check if there is a clear line of sight from source to target
 * @param {Object} from - Source entity with x, y, angle properties
 * @param {Object} to - Target entity with x, y properties
 * @param {Array} obstacles - Array of obstacle objects with x, y, width, height
 * @returns {boolean} True if line of sight is clear
 */
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

/**
 * Check if a point is inside a rectangle
 * @param {number} px - Point X coordinate
 * @param {number} py - Point Y coordinate
 * @param {Object} rect - Rectangle with x, y, width, height properties
 * @returns {boolean} True if point is inside rectangle
 */
function pointInRect(px, py, rect) {
    return px >= rect.x && 
           px <= rect.x + rect.width && 
           py >= rect.y && 
           py <= rect.y + rect.height;
}

/**
 * Apply boundary constraints to keep entity within playfield
 * @param {Object} entity - Entity with x, y properties
 */
function applyBoundaryConstraints(entity) {
    // Constrain X coordinate
    if (entity.x < TANK_SIZE) {
        entity.x = TANK_SIZE;
    } else if (entity.x > PLAYFIELD_WIDTH - TANK_SIZE) {
        entity.x = PLAYFIELD_WIDTH - TANK_SIZE;
    }
    
    // Constrain Y coordinate
    if (entity.y < TANK_SIZE) {
        entity.y = TANK_SIZE;
    } else if (entity.y > PLAYFIELD_HEIGHT - TANK_SIZE) {
        entity.y = PLAYFIELD_HEIGHT - TANK_SIZE;
    }
}

/**
 * Create debris particles at a destruction point
 * @param {number} x - X coordinate of destruction
 * @param {number} y - Y coordinate of destruction
 * @param {number} count - Number of particles to create
 */
function createDebris(x, y, count) {
    // Enforce particle limit - remove oldest particles if needed
    if (particles.length + count > MAX_PARTICLES) {
        const removeCount = particles.length + count - MAX_PARTICLES;
        particles.splice(0, removeCount);
    }
    
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

/**
 * Update all active particles with physics (optimized)
 */
function updateParticles() {
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
        
        // Bounce off ground (z = 0) with energy loss
        if (p.z <= 0) {
            p.z = 0;
            p.vz = -p.vz * 0.4; // More energy loss for faster settling
            
            // Increase drag on ground for faster settling
            p.vx *= 0.9;
            p.vy *= 0.9;
        }
        
        // Update rotation
        p.angle += p.angularVel;
        
        // Decrease lifetime
        p.lifetime--;
        
        // Remove expired particles or particles that have settled on ground with minimal velocity
        // More aggressive removal for better performance
        if (p.lifetime <= 0 || 
            (p.z <= 0 && Math.abs(p.vz) < 0.05 && Math.hypot(p.vx, p.vy) < 0.05)) {
            particles.splice(i, 1);
        }
    }
}

/**
 * Draw all active particles as purple line segments using 3D projection
 */
function drawParticles() {
    ctx.lineWidth = 2;
    
    for (let p of particles) {
        // Distance culling: skip particles too far from camera
        const distanceToCamera = Math.hypot(p.x - camera.x, p.y - camera.y);
        if (distanceToCamera > PARTICLE_CULL_DISTANCE) {
            continue;
        }
        
        // Calculate alpha based on remaining lifetime (fade out)
        const alpha = Math.min(1, p.lifetime / 30);
        ctx.strokeStyle = PURPLE + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        
        // Calculate endpoints of the line segment based on particle angle
        const halfLength = p.length / 2;
        const x1 = p.x + Math.cos(p.angle) * halfLength;
        const y1 = p.y + Math.sin(p.angle) * halfLength;
        const x2 = p.x - Math.cos(p.angle) * halfLength;
        const y2 = p.y - Math.sin(p.angle) * halfLength;
        
        // Draw particle as a 3D line segment at its current z position
        draw3DLine(x1, y1, p.z, x2, y2, p.z);
    }
}

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let enemySpeedMultiplier = 1;
let shellImage = new Image();
shellImage.src = 'kiro-logo.png';

// Player tank
let player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    angle: -Math.PI / 2, // facing up
    velocity: 0,                       // Current speed (-TANK_MAX_SPEED to +TANK_MAX_SPEED)
    targetVelocity: 0                  // Desired speed based on input
};

// Enemy tank
let enemy = null;

// Last known player position (for sound-based awareness)
let lastKnownPlayerPos = null;

// Player shell
let playerShell = null;

// Enemy shell
let enemyShell = null;

// Obstacles
let obstacles = [];

// Boundary walls
let boundaries = [];

// Keys pressed
let keys = {};

/**
 * Initialize obstacles with spatial distribution across the playfield
 * Scales obstacle count based on playfield area and ensures proper spacing
 */
function initializeObstacles() {
    obstacles = [];
    
    // Calculate obstacle count based on area ratio
    // Original playfield: ~800x600 = 480,000 units² with 4 obstacles
    // New playfield: 2000x2000 = 4,000,000 units²
    // Area ratio: 4,000,000 / 480,000 ≈ 8.33
    // Scaled count: 4 * 8.33 ≈ 33, but we'll use 20-25 for better gameplay
    const OBSTACLE_COUNT = 22;
    
    // Minimum distance from player/enemy start positions
    const MIN_DISTANCE_FROM_PLAYER = 300;
    const MIN_DISTANCE_FROM_ENEMY = 300;
    
    // Minimum distance between obstacles
    const MIN_OBSTACLE_SPACING = 150;
    
    // Player and enemy start positions
    const playerStartX = PLAYFIELD_WIDTH / 2;
    const playerStartY = PLAYFIELD_HEIGHT - 200;
    const enemyStartX = PLAYFIELD_WIDTH / 2;
    const enemyStartY = 200;
    
    // Generate obstacles with spatial distribution
    let attempts = 0;
    const MAX_ATTEMPTS = OBSTACLE_COUNT * 50; // Prevent infinite loops
    
    while (obstacles.length < OBSTACLE_COUNT && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Generate random position with some margin from edges
        const margin = OBSTACLE_SIZE * 2;
        const x = margin + Math.random() * (PLAYFIELD_WIDTH - margin * 2);
        const y = margin + Math.random() * (PLAYFIELD_HEIGHT - margin * 2);
        
        // Check distance from player start position
        const distToPlayer = Math.hypot(x - playerStartX, y - playerStartY);
        if (distToPlayer < MIN_DISTANCE_FROM_PLAYER) {
            continue;
        }
        
        // Check distance from enemy start position
        const distToEnemy = Math.hypot(x - enemyStartX, y - enemyStartY);
        if (distToEnemy < MIN_DISTANCE_FROM_ENEMY) {
            continue;
        }
        
        // Check distance from existing obstacles
        let tooClose = false;
        for (let obs of obstacles) {
            const obsCenterX = obs.x + obs.width / 2;
            const obsCenterY = obs.y + obs.height / 2;
            const dist = Math.hypot(x - obsCenterX, y - obsCenterY);
            
            if (dist < MIN_OBSTACLE_SPACING) {
                tooClose = true;
                break;
            }
        }
        
        if (tooClose) {
            continue;
        }
        
        // Valid position found - add obstacle
        obstacles.push({
            x: x - OBSTACLE_SIZE / 2, // Center the obstacle on the generated position
            y: y - OBSTACLE_SIZE / 2,
            width: OBSTACLE_SIZE,
            height: OBSTACLE_SIZE
        });
    }
    
    // If we couldn't generate enough obstacles, log a warning
    if (obstacles.length < OBSTACLE_COUNT) {
        console.warn(`Only generated ${obstacles.length} obstacles out of ${OBSTACLE_COUNT} requested`);
    }
}

// Initialize game
function init() {
    score = 0;
    enemySpeedMultiplier = 1;
    
    // Initialize player at center-bottom of playfield
    player = {
        x: PLAYFIELD_WIDTH / 2,
        y: PLAYFIELD_HEIGHT - 200,
        angle: -Math.PI / 2,
        velocity: 0,                       // Current speed (-TANK_MAX_SPEED to +TANK_MAX_SPEED)
        targetVelocity: 0                  // Desired speed based on input
    };
    
    playerShell = null;
    enemyShell = null;
    particles = [];
    
    // Create boundary walls at playfield edges
    const wallThickness = 10;
    boundaries = [
        // Top wall
        { x: 0, y: 0, width: PLAYFIELD_WIDTH, height: wallThickness },
        // Bottom wall
        { x: 0, y: PLAYFIELD_HEIGHT - wallThickness, width: PLAYFIELD_WIDTH, height: wallThickness },
        // Left wall
        { x: 0, y: 0, width: wallThickness, height: PLAYFIELD_HEIGHT },
        // Right wall
        { x: PLAYFIELD_WIDTH - wallThickness, y: 0, width: wallThickness, height: PLAYFIELD_HEIGHT }
    ];
    
    // Create obstacles using spatial distribution
    initializeObstacles();
    
    // Create enemy tank
    spawnEnemy();
}

function spawnEnemy() {
    enemy = {
        x: PLAYFIELD_WIDTH / 2,
        y: 200,
        angle: Math.PI / 2, // facing down
        fireCooldown: ENEMY_FIRE_COOLDOWN,
        state: 'idle', // 'idle', 'hunting', 'searching'
        searchTimeout: 0, // Frames to search before giving up
        hasFiredOnce: false // Track if enemy has fired at least once
    };
}

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Initialize audio on first user interaction
    if (!audioSystem.enabled) {
        audioSystem.init();
    }
    audioSystem.resume();
    
    if (gameState === 'start' && e.key === ' ') {
        gameState = 'playing';
        init();
    }
    
    if (gameState === 'gameOver' && e.key === ' ') {
        gameState = 'playing';
        init();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', () => {
    // Initialize audio on first user interaction
    if (!audioSystem.enabled) {
        audioSystem.init();
    }
    audioSystem.resume();
    
    if (gameState === 'start') {
        gameState = 'playing';
        init();
    }
    if (gameState === 'gameOver') {
        gameState = 'playing';
        init();
    }
});

// Update game logic
function update() {
    if (gameState !== 'playing') {
        // Stop engine sound when not playing
        audioSystem.stopEngineSound();
        return;
    }
    
    // Fire player shell
    if (keys[' '] && !playerShell) {
        playerShell = {
            x: player.x + Math.cos(player.angle) * TANK_SIZE,
            y: player.y + Math.sin(player.angle) * TANK_SIZE,
            vx: Math.cos(player.angle) * SHELL_SPEED,
            vy: Math.sin(player.angle) * SHELL_SPEED
        };
        audioSystem.playShoot();
        
        // Record player position when firing (sound-based awareness)
        lastKnownPlayerPos = { x: player.x, y: player.y };
        
        // Trigger enemy searching state if not already hunting
        if (enemy && enemy.state !== 'hunting') {
            enemy.state = 'searching';
            enemy.searchTimeout = 300; // Search for 5 seconds (300 frames at 60 FPS)
        }
    }
    
    // Determine if player is moving (W or S key pressed)
    const isPlayerMoving = keys['w'] || keys['s'];
    
    // Update player tank movement
    updatePlayerMovement();
    
    // Update engine sound based on player movement
    audioSystem.updateEngineSound(isPlayerMoving);
    
    // Update enemy tank
    updateEnemy();
    
    // Update shells
    updateShells();
    
    // Update particles
    updateParticles();
    
    // Check collisions
    checkCollisions();
}

function updatePlayerMovement() {
    const oldX = player.x;
    const oldY = player.y;
    const oldAngle = player.angle;
    
    // Handle rotation (A = turn left, D = turn right)
    // With -yaw in camera, increasing angle turns view right, decreasing turns view left
    if (keys['a']) {
        player.angle += ROTATION_SPEED; // Turn left - things on your left come into view
    }
    if (keys['d']) {
        player.angle -= ROTATION_SPEED; // Turn right - things on your right come into view
    }
    
    // Handle forward/backward movement (W = forward, S = backward)
    if (keys['w']) {
        // Set target velocity for forward movement
        player.targetVelocity = TANK_MAX_SPEED;
    } else if (keys['s']) {
        // Set target velocity for backward movement
        player.targetVelocity = -TANK_MAX_SPEED;
    } else {
        // No movement input - decelerate to stop
        player.targetVelocity = 0;
    }
    
    // Smoothly interpolate velocity toward target (acceleration/deceleration)
    if (player.velocity < player.targetVelocity) {
        player.velocity = Math.min(player.velocity + TANK_ACCELERATION, player.targetVelocity);
    } else if (player.velocity > player.targetVelocity) {
        player.velocity = Math.max(player.velocity - TANK_DECELERATION, player.targetVelocity);
    }
    
    // Apply velocity to position
    if (player.velocity !== 0) {
        player.x += Math.cos(player.angle) * player.velocity;
        player.y += Math.sin(player.angle) * player.velocity;
    }
    
    // Apply boundary constraints
    applyBoundaryConstraints(player);
    
    // Check collision with obstacles
    if (checkTankCollision(player)) {
        player.x = oldX;
        player.y = oldY;
        player.angle = oldAngle;
        player.velocity = 0; // Stop immediately on collision
    }
}

function updateEnemy() {
    if (!enemy) return;
    
    // Check line of sight to player
    const hasLOS = hasLineOfSight(enemy, player, obstacles);
    
    // State machine transitions
    if (hasLOS) {
        // Can see player - transition to HUNTING
        enemy.state = 'hunting';
        lastKnownPlayerPos = { x: player.x, y: player.y };
        enemy.searchTimeout = 0;
    } else if (enemy.state === 'hunting') {
        // Lost sight - transition to SEARCHING
        enemy.state = 'searching';
        enemy.searchTimeout = 240; // Search for 4 seconds (reduced from 5 for better pacing)
    }
    
    // Determine target position based on state
    let targetX, targetY;
    
    if (enemy.state === 'hunting') {
        // HUNTING: Track player's current position
        targetX = player.x;
        targetY = player.y;
    } else if (enemy.state === 'searching' && lastKnownPlayerPos) {
        // SEARCHING: Move toward last known position
        targetX = lastKnownPlayerPos.x;
        targetY = lastKnownPlayerPos.y;
        
        // Check if reached last known position
        const distToLastKnown = Math.hypot(enemy.x - targetX, enemy.y - targetY);
        if (distToLastKnown < TANK_SIZE * 2.5) {
            // Reached last known position without finding player (slightly larger radius)
            lastKnownPlayerPos = null;
            enemy.state = 'idle';
        }
        
        // Decrease search timeout
        enemy.searchTimeout--;
        if (enemy.searchTimeout <= 0) {
            // Search timeout expired - give up search
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
    
    // Rotate towards target (only if not idle or if there's a target)
    if (enemy.state !== 'idle' || (targetX !== enemy.x || targetY !== enemy.y)) {
        let angleDiff = targetAngle - enemy.angle;
        // Normalize angle difference
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
        const oldX = enemy.x;
        const oldY = enemy.y;
        const currentMoveSpeed = ENEMY_BASE_MOVE_SPEED * enemySpeedMultiplier;
        enemy.x += Math.cos(enemy.angle) * currentMoveSpeed;
        enemy.y += Math.sin(enemy.angle) * currentMoveSpeed;
        
        // Apply boundary constraints
        applyBoundaryConstraints(enemy);
        
        // Check collision with obstacles
        if (checkTankCollision(enemy)) {
            enemy.x = oldX;
            enemy.y = oldY;
        }
    }
    
    // Fire at player (only if hunting with clear line of sight)
    enemy.fireCooldown--;
    if (enemy.state === 'hunting' && hasLOS && enemy.fireCooldown <= 0 && !enemyShell) {
        // Calculate aim error based on score and whether this is first shot
        const aimError = calculateAimError(score, !enemy.hasFiredOnce);
        const firingAngle = enemy.angle + aimError;
        
        // Apply enemy shell speed multiplier
        const enemyShellSpeed = SHELL_SPEED * ENEMY_SHELL_SPEED_MULTIPLIER;
        
        enemyShell = {
            x: enemy.x + Math.cos(firingAngle) * TANK_SIZE,
            y: enemy.y + Math.sin(firingAngle) * TANK_SIZE,
            vx: Math.cos(firingAngle) * enemyShellSpeed,
            vy: Math.sin(firingAngle) * enemyShellSpeed
        };
        enemy.fireCooldown = ENEMY_FIRE_COOLDOWN;
        enemy.hasFiredOnce = true; // Mark that enemy has fired
        audioSystem.playShoot();
    }
}

function updateShells() {
    // Update player shell
    if (playerShell) {
        playerShell.x += playerShell.vx;
        playerShell.y += playerShell.vy;
        
        // Destroy if reaches playfield boundaries
        if (playerShell.x < 0 || playerShell.x > PLAYFIELD_WIDTH ||
            playerShell.y < 0 || playerShell.y > PLAYFIELD_HEIGHT) {
            audioSystem.playImpact(); // Play impact sound when hitting boundary
            playerShell = null;
        }
    }
    
    // Update enemy shell
    if (enemyShell) {
        enemyShell.x += enemyShell.vx;
        enemyShell.y += enemyShell.vy;
        
        // Destroy if reaches playfield boundaries
        if (enemyShell.x < 0 || enemyShell.x > PLAYFIELD_WIDTH ||
            enemyShell.y < 0 || enemyShell.y > PLAYFIELD_HEIGHT) {
            audioSystem.playImpact(); // Play impact sound when hitting boundary
            enemyShell = null;
        }
    }
}

function checkCollisions() {
    // Player shell vs obstacles
    if (playerShell) {
        for (let obs of obstacles) {
            if (checkRectCollision(playerShell.x - SHELL_SIZE/2, playerShell.y - SHELL_SIZE/2, 
                                   SHELL_SIZE, SHELL_SIZE, obs.x, obs.y, obs.width, obs.height)) {
                playerShell = null;
                audioSystem.playImpact();
                break;
            }
        }
    }
    
    // Enemy shell vs obstacles
    if (enemyShell) {
        for (let obs of obstacles) {
            if (checkRectCollision(enemyShell.x - SHELL_SIZE/2, enemyShell.y - SHELL_SIZE/2,
                                   SHELL_SIZE, SHELL_SIZE, obs.x, obs.y, obs.width, obs.height)) {
                enemyShell = null;
                audioSystem.playImpact();
                break;
            }
        }
    }
    
    // Player shell vs enemy
    if (playerShell && enemy) {
        const dist = Math.hypot(playerShell.x - enemy.x, playerShell.y - enemy.y);
        if (dist < TANK_SIZE) {
            playerShell = null;
            audioSystem.playExplosion();
            createDebris(enemy.x, enemy.y, 12 + Math.floor(Math.random() * 5)); // 12-16 particles
            score++;
            enemySpeedMultiplier *= ENEMY_SPEED_INCREASE;
            spawnEnemy();
        }
    }
    
    // Enemy shell vs player
    if (enemyShell) {
        const dist = Math.hypot(enemyShell.x - player.x, enemyShell.y - player.y);
        if (dist < TANK_SIZE) {
            audioSystem.playExplosion();
            createDebris(player.x, player.y, 12 + Math.floor(Math.random() * 5)); // 12-16 particles
            audioSystem.playGameOver();
            gameState = 'gameOver';
        }
    }
}

function checkTankCollision(tank) {
    for (let obs of obstacles) {
        if (checkCircleRectCollision(tank.x, tank.y, TANK_SIZE/2, obs.x, obs.y, obs.width, obs.height)) {
            return true;
        }
    }
    return false;
}

function checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function checkCircleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const distX = cx - closestX;
    const distY = cy - closestY;
    return (distX * distX + distY * distY) < (radius * radius);
}

// Draw functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        drawGame();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    }
}

function drawStartScreen() {
    ctx.fillStyle = PURPLE;
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('BATTLEZONE', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Courier New';
    ctx.fillText('Press SPACE or click to start!', canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '16px Courier New';
    ctx.fillText('WASD to move/rotate, SPACE to fire', canvas.width / 2, canvas.height / 2 + 60);
}

function drawGame() {
    draw3DGame();
}

/**
 * Draw the game in 3D first-person perspective
 */
function draw3DGame() {
    // Update camera to match player position and orientation
    updateCamera(player);
    
    // 1. Draw ground grid first (for spatial reference)
    drawGroundGrid();
    
    // 2. Collect all entities with their distances from camera for depth sorting
    const entities = [];
    
    // Add boundary walls (with frustum culling)
    for (let boundary of boundaries) {
        const centerX = boundary.x + boundary.width / 2;
        const centerY = boundary.y + boundary.height / 2;
        const distance = Math.hypot(centerX - camera.x, centerY - camera.y);
        
        // Frustum culling: skip objects too far away
        if (distance > FRUSTUM_CULL_DISTANCE) {
            continue;
        }
        
        entities.push({
            type: 'boundary',
            data: boundary,
            distance: distance
        });
    }
    
    // Add obstacles (with frustum culling)
    for (let obs of obstacles) {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const distance = Math.hypot(centerX - camera.x, centerY - camera.y);
        
        // Frustum culling: skip objects too far away
        if (distance > FRUSTUM_CULL_DISTANCE) {
            continue;
        }
        
        entities.push({
            type: 'obstacle',
            data: obs,
            distance: distance
        });
    }
    
    // Add enemy tank (with frustum culling)
    if (enemy) {
        const distance = Math.hypot(enemy.x - camera.x, enemy.y - camera.y);
        
        // Frustum culling: skip if too far away
        if (distance <= FRUSTUM_CULL_DISTANCE) {
            entities.push({
                type: 'enemy',
                data: enemy,
                distance: distance
            });
        }
    }
    
    // Add player shell (with frustum culling)
    if (playerShell) {
        const distance = Math.hypot(playerShell.x - camera.x, playerShell.y - camera.y);
        
        // Frustum culling: skip if too far away
        if (distance <= FRUSTUM_CULL_DISTANCE) {
            entities.push({
                type: 'shell',
                data: playerShell,
                distance: distance
            });
        }
    }
    
    // Add enemy shell (with frustum culling)
    if (enemyShell) {
        const distance = Math.hypot(enemyShell.x - camera.x, enemyShell.y - camera.y);
        
        // Frustum culling: skip if too far away
        if (distance <= FRUSTUM_CULL_DISTANCE) {
            entities.push({
                type: 'shell',
                data: enemyShell,
                distance: distance
            });
        }
    }
    
    // 3. Sort entities by distance (far to near) for proper rendering order
    entities.sort((a, b) => b.distance - a.distance);
    
    // 4. Render all entities in sorted order
    for (let entity of entities) {
        switch (entity.type) {
            case 'boundary':
                draw3DBoundary(entity.data);
                break;
            case 'obstacle':
                draw3DObstacle(entity.data);
                break;
            case 'enemy':
                draw3DTank(entity.data.x, entity.data.y, 0, entity.data.angle);
                break;
            case 'shell':
                draw3DShell(entity.data);
                break;
        }
    }
    
    // 5. Draw particles (rendered separately with proper depth)
    drawParticles();
    
    // 6. Draw HUD elements (score) in 2D overlay
    ctx.fillStyle = PURPLE;
    ctx.font = '24px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 40);
    
    // Debug info
    ctx.font = '16px Courier New';
    const angleDegrees = Math.round((player.angle * 180 / Math.PI + 360) % 360);
    ctx.fillText('Angle: ' + angleDegrees + '°', 20, 70);
    ctx.fillText('Pos: ' + Math.round(player.x) + ', ' + Math.round(player.y), 20, 90);
}

/**
 * Draw a boundary wall as a 3D box
 * @param {Object} boundary - Boundary with x, y, width, height properties
 */
function draw3DBoundary(boundary) {
    const centerX = boundary.x + boundary.width / 2;
    const centerY = boundary.y + boundary.height / 2;
    const height = 50; // Height of boundary wall in 3D space (taller than obstacles)
    
    draw3DBox(centerX, centerY, 0, boundary.width, height, boundary.height);
}

/**
 * Draw an obstacle as a 3D box
 * @param {Object} obs - Obstacle with x, y, width, height properties
 */
function draw3DObstacle(obs) {
    const centerX = obs.x + obs.width / 2;
    const centerY = obs.y + obs.height / 2;
    const height = 40; // Height of obstacle in 3D space
    
    draw3DBox(centerX, centerY, 0, obs.width, height, obs.height);
}

/**
 * Draw a shell as a 3D object
 * @param {Object} shell - Shell with x, y properties
 */
function draw3DShell(shell) {
    const size = 8; // Shell size in 3D
    const height = 5; // Shell height above ground
    
    // Draw shell as a small cube
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    draw3DBox(shell.x, shell.y, height, size, size, size);
}



function drawTank(x, y, angle, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    
    // Tank body (rectangle)
    ctx.strokeRect(-15, -10, 30, 20);
    
    // Tank turret (smaller rectangle on top)
    ctx.strokeRect(-8, -6, 16, 12);
    
    // Tank barrel (line extending forward)
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    
    // Treads (lines on sides)
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-15, 10);
    ctx.moveTo(15, -10);
    ctx.lineTo(15, 10);
    ctx.stroke();
    
    ctx.restore();
}

function drawGameOver() {
    // Draw final game state
    drawGame();
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = PURPLE;
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '32px Courier New';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.font = '24px Courier New';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
