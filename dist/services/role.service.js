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
exports.RoleService = void 0;
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const license_1 = require("../license");
const global_roles_1 = require("../permissions/global-roles");
const project_roles_1 = require("../permissions/project-roles");
const resource_roles_1 = require("../permissions/resource-roles");
const GLOBAL_SCOPE_MAP = {
    'global:owner': global_roles_1.GLOBAL_OWNER_SCOPES,
    'global:admin': global_roles_1.GLOBAL_ADMIN_SCOPES,
    'global:member': global_roles_1.GLOBAL_MEMBER_SCOPES,
};
const PROJECT_SCOPE_MAP = {
    'project:admin': project_roles_1.REGULAR_PROJECT_ADMIN_SCOPES,
    'project:personalOwner': project_roles_1.PERSONAL_PROJECT_OWNER_SCOPES,
    'project:editor': project_roles_1.PROJECT_EDITOR_SCOPES,
    'project:viewer': project_roles_1.PROJECT_VIEWER_SCOPES,
};
const CREDENTIALS_SHARING_SCOPE_MAP = {
    'credential:owner': resource_roles_1.CREDENTIALS_SHARING_OWNER_SCOPES,
    'credential:user': resource_roles_1.CREDENTIALS_SHARING_USER_SCOPES,
};
const WORKFLOW_SHARING_SCOPE_MAP = {
    'workflow:owner': resource_roles_1.WORKFLOW_SHARING_OWNER_SCOPES,
    'workflow:editor': resource_roles_1.WORKFLOW_SHARING_EDITOR_SCOPES,
};
const ALL_MAPS = {
    global: GLOBAL_SCOPE_MAP,
    project: PROJECT_SCOPE_MAP,
    credential: CREDENTIALS_SHARING_SCOPE_MAP,
    workflow: WORKFLOW_SHARING_SCOPE_MAP,
};
const COMBINED_MAP = Object.fromEntries(Object.values(ALL_MAPS).flatMap((o) => Object.entries(o)));
const ROLE_NAMES = {
    'global:owner': 'Owner',
    'global:admin': 'Admin',
    'global:member': 'Member',
    'project:personalOwner': 'Project Owner',
    'project:admin': 'Project Admin',
    'project:editor': 'Project Editor',
    'project:viewer': 'Project Viewer',
    'credential:user': 'Credential User',
    'credential:owner': 'Credential Owner',
    'workflow:owner': 'Workflow Owner',
    'workflow:editor': 'Workflow Editor',
};
let RoleService = class RoleService {
    constructor(license) {
        this.license = license;
    }
    rolesWithScope(namespace, scopes) {
        if (!Array.isArray(scopes)) {
            scopes = [scopes];
        }
        return Object.keys(ALL_MAPS[namespace]).filter((k) => {
            return scopes.every((s) => ALL_MAPS[namespace][k].includes(s));
        });
    }
    getRoles() {
        return Object.fromEntries(Object.entries(ALL_MAPS).map((e) => [e[0], Object.keys(e[1])]));
    }
    getRoleName(role) {
        return ROLE_NAMES[role];
    }
    getRoleScopes(role, filters) {
        let scopes = COMBINED_MAP[role];
        if (filters) {
            scopes = scopes.filter((s) => filters.includes(s.split(':')[0]));
        }
        return scopes;
    }
    getScopesBy(projectRoles) {
        return [...projectRoles].reduce((acc, projectRole) => {
            for (const scope of PROJECT_SCOPE_MAP[projectRole] ?? []) {
                acc.add(scope);
            }
            return acc;
        }, new Set());
    }
    addScopes(rawEntity, user, userProjectRelations) {
        const shared = rawEntity.shared;
        const entity = rawEntity;
        Object.assign(entity, {
            scopes: [],
        });
        if (shared === undefined) {
            return entity;
        }
        if (!('active' in entity) && !('type' in entity)) {
            throw new n8n_workflow_1.ApplicationError('Cannot detect if entity is a workflow or credential.');
        }
        entity.scopes = this.combineResourceScopes('active' in entity ? 'workflow' : 'credential', user, shared, userProjectRelations);
        return entity;
    }
    combineResourceScopes(type, user, shared, userProjectRelations) {
        const globalScopes = this.getRoleScopes(user.role, [type]);
        const scopesSet = new Set(globalScopes);
        for (const sharedEntity of shared) {
            const pr = userProjectRelations.find((p) => p.projectId === (sharedEntity.projectId ?? sharedEntity.project.id));
            let projectScopes = [];
            if (pr) {
                projectScopes = this.getRoleScopes(pr.role);
            }
            const resourceMask = this.getRoleScopes(sharedEntity.role);
            const mergedScopes = (0, permissions_1.combineScopes)({
                global: globalScopes,
                project: projectScopes,
            }, { sharing: resourceMask });
            mergedScopes.forEach((s) => scopesSet.add(s));
        }
        return [...scopesSet].sort();
    }
    isRoleLicensed(role) {
        switch (role) {
            case 'project:admin':
                return this.license.isProjectRoleAdminLicensed();
            case 'project:editor':
                return this.license.isProjectRoleEditorLicensed();
            case 'project:viewer':
                return this.license.isProjectRoleViewerLicensed();
            case 'global:admin':
                return this.license.isAdvancedPermissionsLicensed();
            default:
                return true;
        }
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [license_1.License])
], RoleService);
//# sourceMappingURL=role.service.js.map