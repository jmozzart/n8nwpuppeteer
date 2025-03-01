"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearLicenseCommand = void 0;
const typedi_1 = require("typedi");
const constants_1 = require("../../constants");
const settings_repository_1 = require("../../databases/repositories/settings.repository");
const license_1 = require("../../license");
const base_command_1 = require("../base-command");
class ClearLicenseCommand extends base_command_1.BaseCommand {
    async run() {
        this.logger.info('Clearing license from database.');
        const license = typedi_1.Container.get(license_1.License);
        await license.init();
        try {
            await license.shutdown();
        }
        catch {
            this.logger.info('License shutdown failed. Continuing with clearing license from database.');
        }
        await typedi_1.Container.get(settings_repository_1.SettingsRepository).delete({
            key: constants_1.SETTINGS_LICENSE_CERT_KEY,
        });
        this.logger.info('Done. Restart n8n to take effect.');
    }
    async catch(error) {
        this.logger.error('Error updating database. See log messages for details.');
        this.logger.error('\nGOT ERROR');
        this.logger.info('====================================');
        this.logger.error(error.message);
        this.logger.error(error.stack);
    }
}
exports.ClearLicenseCommand = ClearLicenseCommand;
ClearLicenseCommand.description = 'Clear license';
ClearLicenseCommand.examples = ['$ n8n clear:license'];
//# sourceMappingURL=clear.js.map