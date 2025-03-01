import { DataSource, Repository } from '@n8n/typeorm';
import { Settings } from '../entities/settings';
export declare class SettingsRepository extends Repository<Settings> {
    constructor(dataSource: DataSource);
    getEncryptedSecretsProviderSettings(): Promise<string | null>;
    findByKey(key: string): Promise<Settings | null>;
    saveEncryptedSecretsProviderSettings(data: string): Promise<void>;
    dismissBanner({ bannerName }: {
        bannerName: string;
    }): Promise<{
        success: boolean;
    }>;
}
