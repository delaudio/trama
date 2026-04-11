import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProjectsStore } from '../../store/projects-store'
import { WorkflowCanvas } from '../workflow/WorkflowCanvas'

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
  const saveActiveProject = useProjectsStore((state) => state.saveActiveProject)
  const renameActiveProject = useProjectsStore((state) => state.renameActiveProject)
  const deleteActiveProject = useProjectsStore((state) => state.deleteActiveProject)

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
          <button className="primary-button" type="button">
            Run workflow
          </button>
        </div>
      </header>

      {errorMessage ? <p className="workspace-message is-error">{errorMessage}</p> : null}
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
              <button className="ghost-button" type="button">
                Add images
              </button>
            </div>

            <div className="moodboard-grid">
              {activeProject.moodboard.map((item) => (
                <article key={item.id} className="moodboard-card">
                  <div className="moodboard-swatch" />
                  <div className="moodboard-copy">
                    <strong>{item.title}</strong>
                    <p className="moodboard-note">{item.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="output-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Outputs</p>
                <h3>Latest generated stills</h3>
              </div>
              <button className="ghost-button" type="button">
                Export
              </button>
            </div>

            <div className="output-list">
              {activeProject.outputs.map((item) => (
                <article key={item.id} className="output-card">
                  <div className="output-preview" />
                  <div className="output-copy">
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
