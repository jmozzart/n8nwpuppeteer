"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPositiveInteger = exports.assertNever = exports.isIntegerString = exports.toError = exports.separate = exports.findCliWorkflowStart = exports.findSubworkflowStart = void 0;
exports.isWorkflowIdValid = isWorkflowIdValid;
exports.isStringArray = isStringArray;
exports.isObjectLiteral = isObjectLiteral;
exports.removeTrailingSlash = removeTrailingSlash;
exports.rightDiff = rightDiff;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("./constants");
function isWorkflowIdValid(id) {
    return typeof id === 'string' && id?.length <= 16;
}
function findWorkflowStart(executionMode) {
    return function (nodes) {
        const executeWorkflowTriggerNode = nodes.find((node) => node.type === 'n8n-nodes-base.executeWorkflowTrigger');
        if (executeWorkflowTriggerNode)
            return executeWorkflowTriggerNode;
        const startNode = nodes.find((node) => constants_1.STARTING_NODES.includes(node.type));
        if (startNode)
            return startNode;
        const title = 'Missing node to start execution';
        const description = "Please make sure the workflow you're calling contains an Execute Workflow Trigger node";
        if (executionMode === 'integrated') {
            throw new n8n_workflow_1.SubworkflowOperationError(title, description);
        }
        throw new n8n_workflow_1.CliWorkflowOperationError(title, description);
    };
}
exports.findSubworkflowStart = findWorkflowStart('integrated');
exports.findCliWorkflowStart = findWorkflowStart('cli');
const separate = (array, test) => {
    const pass = [];
    const fail = [];
    array.forEach((i) => (test(i) ? pass : fail).push(i));
    return [pass, fail];
};
exports.separate = separate;
const toError = (maybeError) => maybeError instanceof Error ? maybeError : new Error(`${maybeError}`);
exports.toError = toError;
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
const isIntegerString = (value) => /^\d+$/.test(value);
exports.isIntegerString = isIntegerString;
function isObjectLiteral(item) {
    return typeof item === 'object' && item !== null && !Array.isArray(item);
}
function removeTrailingSlash(path) {
    return path.endsWith('/') ? path.slice(0, -1) : path;
}
function rightDiff([arr1, keyExtractor1], [arr2, keyExtractor2]) {
    const keyMap = arr1.reduce((map, item) => {
        map[keyExtractor1(item)] = true;
        return map;
    }, {});
    return arr2.reduce((acc, item) => {
        if (!keyMap[keyExtractor2(item)]) {
            acc.push(item);
        }
        return acc;
    }, []);
}
const assertNever = (_value) => { };
exports.assertNever = assertNever;
const isPositiveInteger = (maybeInt) => /^[1-9]\d*$/.test(maybeInt);
exports.isPositiveInteger = isPositiveInteger;
//# sourceMappingURL=utils.js.map