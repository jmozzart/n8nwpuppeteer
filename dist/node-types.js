"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTypes = void 0;
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = require("path");
const typedi_1 = require("typedi");
const unrecognized_node_type_error_1 = require("./errors/unrecognized-node-type.error");
const load_nodes_and_credentials_1 = require("./load-nodes-and-credentials");
let NodeTypes = class NodeTypes {
    constructor(loadNodesAndCredentials) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        loadNodesAndCredentials.addPostProcessor(async () => this.applySpecialNodeParameters());
    }
    getWithSourcePath(nodeTypeName, version) {
        const nodeType = this.getNode(nodeTypeName);
        if (!nodeType) {
            throw new n8n_workflow_1.ApplicationError('Unknown node type', { tags: { nodeTypeName } });
        }
        const { description } = n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodeType.type, version);
        return { description: { ...description }, sourcePath: nodeType.sourcePath };
    }
    getByName(nodeType) {
        return this.getNode(nodeType).type;
    }
    getByNameAndVersion(nodeType, version) {
        const origType = nodeType;
        const toolRequested = nodeType.startsWith('n8n-nodes-base') && nodeType.endsWith('Tool');
        if (toolRequested) {
            nodeType = nodeType.replace(/Tool$/, '');
        }
        const node = this.getNode(nodeType);
        const versionedNodeType = n8n_workflow_1.NodeHelpers.getVersionedNodeType(node.type, version);
        if (!toolRequested)
            return versionedNodeType;
        if (!versionedNodeType.description.usableAsTool)
            throw new n8n_workflow_1.ApplicationError('Node cannot be used as a tool', { extra: { nodeType } });
        const { loadedNodes } = this.loadNodesAndCredentials;
        if (origType in loadedNodes) {
            return loadedNodes[origType].type;
        }
        const clonedProperties = Object.create(versionedNodeType.description.properties);
        const clonedDescription = Object.create(versionedNodeType.description, {
            properties: { value: clonedProperties },
        });
        const clonedNode = Object.create(versionedNodeType, {
            description: { value: clonedDescription },
        });
        const tool = n8n_workflow_1.NodeHelpers.convertNodeToAiTool(clonedNode);
        loadedNodes[nodeType + 'Tool'] = { sourcePath: '', type: tool };
        return tool;
    }
    applySpecialNodeParameters() {
        for (const nodeTypeData of Object.values(this.loadNodesAndCredentials.loadedNodes)) {
            const nodeType = n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodeTypeData.type);
            n8n_workflow_1.NodeHelpers.applySpecialNodeParameters(nodeType);
        }
    }
    getKnownTypes() {
        return this.loadNodesAndCredentials.knownNodes;
    }
    getNode(type) {
        const { loadedNodes, knownNodes } = this.loadNodesAndCredentials;
        if (type in loadedNodes) {
            return loadedNodes[type];
        }
        if (type in knownNodes) {
            const { className, sourcePath } = knownNodes[type];
            const loaded = (0, n8n_core_1.loadClassInIsolation)(sourcePath, className);
            n8n_workflow_1.NodeHelpers.applySpecialNodeParameters(loaded);
            loadedNodes[type] = { sourcePath, type: loaded };
            return loadedNodes[type];
        }
        throw new unrecognized_node_type_error_1.UnrecognizedNodeTypeError(type);
    }
    async getNodeTranslationPath({ nodeSourcePath, longNodeType, locale, }) {
        const nodeDir = (0, path_1.dirname)(nodeSourcePath);
        const maxVersion = await this.getMaxVersion(nodeDir);
        const nodeType = longNodeType.replace('n8n-nodes-base.', '');
        return maxVersion
            ? (0, path_1.join)(nodeDir, `v${maxVersion}`, 'translations', locale, `${nodeType}.json`)
            : (0, path_1.join)(nodeDir, 'translations', locale, `${nodeType}.json`);
    }
    async getMaxVersion(dir) {
        const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        const dirnames = entries.reduce((acc, cur) => {
            if (this.isVersionedDirname(cur))
                acc.push(cur.name);
            return acc;
        }, []);
        if (!dirnames.length)
            return null;
        return Math.max(...dirnames.map((d) => parseInt(d.charAt(1), 10)));
    }
    isVersionedDirname(dirent) {
        if (!dirent.isDirectory())
            return false;
        const ALLOWED_VERSIONED_DIRNAME_LENGTH = [2, 3];
        return (ALLOWED_VERSIONED_DIRNAME_LENGTH.includes(dirent.name.length) &&
            dirent.name.toLowerCase().startsWith('v'));
    }
    getNodeTypeDescriptions(nodeTypes) {
        return nodeTypes.map(({ name: nodeTypeName, version: nodeTypeVersion }) => {
            const nodeType = this.getNode(nodeTypeName);
            if (!nodeType)
                throw new n8n_workflow_1.ApplicationError(`Unknown node type: ${nodeTypeName}`);
            const { description } = n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodeType.type, nodeTypeVersion);
            const descriptionCopy = { ...description };
            descriptionCopy.name = descriptionCopy.name.startsWith('n8n-nodes')
                ? descriptionCopy.name
                : `n8n-nodes-base.${descriptionCopy.name}`;
            return descriptionCopy;
        });
    }
};
exports.NodeTypes = NodeTypes;
exports.NodeTypes = NodeTypes = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials])
], NodeTypes);
//# sourceMappingURL=node-types.js.map