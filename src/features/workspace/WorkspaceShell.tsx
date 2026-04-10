import { useProjectsStore } from '../../store/projects-store'
import { WorkflowCanvas } from '../workflow/WorkflowCanvas'

export function WorkspaceShell() {
  const activeProject = useProjectsStore((state) =>
    state.projects.find((project) => project.id === state.activeProjectId),
  )

  if (!activeProject) {
    return null
  }

  return (
    <section className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Current project</p>
          <h2>{activeProject.name}</h2>
          <p>
            One local workspace for workflow, references and generated outputs.
          </p>
        </div>

        <div className="workspace-actions">
          <button className="chip-button" type="button">
            Save
          </button>
          <button className="primary-button" type="button">
            Run workflow
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="canvas-column">
          <div className="overview-grid">
            <article className="panel-card">
              <p className="meta-label">Template</p>
              <strong>Beauty Campaign</strong>
              <p>Opinionated image-first flow for product visuals.</p>
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
