# trama

`trama` is a local creative workspace for AI image workflows.

It combines three things in one desktop app:

- visual workflows for image generation and editing
- moodboards linked to each workflow
- generated outputs stored alongside the project

The first target use case is `beauty / campaign / product placement`, with a second template planned for `interior / room restyle`.

## Product Direction

`trama` is not a generic AI lab and not a ComfyUI clone.

The goal is to give non-technical creative users a guided desktop tool where they can:

- create and save named workflows
- collect visual references in a moodboard
- run a few opinionated AI operations
- keep references, workflow, and outputs in the same local project

## Initial Scope

Version 1 focuses on:

- Tauri desktop shell
- React UI
- React Flow canvas
- Zustand stores
- local file-based project persistence
- first workflow template for beauty campaign work
- moodboard attached to each workflow
- Fal.ai integration for a small set of curated operations

## Documents

- [Product Vision](./docs/vision.md)
- [MVP](./docs/mvp.md)
- [Architecture](./docs/architecture.md)
- [Tasks](./docs/tasks.md)
- [Contributing](./CONTRIBUTING.md)

## Repository Setup

This repository is intended to work as a standard local git project.

Do not document user-specific absolute filesystem paths in shared setup steps.

If needed, add your own remote locally with the usual git workflow for your environment.
