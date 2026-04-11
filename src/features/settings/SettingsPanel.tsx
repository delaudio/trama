import { falConfig } from '../../lib/fal-config'

export function SettingsPanel() {
  return (
    <section className="settings-panel">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Fal access</h2>
        </div>
        <span className={`settings-pill ${falConfig.hasApiKey ? 'is-ready' : 'is-missing'}`}>
          {falConfig.hasApiKey ? 'Configured' : 'Missing'}
        </span>
      </div>

      <div className="settings-card">
        <p className="settings-copy">
          The Fal API key is loaded from a local `.env` file instead of app-managed storage.
        </p>
        <dl className="settings-list">
          <div>
            <dt>Source</dt>
            <dd>{falConfig.sourceLabel}</dd>
          </div>
          <div>
            <dt>Key</dt>
            <dd>{falConfig.maskedApiKey}</dd>
          </div>
        </dl>
        <p className="settings-hint">
          Set `VITE_FAL_API_KEY` in `.env` and restart the dev app after changing it.
        </p>
      </div>
    </section>
  )
}
