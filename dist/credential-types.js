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
exports.CredentialTypes = void 0;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const constants_1 = require("./constants");
const load_nodes_and_credentials_1 = require("./load-nodes-and-credentials");
let CredentialTypes = class CredentialTypes {
    constructor(loadNodesAndCredentials) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
    }
    recognizes(type) {
        const { loadedCredentials, knownCredentials } = this.loadNodesAndCredentials;
        return type in knownCredentials || type in loadedCredentials;
    }
    getByName(credentialType) {
        return this.getCredential(credentialType).type;
    }
    getSupportedNodes(type) {
        return this.loadNodesAndCredentials.knownCredentials[type]?.supportedNodes ?? [];
    }
    getParentTypes(typeName) {
        const extendsArr = this.loadNodesAndCredentials.knownCredentials[typeName]?.extends ?? [];
        if (extendsArr.length) {
            extendsArr.forEach((type) => {
                extendsArr.push(...this.getParentTypes(type));
            });
        }
        return extendsArr;
    }
    getCredential(type) {
        const { loadedCredentials, knownCredentials } = this.loadNodesAndCredentials;
        if (type in loadedCredentials) {
            return loadedCredentials[type];
        }
        if (type in knownCredentials) {
            const { className, sourcePath } = knownCredentials[type];
            const loaded = (0, n8n_core_1.loadClassInIsolation)(sourcePath, className);
            loadedCredentials[type] = { sourcePath, type: loaded };
            return loadedCredentials[type];
        }
        throw new n8n_workflow_1.ApplicationError(constants_1.RESPONSE_ERROR_MESSAGES.NO_CREDENTIAL, {
            tags: { credentialType: type },
        });
    }
};
exports.CredentialTypes = CredentialTypes;
exports.CredentialTypes = CredentialTypes = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials])
], CredentialTypes);
//# sourceMappingURL=credential-types.js.map