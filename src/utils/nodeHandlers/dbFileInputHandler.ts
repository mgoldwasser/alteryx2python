export const dbFileInputHandler = (node: any, _inputDF: string, outputDF: string): string => {
  const filePath = node.Properties?.Configuration?.File?._text;
  return filePath ? `${outputDF} = pd.read_csv(r'${filePath}')\n` : "";
};
