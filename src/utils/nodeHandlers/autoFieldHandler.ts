import { getArray } from '../graphUtils';

export const autoFieldHandler = (node: any, inputDF: string, outputDF: string): string => {
  let code = `${outputDF} = ${inputDF}.copy()\n`;
  
  // Let pandas infer types automatically for all columns
  code += `${outputDF} = ${outputDF}.convert_dtypes()\n`;
  
  // Get metadata about expected types
  const metaFields = getArray(node.Properties?.MetaInfo?.RecordInfo?.Field);
  
  // Apply any specific type conversions based on metadata
  metaFields.forEach(field => {
    const name = field._attributes?.name;
    const type = field._attributes?.type?.toLowerCase();
    
    if (name && type) {
      switch(type) {
        case 'v_string':
          code += `${outputDF}["${name}"] = ${outputDF}["${name}"].astype("string")\n`;
          break;
        case 'bool':
        case 'boolean':
          code += `${outputDF}["${name}"] = ${outputDF}["${name}"].astype("boolean")\n`;
          break;
        case 'double':
          code += `${outputDF}["${name}"] = pd.to_numeric(${outputDF}["${name}"], errors='coerce')\n`;
          break;
        case 'int':
        case 'integer':
          code += `${outputDF}["${name}"] = pd.to_numeric(${outputDF}["${name}"], errors='coerce', downcast='integer')\n`;
          break;
      }
    }
  });
  
  return code;
}
