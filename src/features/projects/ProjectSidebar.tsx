import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProjectsStore } from '../../store/projects-store'
import { formatProjectUpdatedAt } from '../../lib/project-format'

type ProjectSidebarProps = {
  storageNote: string
}

export function ProjectSidebar({ storageNote }: ProjectSidebarProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('Beauty Campaign')
  const projects = useProjectsStore((state) => state.projects)
  const activeProjectId = useProjectsStore((state) => state.activeProjectId)
  const activeProject = useProjectsStore((state) => state.activeProject)
  const isLoading = useProjectsStore((state) => state.isLoading)
  const isDirty = useProjectsStore((state) => state.isDirty)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const setActiveProject = useProjectsStore((state) => state.setActiveProject)
  const createProject = useProjectsStore((state) => state.createProject)

  async function handleSubmitCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = newProjectName.trim()

    if (!trimmedName) {
      return
    }

    if (isDirty) {
      const shouldContinue = window.confirm(
        `Create a new project without saving "${activeProject?.name ?? 'current project'}"?`,
      )

      if (!shouldContinue) {
        return
      }
    }

    await createProject(trimmedName)
    setIsCreateFormOpen(false)
    setNewProjectName('Beauty Campaign')
  }

  function handleOpenCreateForm() {
    setIsCreateFormOpen(true)
    setNewProjectName('Beauty Campaign')
  }

  function handleCancelCreateForm() {
    setIsCreateFormOpen(false)
    setNewProjectName('Beauty Campaign')
  }

  function handleOpenProject(projectId: string) {
    if (projectId === activeProjectId) {
      return
    }

    if (isDirty) {
      const shouldContinue = window.confirm(
        `Open another project without saving "${activeProject?.name ?? 'current project'}"?`,
      )

      if (!shouldContinue) {
        return
      }
    }

    void setActiveProject(projectId)
  }

  return (
    <section className="projects-panel">
      <div className="projects-toolbar">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Workspace list</h2>
        </div>
        <button
          className="ghost-button"
          type="button"
          disabled={isLoading}
          onClick={handleOpenCreateForm}
        >
          {projects.length ? 'New project' : 'Create first'}
        </button>
      </div>

      {isCreateFormOpen ? (
        <form className="project-create-form" onSubmit={(event) => void handleSubmitCreateProject(event)}>
          <label className="field-label" htmlFor="new-project-name">
            Project name
          </label>
          <input
            id="new-project-name"
            className="text-input"
            type="text"
            value={newProjectName}
            placeholder="Beauty Campaign"
            onChange={(event) => setNewProjectName(event.target.value)}
          />
          <div className="project-form-actions">
            <button className="primary-button" type="submit" disabled={isLoading || !newProjectName.trim()}>
              {isLoading ? 'Creating...' : 'Create project'}
            </button>
            <button className="ghost-button" type="button" disabled={isLoading} onClick={handleCancelCreateForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {errorMessage ? <p className="inline-message is-error">{errorMessage}</p> : null}
      {isLoading ? <p className="inline-message">Loading project list...</p> : null}

      {!projects.length && !isLoading ? (
        <div className="project-empty-state">
          <p className="eyebrow">No projects yet</p>
          <h3>Start with one local workspace.</h3>
          <p>Create a project to keep workflow, references, and outputs in the same folder.</p>
          <button className="primary-button" type="button" onClick={handleOpenCreateForm}>
            Create first project
          </button>
        </div>
      ) : null}

      <div className="project-list">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`project-card ${project.id === activeProjectId ? 'is-active' : ''}`}
            type="button"
            disabled={isLoading}
            onClick={() => handleOpenProject(project.id)}
          >
            <strong>{project.name}</strong>
            <p>Template: {project.template === 'beauty-campaign' ? 'Beauty Campaign' : project.template}</p>
            <footer>
              <span>{project.moodboardCount} refs</span>
              <span>{project.id === activeProjectId ? 'Open now' : formatProjectUpdatedAt(project.updatedAt)}</span>
            </footer>
          </button>
        ))}
      </div>

      <p className="app-storage-note">{storageNote}</p>
    </section>
  )
}
