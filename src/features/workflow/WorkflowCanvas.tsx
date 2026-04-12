import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Node,
  type NodeChange,
  type NodeProps,
  type EdgeChange,
  type Viewport,
} from '@xyflow/react'
import { getWorkflowNodeIo } from './workflow-io'
import { getFalOperationForNodeKind } from '../fal/fal-operations'
import { useProjectsStore } from '../../store/projects-store'
import type { WorkflowNodeData, WorkflowNodeRunState } from '../../types/project'

type WorkflowCanvasNodeData = WorkflowNodeData & {
  runtimeState?: WorkflowNodeRunState
}

function WorkflowNode({ data }: NodeProps<Node<WorkflowCanvasNodeData>>) {
  const nodeIo = getWorkflowNodeIo(data.kind)
  const falOperation = getFalOperationForNodeKind(data.kind)
  const runtimeStatus = data.runtimeState?.status ?? 'idle'

  return (
    <div className={`flow-node is-${runtimeStatus}`}>
      <Handle className="flow-node-handle" type="target" position={Position.Left} />
      <p className="panel-label">{falOperation ? 'Fal operation' : data.kind.replace('-', ' ')}</p>
      <h4>{data.label}</h4>
      <p>{data.description}</p>
      {data.runtimeState && runtimeStatus !== 'idle' ? (
        <div className={`flow-node-status is-${runtimeStatus}`}>
          <strong>{formatRuntimeStatus(runtimeStatus)}</strong>
          {data.runtimeState.errorMessage ? <span>{data.runtimeState.errorMessage}</span> : null}
          {data.runtimeState.outputCount ? <span>{data.runtimeState.outputCount} output</span> : null}
        </div>
      ) : null}
      {falOperation ? (
        <div className="flow-node-operation">
          <strong>{falOperation.label}</strong>
          <span>{falOperation.summary}</span>
        </div>
      ) : null}
      <div className="flow-node-io">
        <div className="flow-node-io-group">
          <span className="flow-node-io-label">In</span>
          <span>{nodeIo.inputs.length ? nodeIo.inputs.join(', ').replaceAll('-', ' ') : 'start'}</span>
        </div>
        <div className="flow-node-io-group">
          <span className="flow-node-io-label">Out</span>
          <span>{nodeIo.outputs.length ? nodeIo.outputs.join(', ').replaceAll('-', ' ') : 'end'}</span>
        </div>
      </div>
      <Handle className="flow-node-handle" type="source" position={Position.Right} />
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
  const workflowMessage = useProjectsStore((state) => state.workflowMessage)
  const workflowRun = useProjectsStore((state) => state.workflowRun)
  const clearWorkflowMessage = useProjectsStore((state) => state.clearWorkflowMessage)

  if (!activeProject) {
    return null
  }

  const nodes = activeProject.graph.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      runtimeState: workflowRun.nodeStates[node.id],
    },
  }))

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
      {workflowMessage ? (
        <div className="workflow-feedback workflow-feedback-error">
          <span>{workflowMessage}</span>
          <button className="ghost-button workflow-feedback-dismiss" type="button" onClick={clearWorkflowMessage}>
            Dismiss
          </button>
        </div>
      ) : null}

      <ReactFlow
        key={activeProject.id}
        nodes={nodes}
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

function formatRuntimeStatus(status: WorkflowNodeRunState['status']) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'running':
      return 'Running'
    case 'succeeded':
      return 'Succeeded'
    case 'failed':
      return 'Failed'
    default:
      return 'Idle'
  }
}
