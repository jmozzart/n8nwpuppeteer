"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSecretsClient = void 0;
const aws4 = __importStar(require("aws4"));
const axios_1 = __importDefault(require("axios"));
class AwsSecretsClient {
    constructor(settings) {
        this.settings = {
            region: '',
            host: '',
            url: '',
            accessKeyId: '',
            secretAccessKey: '',
        };
        const { region, accessKeyId, secretAccessKey } = settings;
        this.settings = {
            region,
            host: `secretsmanager.${region}.amazonaws.com`,
            url: `https://secretsmanager.${region}.amazonaws.com`,
            accessKeyId,
            secretAccessKey,
        };
    }
    async checkConnection() {
        try {
            await this.fetchSecretsNamesPage();
            return [true];
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            return [false, error.message];
        }
    }
    async fetchAllSecrets() {
        const secrets = [];
        const allSecretsNames = await this.fetchAllSecretsNames();
        const batches = this.batch(allSecretsNames);
        for (const batch of batches) {
            const page = await this.fetchSecretsPage(batch);
            secrets.push(...page.SecretValues.map((s) => ({ secretName: s.Name, secretValue: s.SecretString })));
        }
        return secrets;
    }
    batch(arr, size = 20) {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, index) => arr.slice(index * size, (index + 1) * size));
    }
    toRequestOptions(action, body) {
        return {
            method: 'POST',
            service: 'secretsmanager',
            region: this.settings.region,
            host: this.settings.host,
            headers: {
                'X-Amz-Target': `secretsmanager.${action}`,
                'Content-Type': 'application/x-amz-json-1.1',
            },
            body,
        };
    }
    async fetchSecretsPage(secretsNames, nextToken) {
        const body = JSON.stringify(nextToken
            ? { SecretIdList: secretsNames, NextToken: nextToken }
            : { SecretIdList: secretsNames });
        const options = this.toRequestOptions('BatchGetSecretValue', body);
        const { headers } = aws4.sign(options, this.settings);
        const config = {
            method: 'POST',
            url: this.settings.url,
            headers,
            data: body,
        };
        const response = await axios_1.default.request(config);
        return response.data;
    }
    async fetchAllSecretsNames() {
        const names = [];
        let nextToken;
        do {
            const page = await this.fetchSecretsNamesPage(nextToken);
            names.push(...page.SecretList.map((s) => s.Name));
            nextToken = page.NextToken;
        } while (nextToken);
        return names;
    }
    async fetchSecretsNamesPage(nextToken) {
        const body = JSON.stringify(nextToken ? { NextToken: nextToken } : {});
        const options = this.toRequestOptions('ListSecrets', body);
        const { headers } = aws4.sign(options, this.settings);
        const config = {
            method: 'POST',
            url: this.settings.url,
            headers,
            data: body,
        };
        const response = await axios_1.default.request(config);
        return response.data;
    }
}
exports.AwsSecretsClient = AwsSecretsClient;
//# sourceMappingURL=aws-secrets-client.js.map