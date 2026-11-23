# FixFlow Design Handoff

**Google Stitch project:** https://stitch.google.com/projects/2412544707647263879

The supplied Stitch export has been inspected. It contains 23 screen folders, each with a generated `code.html` and `screen.png`, plus the `operations_engine/DESIGN.md` design-system specification.

See [STITCH_EXPORTS.md](STITCH_EXPORTS.md) for the screen inventory, design-system summary and implementation guidance.

## Design principles

- Deep navy and neutral surfaces with restrained teal, blue and safety-red accents.
- Clear operational hierarchy and dense but readable manager workflows.
- Mobile-first tenant workflows and responsive manager workspaces.
- Explicit accountability: every request has an owner, next action, history and verifiable outcome.
- Scout and Flow are advisory; human managers retain authority over approvals, dispatch and status changes.

## Export archive

The original Google Stitch export should be extracted under `docs/designs/stitch-export/`. Each screen folder should retain its HTML and PNG files. The exports are design references, not the production React application.

## Acceptance checklist

- [x] Stitch project URL recorded.
- [x] Export archive inspected; 23 screen exports and design-system specification identified.
- [ ] Exported HTML and PNG assets committed under `docs/designs/stitch-export/`.
- [ ] Approved layouts implemented as maintainable React components.
