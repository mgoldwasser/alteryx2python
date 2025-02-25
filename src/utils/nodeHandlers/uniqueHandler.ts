export const uniqueHandler = (node: any, inputDF: string, outputDF: string): string => {
  const subset = node.Properties?.Configuration?.UniqueField?._text;
  return subset ? `${outputDF} = ${inputDF}.drop_duplicates(subset=["${subset}"])\n` : "";
};
