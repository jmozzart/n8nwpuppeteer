import { BaseCommand } from '../base-command';
export declare class LicenseInfoCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
}
