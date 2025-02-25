import { useCallback, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  ConnectionMode,
  Node,
  Edge,
  Position,
  NodeProps,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphNode {
  id: string;
  label: string;
  rawXml?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface WorkflowVisualizationProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
}

import { FC } from 'react';

interface CustomNodeData {
  label: string;
  rawXml: string;
  isSelected: boolean;
  setSelectedNode: (id: string | null) => void;
}

const CustomNode: FC<NodeProps<CustomNodeData>> = ({ id, data, sourcePosition = Position.Right, targetPosition = Position.Left }) => {
  const { label, rawXml, isSelected, setSelectedNode } = data;

  return (
    <div
      onClick={() => isSelected ? setSelectedNode(null) : setSelectedNode(id)}
      style={{
        border: isSelected ? '2px solid blue' : '1px solid gray',
        padding: '10px',
        backgroundColor: isSelected ? '#f0f8ff' : 'white',
      }}
    >
      <Handle type="source" position={sourcePosition} id={`source-${id}`} />
      <Handle type="target" position={targetPosition} id={`target-${id}`} />
      <strong>{label}</strong>
      {isSelected && (
        <pre>{rawXml}</pre>
      )}
    </div>
  );
};

const WorkflowVisualization = ({ nodes, links, onNodeClick }: WorkflowVisualizationProps) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Calculate node levels based on dependencies
  const calculateNodeLevels = () => {
    const levels: { [key: string]: number } = {};
    const inDegree: { [key: string]: number } = {};
    const outDegree: { [key: string]: number } = {};
    
    // Initialize degrees
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      outDegree[node.id] = 0;
    });

    // Calculate in/out degrees
    links.forEach(link => {
      inDegree[link.target] = (inDegree[link.target] || 0) + 1;
      outDegree[link.source] = (outDegree[link.source] || 0) + 1;
    });

    // Start with input nodes (no incoming edges)
    const queue = nodes
      .filter(node => inDegree[node.id] === 0)
      .map(node => node.id);
    
    let level = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        levels[nodeId] = level;
        
        // Add children to queue
        links
          .filter(link => link.source === nodeId)
          .forEach(link => {
            inDegree[link.target]--;
            if (inDegree[link.target] === 0) {
              queue.push(link.target);
            }
          });
      }
      level++;
    }

    // Ensure output nodes (no outgoing edges) are on the last level
    const maxLevel = Math.max(...Object.values(levels));
    nodes.forEach(node => {
      if (outDegree[node.id] === 0) {
        levels[node.id] = maxLevel;
      }
    });

    return levels;
  };

  const nodeLevels = calculateNodeLevels();
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 100;

  // Convert graph data to ReactFlow format with calculated positions
  const flowNodes: Node[] = nodes.map((node) => {
    const level = nodeLevels[node.id];
    const nodesAtLevel = nodes.filter(n => nodeLevels[n.id] === level).length;
    const indexAtLevel = nodes.filter(n => nodeLevels[n.id] === level && n.id <= node.id).length;
    
    return {
      id: node.id,
      data: { 
        label: node.label,
        rawXml: node.rawXml || '',
        isSelected: node.id === selectedNode,
        setSelectedNode: setSelectedNode,
      },
      position: {
        x: level * HORIZONTAL_SPACING,
        y: (indexAtLevel - nodesAtLevel / 2) * VERTICAL_SPACING
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      type: 'custom', // Use custom node type
    };
  });

  // Convert links to ReactFlow format with proper handle specifications
  const flowEdges: Edge[] = links.map((link) => ({
    id: `${link.source}-${link.target}`,
    source: link.source,
    target: link.target,
    animated: true,
    type: 'smoothstep',
    sourceHandle: `source-${link.source}`, // Add unique source handle
    targetHandle: `target-${link.target}`  // Add unique target handle
  }));

  const onNodesChange = useCallback(() => {
    // Handle node changes if needed
  }, []);

  const onEdgesChange = useCallback(() => {
    // Handle edge changes if needed
  }, []);

  const nodeTypes = {
    custom: CustomNode,
  };

  const handleNodeClick = (node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    } else {
      console.log("Node clicked:", node);
    }
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {nodes.map(node => (
        <div 
          key={node.id} 
          onClick={() => handleNodeClick(node)}
          className="node cursor-pointer p-2 border rounded m-2 bg-white shadow"
        >
          {node.label}
        </div>
      ))}
    </div>
  );
};

export { WorkflowVisualization };
