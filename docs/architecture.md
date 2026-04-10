# Architecture

## Stack

- `Tauri`
- `React`
- `TypeScript`
- `React Flow`
- `Zustand`

## High-Level Shape

The app should be structured around a local project model.

Each project contains:

- workflow graph
- moodboard assets and metadata
- generated outputs

## Main Areas

### Shell

Tauri provides:

- desktop shell
- filesystem access
- app data directory management
- secure-ish local storage of the API key

### UI

React provides:

- project list screen
- project workspace layout
- workflow canvas
- right-side inspector / moodboard / outputs panels

### Graph Editor

React Flow manages:

- nodes
- edges
- viewport
- custom node rendering
- connection rules

### State

Use Zustand, split by responsibility:

- `editorStore`
- `runtimeStore`
- `projectsStore`

Suggested responsibilities:

`editorStore`

- current project id
- nodes
- edges
- selection
- viewport
- active panel
- dirty state

`runtimeStore`

- node execution state
- current run id
- logs
- output artifacts
- Fal job polling state

`projectsStore`

- project list
- create/open/rename/delete actions
- save status

## Persistence Strategy

Start with filesystem-based persistence through Tauri commands.

Suggested app data layout:

```text
app-data/
  projects/
    <project-id>/
      project.json
      moodboard/
      outputs/
  settings.json
```

This keeps the first version simple and debuggable.

A repository interface should hide the storage implementation so SQLite can be introduced later if needed.

## Core Domain Types

### Project

Contains:

- id
- name
- template
- createdAt
- updatedAt
- graph
- moodboard
- outputs

### Graph

Contains:

- nodes
- edges
- viewport

### Moodboard Item

Contains:

- id
- filename
- path
- title
- note
- createdAt

### Output Item

Contains:

- id
- filename
- path
- sourceRunId
- createdAt

## Execution Model

The runtime should execute only valid directed graphs.

First version rules:

- no loops
- no branching-heavy orchestration requirements
- no generic dynamic model mapping
- only curated node types

Execution flow:

1. validate graph
2. compute topological order
3. resolve node inputs
4. execute node operation
5. persist node result
6. update runtime state

## Fal Integration

Keep a thin client layer with explicit operations instead of a generic raw endpoint builder.

Examples:

- `removeBackground`
- `generateScene`
- `placeProduct`
- `upscaleImage`

This keeps the node system opinionated and easier to use.

## API Key Handling

Do not spread API calls across random UI components.

Use one app-level integration layer and store the API key locally through Tauri-side commands or a dedicated local settings flow.
