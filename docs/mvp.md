# MVP

## Goal

Ship a first desktop proof of concept for `beauty / campaign / product placement`.

The first release should validate that a project-based workflow editor with moodboard support is more useful than using separate AI tools and folders.

## In Scope

- desktop app built with Tauri
- React UI with React Flow canvas
- project list screen
- create, rename, open, and delete project
- local file-based persistence
- project folder containing workflow, moodboard assets, and outputs
- one guided workflow template: `Beauty Campaign`
- moodboard panel with image upload and notes
- output gallery for generated assets
- minimal Fal.ai integration for curated operations

## First Template

`Beauty Campaign`

Suggested node set:

- `Prompt`
- `Reference Image`
- `Remove Background`
- `Generate Scene`
- `Place Product`
- `Upscale`
- `Export`

## Moodboard v1

- upload multiple images
- store files inside the project folder
- show thumbnails in a grid
- allow title and note per image
- delete an item
- reorder later if cheap, otherwise postpone

## Project Persistence

Each project is stored as a local folder:

```text
projects/
  <project-id>/
    project.json
    moodboard/
    outputs/
```

`project.json` stores:

- id
- name
- template
- createdAt
- updatedAt
- graph
- moodboard metadata
- output metadata

## Out of Scope

- generic support for all Fal models
- blank workflow builder with dozens of nodes
- video generation
- real-time collaboration
- cloud sync
- advanced search and tagging
- moodboard freeform canvas
- automatic prompt generation from references
- interior design template in v1

## Milestones

### Milestone 1

- repo bootstrap
- base Tauri + React app
- React Flow canvas working
- Zustand stores defined

### Milestone 2

- project create/open/delete
- file-based persistence
- save/load workflow graph

### Milestone 3

- moodboard panel
- local image import and metadata editing

### Milestone 4

- Fal client wrapper
- first executable nodes
- output gallery

### Milestone 5

- Beauty Campaign template
- usability pass
- packaging sanity check
