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

// Optimization constants
const MAX_PARTICLES = 100; // Maximum active particles
const PARTICLE_CULL_DISTANCE = 800; // Don't render particles beyond this distance
const FRUSTUM_CULL_DISTANCE = 1200; // Don't render objects beyond this distance
const AUDIO_MAX_VOLUME = 0.25; // Reduced from 0.3-0.5 for better balance

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
            return true;
        } catch (e) {
            console.warn('Failed to initialize audio:', e);
            return false;
        }
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
        
        // Create oscillator for laser-like sound
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Triangle wave for retro sound
        oscillator.type = 'triangle';
        
        // Frequency sweep from 800Hz to 400Hz
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        
        // Volume envelope - tuned for better balance
        gainNode.gain.setValueAtTime(AUDIO_MAX_VOLUME, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        oscillator.start(now);
        oscillator.stop(now + 0.08);
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
        const duration = 0.12; // Shortened for snappier feel
        
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
            gainNode.gain.setValueAtTime(AUDIO_MAX_VOLUME * 0.8, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now + index * 0.008);
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
    fov: Math.PI / 3,  // Field of view in radians (60 degrees)
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
    // Standard 2D rotation matrix around Z axis
    const cosYaw = Math.cos(-camera.yaw);
    const sinYaw = Math.sin(-camera.yaw);
    
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
 * Draw a 3D line from (x1, y1, z1) to (x2, y2, z2)
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
    
    // Skip if either point is behind camera
    if (!p1 || !p2) {
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
 * Draw a ground grid for spatial reference
 */
function drawGroundGrid() {
    ctx.strokeStyle = PURPLE + '40'; // Purple with low opacity
    ctx.lineWidth = 1;
    
    const gridSize = 100; // Distance between grid lines
    const gridExtent = 600; // Reduced from 1000 for better performance
    
    // Calculate grid bounds relative to camera position for culling
    const minX = Math.floor((camera.x - FRUSTUM_CULL_DISTANCE) / gridSize) * gridSize;
    const maxX = Math.ceil((camera.x + FRUSTUM_CULL_DISTANCE) / gridSize) * gridSize;
    const minY = Math.floor((camera.y - FRUSTUM_CULL_DISTANCE) / gridSize) * gridSize;
    const maxY = Math.ceil((camera.y + FRUSTUM_CULL_DISTANCE) / gridSize) * gridSize;
    
    // Draw grid lines parallel to X axis (running along Y direction)
    for (let x = minX; x <= maxX; x += gridSize) {
        draw3DLine(x, minY, 0, x, maxY, 0);
    }
    
    // Draw grid lines parallel to Y axis (running along X direction)
    for (let y = minY; y <= maxY; y += gridSize) {
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
 * Update all active particles with physics
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
    leftTreadForward: false,
    leftTreadBackward: false,
    rightTreadForward: false,
    rightTreadBackward: false
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

// Keys pressed
let keys = {};

// Initialize game
function init() {
    score = 0;
    enemySpeedMultiplier = 1;
    player = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        angle: -Math.PI / 2,
        leftTreadForward: false,
        leftTreadBackward: false,
        rightTreadForward: false,
        rightTreadBackward: false
    };
    
    playerShell = null;
    enemyShell = null;
    particles = [];
    
    // Create obstacles
    obstacles = [
        { x: 200, y: 200, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE },
        { x: 600, y: 200, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE },
        { x: 400, y: 350, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE },
        { x: 150, y: 450, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE }
    ];
    
    // Create enemy tank
    spawnEnemy();
}

function spawnEnemy() {
    enemy = {
        x: canvas.width / 2,
        y: 100,
        angle: Math.PI / 2, // facing down
        fireCooldown: ENEMY_FIRE_COOLDOWN,
        state: 'idle', // 'idle', 'hunting', 'searching'
        searchTimeout: 0 // Frames to search before giving up
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
    if (gameState !== 'playing') return;
    
    // Update player controls
    player.leftTreadForward = keys['q'];
    player.leftTreadBackward = keys['a'];
    player.rightTreadForward = keys['w'];
    player.rightTreadBackward = keys['s'];
    
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
    
    // Update player tank movement
    updatePlayerMovement();
    
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
    const leftForce = player.leftTreadForward ? 1 : (player.leftTreadBackward ? -1 : 0);
    const rightForce = player.rightTreadForward ? 1 : (player.rightTreadBackward ? -1 : 0);
    
    // Calculate rotation and movement
    if (leftForce !== 0 || rightForce !== 0) {
        const oldX = player.x;
        const oldY = player.y;
        const oldAngle = player.angle;
        
        // Both treads same direction = move forward/backward
        if (leftForce === rightForce) {
            player.x += Math.cos(player.angle) * MOVE_SPEED * leftForce;
            player.y += Math.sin(player.angle) * MOVE_SPEED * leftForce;
        }
        // Different forces = rotation
        else {
            const rotationDelta = (rightForce - leftForce) * ROTATION_SPEED;
            player.angle += rotationDelta;
            
            // Single tread creates rotation around that tread
            if (leftForce === 0 && rightForce !== 0) {
                // Rotating around left tread
                const pivotX = player.x - Math.cos(player.angle - Math.PI / 2) * 10;
                const pivotY = player.y - Math.sin(player.angle - Math.PI / 2) * 10;
                player.x = pivotX + Math.cos(player.angle - Math.PI / 2) * 10;
                player.y = pivotY + Math.sin(player.angle - Math.PI / 2) * 10;
            } else if (rightForce === 0 && leftForce !== 0) {
                // Rotating around right tread
                const pivotX = player.x + Math.cos(player.angle - Math.PI / 2) * 10;
                const pivotY = player.y + Math.sin(player.angle - Math.PI / 2) * 10;
                player.x = pivotX - Math.cos(player.angle - Math.PI / 2) * 10;
                player.y = pivotY - Math.sin(player.angle - Math.PI / 2) * 10;
            }
        }
        
        // Check collision with obstacles and boundaries
        if (checkTankCollision(player) || player.x < TANK_SIZE || player.x > canvas.width - TANK_SIZE ||
            player.y < TANK_SIZE || player.y > canvas.height - TANK_SIZE) {
            player.x = oldX;
            player.y = oldY;
            player.angle = oldAngle;
        }
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
            // Search timeout expired
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
        
        // Check collision
        if (checkTankCollision(enemy) || enemy.x < TANK_SIZE || enemy.x > canvas.width - TANK_SIZE ||
            enemy.y < TANK_SIZE || enemy.y > canvas.height - TANK_SIZE) {
            enemy.x = oldX;
            enemy.y = oldY;
        }
    }
    
    // Fire at player (only if hunting with clear line of sight)
    enemy.fireCooldown--;
    if (enemy.state === 'hunting' && hasLOS && enemy.fireCooldown <= 0 && !enemyShell) {
        enemyShell = {
            x: enemy.x + Math.cos(enemy.angle) * TANK_SIZE,
            y: enemy.y + Math.sin(enemy.angle) * TANK_SIZE,
            vx: Math.cos(enemy.angle) * SHELL_SPEED,
            vy: Math.sin(enemy.angle) * SHELL_SPEED
        };
        enemy.fireCooldown = ENEMY_FIRE_COOLDOWN;
        audioSystem.playShoot();
    }
}

function updateShells() {
    // Update player shell
    if (playerShell) {
        playerShell.x += playerShell.vx;
        playerShell.y += playerShell.vy;
        
        // Remove if out of bounds
        if (playerShell.x < 0 || playerShell.x > canvas.width ||
            playerShell.y < 0 || playerShell.y > canvas.height) {
            playerShell = null;
        }
    }
    
    // Update enemy shell
    if (enemyShell) {
        enemyShell.x += enemyShell.vx;
        enemyShell.y += enemyShell.vy;
        
        // Remove if out of bounds
        if (enemyShell.x < 0 || enemyShell.x > canvas.width ||
            enemyShell.y < 0 || enemyShell.y > canvas.height) {
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
    ctx.fillText('Q/A: Left Tread  W/S: Right Tread  SPACE: Fire', canvas.width / 2, canvas.height / 2 + 60);
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
