export const downloadHandler = (node: any, inputDF: string, outputDF: string): string => {
  const urlField = node.Properties?.Configuration?.URLField?._text || "URL";
  return `${outputDF} = ${inputDF}.copy()\n` +
         `${outputDF}["downloaded_data"] = ${inputDF}["${urlField}"].apply(lambda url: requests.get(url).text)\n`;
};
