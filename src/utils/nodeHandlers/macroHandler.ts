export const macroHandler = (node: any, inputDF: string, outputDF: string): string => {
  const macroName = node.EngineSettings?._attributes?.Macro;
  
  if (macroName === "GreatArcs.yxmc") {
    const inputConfig = node.Properties?.Configuration?.Value;
    const mappings: {[key: string]: string} = {};
    
    // Parse the input configuration CDATA
    if (inputConfig && inputConfig[0]?._attributes?.name === "Input.Points") {
      const configText = inputConfig[0]?._cdata || "";
      configText.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          mappings[key.trim()] = value.trim();
        }
      });
    }

    // Generate great circle calculation code
    return `
# Great Circle Distance calculation
${outputDF} = ${inputDF}.copy()
${outputDF}['distance'] = np.vectorize(lambda lat1, lon1, lat2, lon2: great_circle((lat1, lon1), (lat2, lon2)).miles)(
    ${outputDF}['${mappings['LatitudeA']}'],
    ${outputDF}['${mappings['LongitudeA']}'],
    ${outputDF}['${mappings['LatitudeB']}'],
    ${outputDF}['${mappings['LongitudeB']}']
)
`;
  }
  
  return `# Unsupported macro: ${macroName}\n${outputDF} = ${inputDF}.copy()\n`;
};
