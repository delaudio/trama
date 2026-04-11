# Tasks

## Milestone 1: Foundation

- [ ] Initialize Tauri + React + TypeScript app
- [ ] Add React Flow
- [ ] Add Zustand
- [x] Define base project folder layout
- [x] Define TypeScript domain models
- [x] Define repository interfaces for projects and assets
- [ ] Set up base workspace layout
- [ ] Add home screen for project list

## Milestone 2: Project Management

- [x] Implement Tauri command to list projects
- [x] Implement Tauri command to create a project
- [x] Implement Tauri command to rename a project
- [x] Implement Tauri command to delete a project
- [x] Implement Tauri command to load a project
- [x] Implement Tauri command to save a project
- [x] Add project create flow in the UI
- [x] Add project rename flow in the UI
- [x] Add project delete flow in the UI

## Milestone 3: Workflow Editor

- [ ] Add React Flow canvas with project graph binding
- [ ] Implement custom node shell component
- [ ] Implement `Prompt` node
- [ ] Implement `Reference Image` node
- [ ] Implement `Remove Background` node
- [ ] Implement `Generate Scene` node
- [ ] Implement `Place Product` node
- [ ] Implement `Upscale` node
- [ ] Implement `Export` node
- [ ] Add connection validation by node IO type
- [ ] Save viewport and graph updates

## Milestone 4: Moodboard

- [ ] Add moodboard panel to the workspace
- [ ] Implement image import into project moodboard folder
- [ ] Persist moodboard item metadata
- [ ] Show moodboard thumbnail grid
- [ ] Add title and note editing for moodboard items
- [ ] Add delete action for moodboard items
- [ ] Add large preview for a moodboard image

## Milestone 5: Execution Runtime

- [ ] Create Fal client wrapper
- [ ] Define runtime state model
- [ ] Implement graph validation
- [ ] Implement topological execution order
- [ ] Implement node execution dispatcher
- [ ] Add run status in the UI
- [ ] Add node-level loading and error states
- [ ] Persist output metadata

## Milestone 6: Outputs

- [ ] Create outputs panel
- [ ] Show generated images for the project
- [ ] Add output preview
- [ ] Add export/save convenience actions

## Milestone 7: Template and Polish

- [ ] Create `Beauty Campaign` starter template
- [ ] Add empty-state guidance for new users
- [ ] Review naming and labels for non-technical users
- [ ] Add basic error messaging for failed runs
- [ ] Test project reopen flow end-to-end

## Later

- [ ] Add `Interior Restyle` template
- [ ] Add reorder support for moodboard items
- [ ] Add project thumbnails
- [ ] Add prompt helpers based on moodboard references
- [ ] Evaluate SQLite when project metadata and history become more complex
