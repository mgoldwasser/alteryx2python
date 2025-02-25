export const dbFileOutputHandler = (node: any, inputDF: string, outputDF: string): string => {
  const filePath = node.Properties?.Configuration?.File?._text || "output.csv";
  return `${outputDF} = ${inputDF}.copy()\n` +
         `${outputDF}.to_csv(r'${filePath}', index=False)\n`;
};
