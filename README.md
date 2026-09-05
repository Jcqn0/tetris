# Tetris

A standalone falling-block game with a clean light interface, dark playfield, and classic colored pieces.

## Play

Double-click **index.html** to open it in a current browser. No installation, internet connection, or server is required.

- **Left / right arrows:** move (hold to repeat)
- **Up arrow / X:** rotate clockwise
- **Z:** rotate counterclockwise
- **Down arrow:** soft drop
- **Space:** hard drop
- **P / Escape:** pause or resume
- **Enter:** start or resume

Touch controls appear on small screens and touch devices. The game pauses when you switch away. Your best score is saved in the current browser when local storage is available.

## Rules

Fill horizontal rows to clear them. Singles, doubles, triples, and four-line clears award 100, 300, 500, and 800 points multiplied by your current level. Soft drops earn one point per cell; hard drops earn two. Every ten cleared lines advances the level and increases gravity.

Includes seven-piece bags, next-piece previews, a ghost landing guide, standard rotation wall kicks, and a 500 ms lock delay with up to 15 movement resets.

## Test

Requires Node.js for development tests only:

```sh
node --test tests/game.test.cjs
```

The tests execute the actual game engine embedded in index.html.
