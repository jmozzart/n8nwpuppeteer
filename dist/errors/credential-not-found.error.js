"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialNotFoundError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CredentialNotFoundError extends n8n_workflow_1.ApplicationError {
    constructor(credentialId, credentialType) {
        super(`Credential with ID "${credentialId}" does not exist for type "${credentialType}".`);
        this.level = 'warning';
    }
}
exports.CredentialNotFoundError = CredentialNotFoundError;
//# sourceMappingURL=credential-not-found.error.js.map