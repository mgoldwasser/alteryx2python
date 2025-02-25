import { getArray } from '../graphUtils';

export const unionHandler = (node: any, _inputDF: string, outputDF: string, toolID?: string): string => {
  const originConnections = toolID ? getArray(connections[toolID]) : [];
  if (originConnections.length > 1) {
    const dfs = originConnections.map(id => dataFrames[id] || `df_${id}`);
    return `${outputDF} = pd.concat([${dfs.join(", ")}], ignore_index=True)\n`;
  }
  return "";
};
