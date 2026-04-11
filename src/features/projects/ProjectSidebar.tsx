import { useProjectsStore } from '../../store/projects-store'
import { formatProjectUpdatedAt } from '../../lib/project-format'

type ProjectSidebarProps = {
  storageNote: string
}

export function ProjectSidebar({ storageNote }: ProjectSidebarProps) {
  const projects = useProjectsStore((state) => state.projects)
  const activeProjectId = useProjectsStore((state) => state.activeProjectId)
  const isLoading = useProjectsStore((state) => state.isLoading)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const setActiveProject = useProjectsStore((state) => state.setActiveProject)
  const createProject = useProjectsStore((state) => state.createProject)

  function handleCreateProject() {
    const name = window.prompt('New project name', 'Beauty Campaign')

    if (!name?.trim()) {
      return
    }

    void createProject(name.trim())
  }

  return (
    <section className="projects-panel">
      <div className="projects-toolbar">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Workspace list</h2>
        </div>
        <button className="ghost-button" type="button" onClick={handleCreateProject}>
          New project
        </button>
      </div>

      {errorMessage ? <p className="inline-message is-error">{errorMessage}</p> : null}
      {isLoading ? <p className="inline-message">Loading projects...</p> : null}

      <div className="project-list">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`project-card ${project.id === activeProjectId ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveProject(project.id)}
          >
            <strong>{project.name}</strong>
            <p>Template: Beauty Campaign</p>
            <footer>
              <span>{project.moodboardCount} refs</span>
              <span>{formatProjectUpdatedAt(project.updatedAt)}</span>
            </footer>
          </button>
        ))}
      </div>

      <p className="app-storage-note">{storageNote}</p>
    </section>
  )
}
