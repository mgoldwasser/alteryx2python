import { getArray } from '../graphUtils';

export const summarizeHandler = (node: any, inputDF: string, outputDF: string): string => {
  let code = `${outputDF} = ${inputDF}.copy()\n`;
  const summaryFields = getArray(node.Properties?.Configuration?.SummarizeFields?.SummarizeField);
  summaryFields.forEach((field) => {
    const fieldName = field._attributes?.field.replace(/\s/g, "_");
    const action = field._attributes?.action;
    if (fieldName) {
      if (action === "Sum") {
        code += `${outputDF}["Sum_${fieldName}"] = ${outputDF}["${fieldName}"].sum()\n`;
      } else if (action === "Avg") {
        code += `${outputDF}["Avg_${fieldName}"] = ${outputDF}["${fieldName}"].mean()\n`;
      } else if (action === "Min") {
        code += `${outputDF}["Min_${fieldName}"] = ${outputDF}["${fieldName}"].min()\n`;
      } else if (action === "Max") {
        code += `${outputDF}["Max_${fieldName}"] = ${outputDF}["${fieldName}"].max()\n`;
      }
    }
  });
  return code;
};
