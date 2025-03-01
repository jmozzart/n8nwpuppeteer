"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFailedExecutionFromError = generateFailedExecutionFromError;
exports.getDataLastExecutedNodeData = getDataLastExecutedNodeData;
exports.addNodeIds = addNodeIds;
exports.replaceInvalidCredentials = replaceInvalidCredentials;
exports.getExecutionStartNode = getExecutionStartNode;
exports.getVariables = getVariables;
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const credentials_repository_1 = require("./databases/repositories/credentials.repository");
const variables_service_ee_1 = require("./environments/variables/variables.service.ee");
function generateFailedExecutionFromError(mode, error, node) {
    return {
        data: {
            startData: {
                destinationNode: node.name,
                runNodeFilter: [node.name],
            },
            resultData: {
                error,
                runData: {
                    [node.name]: [
                        {
                            startTime: 0,
                            executionTime: 0,
                            error,
                            source: [],
                        },
                    ],
                },
                lastNodeExecuted: node.name,
            },
            executionData: {
                contextData: {},
                metadata: {},
                nodeExecutionStack: [
                    {
                        node,
                        data: {},
                        source: null,
                    },
                ],
                waitingExecution: {},
                waitingExecutionSource: {},
            },
        },
        finished: false,
        mode,
        startedAt: new Date(),
        stoppedAt: new Date(),
        status: 'error',
    };
}
function getDataLastExecutedNodeData(inputData) {
    const { runData, pinData = {} } = inputData.data.resultData;
    const { lastNodeExecuted } = inputData.data.resultData;
    if (lastNodeExecuted === undefined) {
        return undefined;
    }
    if (runData[lastNodeExecuted] === undefined) {
        return undefined;
    }
    const lastNodeRunData = runData[lastNodeExecuted][runData[lastNodeExecuted].length - 1];
    let lastNodePinData = pinData[lastNodeExecuted];
    if (lastNodePinData && inputData.mode === 'manual') {
        if (!Array.isArray(lastNodePinData))
            lastNodePinData = [lastNodePinData];
        const itemsPerRun = lastNodePinData.map((item, index) => {
            return { json: item, pairedItem: { item: index } };
        });
        return {
            startTime: 0,
            executionTime: 0,
            data: { main: [itemsPerRun] },
            source: lastNodeRunData.source,
        };
    }
    return lastNodeRunData;
}
function addNodeIds(workflow) {
    const { nodes } = workflow;
    if (!nodes)
        return;
    nodes.forEach((node) => {
        if (!node.id) {
            node.id = (0, uuid_1.v4)();
        }
    });
}
async function replaceInvalidCredentials(workflow) {
    const { nodes } = workflow;
    if (!nodes)
        return workflow;
    const credentialsByName = {};
    const credentialsById = {};
    for (const node of nodes) {
        if (!node.credentials || node.disabled) {
            continue;
        }
        const allNodeCredentials = Object.entries(node.credentials);
        for (const [nodeCredentialType, nodeCredentials] of allNodeCredentials) {
            if (typeof nodeCredentials === 'string' || nodeCredentials.id === null) {
                const name = typeof nodeCredentials === 'string' ? nodeCredentials : nodeCredentials.name;
                if (!credentialsByName[nodeCredentialType]) {
                    credentialsByName[nodeCredentialType] = {};
                }
                if (credentialsByName[nodeCredentialType][name] === undefined) {
                    const credentials = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).findBy({
                        name,
                        type: nodeCredentialType,
                    });
                    if (credentials?.length === 1) {
                        credentialsByName[nodeCredentialType][name] = {
                            id: credentials[0].id,
                            name: credentials[0].name,
                        };
                        node.credentials[nodeCredentialType] = credentialsByName[nodeCredentialType][name];
                        continue;
                    }
                    credentialsByName[nodeCredentialType][name] = {
                        id: null,
                        name,
                    };
                }
                else {
                    node.credentials[nodeCredentialType] = credentialsByName[nodeCredentialType][name];
                }
                continue;
            }
            if (!credentialsById[nodeCredentialType]) {
                credentialsById[nodeCredentialType] = {};
            }
            if (credentialsById[nodeCredentialType][nodeCredentials.id] === undefined) {
                const credentials = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).findOneBy({
                    id: nodeCredentials.id,
                    type: nodeCredentialType,
                });
                if (credentials) {
                    credentialsById[nodeCredentialType][nodeCredentials.id] = {
                        id: credentials.id,
                        name: credentials.name,
                    };
                    node.credentials[nodeCredentialType] =
                        credentialsById[nodeCredentialType][nodeCredentials.id];
                    continue;
                }
                const credsByName = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).findBy({
                    name: nodeCredentials.name,
                    type: nodeCredentialType,
                });
                if (credsByName?.length === 1) {
                    credentialsById[nodeCredentialType][credsByName[0].id] = {
                        id: credsByName[0].id,
                        name: credsByName[0].name,
                    };
                    node.credentials[nodeCredentialType] =
                        credentialsById[nodeCredentialType][credsByName[0].id];
                    continue;
                }
                credentialsById[nodeCredentialType][nodeCredentials.id] = nodeCredentials;
                continue;
            }
            node.credentials[nodeCredentialType] =
                credentialsById[nodeCredentialType][nodeCredentials.id];
        }
    }
    return workflow;
}
function getExecutionStartNode(data, workflow) {
    let startNode;
    if (data.startNodes?.length === 1 &&
        Object.keys(data.pinData ?? {}).includes(data.startNodes[0].name)) {
        startNode = workflow.getNode(data.startNodes[0].name) ?? undefined;
    }
    return startNode;
}
async function getVariables() {
    const variables = await typedi_1.Container.get(variables_service_ee_1.VariablesService).getAllCached();
    return Object.freeze(variables.reduce((prev, curr) => {
        prev[curr.key] = curr.value;
        return prev;
    }, {}));
}
//# sourceMappingURL=workflow-helpers.js.map