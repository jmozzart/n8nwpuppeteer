"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceControlLicensedMiddleware = exports.sourceControlLicensedAndEnabledMiddleware = void 0;
const typedi_1 = require("typedi");
const source_control_helper_ee_1 = require("../source-control-helper.ee");
const source_control_preferences_service_ee_1 = require("../source-control-preferences.service.ee");
const sourceControlLicensedAndEnabledMiddleware = (_req, res, next) => {
    const sourceControlPreferencesService = typedi_1.Container.get(source_control_preferences_service_ee_1.SourceControlPreferencesService);
    if (sourceControlPreferencesService.isSourceControlLicensedAndEnabled()) {
        next();
    }
    else {
        if (!sourceControlPreferencesService.isSourceControlConnected()) {
            res.status(412).json({
                status: 'error',
                message: 'source_control_not_connected',
            });
        }
        else {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
    }
};
exports.sourceControlLicensedAndEnabledMiddleware = sourceControlLicensedAndEnabledMiddleware;
const sourceControlLicensedMiddleware = (_req, res, next) => {
    if ((0, source_control_helper_ee_1.isSourceControlLicensed)()) {
        next();
    }
    else {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};
exports.sourceControlLicensedMiddleware = sourceControlLicensedMiddleware;
//# sourceMappingURL=source-control-enabled-middleware.ee.js.map