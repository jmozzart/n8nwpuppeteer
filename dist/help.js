"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const typedi_1 = __importDefault(require("typedi"));
const winston_1 = require("winston");
class CustomHelp extends core_1.Help {
    async showRootHelp() {
        typedi_1.default.get(winston_1.Logger).info('You can find up to date information about the CLI here:\nhttps://docs.n8n.io/hosting/cli-commands/');
    }
}
exports.default = CustomHelp;
//# sourceMappingURL=help.js.map