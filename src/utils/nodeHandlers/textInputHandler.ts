import { getArray } from '../graphUtils';

export const textInputHandler = (node: any, _inputDF: string, outputDF: string): string => {
  const fields = getArray(node.Properties?.Configuration?.Fields?.Field);
  const records = getArray(node.Properties?.Configuration?.Data?.r);
  
  // Simple case: single field, single value
  if (fields.length === 1 && records.length === 1) {
    const fieldName = fields[0]._attributes?.name;
    const value = records[0].c?._text;
    if (fieldName && value) {
      // The value could be anything - URL, formula, string, etc.
      // Just create a DataFrame with this single value
      return `${outputDF} = pd.DataFrame({
    "${fieldName}": ["${value}"]
})\n`;
    }
  }

  // Multiple fields/records case
  const columns: { [key: string]: any[] } = {};
  fields.forEach(field => {
    const name = field._attributes?.name;
    if (name) columns[name] = [];
  });

  records.forEach(record => {
    const values = getArray(record.c);
    values.forEach((value, index) => {
      const fieldName = fields[index]?._attributes?.name;
      if (fieldName) {
        columns[fieldName].push(value._text || '');
      }
    });
  });

  const columnDefinitions = Object.entries(columns)
    .map(([name, values]) => `    "${name}": ${JSON.stringify(values)}`)
    .join(",\n");

  return `${outputDF} = pd.DataFrame({\n${columnDefinitions}\n})\n`;
};
