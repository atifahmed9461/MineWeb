# MineWeb

![MineWeb](https://i.imgur.com/fFHAdEJ.png)

A modern web-based control panel for a Minecraft bot, built with Node.js (mineflayer) and Next.js.  
Easily manage, monitor, and interact with your Minecraft server bot in real-time from any browser.

---

## Features

- **Real-time Chat:** View and send Minecraft chat messages instantly from the web.
- **Player List:** See all online players and their ping, just like the in-game tablist.
- **Bot Stats:** Monitor bot health, food, position, experience, and gamemode.
- **Admin Actions:** Kick, ban, kill, or change gamemode for any player (with OP permissions), including reason support.
- **Teleportation:** Teleport players to each other via the web interface.
- **Responsive UI:** Compact, two-column layout with dark mode and mobile support.
- **Robust Connection:** Handles reconnects, server kicks, and manual disconnects gracefully.
- **Easy Setup:** One command to install and run both backend and frontend.

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/atifahmed9461/MineWeb.git
   cd MineWeb
   ```

2. **Install dependencies (for both backend and frontend):**
   ```bash
   npm run setup
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory (optional, for custom server/bot settings):

   ```
   MC_SERVER_IP=your.minecraft.server.ip
   MC_SERVER_PORT=25565
   VERSION=1.21.4

   WEB_PORT=3000
   BOT_SERVER_PORT=3001
   SOCKET_PORT=4000

   BOT_USERNAME=WebBot
   BOT_PASSWORD=yourpassword
   BOT_AUTH=offline
   ```

4. **Start the app (backend + frontend):**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3001  
   - Frontend: http://localhost:3000

---

## Usage

- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Connect the bot to your Minecraft server using the web interface.
- Use the dashboard to chat, view players, monitor stats, and perform admin actions.

---

## Project Structure

```
MineWeb/
  ├─ bot/                # Node.js backend (mineflayer bot, Express, Socket.IO)
  │   ├─ botController.js
  │   └─ index.js
  ├─ web/                # Next.js frontend (React, Tailwind CSS)
  │   ├─ src/app/
  │   │   └─ page.tsx
  │   └─ src/components/
  ├─ package.json        # Project scripts and dependencies
  └─ README.md
```

---

## Scripts

- `npm run dev` — Start both backend and frontend in development mode
- `npm run dev:bot` — Start only the bot backend
- `npm run dev:web` — Start only the web frontend
- `npm run setup` — Install dependencies for both backend and frontend

---

## Technologies Used

- **Backend:** Node.js, Express, mineflayer, Socket.IO
- **Frontend:** Next.js, React, Tailwind CSS, Zustand, Framer Motion, next-themes

---

## Credits

- [mineflayer](https://github.com/PrismarineJS/mineflayer) for Minecraft bot API
- [Next.js](https://nextjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

## License

MIT

---

## Support Server

Join our Discord for help and community support: [https://discord.gg/tsbBKz2k53](https://discord.gg/tsbBKz2k53)

## Creator

Created by Atif Ahmed 🖤 
