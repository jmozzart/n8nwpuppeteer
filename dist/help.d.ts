import { Help } from '@oclif/core';
export default class CustomHelp extends Help {
    showRootHelp(): Promise<void>;
}
