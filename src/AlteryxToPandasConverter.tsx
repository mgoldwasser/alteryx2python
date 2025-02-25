import React, { useState, DragEvent } from "react";
import { xml2json } from "xml-js";
import { WorkflowVisualization } from './components/WorkflowVisualization';
import { generateGraphData, getArray } from './utils/graphUtils';
import { dbFileInputHandler } from './utils/nodeHandlers/dbFileInputHandler';
import { downloadHandler } from './utils/nodeHandlers/downloadHandler';
import { regexHandler } from './utils/nodeHandlers/regexHandler';
import { alteryxSelectHandler } from './utils/nodeHandlers/alteryxSelectHandler';
import { autoFieldHandler } from './utils/nodeHandlers/autoFieldHandler';
import { joinHandler } from './utils/nodeHandlers/joinHandler';
import { summarizeHandler } from './utils/nodeHandlers/summarizeHandler';
import { dbFileOutputHandler } from './utils/nodeHandlers/dbFileOutputHandler';
import { filterHandler } from './utils/nodeHandlers/filterHandler';
import { formulaHandler } from './utils/nodeHandlers/formulaHandler';
import { unionHandler } from './utils/nodeHandlers/unionHandler';
import { sortHandler } from './utils/nodeHandlers/sortHandler';
import { uniqueHandler } from './utils/nodeHandlers/uniqueHandler';
import { textInputHandler } from './utils/nodeHandlers/textInputHandler';
import { macroHandler } from './utils/nodeHandlers/macroHandler';

// Define TypeScript interfaces for Graph Data
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

export default function AlteryxToPandasConverter() {
  const [xmlInput, setXmlInput] = useState<string>("");
  const [pythonOutput, setPythonOutput] = useState<string>("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [notification, setNotification] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setXmlInput(e.target.result as string);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setXmlInput(ev.target.result as string);
      };
      reader.readAsText(file);
    }
  };

  const convertToPandas = () => {
    try {
      const json = JSON.parse(xml2json(xmlInput, { compact: true }));
      const pandasScript = generatePandasScript(json);
      setPythonOutput(pandasScript);
      setGraphData(generateGraphData(json));
    } catch (error: any) {
      setPythonOutput(`Error parsing XML: ${error.message}`);
    }
  };

  const handleDownload = () => {
    if (!pythonOutput) return;
    const blob = new Blob([pythonOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_code.py";
    a.click();
    URL.revokeObjectURL(url);
    setNotification("Download started!");
  };

  const generatePandasScript = (json: { AlteryxDocument: { Nodes: { Node: any; }; Connections: { Connection: any; }; }; }): string => {
    if (!json || !json.AlteryxDocument) return "Invalid JSON structure.";
    const nodes = getArray(json.AlteryxDocument?.Nodes?.Node);
    let pandasCode = "import pandas as pd\nimport requests\nfrom io import StringIO\nimport numpy as np\nfrom geopy.distance import great_circle\n\n";
    let dataFrames: { [key: string]: string } = {}; 
    let connections: { [key: string]: string[] } = {}; 
    let processedNodes = new Set<string>(); 

    const connectionList = getArray(json.AlteryxDocument?.Connections?.Connection);
    connectionList.forEach((conn) => {
      const origin = conn?.Origin?._attributes?.ToolID;
      const destination = conn?.Destination?._attributes?.ToolID;
      if (origin && destination) {
        if (!connections[origin]) {
          connections[origin] = [];
        }
        connections[origin].push(destination);
      }
    });

    const incoming: { [toolID: string]: string[] } = {};
    connectionList.forEach((conn) => {
      const dest = conn?.Destination?._attributes?.ToolID;
      const origin = conn?.Origin?._attributes?.ToolID;
      if (dest && origin) {
        if (!incoming[dest]) {
          incoming[dest] = [];
        }
        incoming[dest].push(origin);
      }
    });

    // Build reverse map of destinations for each origin
    const outgoing: { [toolID: string]: string[] } = {};
    connectionList.forEach((conn) => {
      const origin = conn?.Origin?._attributes?.ToolID;
      const dest = conn?.Destination?._attributes?.ToolID;
      if (origin && dest) {
        if (!outgoing[origin]) {
          outgoing[origin] = [];
        }
        outgoing[origin].push(dest);
      }
    });

    nodes.forEach((node) => {
      const toolID = node?._attributes?.ToolID;
      if (toolID) {
        dataFrames[toolID] = `df_tool_${toolID}`;
      }
    });

    interface NodeHandler {
      (node: any, inputDF: string, outputDF: string, toolID?: string, context?: {
        connections: { [key: string]: string[] },
        dataFrames: { [key: string]: string },
        incoming: { [key: string]: string[] }
      }): string;
    }

    const nodeHandlers: { [key: string]: NodeHandler } = {
      "DbFileInput": dbFileInputHandler,
      "Download": downloadHandler,
      "RegEx": regexHandler,
      "AlteryxSelect": alteryxSelectHandler,
      "AutoField": autoFieldHandler,
      "Join": (node, inputDF, outputDF, toolID, context) => {
        if (!toolID || !context) return "";
        const inputs = context.incoming[toolID] || [];
        if (inputs.length === 2) {
            const leftToolID = inputs.find(input => context.connections[input]?.includes(toolID) && node.Properties?.Configuration?.JoinInfo?.some((joinInfo: any) => joinInfo._attributes?.connection === "Left"));
            const rightToolID = inputs.find(input => context.connections[input]?.includes(toolID) && node.Properties?.Configuration?.JoinInfo?.some((joinInfo: any) => joinInfo._attributes?.connection === "Right"));
            const leftDF = context.dataFrames[leftToolID];
            const rightDF = context.dataFrames[rightToolID];
            if (leftDF && rightDF) {
                return joinHandler(node, leftDF, rightDF, outputDF, toolID, context);
            } else {
                console.warn(`Missing dataframes for Join node ${toolID}`);
            }
        } else {
            console.warn(`Incorrect number of inputs for Join node ${toolID}: ${inputs.length}`);
        }
        return "";
      },
      "Summarize": summarizeHandler,
      "DbFileOutput": dbFileOutputHandler,
      "Filter": filterHandler,
      "Formula": formulaHandler,
      "Union": unionHandler,
      "Sort": sortHandler,
      "Unique": uniqueHandler,
      "TextInput": textInputHandler,
      "Macro": macroHandler,
    };

    const defaultHandler: NodeHandler = (_node, _inputDF, outputDF) => {
      return `${outputDF} = pd.DataFrame()\n`;
    };

    const processNodes = () => {
      const inDegree: { [toolID: string]: number } = {};
      const nodeMap: { [toolID: string]: any } = {};
      nodes.forEach((node) => {
        const toolID = node?._attributes?.ToolID;
        if (toolID) {
          inDegree[toolID] = 0;
          nodeMap[toolID] = node;
        }
      });
      connectionList.forEach((conn) => {
        const dest = conn?.Destination?._attributes?.ToolID;
        if (dest && inDegree.hasOwnProperty(dest)) {
          inDegree[dest]++;
        }
      });
      const queue: string[] = Object.keys(inDegree).filter(toolID => inDegree[toolID] === 0);
      const processedOrder: string[] = [];
      const startTime = Date.now();
      const timeout = 10000; 
    
      while (queue.length > 0) {
        if (Date.now() - startTime > timeout) {
          pandasCode += "\n# Conversion timed out. Some nodes may not have been processed due to potential cycles.\n";
          break;
        }
        const currentID = queue.shift()!;
        const currentNode = nodeMap[currentID];
        processedOrder.push(currentID);
        
        let inputDF = dataFrames[currentID] || `df_tool_${currentID}`; 
        const outputDF = `df_tool_${currentID}`; 
        if (incoming[currentID] && incoming[currentID].length === 1) {
          inputDF = dataFrames[incoming[currentID][0]];
        }
        dataFrames[currentID] = outputDF;
        
        const plugin = currentNode.GuiSettings?._attributes?.Plugin || "Unknown";
        let handled = false;
        
        // Check for macro nodes first
        if (currentNode.EngineSettings?._attributes?.Macro) {
          pandasCode += macroHandler(currentNode, inputDF, outputDF);
          handled = true;
        } else {
          for (const [key, handler] of Object.entries(nodeHandlers)) {
            if (plugin.includes(key)) {
              pandasCode += handler(currentNode, inputDF, outputDF, currentID, {
                connections,
                dataFrames,
                incoming
              });
              handled = true;
              break;
            }
          }
        }
        
        if (!handled) {
          pandasCode += `# Unsupported node type for tool ${currentID} (${plugin})\n`;
          pandasCode += defaultHandler(currentNode, inputDF, outputDF);
        }
        processedNodes.add(currentID);
    
        if (connections[currentID]) {
          connections[currentID].forEach((destID) => {
            if (inDegree.hasOwnProperty(destID)) {
              inDegree[destID]--;
              if (inDegree[destID] === 0) {
                queue.push(destID);
              }
            }
          });
        }
      }
    
      const unprocessed = Object.keys(inDegree).filter(id => !processedNodes.has(id));
      if (unprocessed.length) {
        pandasCode += `\n# The following nodes could not be processed (cyclic or missing dependencies): ${unprocessed.join(", ")}\n`;
      }
    };
    
    processNodes();

    pandasCode += `\n# Available DataFrames: ${Object.values(dataFrames).join(", ")}\n`;
    return pandasCode;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-24 w-full container mx-auto px-8">
      <div>
        <h1 className="text-5xl font-extrabold text-center text-blue-800 mb-12">
          Alteryx to Pandas Converter
        </h1>
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="mb-8 border-dashed border-4 border-blue-200 p-8 rounded-lg text-center"
        >
          <label 
            htmlFor="alteryx-file" 
            className="cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 px-6 rounded-lg transition-colors">
            {xmlInput ? "Change File" : "Choose or Drop Alteryx File"}
          </label>
          <input
            id="alteryx-file"
            type="file"
            accept=".yxmd"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        {graphData && (
          <div className="mb-8">
            <div className="graph-container border border-gray-300 rounded-lg p-4 bg-white">
              <WorkflowVisualization 
                nodes={graphData.nodes}
                links={graphData.links}
              />
            </div>
          </div>
        )}
        {xmlInput.trim() && (
          <div className="mb-8">
            <button
              onClick={convertToPandas}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg transition-colors"
            >
              Convert to Python
            </button>
          </div>
        )}
        {pythonOutput && (
          <div className="mb-8">
            <textarea
              placeholder="Generated Python Pandas Code"
              value={pythonOutput}
              readOnly
              className="w-full h-96 p-6 border border-gray-300 rounded-xl resize-y bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono"
            />
            <button
              onClick={handleDownload}
              className="mt-4 w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-lg transition-colors"
            >
              Download Code
            </button>
          </div>
        )}
        {notification && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}