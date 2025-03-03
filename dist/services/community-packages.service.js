"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityPackagesService = void 0;
const config_1 = require("@n8n/config");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const util_1 = require("util");
const constants_1 = require("../constants");
const installed_packages_repository_1 = require("../databases/repositories/installed-packages.repository");
const feature_not_licensed_error_1 = require("../errors/feature-not-licensed.error");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const logger_service_1 = require("../logging/logger.service");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const utils_1 = require("../utils");
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const { PACKAGE_NAME_NOT_PROVIDED, DISK_IS_FULL, PACKAGE_FAILED_TO_INSTALL, PACKAGE_VERSION_NOT_FOUND, PACKAGE_NOT_FOUND, } = constants_1.RESPONSE_ERROR_MESSAGES;
const { NPM_PACKAGE_NOT_FOUND_ERROR, NPM_NO_VERSION_AVAILABLE, NPM_DISK_NO_SPACE, NPM_DISK_INSUFFICIENT_SPACE, NPM_PACKAGE_VERSION_NOT_FOUND_ERROR, } = constants_1.NPM_COMMAND_TOKENS;
const asyncExec = (0, util_1.promisify)(child_process_1.exec);
const INVALID_OR_SUSPICIOUS_PACKAGE_NAME = /[^0-9a-z@\-./]/;
let CommunityPackagesService = class CommunityPackagesService {
    constructor(instanceSettings, logger, installedPackageRepository, loadNodesAndCredentials, publisher, license, globalConfig) {
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.installedPackageRepository = installedPackageRepository;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.publisher = publisher;
        this.license = license;
        this.globalConfig = globalConfig;
        this.reinstallMissingPackages = false;
        this.missingPackages = [];
    }
    get hasMissingPackages() {
        return this.missingPackages.length > 0;
    }
    async findInstalledPackage(packageName) {
        return await this.installedPackageRepository.findOne({
            where: { packageName },
            relations: ['installedNodes'],
        });
    }
    async isPackageInstalled(packageName) {
        return await this.installedPackageRepository.exist({ where: { packageName } });
    }
    async getAllInstalledPackages() {
        return await this.installedPackageRepository.find({ relations: ['installedNodes'] });
    }
    async removePackageFromDatabase(packageName) {
        return await this.installedPackageRepository.remove(packageName);
    }
    async persistInstalledPackage(packageLoader) {
        try {
            return await this.installedPackageRepository.saveInstalledPackageWithNodes(packageLoader);
        }
        catch (maybeError) {
            const error = (0, utils_1.toError)(maybeError);
            this.logger.error('Failed to save installed packages and nodes', {
                error,
                packageName: packageLoader.packageJson.name,
            });
            throw error;
        }
    }
    parseNpmPackageName(rawString) {
        if (!rawString)
            throw new n8n_workflow_1.ApplicationError(PACKAGE_NAME_NOT_PROVIDED);
        if (INVALID_OR_SUSPICIOUS_PACKAGE_NAME.test(rawString)) {
            throw new n8n_workflow_1.ApplicationError('Package name must be a single word');
        }
        const scope = rawString.includes('/') ? rawString.split('/')[0] : undefined;
        const packageNameWithoutScope = scope ? rawString.replace(`${scope}/`, '') : rawString;
        if (!packageNameWithoutScope.startsWith(constants_1.NODE_PACKAGE_PREFIX)) {
            throw new n8n_workflow_1.ApplicationError(`Package name must start with ${constants_1.NODE_PACKAGE_PREFIX}`);
        }
        const version = packageNameWithoutScope.includes('@')
            ? packageNameWithoutScope.split('@')[1]
            : undefined;
        const packageName = version ? rawString.replace(`@${version}`, '') : rawString;
        return { packageName, scope, version, rawString };
    }
    async executeNpmCommand(command, options) {
        const downloadFolder = this.instanceSettings.nodesDownloadDir;
        const execOptions = {
            cwd: downloadFolder,
            env: {
                NODE_PATH: process.env.NODE_PATH,
                PATH: process.env.PATH,
                APPDATA: process.env.APPDATA,
            },
        };
        try {
            await (0, promises_1.access)(downloadFolder);
        }
        catch {
            await (0, promises_1.mkdir)(downloadFolder);
            await asyncExec('npm init -y', execOptions);
        }
        try {
            const commandResult = await asyncExec(command, execOptions);
            return commandResult.stdout;
        }
        catch (error) {
            if (options?.doNotHandleError)
                throw error;
            const errorMessage = error instanceof Error ? error.message : constants_1.UNKNOWN_FAILURE_REASON;
            const map = {
                [NPM_PACKAGE_NOT_FOUND_ERROR]: PACKAGE_NOT_FOUND,
                [NPM_NO_VERSION_AVAILABLE]: PACKAGE_NOT_FOUND,
                [NPM_PACKAGE_VERSION_NOT_FOUND_ERROR]: PACKAGE_VERSION_NOT_FOUND,
                [NPM_DISK_NO_SPACE]: DISK_IS_FULL,
                [NPM_DISK_INSUFFICIENT_SPACE]: DISK_IS_FULL,
            };
            Object.entries(map).forEach(([npmMessage, n8nMessage]) => {
                if (errorMessage.includes(npmMessage))
                    throw new n8n_workflow_1.ApplicationError(n8nMessage);
            });
            this.logger.warn('npm command failed', { errorMessage });
            throw new n8n_workflow_1.ApplicationError(PACKAGE_FAILED_TO_INSTALL);
        }
    }
    matchPackagesWithUpdates(packages, updates) {
        if (!updates)
            return packages;
        return packages.reduce((acc, cur) => {
            const publicPackage = { ...cur };
            const update = updates[cur.packageName];
            if (update)
                publicPackage.updateAvailable = update.latest;
            acc.push(publicPackage);
            return acc;
        }, []);
    }
    matchMissingPackages(installedPackages) {
        const missingPackagesList = this.missingPackages
            .map((name) => {
            try {
                const parsedPackageData = this.parseNpmPackageName(name);
                return parsedPackageData.packageName;
            }
            catch {
                return;
            }
        })
            .filter((i) => i !== undefined);
        const hydratedPackageList = [];
        installedPackages.forEach((installedPackage) => {
            const hydratedInstalledPackage = { ...installedPackage };
            if (missingPackagesList.includes(hydratedInstalledPackage.packageName)) {
                hydratedInstalledPackage.failedLoading = true;
            }
            hydratedPackageList.push(hydratedInstalledPackage);
        });
        return hydratedPackageList;
    }
    async checkNpmPackageStatus(packageName) {
        const N8N_BACKEND_SERVICE_URL = 'https://api.n8n.io/api/package';
        try {
            const response = await axios_1.default.post(N8N_BACKEND_SERVICE_URL, { name: packageName }, { method: 'POST' });
            if (response.data.status !== constants_1.NPM_PACKAGE_STATUS_GOOD)
                return response.data;
        }
        catch {
        }
        return { status: constants_1.NPM_PACKAGE_STATUS_GOOD };
    }
    hasPackageLoaded(packageName) {
        if (!this.missingPackages.length)
            return true;
        return !this.missingPackages.some((packageNameAndVersion) => packageNameAndVersion.startsWith(packageName) &&
            packageNameAndVersion.replace(packageName, '').startsWith('@'));
    }
    removePackageFromMissingList(packageName) {
        try {
            this.missingPackages = this.missingPackages.filter((packageNameAndVersion) => !packageNameAndVersion.startsWith(packageName) ||
                !packageNameAndVersion.replace(packageName, '').startsWith('@'));
        }
        catch {
        }
    }
    async checkForMissingPackages() {
        const installedPackages = await this.getAllInstalledPackages();
        const missingPackages = new Set();
        installedPackages.forEach((installedPackage) => {
            installedPackage.installedNodes.forEach((installedNode) => {
                if (!this.loadNodesAndCredentials.isKnownNode(installedNode.type)) {
                    missingPackages.add({
                        packageName: installedPackage.packageName,
                        version: installedPackage.installedVersion,
                    });
                }
            });
        });
        this.missingPackages = [];
        if (missingPackages.size === 0)
            return;
        const { reinstallMissing } = this.globalConfig.nodes.communityPackages;
        if (reinstallMissing) {
            this.logger.info('Attempting to reinstall missing packages', { missingPackages });
            try {
                for (const missingPackage of missingPackages) {
                    await this.installPackage(missingPackage.packageName, missingPackage.version);
                    missingPackages.delete(missingPackage);
                }
                this.logger.info('Packages reinstalled successfully. Resuming regular initialization.');
                await this.loadNodesAndCredentials.postProcessLoaders();
            }
            catch (error) {
                this.logger.error('n8n was unable to install the missing packages.');
            }
        }
        else {
            this.logger.warn('n8n detected that some packages are missing. For more information, visit https://docs.n8n.io/integrations/community-nodes/troubleshooting/');
        }
        this.missingPackages = [...missingPackages].map((missingPackage) => `${missingPackage.packageName}@${missingPackage.version}`);
    }
    async installPackage(packageName, version) {
        return await this.installOrUpdatePackage(packageName, { version });
    }
    async updatePackage(packageName, installedPackage) {
        return await this.installOrUpdatePackage(packageName, { installedPackage });
    }
    async removePackage(packageName, installedPackage) {
        await this.removeNpmPackage(packageName);
        await this.removePackageFromDatabase(installedPackage);
        void this.publisher.publishCommand({
            command: 'community-package-uninstall',
            payload: { packageName },
        });
    }
    getNpmRegistry() {
        const { registry } = this.globalConfig.nodes.communityPackages;
        if (registry !== DEFAULT_REGISTRY && !this.license.isCustomNpmRegistryEnabled()) {
            throw new feature_not_licensed_error_1.FeatureNotLicensedError(constants_1.LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY);
        }
        return registry;
    }
    async installOrUpdatePackage(packageName, options) {
        const isUpdate = 'installedPackage' in options;
        const packageVersion = isUpdate || !options.version ? 'latest' : options.version;
        const command = `npm install ${packageName}@${packageVersion} --registry=${this.getNpmRegistry()}`;
        try {
            await this.executeNpmCommand(command);
        }
        catch (error) {
            if (error instanceof Error && error.message === constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_NOT_FOUND) {
                throw new n8n_workflow_1.ApplicationError('npm package not found', { extra: { packageName } });
            }
            throw error;
        }
        let loader;
        try {
            await this.loadNodesAndCredentials.unloadPackage(packageName);
            loader = await this.loadNodesAndCredentials.loadPackage(packageName);
        }
        catch (error) {
            try {
                await this.executeNpmCommand(`npm remove ${packageName}`);
            }
            catch { }
            throw new n8n_workflow_1.ApplicationError(constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_LOADING_FAILED, { cause: error });
        }
        if (loader.loadedNodes.length > 0) {
            try {
                if (isUpdate) {
                    await this.removePackageFromDatabase(options.installedPackage);
                }
                const installedPackage = await this.persistInstalledPackage(loader);
                void this.publisher.publishCommand({
                    command: isUpdate ? 'community-package-update' : 'community-package-install',
                    payload: { packageName, packageVersion },
                });
                await this.loadNodesAndCredentials.postProcessLoaders();
                this.logger.info(`Community package installed: ${packageName}`);
                return installedPackage;
            }
            catch (error) {
                throw new n8n_workflow_1.ApplicationError('Failed to save installed package', {
                    extra: { packageName },
                    cause: error,
                });
            }
        }
        else {
            try {
                await this.executeNpmCommand(`npm remove ${packageName}`);
            }
            catch { }
            throw new n8n_workflow_1.ApplicationError(constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_DOES_NOT_CONTAIN_NODES);
        }
    }
    async installOrUpdateNpmPackage(packageName, packageVersion) {
        await this.executeNpmCommand(`npm install ${packageName}@${packageVersion} --registry=${this.getNpmRegistry()}`);
        await this.loadNodesAndCredentials.loadPackage(packageName);
        await this.loadNodesAndCredentials.postProcessLoaders();
        this.logger.info(`Community package installed: ${packageName}`);
    }
    async removeNpmPackage(packageName) {
        await this.executeNpmCommand(`npm remove ${packageName}`);
        await this.loadNodesAndCredentials.unloadPackage(packageName);
        await this.loadNodesAndCredentials.postProcessLoaders();
        this.logger.info(`Community package uninstalled: ${packageName}`);
    }
};
exports.CommunityPackagesService = CommunityPackagesService;
exports.CommunityPackagesService = CommunityPackagesService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings,
        logger_service_1.Logger,
        installed_packages_repository_1.InstalledPackagesRepository,
        load_nodes_and_credentials_1.LoadNodesAndCredentials,
        publisher_service_1.Publisher,
        license_1.License,
        config_1.GlobalConfig])
], CommunityPackagesService);
//# sourceMappingURL=community-packages.service.js.map