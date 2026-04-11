import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'
import { webProjectRepository } from './project-repository.ts'

class MemoryStorage implements Storage {
  #store = new Map<string, string>()

  get length() {
    return this.#store.size
  }

  clear() {
    this.#store.clear()
  }

  getItem(key: string) {
    return this.#store.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.#store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.#store.delete(key)
  }

  setItem(key: string, value: string) {
    this.#store.set(key, value)
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test('web repository starts empty without seeded projects', async () => {
  const projects = await webProjectRepository.listProjects()

  assert.deepEqual(projects, [])
})

test('web repository persists create, rename, save, and delete flows via local storage', async () => {
  const created = await webProjectRepository.createProject('Persistence Check')
  let projects = await webProjectRepository.listProjects()

  assert.equal(projects.length, 1)
  assert.equal(projects[0]?.id, created.id)
  assert.equal('graph' in projects[0], false)

  const renamed = await webProjectRepository.renameProject(created.id, 'Renamed Project')
  assert.equal(renamed.name, 'Renamed Project')

  const loaded = await webProjectRepository.loadProject(created.id)
  const saved = await webProjectRepository.saveProject({
    ...loaded,
    moodboard: [...loaded.moodboard, { id: 'mb-test', title: 'Test', note: 'Added in test' }],
  })

  assert.equal(saved.moodboardCount, loaded.moodboard.length + 1)

  projects = await webProjectRepository.listProjects()
  assert.equal(projects[0]?.name, 'Renamed Project')
  assert.equal(projects[0]?.moodboardCount, saved.moodboard.length)

  await webProjectRepository.deleteProject(created.id)

  assert.deepEqual(await webProjectRepository.listProjects(), [])
})
