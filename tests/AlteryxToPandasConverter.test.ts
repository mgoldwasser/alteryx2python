import { generateGraphData } from "../src/utils/graphUtils";

// Sample minimal JSON input representing an Alteryx document.
const sampleJson = {
  AlteryxDocument: {
    Nodes: {
      Node: [
        { _attributes: { ToolID: "1" }, GuiSettings: { _attributes: { Plugin: "DbFileInput" } }, Properties: { Configuration: { File: { _text: "/path/to/input.csv" } } } },
        { _attributes: { ToolID: "2" }, GuiSettings: { _attributes: { Plugin: "DbFileOutput" } }, Properties: { Configuration: { File: { _text: "/path/to/output.csv" } } } }
      ]
    },
    Connections: {
      Connection: { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "2" } } }
    }
  }
};

describe("generateGraphData", () => {
  it("should generate nodes and links from sample JSON", () => {
    const graphData = generateGraphData();
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.links).toHaveLength(1);
  });

  it("should handle different node types", () => {
    const json = {
      AlteryxDocument: {
        Nodes: {
          Node: [
            { _attributes: { ToolID: "1" }, GuiSettings: { _attributes: { Plugin: "DbFileInput" } }, Properties: { Configuration: { File: { _text: "/path/to/input.csv" } } } },
            { _attributes: { ToolID: "2" }, GuiSettings: { _attributes: { Plugin: "Filter" } }, Properties: { Configuration: { Expression: { _text: "[Value] > 10" } } } },
            { _attributes: { ToolID: "3" }, GuiSettings: { _attributes: { Plugin: "DbFileOutput" } }, Properties: { Configuration: { File: { _text: "/path/to/output.csv" } } } }
          ]
        },
        Connections: {
          Connection: [
            { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "2" } } },
            { Origin: { _attributes: { ToolID: "2" } }, Destination: { _attributes: { ToolID: "3" } } }
          ]
        }
      }
    };
    const graphData = generateGraphData(json);
    expect(graphData.nodes).toHaveLength(3);
    expect(graphData.links).toHaveLength(2);
  });

  it("should handle multiple connections", () => {
    const json = {
      AlteryxDocument: {
        Nodes: {
          Node: [
            { _attributes: { ToolID: "1" }, GuiSettings: { _attributes: { Plugin: "DbFileInput" } }, Properties: { Configuration: { File: { _text: "/path/to/input.csv" } } } },
            { _attributes: { ToolID: "2" }, GuiSettings: { _attributes: { Plugin: "DbFileOutput" } }, Properties: { Configuration: { File: { _text: "/path/to/output1.csv" } } } },
            { _attributes: { ToolID: "3" }, GuiSettings: { _attributes: { Plugin: "DbFileOutput" } }, Properties: { Configuration: { File: { _text: "/path/to/output2.csv" } } } }
          ]
        },
        Connections: {
          Connection: [
            { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "2" } } },
            { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "3" } } }
          ]
        }
      }
    };
    const graphData = generateGraphData(json);
    expect(graphData.nodes).toHaveLength(3);
    expect(graphData.links).toHaveLength(2);
  });

  it("should handle missing connections", () => {
    const json = {
      AlteryxDocument: {
        Nodes: {
          Node: [
            { _attributes: { ToolID: "1" }, GuiSettings: { _attributes: { Plugin: "DbFileInput" } }, Properties: { Configuration: { File: { _text: "/path/to/input.csv" } } } },
            { _attributes: { ToolID: "2" }, GuiSettings: { _attributes: { Plugin: "DbFileOutput" } }, Properties: { Configuration: { File: { _text: "/path/to/output.csv" } } } }
          ]
        },
        Connections: {}
      }
    };
    const graphData = generateGraphData(json);
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.links).toHaveLength(0);
  });

  it("should handle missing nodes", () => {
    const json = {
      AlteryxDocument: {
        Nodes: {},
        Connections: {
          Connection: { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "2" } } }
        }
      }
    };
    const graphData = generateGraphData(json);
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.links).toHaveLength(1);
  });

  it("should handle different data types in properties", () => {
    const json = {
      AlteryxDocument: {
        Nodes: {
          Node: [
            { _attributes: { ToolID: "1" }, GuiSettings: { _attributes: { Plugin: "Formula" } }, Properties: { Configuration: { Expression: { _text: "1 + 1" } } } },
            { _attributes: { ToolID: "2" }, GuiSettings: { _attributes: { Plugin: "Filter" } }, Properties: { Configuration: { Expression: { _text: "[Value] > 10" } } } }
          ]
        },
        Connections: {
          Connection: { Origin: { _attributes: { ToolID: "1" } }, Destination: { _attributes: { ToolID: "2" } } }
        }
      }
    };
    const graphData = generateGraphData(json);
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.links).toHaveLength(1);
  });
});
