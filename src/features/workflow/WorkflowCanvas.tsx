import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Node,
  type NodeChange,
  type NodeProps,
  type EdgeChange,
  type Viewport,
} from '@xyflow/react'
import { useProjectsStore } from '../../store/projects-store'
import type { WorkflowNodeData } from '../../types/project'

function WorkflowNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <div className="flow-node">
      <p className="panel-label">{data.kind.replace('-', ' ')}</p>
      <h4>{data.label}</h4>
      <p>{data.description}</p>
    </div>
  )
}

const nodeTypes = {
  workflowNode: WorkflowNode,
}

export function WorkflowCanvas() {
  const activeProject = useProjectsStore((state) => state.activeProject)
  const applyNodeChanges = useProjectsStore((state) => state.applyNodeChanges)
  const applyEdgeChanges = useProjectsStore((state) => state.applyEdgeChanges)
  const connectNodes = useProjectsStore((state) => state.connectNodes)
  const setViewport = useProjectsStore((state) => state.setViewport)

  if (!activeProject) {
    return null
  }

  function handleNodeChanges(changes: NodeChange<Node<WorkflowNodeData>>[]) {
    applyNodeChanges(changes)
  }

  function handleEdgeChanges(changes: EdgeChange[]) {
    applyEdgeChanges(changes)
  }

  function handleConnect(connection: Connection) {
    connectNodes(connection)
  }

  function handleMoveEnd(_: MouseEvent | TouchEvent | null, viewport: Viewport) {
    setViewport(viewport)
  }

  return (
    <div className="workflow-canvas">
      <ReactFlow
        key={activeProject.id}
        nodes={activeProject.graph.nodes}
        edges={activeProject.graph.edges}
        nodeTypes={nodeTypes}
        defaultViewport={activeProject.graph.viewport}
        minZoom={0.5}
        maxZoom={1.5}
        onNodesChange={handleNodeChanges}
        onEdgesChange={handleEdgeChanges}
        onConnect={handleConnect}
        onMoveEnd={handleMoveEnd}
        fitViewOptions={{ padding: 0.18 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#8e4d22', strokeWidth: 1.6 },
        }}
      >
        <Background color="#c9baa2" gap={24} size={1} />
        <MiniMap
          pannable
          zoomable
          nodeColor={() => '#b86939'}
          nodeBorderRadius={12}
        />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  )
}
