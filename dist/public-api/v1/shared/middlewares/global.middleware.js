"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLicensed = exports.validLicenseWithUserQuota = exports.validCursor = exports.projectScope = exports.globalScope = void 0;
const typedi_1 = require("typedi");
const feature_not_licensed_error_1 = require("../../../../errors/feature-not-licensed.error");
const license_1 = require("../../../../license");
const check_access_1 = require("../../../../permissions/check-access");
const pagination_service_1 = require("../services/pagination.service");
const UNLIMITED_USERS_QUOTA = -1;
const buildScopeMiddleware = (scopes, resource, { globalOnly } = { globalOnly: false }) => {
    return async (req, res, next) => {
        const params = {};
        if (req.params.id) {
            if (resource === 'workflow') {
                params.workflowId = req.params.id;
            }
            else if (resource === 'credential') {
                params.credentialId = req.params.id;
            }
        }
        if (!(await (0, check_access_1.userHasScopes)(req.user, scopes, globalOnly, params))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
};
const globalScope = (scopes) => buildScopeMiddleware(Array.isArray(scopes) ? scopes : [scopes], undefined, { globalOnly: true });
exports.globalScope = globalScope;
const projectScope = (scopes, resource) => buildScopeMiddleware(Array.isArray(scopes) ? scopes : [scopes], resource, { globalOnly: false });
exports.projectScope = projectScope;
const validCursor = (req, res, next) => {
    if (req.query.cursor) {
        const { cursor } = req.query;
        try {
            const paginationData = (0, pagination_service_1.decodeCursor)(cursor);
            if ('offset' in paginationData) {
                req.query.offset = paginationData.offset;
                req.query.limit = paginationData.limit;
            }
            else {
                req.query.lastId = paginationData.lastId;
                req.query.limit = paginationData.limit;
            }
        }
        catch (error) {
            return res.status(400).json({
                message: 'An invalid cursor was provided',
            });
        }
    }
    return next();
};
exports.validCursor = validCursor;
const validLicenseWithUserQuota = (_, res, next) => {
    const license = typedi_1.Container.get(license_1.License);
    if (license.getUsersLimit() !== UNLIMITED_USERS_QUOTA) {
        return res.status(403).json({
            message: '/users path can only be used with a valid license. See https://n8n.io/pricing/',
        });
    }
    return next();
};
exports.validLicenseWithUserQuota = validLicenseWithUserQuota;
const isLicensed = (feature) => {
    return async (_, res, next) => {
        if (typedi_1.Container.get(license_1.License).isFeatureEnabled(feature))
            return next();
        return res.status(403).json({ message: new feature_not_licensed_error_1.FeatureNotLicensedError(feature).message });
    };
};
exports.isLicensed = isLicensed;
//# sourceMappingURL=global.middleware.js.map