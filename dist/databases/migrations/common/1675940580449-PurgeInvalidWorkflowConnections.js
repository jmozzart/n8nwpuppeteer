"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurgeInvalidWorkflowConnections1675940580449 = void 0;
class PurgeInvalidWorkflowConnections1675940580449 {
    async up({ escape, parseJson, runQuery, nodeTypes }) {
        const workflowsTable = escape.tableName('workflow_entity');
        const workflows = await runQuery(`SELECT id, nodes, connections FROM ${workflowsTable}`);
        await Promise.all(workflows.map(async (workflow) => {
            const connections = parseJson(workflow.connections);
            const nodes = parseJson(workflow.nodes);
            const nodesThatCannotReceiveInput = nodes.reduce((acc, node) => {
                try {
                    const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
                    if ((nodeType.description.inputs?.length ?? []) === 0) {
                        acc.push(node.name);
                    }
                }
                catch (error) { }
                return acc;
            }, []);
            Object.keys(connections).forEach((sourceNodeName) => {
                const connection = connections[sourceNodeName];
                const outputs = Object.keys(connection);
                outputs.forEach((outputConnectionName) => {
                    const outputConnection = connection[outputConnectionName];
                    outputConnection.forEach((outputConnectionItem, outputConnectionItemIdx) => {
                        outputConnection[outputConnectionItemIdx] = outputConnectionItem.filter((outgoingConnections) => !nodesThatCannotReceiveInput.includes(outgoingConnections.node));
                    });
                });
            });
            return await runQuery(`UPDATE ${workflowsTable} SET connections = :connections WHERE id = :id`, {
                connections: JSON.stringify(connections),
                id: workflow.id,
            });
        }));
    }
}
exports.PurgeInvalidWorkflowConnections1675940580449 = PurgeInvalidWorkflowConnections1675940580449;
//# sourceMappingURL=1675940580449-PurgeInvalidWorkflowConnections.js.map