export const filterHandler = (node: any, inputDF: string, outputDF: string): string => {
  const condition = node.Properties?.Configuration?.FilterExpression?._text;
  return condition ? `${outputDF} = ${inputDF}.query(r'${condition}')\n` : "";
};
