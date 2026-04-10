import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type NodeProps,
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
  const activeProject = useProjectsStore((state) =>
    state.projects.find((project) => project.id === state.activeProjectId),
  )

  if (!activeProject) {
    return null
  }

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={activeProject.graph.nodes}
        edges={activeProject.graph.edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
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
