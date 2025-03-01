"use strict";
const typedi_1 = require("typedi");
const source_control_helper_ee_1 = require("../../../../environments/source-control/source-control-helper.ee");
const source_control_preferences_service_ee_1 = require("../../../../environments/source-control/source-control-preferences.service.ee");
const source_control_service_ee_1 = require("../../../../environments/source-control/source-control.service.ee");
const event_service_1 = require("../../../../events/event.service");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
module.exports = {
    pull: [
        (0, global_middleware_1.globalScope)('sourceControl:pull'),
        async (req, res) => {
            const sourceControlPreferencesService = typedi_1.Container.get(source_control_preferences_service_ee_1.SourceControlPreferencesService);
            if (!(0, source_control_helper_ee_1.isSourceControlLicensed)()) {
                return res
                    .status(401)
                    .json({ status: 'Error', message: 'Source Control feature is not licensed' });
            }
            if (!sourceControlPreferencesService.isSourceControlConnected()) {
                return res
                    .status(400)
                    .json({ status: 'Error', message: 'Source Control is not connected to a repository' });
            }
            try {
                const sourceControlService = typedi_1.Container.get(source_control_service_ee_1.SourceControlService);
                const result = await sourceControlService.pullWorkfolder({
                    force: req.body.force,
                    variables: req.body.variables,
                    userId: req.user.id,
                });
                if (result.statusCode === 200) {
                    typedi_1.Container.get(event_service_1.EventService).emit('source-control-user-pulled-api', {
                        ...(0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(result.statusResult),
                        forced: req.body.force ?? false,
                    });
                    return res.status(200).send(result.statusResult);
                }
                else {
                    return res.status(409).send(result.statusResult);
                }
            }
            catch (error) {
                return res.status(400).send(error.message);
            }
        },
    ],
};
//# sourceMappingURL=source-control.handler.js.map