import { getArray } from '../graphUtils';

export const joinHandler = (
    node: any,
    leftDF: string,
    rightDF: string,
    outputDF: string,
    toolID?: string,
    context?: {
        connections: { [key: string]: string[] };
        dataFrames: { [key: string]: string };
        incoming: { [key: string]: string[] };
    }
): string => {
    if (!toolID || !context) return "";

    const joinInfos = getArray(node.Properties?.Configuration?.JoinInfo);
    if (!joinInfos || joinInfos.length === 0) {
        console.warn(`Join node ${toolID} is missing JoinInfo configuration.`);
        return "";
    }

    const leftJoin = joinInfos.find(j => j._attributes?.connection === "Left");
    const rightJoin = joinInfos.find(j => j._attributes?.connection === "Right");

    const leftField = leftJoin?.Field?._text;
    const rightField = rightJoin?.Field?._text;

    if (!leftField || !rightField) {
        console.warn(`Join node ${toolID} is missing join field(s): leftField=${leftField}, rightField=${rightField}.`);
        return "";
    }

    // Get incoming connections
    const incoming = context.incoming[toolID] || [];
    if (!incoming || incoming.length !== 2) {
        console.warn(`Join node ${toolID} expected 2 incoming connections but got ${incoming.length}.`);
        return "";
    }

    let leftToolID: string | undefined;
    let rightToolID: string | undefined;

    // Determine left and right tool IDs based on connection type
    if (node.Properties?.Configuration) {
        const config = node.Properties.Configuration;
        const joinInfoArray = getArray(config.JoinInfo);

        joinInfoArray.forEach((joinInfo: any) => {
            if (joinInfo._attributes?.connection === "Left") {
                leftToolID = context.incoming[toolID]?.find(input => {
                    const connection = context.connections[input]?.find(connection => connection === toolID);
                    return connection;
                });
            } else if (joinInfo._attributes?.connection === "Right") {
                rightToolID = context.incoming[toolID]?.find(input => {
                    const connection = context.connections[input]?.find(connection => connection === toolID);
                    return connection;
                });
            }
        });
    }

    const leftDFName = context.dataFrames[leftToolID];
    const rightDFName = context.dataFrames[rightToolID];

    if (!leftDFName || !rightDFName) {
        console.warn(`Join node ${toolID} is missing one of the required DataFrames.`);
        return "";
    }

    // Optionally, if field selection/renaming is required add handling here…
    return `${outputDF} = pd.merge(${leftDFName}, ${rightDFName}, ` +
        `left_on="${leftField}", right_on="${rightField}", how="inner")\n`;
};
