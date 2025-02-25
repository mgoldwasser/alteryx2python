import { getArray } from '../graphUtils';

export const formulaHandler = (node: any, inputDF: string, outputDF: string): string => {
  const formulas = getArray(node.Properties?.Configuration?.FormulaExpression);
  let code = `${outputDF} = ${inputDF}.copy()\n`;
  formulas.forEach(formula => {
    const newField = formula._attributes?.newField;
    const expression = formula._attributes?.expression;
    if (newField && expression) {
      code += `${outputDF}["${newField}"] = ${inputDF}.eval(r'${expression}')\n`;
    }
  });
  return code;
};
