export const sortHandler = (node: any, inputDF: string, outputDF: string): string => {
  const sortField = node.Properties?.Configuration?.SortField?._text;
  const ascending = node.Properties?.Configuration?.Ascending?._text === "True";
  return sortField ? `${outputDF} = ${inputDF}.sort_values(by="${sortField}", ascending=${ascending})\n` : "";
};
