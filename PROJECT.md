# Sketch-A-Wall

**Stack:** React 18, TypeScript, Vite, Tailwind CSS  
**Live:** https://projects.slash301.com/SketchAWall/  
**Local:** `npm run dev` → http://localhost:5174  
**No Gemini/AI dependency**

## What it is
2D wall sketching and boundary tool — upload a floor plan or photo, then trace and draw walls over it. Outputs a 2D room plan. Single-component focus: `WallEditor.tsx`.

## Structure
- `src/App.tsx` — main shell
- `src/components/WallEditor.tsx` — the entire drawing canvas + tool UI (likely large)
- `src/types/` — geometry/wall types
- `tailwind.config.cjs` + `postcss.config.cjs` — Tailwind setup
- `backup-local-20260220-140649/` — snapshot from Feb 2026

## State
Has a backup from Feb 2026 — suggests active development at that point. Canvas-based wall editor is non-trivial. All functionality in one component is a risk if it grows further.

## What needs work / next directions
- WallEditor.tsx is almost certainly very large — splitting into sub-components (canvas, toolbar, wall list) would help
- Export: SVG or PNG output of the traced plan
- Snap-to-grid and angle snapping for cleaner walls
- Measurement scale (real-world units)
- Undo/redo
