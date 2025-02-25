import { getArray } from '../graphUtils';

export const alteryxSelectHandler = (node: any, inputDF: string, outputDF: string): string => {
  let code = `${outputDF} = ${inputDF}.copy()\n`;
  const fields = getArray(node.Properties?.Configuration?.SelectFields?.SelectField);
  
  // Check if *Unknown is selected (meaning keep unspecified columns)
  const keepUnspecified = fields.some(f => 
    f._attributes?.field === "*Unknown" && f._attributes?.selected === "True"
  );

  // Get list of columns to explicitly drop
  const dropColumns = fields
    .filter(f => f._attributes?.field !== "*Unknown" && f._attributes?.selected === "False")
    .map(f => f._attributes?.field);

  if (keepUnspecified && dropColumns.length > 0) {
    // Drop specified columns, keep everything else
    code += `${outputDF} = ${outputDF}.drop(columns=${JSON.stringify(dropColumns)})\n`;
  } else {
    // Get explicitly selected columns
    const keepColumns = fields
      .filter(f => f._attributes?.field !== "*Unknown" && f._attributes?.selected === "True")
      .map(f => f._attributes?.field);
    
    if (keepColumns.length > 0) {
      code += `${outputDF} = ${outputDF}[${JSON.stringify(keepColumns)}]\n`;
    }
  }
  
  return code;
};
