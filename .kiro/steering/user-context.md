---
inclusion: always
---

# User Game Preferences

## Project: BattleZone-style Tank Game

### Technology Stack
- Vanilla JavaScript
- HTML5 Canvas
- No frameworks

### Game Mechanics
- **Scoring**: 1 point per enemy tank destroyed
- **Win/Lose**: Game over when player is hit; continue until hit
- **Obstacles**: 3-4 stationary obstacles that block shells and movement
- **Enemy Behavior**: Moves around, rotates slowly to face player, fires back

### Controls
- **Q**: Left tread forward (turn right around right tread axis when alone)
- **A**: Left tread backward (turn left around right tread axis when alone)
- **W**: Right tread forward (turn left around left tread axis when alone)
- **S**: Right tread backward (turn right around left tread axis when alone)
- **Q+W**: Move forward
- **A+S**: Move backward
- **Q+S**: Turn right
- **A+W**: Turn left
- **SPACE**: Fire shell (one shot at a time)

### Visual Style
- **Lines/Vectors**: Purple (#a855f7 - purple-500)
- **Background**: Black
- **Shell Sprite**: kiro-logo.png
- **Rotation**: Slow for both player and enemy

### Game States
- start: Show "Press SPACE or click to start!"
- playing: Active gameplay
- gameOver: Show score and restart option
