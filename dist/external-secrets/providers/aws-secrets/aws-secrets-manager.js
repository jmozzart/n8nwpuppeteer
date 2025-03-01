"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSecretsManager = void 0;
const typedi_1 = __importDefault(require("typedi"));
const unknown_auth_type_error_1 = require("../../../errors/unknown-auth-type.error");
const constants_1 = require("../../../external-secrets/constants");
const logger_service_1 = require("../../../logging/logger.service");
const aws_secrets_client_1 = require("./aws-secrets-client");
class AwsSecretsManager {
    constructor(logger = typedi_1.default.get(logger_service_1.Logger)) {
        this.logger = logger;
        this.name = 'awsSecretsManager';
        this.displayName = 'AWS Secrets Manager';
        this.state = 'initializing';
        this.properties = [
            constants_1.DOCS_HELP_NOTICE,
            {
                displayName: 'Region',
                name: 'region',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. eu-west-3',
                noDataExpression: true,
            },
            {
                displayName: 'Authentication Method',
                name: 'authMethod',
                type: 'options',
                options: [
                    {
                        name: 'IAM User',
                        value: 'iamUser',
                        description: 'Credentials for IAM user having <code>secretsmanager:ListSecrets</code> and <code>secretsmanager:BatchGetSecretValue</code> permissions. <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html" target="_blank">Learn more</a>',
                    },
                ],
                default: 'iamUser',
                required: true,
                noDataExpression: true,
            },
            {
                displayName: 'Access Key ID',
                name: 'accessKeyId',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. ACHXUQMBAQEVTE2RKMWP',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        authMethod: ['iamUser'],
                    },
                },
            },
            {
                displayName: 'Secret Access Key',
                name: 'secretAccessKey',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. cbmjrH/xNAjPwlQR3i/1HRSDD+esQX/Lan3gcmBc',
                typeOptions: { password: true },
                noDataExpression: true,
                displayOptions: {
                    show: {
                        authMethod: ['iamUser'],
                    },
                },
            },
        ];
        this.cachedSecrets = {};
        this.logger = this.logger.scoped('external-secrets');
    }
    async init(context) {
        this.assertAuthType(context);
        this.client = new aws_secrets_client_1.AwsSecretsClient(context.settings);
        this.logger.debug('AWS Secrets Manager provider initialized');
    }
    async test() {
        return await this.client.checkConnection();
    }
    async connect() {
        const [wasSuccessful, errorMsg] = await this.test();
        this.state = wasSuccessful ? 'connected' : 'error';
        if (wasSuccessful) {
            this.logger.debug('AWS Secrets Manager provider connected');
        }
        else {
            this.logger.error('AWS Secrets Manager provider failed to connect', { errorMsg });
        }
    }
    async disconnect() {
        return;
    }
    async update() {
        const secrets = await this.client.fetchAllSecrets();
        const supportedSecrets = secrets.filter((s) => constants_1.EXTERNAL_SECRETS_NAME_REGEX.test(s.secretName));
        this.cachedSecrets = Object.fromEntries(supportedSecrets.map((s) => [s.secretName, s.secretValue]));
        this.logger.debug('AWS Secrets Manager provider secrets updated');
    }
    getSecret(name) {
        return this.cachedSecrets[name];
    }
    hasSecret(name) {
        return name in this.cachedSecrets;
    }
    getSecretNames() {
        return Object.keys(this.cachedSecrets);
    }
    assertAuthType(context) {
        if (context.settings.authMethod === 'iamUser')
            return;
        throw new unknown_auth_type_error_1.UnknownAuthTypeError(context.settings.authMethod);
    }
}
exports.AwsSecretsManager = AwsSecretsManager;
//# sourceMappingURL=aws-secrets-manager.js.map