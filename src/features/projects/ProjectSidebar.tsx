import { useProjectsStore } from '../../store/projects-store'

export function ProjectSidebar() {
  const projects = useProjectsStore((state) => state.projects)
  const activeProjectId = useProjectsStore((state) => state.activeProjectId)
  const setActiveProject = useProjectsStore((state) => state.setActiveProject)

  return (
    <section className="projects-panel">
      <div className="projects-toolbar">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Workspace list</h2>
        </div>
        <button className="ghost-button" type="button">
          New project
        </button>
      </div>

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
              <span>{project.updatedAt}</span>
            </footer>
          </button>
        ))}
      </div>
    </section>
  )
}
