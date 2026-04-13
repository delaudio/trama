import { useState } from 'react'
import type { FormEvent } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { listFalOperations } from '../fal/fal-operations'
import { falConfig } from '../../lib/fal-config'
import { useProjectsStore } from '../../store/projects-store'
import { WorkflowCanvas } from '../workflow/WorkflowCanvas'
import type { MoodboardItem, OutputItem } from '../../types/project'

const falOperations = listFalOperations()

export function WorkspaceShell() {
  const [isRenameFormOpen, setIsRenameFormOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [renameProjectId, setRenameProjectId] = useState('')
  const [deleteProjectId, setDeleteProjectId] = useState('')
  const activeProject = useProjectsStore((state) => state.activeProject)
  const isLoading = useProjectsStore((state) => state.isLoading)
  const isSaving = useProjectsStore((state) => state.isSaving)
  const isDirty = useProjectsStore((state) => state.isDirty)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const workflowRun = useProjectsStore((state) => state.workflowRun)
  const saveActiveProject = useProjectsStore((state) => state.saveActiveProject)
  const renameActiveProject = useProjectsStore((state) => state.renameActiveProject)
  const deleteActiveProject = useProjectsStore((state) => state.deleteActiveProject)
  const runActiveWorkflow = useProjectsStore((state) => state.runActiveWorkflow)
  const exportProjectOutputs = useProjectsStore((state) => state.exportProjectOutputs)
  const importMoodboardImages = useProjectsStore((state) => state.importMoodboardImages)
  const updateMoodboardItem = useProjectsStore((state) => state.updateMoodboardItem)
  const deleteMoodboardItem = useProjectsStore((state) => state.deleteMoodboardItem)

  const [selectedMoodboardItemId, setSelectedMoodboardItemId] = useState('')
  const [moodboardTitle, setMoodboardTitle] = useState('')
  const [moodboardNote, setMoodboardNote] = useState('')
  const [selectedOutputIds, setSelectedOutputIds] = useState<string[]>([])

  const selectedMoodboardItem = (() => {
    if (!activeProject?.moodboard.length) {
      return null
    }

    return (
      activeProject.moodboard.find((item) => item.id === selectedMoodboardItemId) ??
      activeProject.moodboard[0]
    )
  })()
  const isEditingSelectedMoodboardItem = selectedMoodboardItem?.id === selectedMoodboardItemId
  const displayedMoodboardTitle = isEditingSelectedMoodboardItem
    ? moodboardTitle
    : selectedMoodboardItem?.title ?? ''
  const displayedMoodboardNote = isEditingSelectedMoodboardItem
    ? moodboardNote
    : selectedMoodboardItem?.note ?? ''

  function handleStartRename() {
    if (!activeProject) {
      return
    }

    setRenameValue(activeProject.name)
    setRenameProjectId(activeProject.id)
    setIsRenameFormOpen(true)
  }

  async function handleSubmitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeProject) {
      return
    }

    const nextName = renameValue.trim()

    if (!nextName || nextName === activeProject.name) {
      setIsRenameFormOpen(false)
      setRenameValue(activeProject.name)
      setRenameProjectId('')
      return
    }

    await renameActiveProject(nextName)
    setIsRenameFormOpen(false)
    setRenameProjectId('')
  }

  function handleDeleteProject() {
    if (!activeProject) {
      return
    }

    setIsDeleteConfirmOpen(true)
    setDeleteProjectId(activeProject.id)
  }

  async function handleConfirmDelete() {
    setIsDeleteConfirmOpen(false)
    setDeleteProjectId('')
    void deleteActiveProject()
  }

  async function handleMoodboardFileSelection(files: FileList | null) {
    if (!files?.length) {
      return
    }

    await importMoodboardImages(Array.from(files))
  }

  function handleSelectMoodboardItem(item: MoodboardItem) {
    setSelectedMoodboardItemId(item.id)
    setMoodboardTitle(item.title)
    setMoodboardNote(item.note)
  }

  async function handleSaveMoodboardDetails() {
    if (!selectedMoodboardItem) {
      return
    }

    await updateMoodboardItem(selectedMoodboardItem.id, {
      title: displayedMoodboardTitle.trim() || selectedMoodboardItem.title,
      note: displayedMoodboardNote.trim(),
    })
  }

  async function handleDeleteMoodboardItem() {
    if (!selectedMoodboardItem) {
      return
    }

    const shouldDelete = window.confirm(`Delete moodboard image "${selectedMoodboardItem.title}"?`)

    if (!shouldDelete) {
      return
    }

    await deleteMoodboardItem(selectedMoodboardItem.id)
    setSelectedMoodboardItemId('')
    setMoodboardTitle('')
    setMoodboardNote('')
  }

  function handleRunWorkflow() {
    if (!falConfig.hasApiKey) {
      return
    }

    void runActiveWorkflow()
  }

  function handleToggleOutput(item: OutputItem) {
    if (!item.path) {
      return
    }

    setSelectedOutputIds((current) =>
      current.includes(item.id)
        ? current.filter((outputId) => outputId !== item.id)
        : [...current, item.id],
    )
  }

  async function handleExportOutputs() {
    if (!selectedOutputIds.length) {
      return
    }

    await exportProjectOutputs(selectedOutputIds.filter((outputId) =>
      activeProject?.outputs.some((item) => item.id === outputId),
    ))
  }

  if (!activeProject) {
    return (
      <section className="workspace-shell">
        <header className="workspace-header workspace-header-empty">
          <div>
            <p className="eyebrow">Current project</p>
            <h2>No project selected</h2>
            <p>{isLoading ? 'Loading project workspace...' : 'Create or open a project from the left rail to begin.'}</p>
          </div>
        </header>
        <div className="workspace-empty-state">
          <div className="workspace-empty-copy">
            <p className="eyebrow">Project lifecycle</p>
            <h3>The canvas opens when a project is active.</h3>
            <p>
              Use the sidebar to create a workspace, reopen an existing one, or keep your projects organised locally.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const displayedOutputs = activeProject.outputs
  const selectedOutputIdsInProject = selectedOutputIds.filter((outputId) =>
    displayedOutputs.some((item) => item.id === outputId),
  )
  const hasExportableSelection = displayedOutputs.some(
    (item) => selectedOutputIdsInProject.includes(item.id) && Boolean(item.path),
  )

  return (
    <section className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Current project</p>
          {isRenameFormOpen && renameProjectId === activeProject.id ? (
            <form className="workspace-rename-form" onSubmit={(event) => void handleSubmitRename(event)}>
              <input
                className="text-input workspace-title-input"
                type="text"
                value={renameValue}
                aria-label="Rename project"
                onChange={(event) => setRenameValue(event.target.value)}
              />
              <div className="workspace-form-actions">
                <button className="chip-button" type="submit" disabled={isSaving || !renameValue.trim()}>
                  {isSaving ? 'Saving...' : 'Save name'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsRenameFormOpen(false)
                    setRenameValue(activeProject.name)
                    setRenameProjectId('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{activeProject.name}</h2>
              <p>
                One local workspace for workflow, references and generated outputs.
              </p>
            </>
          )}
        </div>

        <div className="workspace-actions">
          <button className="ghost-button" type="button" disabled={isLoading || isSaving} onClick={handleStartRename}>
            Rename
          </button>
          <button className="ghost-button" type="button" disabled={isLoading || isSaving} onClick={handleDeleteProject}>
            Delete
          </button>
          <button
            className="chip-button"
            type="button"
            disabled={isLoading || isSaving || !isDirty}
            onClick={() => void saveActiveProject()}
          >
            {isSaving ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!falConfig.hasApiKey || workflowRun.status === 'running'}
            onClick={handleRunWorkflow}
          >
            {falConfig.hasApiKey
              ? workflowRun.status === 'running'
                ? 'Running...'
                : 'Run workflow'
              : 'API key required'}
          </button>
        </div>
      </header>

      {errorMessage ? <p className="workspace-message is-error">{errorMessage}</p> : null}
      {!falConfig.hasApiKey ? (
        <div className="workspace-message workspace-message-warning">
          <p>
            Fal API key missing. Add <strong>VITE_FAL_API_KEY</strong> to your local <strong>.env</strong> file before running workflows.
          </p>
        </div>
      ) : null}
      {isDeleteConfirmOpen && deleteProjectId === activeProject.id ? (
        <div className="workspace-message workspace-message-warning">
          <p>
            Delete <strong>{activeProject.name}</strong>? The project folder and saved metadata will be removed.
          </p>
          <div className="workspace-inline-actions">
            <button className="primary-button" type="button" disabled={isLoading} onClick={() => void handleConfirmDelete()}>
              {isLoading ? 'Deleting...' : 'Delete project'}
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={isLoading}
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                setDeleteProjectId('')
              }}
            >
              Keep project
            </button>
          </div>
        </div>
      ) : null}

      <div className="workspace-grid">
        <div className="canvas-column">
          <div className="overview-grid">
            <article className="panel-card">
              <p className="meta-label">Template</p>
              <strong>Beauty Campaign</strong>
              <p>{isDirty ? 'Workflow has unsaved changes.' : 'Opinionated image-first flow for product visuals.'}</p>
            </article>
            <article className="panel-card">
              <p className="meta-label">Moodboard</p>
              <strong>{activeProject.moodboard.length}</strong>
              <p>References kept with the workflow instead of separate folders.</p>
            </article>
            <article className="panel-card">
              <p className="meta-label">Outputs</p>
              <strong>{activeProject.outputs.length}</strong>
              <p>Selected generated assets ready for review and export.</p>
            </article>
          </div>

          <div className="flow-panel">
            <div className="operations-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Curated AI operations</p>
                  <h3>Beauty Campaign modules</h3>
                </div>
              </div>

              <div className="operations-grid">
                {falOperations.map((operation) => (
                  <article key={operation.id} className="operation-card">
                    <p className="meta-label">{operation.label}</p>
                    <strong>{operation.summary}</strong>
                    <p>Inputs: {operation.io.inputs.join(', ').replaceAll('-', ' ')}</p>
                    <p>Output: {operation.io.outputs.join(', ').replaceAll('-', ' ')}</p>
                  </article>
                ))}
              </div>
            </div>

            <WorkflowCanvas />
          </div>
        </div>

        <div className="side-column">
          <section className="moodboard-panel">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Moodboard</p>
                <h3>References linked to the project</h3>
              </div>
              <label className="ghost-button file-trigger">
                Add images
                <input
                  className="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isSaving}
                  onChange={(event) => void handleMoodboardFileSelection(event.target.files)}
                />
              </label>
            </div>

            {selectedMoodboardItem ? (
              <div className="moodboard-preview-panel">
                <div className="moodboard-preview-stage">
                  {selectedMoodboardItem.path ? (
                    <img
                      className="moodboard-preview-image"
                      src={toPreviewSrc(selectedMoodboardItem.path)}
                      alt={selectedMoodboardItem.title}
                    />
                  ) : (
                    <div className="moodboard-swatch moodboard-preview-swatch" />
                  )}
                </div>

                <div className="moodboard-editor">
                  <label className="field-label" htmlFor="moodboard-title">
                    Title
                  </label>
                  <input
                    id="moodboard-title"
                    className="text-input"
                    type="text"
                    value={displayedMoodboardTitle}
                    onChange={(event) => {
                      setSelectedMoodboardItemId(selectedMoodboardItem.id)
                      setMoodboardTitle(event.target.value)
                    }}
                  />

                  <label className="field-label" htmlFor="moodboard-note">
                    Note
                  </label>
                  <textarea
                    id="moodboard-note"
                    className="text-input moodboard-textarea"
                    value={displayedMoodboardNote}
                    rows={4}
                    onChange={(event) => {
                      setSelectedMoodboardItemId(selectedMoodboardItem.id)
                      setMoodboardNote(event.target.value)
                    }}
                  />

                  <div className="workspace-inline-actions">
                    <button className="chip-button" type="button" disabled={isSaving} onClick={() => void handleSaveMoodboardDetails()}>
                      {isSaving ? 'Saving...' : 'Save details'}
                    </button>
                    <button className="ghost-button" type="button" disabled={isSaving} onClick={() => void handleDeleteMoodboardItem()}>
                      Delete image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="moodboard-empty-state">
                <p className="eyebrow">No references yet</p>
                <p>Import one or more images to build the project moodboard.</p>
              </div>
            )}

            <div className="moodboard-grid">
              {activeProject.moodboard.map((item) => (
                <button
                  key={item.id}
                  className={`moodboard-card moodboard-card-button ${selectedMoodboardItem?.id === item.id ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handleSelectMoodboardItem(item)}
                >
                  {item.path ? (
                    <img
                      className="moodboard-image"
                      src={toPreviewSrc(item.path)}
                      alt={item.title}
                    />
                  ) : (
                    <div className="moodboard-swatch" />
                  )}
                  <div className="moodboard-copy">
                    <strong>{item.title}</strong>
                    <p className="moodboard-note">{item.note || 'No note yet'}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="output-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Outputs</p>
                <h3>Latest generated stills</h3>
              </div>
              <button
                className="ghost-button"
                type="button"
                disabled={!hasExportableSelection || isSaving}
                onClick={() => void handleExportOutputs()}
              >
                {isSaving ? 'Exporting...' : hasExportableSelection ? 'Export selected' : 'Select outputs'}
              </button>
            </div>

            {displayedOutputs.length ? (
              <div className="output-list">
                {displayedOutputs.map((item) => (
                  <button
                    key={item.id}
                    className={`output-card output-card-button ${selectedOutputIdsInProject.includes(item.id) ? 'is-active' : ''} ${item.path ? '' : 'is-disabled'}`}
                    type="button"
                    disabled={!item.path}
                    onClick={() => handleToggleOutput(item)}
                  >
                    {item.path ? (
                      <img
                        className="output-preview output-preview-image"
                        src={toPreviewSrc(item.path)}
                        alt={item.title}
                      />
                    ) : (
                      <div className="output-preview" />
                    )}
                    <div className="output-copy">
                      <strong>{item.title}</strong>
                      <p>{item.note}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="output-empty-state">
                <p className="eyebrow">No outputs yet</p>
                <p>Run the workflow to generate local stills for review and export.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

function toPreviewSrc(path: string) {
  if (!path) {
    return ''
  }

  if (path.startsWith('data:')) {
    return path
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return convertFileSrc(path)
}
