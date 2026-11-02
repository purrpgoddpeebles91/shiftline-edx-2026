# Shiftline EDX 2026

GitHub Game Off 2026 jam project: Shiftline EDX 2026, a hybrid action-platformer / bullet-hell prototype built around the theme of shifting between fractured realities.

## Play the game

Published browser URL (GitHub Pages, when enabled in the repo settings):
https://purrpgoddpeebles91.github.io/shiftline-edx-2026/

If you are running it locally, use:
http://localhost:4173

## Controls

- Move: A / D
- Jump: W / Space / Up Arrow
- Shoot: J / Enter
- Shift: C / E

## Local run

From the project root:

```bash
npm install
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Game summary

The city still breathes, but only in fragments. The gate ahead trembles because reality is trying to peel itself open. Your shift-state is the last thing still holding the seams together.

You must cross the gate, survive the Warden, and shatter the fractured city before it collapses.

## Notes

This project is designed to be browser-playable and lightweight enough for a jam build. It uses a canvas-based gameplay loop with a modern renderer fallback chain:

- Canvas 2D fallback
- WebGL background renderer
- WebGPU capability detection
- Wasm-ready structure for future optimization

## Browser testing on iPhone

For an iPhone browser test, either:

- open the live GitHub Pages URL above, or
- run the local server on a Mac connected to the same Wi-Fi network and open the Mac's local IP address on the iPhone, for example:

```text
http://192.168.1.20:4173
```

## Repo links

- GitHub repo: https://github.com/purrpgoddpeebles91/shiftline-edx-2026
- Template branch: https://github.com/purrpgoddpeebles91/shiftline-edx-2026/tree/project-template
