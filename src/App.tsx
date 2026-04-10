import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { ProjectSidebar } from './features/projects/ProjectSidebar'
import { WorkspaceShell } from './features/workspace/WorkspaceShell'

function App() {
  const [appVersion, setAppVersion] = useState<string>('web')

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('web'))
  }, [])

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

        <ProjectSidebar />

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
