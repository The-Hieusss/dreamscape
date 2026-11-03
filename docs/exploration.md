# Explore on foot

Choose a terrain preset, then click **Explore on foot**. The library, editor
properties, and AI command bar hide while a perspective camera explores the scene.
Click the scene to focus it and request mouse lock:

- WASD or arrow keys: walk.
- Shift: move faster.
- Mouse: look around. In embedded browsers that deny mouse lock, drag to look.
- Escape: release the mouse and pause keyboard movement.
- Back to build: return to the editor.

The controller uses local key refs, clears them on blur/unlock, and pauses while
the scene lacks focus. It follows each preset's terrain height, including city
roads and sidewalks, woodland hills, and the ocean floor. Movement follows the
view direction and normalizes diagonals. It does not implement collisions with
buildings or other placed props.

Exploration has no weapons, shooting, enemies, damage, health/ammo HUD, game store,
or direct Zustand dependency. Generic GLB animation clips remain available in
the model editor.

