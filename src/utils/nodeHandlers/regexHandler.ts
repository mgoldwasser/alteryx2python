import { getArray } from '../graphUtils';

export const regexHandler = (node: any, inputDF: string, outputDF: string): string => {
  const field = node.Properties?.Configuration?.Field?._text || "";
  const regex = node.Properties?.Configuration?.RegExExpression?._attributes?.value || "";
  // Only run regex if both field and regex are provided
  if (field && regex.trim() !== "") {
    return `${outputDF} = ${inputDF}.copy()\n` +
           `${outputDF}["regex_extract"] = ${inputDF}["${field}"].str.extract(r'${regex}')\n`;
  }
  // Otherwise, do nothing and pass the dataframe unchanged
  return `${outputDF} = ${inputDF}.copy()\n`;
};
