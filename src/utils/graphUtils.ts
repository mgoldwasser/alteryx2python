interface GraphNode {
  id: string;
  label: string;
  rawXml?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Helper function to ensure we always work with arrays
export const getArray = <T,>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const generateGraphData = (json?: any): GraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  if (!json) return { nodes, links };

  const nodeList = getArray(json.AlteryxDocument?.Nodes?.Node);
  
  nodeList.forEach((node) => {
    const id = node?._attributes?.ToolID;
    const plugin = node?.GuiSettings?._attributes?.Plugin || "Unknown";
    const annotation = node?.Properties?.Annotation?.DefaultAnnotationText?._text || "";
    const pluginShort = plugin.split(".").pop() || plugin;
    const truncatedAnnotation = annotation.length > 50 ? annotation.slice(0, 50) + "..." : annotation;
    const label = `${id} - ${pluginShort} - ${truncatedAnnotation || plugin}`;
    
    if (id) {
      nodes.push({ 
        id, 
        label,
        rawXml: JSON.stringify(node, null, 2)
      });
      nodeIds.add(id);
    }
  });
  
  const connectionList = getArray(json.AlteryxDocument?.Connections?.Connection);
  connectionList.forEach((conn) => {
    const origin = conn?.Origin?._attributes?.ToolID;
    const destination = conn?.Destination?._attributes?.ToolID;
    if (origin && destination) {
      links.push({ source: origin, target: destination });
      if (!nodeIds.has(origin)) {
        nodes.push({ id: origin, label: "Missing Node" });
        nodeIds.add(origin);
      }
      if (!nodeIds.has(destination)) {
        nodes.push({ id: destination, label: "Missing Node" });
        nodeIds.add(destination);
      }
    }
  });

  return { nodes, links };
};
