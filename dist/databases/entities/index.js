"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = void 0;
const annotation_tag_entity_ee_1 = require("./annotation-tag-entity.ee");
const annotation_tag_mapping_ee_1 = require("./annotation-tag-mapping.ee");
const api_key_1 = require("./api-key");
const auth_identity_1 = require("./auth-identity");
const auth_provider_sync_history_1 = require("./auth-provider-sync-history");
const auth_user_1 = require("./auth-user");
const credentials_entity_1 = require("./credentials-entity");
const event_destinations_1 = require("./event-destinations");
const execution_annotation_ee_1 = require("./execution-annotation.ee");
const execution_data_1 = require("./execution-data");
const execution_entity_1 = require("./execution-entity");
const execution_metadata_1 = require("./execution-metadata");
const installed_nodes_1 = require("./installed-nodes");
const installed_packages_1 = require("./installed-packages");
const invalid_auth_token_1 = require("./invalid-auth-token");
const processed_data_1 = require("./processed-data");
const project_1 = require("./project");
const project_relation_1 = require("./project-relation");
const settings_1 = require("./settings");
const shared_credentials_1 = require("./shared-credentials");
const shared_workflow_1 = require("./shared-workflow");
const tag_entity_1 = require("./tag-entity");
const test_definition_ee_1 = require("./test-definition.ee");
const user_1 = require("./user");
const variables_1 = require("./variables");
const webhook_entity_1 = require("./webhook-entity");
const workflow_entity_1 = require("./workflow-entity");
const workflow_history_1 = require("./workflow-history");
const workflow_statistics_1 = require("./workflow-statistics");
const workflow_tag_mapping_1 = require("./workflow-tag-mapping");
exports.entities = {
    AnnotationTagEntity: annotation_tag_entity_ee_1.AnnotationTagEntity,
    AnnotationTagMapping: annotation_tag_mapping_ee_1.AnnotationTagMapping,
    AuthIdentity: auth_identity_1.AuthIdentity,
    AuthProviderSyncHistory: auth_provider_sync_history_1.AuthProviderSyncHistory,
    AuthUser: auth_user_1.AuthUser,
    CredentialsEntity: credentials_entity_1.CredentialsEntity,
    EventDestinations: event_destinations_1.EventDestinations,
    ExecutionAnnotation: execution_annotation_ee_1.ExecutionAnnotation,
    ExecutionEntity: execution_entity_1.ExecutionEntity,
    InstalledNodes: installed_nodes_1.InstalledNodes,
    InstalledPackages: installed_packages_1.InstalledPackages,
    InvalidAuthToken: invalid_auth_token_1.InvalidAuthToken,
    Settings: settings_1.Settings,
    SharedCredentials: shared_credentials_1.SharedCredentials,
    SharedWorkflow: shared_workflow_1.SharedWorkflow,
    TagEntity: tag_entity_1.TagEntity,
    User: user_1.User,
    Variables: variables_1.Variables,
    WebhookEntity: webhook_entity_1.WebhookEntity,
    WorkflowEntity: workflow_entity_1.WorkflowEntity,
    WorkflowTagMapping: workflow_tag_mapping_1.WorkflowTagMapping,
    WorkflowStatistics: workflow_statistics_1.WorkflowStatistics,
    ExecutionMetadata: execution_metadata_1.ExecutionMetadata,
    ExecutionData: execution_data_1.ExecutionData,
    WorkflowHistory: workflow_history_1.WorkflowHistory,
    Project: project_1.Project,
    ProjectRelation: project_relation_1.ProjectRelation,
    ApiKey: api_key_1.ApiKey,
    ProcessedData: processed_data_1.ProcessedData,
    TestDefinition: test_definition_ee_1.TestDefinition,
};
//# sourceMappingURL=index.js.map