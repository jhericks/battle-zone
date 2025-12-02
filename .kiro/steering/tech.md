# Technology Stack

## Core Technologies
- **Vanilla JavaScript** (ES6+) - No frameworks or build tools
- **HTML5 Canvas API** - 2D rendering context
- **HTML5** - Single page application structure

## Architecture
- Single-file game logic (`game.js`)
- Game loop using `requestAnimationFrame` for 60 FPS target
- State machine pattern for game states (start, playing, gameOver)
- Entity-based architecture (player, enemy, shells, obstacles)

## Key Libraries & APIs
- Canvas 2D Context for all rendering
- Keyboard event listeners for input handling
- Image API for sprite loading (kiro-logo.png)

## Development Workflow
- No build process required
- Open `index.html` directly in browser to run
- Use browser DevTools for debugging
- Live Server or similar for hot reload during development

## Common Commands
```bash
# Serve locally (if using a local server)
python -m http.server 8000
# or
npx serve

# Then open http://localhost:8000 in browser
```

## Browser Compatibility
- Modern browsers with Canvas API support
- Chrome, Firefox, Safari, Edge (latest versions)
