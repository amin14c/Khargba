
# Khargba (ⵅⵔⴳⴱⴰ) — Ancient Amazigh Board Game



![Game Status](https://img.shields.io/badge/status-active-brightgreen)




![License](https://img.shields.io/badge/license-MIT-blue)




![Platform](https://img.shields.io/badge/platform-web-orange)



> A digital revival of **Khargba**, a traditional Amazigh (Berber) strategy board game
> passed down through generations across North Africa.

---

## 🪨 About the Game

**Khargba** is an ancient two-player strategy game originating from Amazigh culture,
traditionally played on a 7×7 grid using natural objects — stones (*rocks*) and date pits
— as playing pieces. The game reflects the deep strategic thinking embedded in Amazigh
cultural heritage.

### Cultural Background

Khargba has been played for centuries across the Maghreb region, particularly in Algeria,
Morocco, and Libya. It was traditionally played on the ground, with the grid drawn in sand
or dirt, using whatever small objects were at hand. The game is a living artifact of
Amazigh civilization — one of the oldest continuous cultures in the world.

---

## 🎮 How to Play

### The Board
- **7 × 7 grid** — 49 cells total
- One cell remains empty at all times during movement phase

### The Pieces
| Player | Piece | Symbol |
|--------|-------|--------|
| Host | Rocks (Stones) 🪨 | `1` |
| Guest | Date Pits 🟤 | `2` |

### Game Phases

#### Phase 1 — Placement (الوضع)
- The board starts **completely empty**
- Players **alternate turns**, placing **one piece per turn**
- A total of **48 pieces** are placed (24 per player)
- One cell remains empty, creating room for movement
- No captures occur during this phase

#### Phase 2 — Movement (الحركة)
Once all 48 pieces are placed, the movement phase begins:

**Standard Move**
- A piece may move to any **adjacent empty cell** (up, down, left, right)

**Capture Move**
- A piece may **jump over an adjacent opponent piece** into an empty cell beyond it
- The jumped opponent piece is **removed** from the board

### Winning
The player who **eliminates all opponent pieces** wins the game.

---

## 🌐 Features

- 🔥 **Real-time multiplayer** via Firebase Firestore
- 💬 **In-game chat** between players
- 🌍 **Multilingual support** (Arabic / French / English)
- 📱 **Mobile-first** responsive design
- 🎨 **Culturally inspired UI** with warm Saharan color palette
- 🔐 **Firebase Authentication**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Backend / DB | Firebase Firestore |
| Auth | Firebase Aut
