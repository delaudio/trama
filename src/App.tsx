import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { ProjectSidebar } from './features/projects/ProjectSidebar'
import { WorkspaceShell } from './features/workspace/WorkspaceShell'
import { useProjectsStore } from './store/projects-store'

type AppHealth = {
  productName: string
  dataDir?: string | null
  projectsDir?: string | null
}

function App() {
  const [appVersion, setAppVersion] = useState<string>('web')
  const [storageNote, setStorageNote] = useState(
    'Desktop projects are stored in the local app data directory; web preview uses browser storage.',
  )
  const loadProjects = useProjectsStore((state) => state.loadProjects)

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('web'))
  }, [])

  useEffect(() => {
    invoke<AppHealth>('app_health')
      .then((health) => {
        if (health.projectsDir) {
          setStorageNote(`Projects stored in ${health.projectsDir}`)
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <div className="brand-mark">t</div>
          <div>
            <p className="eyebrow">Local creative workflows</p>
            <h1>trama</h1>
          </div>
        </div>

        <ProjectSidebar storageNote={storageNote} />

        <div className="app-meta">
          <span>Beauty Campaign first</span>
          <span>v{appVersion}</span>
        </div>
      </aside>

      <main className="main-panel">
        <WorkspaceShell />
      </main>
    </div>
  )
}

export default App
