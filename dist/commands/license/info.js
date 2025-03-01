"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseInfoCommand = void 0;
const typedi_1 = require("typedi");
const license_1 = require("../../license");
const base_command_1 = require("../base-command");
class LicenseInfoCommand extends base_command_1.BaseCommand {
    async run() {
        const license = typedi_1.Container.get(license_1.License);
        await license.init();
        this.logger.info('Printing license information:\n' + license.getInfo());
    }
    async catch(error) {
        this.logger.error('\nGOT ERROR');
        this.logger.info('====================================');
        this.logger.error(error.message);
    }
}
exports.LicenseInfoCommand = LicenseInfoCommand;
LicenseInfoCommand.description = 'Print license information';
LicenseInfoCommand.examples = ['$ n8n license:info'];
//# sourceMappingURL=info.js.map