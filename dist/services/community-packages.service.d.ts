import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { type PublicInstalledPackage } from 'n8n-workflow';
import type { InstalledPackages } from '../databases/entities/installed-packages';
import { InstalledPackagesRepository } from '../databases/repositories/installed-packages.repository';
import type { CommunityPackages } from '../interfaces';
import { License } from '../license';
import { LoadNodesAndCredentials } from '../load-nodes-and-credentials';
import { Logger } from '../logging/logger.service';
import { Publisher } from '../scaling/pubsub/publisher.service';
export declare class CommunityPackagesService {
    private readonly instanceSettings;
    private readonly logger;
    private readonly installedPackageRepository;
    private readonly loadNodesAndCredentials;
    private readonly publisher;
    private readonly license;
    private readonly globalConfig;
    reinstallMissingPackages: boolean;
    missingPackages: string[];
    constructor(instanceSettings: InstanceSettings, logger: Logger, installedPackageRepository: InstalledPackagesRepository, loadNodesAndCredentials: LoadNodesAndCredentials, publisher: Publisher, license: License, globalConfig: GlobalConfig);
    get hasMissingPackages(): boolean;
    findInstalledPackage(packageName: string): Promise<InstalledPackages | null>;
    isPackageInstalled(packageName: string): Promise<boolean>;
    getAllInstalledPackages(): Promise<InstalledPackages[]>;
    private removePackageFromDatabase;
    private persistInstalledPackage;
    parseNpmPackageName(rawString?: string): CommunityPackages.ParsedPackageName;
    executeNpmCommand(command: string, options?: {
        doNotHandleError?: boolean;
    }): Promise<string>;
    matchPackagesWithUpdates(packages: InstalledPackages[], updates?: CommunityPackages.AvailableUpdates): InstalledPackages[] | PublicInstalledPackage[];
    matchMissingPackages(installedPackages: PublicInstalledPackage[]): PublicInstalledPackage[];
    checkNpmPackageStatus(packageName: string): Promise<CommunityPackages.PackageStatusCheck | {
        status: string;
    }>;
    hasPackageLoaded(packageName: string): boolean;
    removePackageFromMissingList(packageName: string): void;
    checkForMissingPackages(): Promise<void>;
    installPackage(packageName: string, version?: string): Promise<InstalledPackages>;
    updatePackage(packageName: string, installedPackage: InstalledPackages): Promise<InstalledPackages>;
    removePackage(packageName: string, installedPackage: InstalledPackages): Promise<void>;
    private getNpmRegistry;
    private installOrUpdatePackage;
    installOrUpdateNpmPackage(packageName: string, packageVersion: string): Promise<void>;
    removeNpmPackage(packageName: string): Promise<void>;
}
