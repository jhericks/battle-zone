# BattleZone Tank Game

A retro-style 3D tank combat game inspired by the classic BattleZone arcade game, featuring first-person wireframe graphics and intuitive WASD controls.

![Game Preview](kiro-logo.png)

## 🎮 Game Features

- **3D First-Person Perspective**: Immersive wireframe graphics with proper depth sorting and perspective projection
- **Intuitive Controls**: WASD movement and rotation for easy gameplay
- **Smart Enemy AI**: Enemy tanks with line-of-sight detection, state-based behavior (hunting, searching, idle), and sound-based awareness
- **Dynamic Difficulty**: Enemy speed increases with each kill for escalating challenge
- **Retro Audio**: Procedurally generated sound effects using Web Audio API
- **Particle Effects**: Debris system with physics simulation for explosions
- **Obstacle Navigation**: Strategic gameplay with obstacles that block movement and projectiles

## 🕹️ Controls

### Tank Movement
- **W**: Move forward
- **S**: Move backward
- **A**: Rotate left (counter-clockwise)
- **D**: Rotate right (clockwise)

### Combat
- **SPACE**: Fire shell (one shot at a time)

## 🚀 Getting Started

### Prerequisites
- Modern web browser with HTML5 Canvas and Web Audio API support
- No build tools or dependencies required!

### Running the Game

1. Clone the repository:
```bash
git clone https://github.com/jhericks/battle-zone.git
cd battle-zone
```

2. Open `index.html` in your browser, or serve locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

3. Press **SPACE** or click to start playing!

## 🎯 Gameplay

- Destroy enemy tanks to earn points (1 point per kill)
- Survive as long as possible - the game ends when you're hit
- Navigate around obstacles that block both movement and shells
- Enemy tanks become faster with each kill
- Enemies use line-of-sight to track you and will search your last known position

## 🎨 Visual Style

- **Retro Vector Graphics**: Purple (#a855f7) wireframe rendering on black background
- **3D Projection**: Proper perspective projection with depth sorting
- **Minimalist UI**: Clean, arcade-inspired interface
- **Particle Effects**: Dynamic debris with physics simulation

## 🧠 Enemy AI Features

The enemy tank features sophisticated AI behavior:

- **Line-of-Sight Detection**: Only attacks when it can see you
- **State Machine**: Three states (Idle, Hunting, Searching)
- **Sound Awareness**: Detects your position when you fire
- **Pathfinding**: Navigates around obstacles to reach you
- **Adaptive Difficulty**: Speed increases with your score

## 🛠️ Technical Details

- **Pure Vanilla JavaScript** - No frameworks or libraries
- **HTML5 Canvas API** - 2D rendering context with custom 3D projection
- **Web Audio API** - Procedural sound generation
- **60 FPS Target** - Smooth gameplay using requestAnimationFrame
- **Entity-Based Architecture** - Clean separation of game objects

## 📁 Project Structure

```
/
├── index.html          # Entry point with canvas setup
├── game.js             # All game logic and rendering
├── kiro-logo.png       # Shell sprite image
└── README.md           # This file
```

## 🎵 Audio System

The game features a custom audio system with procedurally generated sounds:
- **Shoot**: Laser-like sound with frequency sweep
- **Explosion**: Bass-heavy noise with low-pass filter
- **Impact**: Metallic clang effect
- **Game Over**: Descending tone sequence

## 🏆 Scoring

- Each enemy tank destroyed: **+1 point**
- Enemy speed multiplier: **+10% per kill**
- Game continues until you're hit

## 🤝 Contributing

This game was built as part of the AWS re:Invent workshop with Kiro AI. Feel free to fork and enhance!

## 📝 License

MIT License - Feel free to use and modify as you wish!

## 🙏 Acknowledgments

- Inspired by the classic Atari BattleZone arcade game
- Built with Kiro AI assistant
- Created for AWS re:Invent 2024 workshop

---

**Enjoy the game!** 🎮✨
