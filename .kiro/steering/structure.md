# Project Structure

## File Organization
```
/
├── index.html          # Entry point, canvas setup, minimal styling
├── game.js             # All game logic, rendering, and state management
├── kiro-logo.png       # Shell sprite image
├── .kiro/              # Kiro AI assistant configuration
│   └── steering/       # Project guidance documents
└── .vscode/            # VS Code workspace settings
```

## Code Organization (game.js)

### Constants Section
- Game configuration values (speeds, sizes, colors)
- Tunable parameters at the top for easy adjustment

### State Management
- Global game state variables (gameState, score, entities)
- Entity objects: player, enemy, shells, obstacles
- Input tracking via keys object

### Core Functions
1. **Initialization**: `init()`, `spawnEnemy()`
2. **Input Handling**: Event listeners for keyboard and mouse
3. **Update Logic**: `update()`, `updatePlayerMovement()`, `updateEnemy()`, `updateShells()`
4. **Collision Detection**: `checkCollisions()`, collision helper functions
5. **Rendering**: `draw()`, `drawGame()`, `drawTank()`, state-specific draw functions
6. **Game Loop**: `gameLoop()` using requestAnimationFrame

## Conventions

### Naming
- SCREAMING_SNAKE_CASE for constants
- camelCase for variables and functions
- Descriptive entity object properties (x, y, angle, etc.)

### Coordinate System
- Origin (0,0) at top-left
- Angles in radians, 0 = right, increases clockwise
- Player starts at bottom, enemy at top

### Entity Structure
All moving entities have: `x`, `y`, `angle`
Shells add: `vx`, `vy` (velocity components)

### Collision Detection
- Circle-based for tanks
- Rectangle-based for obstacles and shells
- Helper functions for different collision types
