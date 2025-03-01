"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadNodesAndCredentials = void 0;
const config_1 = require("@n8n/config");
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const typedi_1 = require("typedi");
const constants_1 = require("./constants");
const logger_service_1 = require("./logging/logger.service");
const path_util_1 = require("./utils/path-util");
let LoadNodesAndCredentials = class LoadNodesAndCredentials {
    constructor(logger, instanceSettings, globalConfig) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.globalConfig = globalConfig;
        this.known = { nodes: {}, credentials: {} };
        this.loaded = { nodes: {}, credentials: {} };
        this.types = { nodes: [], credentials: [] };
        this.loaders = {};
        this.excludeNodes = this.globalConfig.nodes.exclude;
        this.includeNodes = this.globalConfig.nodes.include;
        this.postProcessors = [];
    }
    async init() {
        if (constants_1.inTest)
            throw new n8n_workflow_1.ApplicationError('Not available in tests');
        const delimiter = process.platform === 'win32' ? ';' : ':';
        process.env.NODE_PATH = module.paths.join(delimiter);
        module.constructor._initPaths();
        if (!constants_1.inE2ETests) {
            this.excludeNodes = this.excludeNodes ?? [];
            this.excludeNodes.push('n8n-nodes-base.e2eTest');
        }
        const basePathsToScan = [
            path_1.default.join(constants_1.CLI_DIR, '..'),
            path_1.default.join(constants_1.CLI_DIR, 'node_modules'),
        ];
        for (const nodeModulesDir of basePathsToScan) {
            await this.loadNodesFromNodeModules(nodeModulesDir, 'n8n-nodes-base');
            await this.loadNodesFromNodeModules(nodeModulesDir, '@n8n/n8n-nodes-langchain');
        }
        await this.loadNodesFromNodeModules(path_1.default.join(this.instanceSettings.nodesDownloadDir, 'node_modules'));
        await this.loadNodesFromCustomDirectories();
        await this.postProcessLoaders();
    }
    addPostProcessor(fn) {
        this.postProcessors.push(fn);
    }
    isKnownNode(type) {
        return type in this.known.nodes;
    }
    get loadedCredentials() {
        return this.loaded.credentials;
    }
    get loadedNodes() {
        return this.loaded.nodes;
    }
    get knownCredentials() {
        return this.known.credentials;
    }
    get knownNodes() {
        return this.known.nodes;
    }
    async loadNodesFromNodeModules(nodeModulesDir, packageName) {
        const globOptions = {
            cwd: nodeModulesDir,
            onlyDirectories: true,
            deep: 1,
        };
        const installedPackagePaths = packageName
            ? await (0, fast_glob_1.default)(packageName, globOptions)
            : [
                ...(await (0, fast_glob_1.default)('n8n-nodes-*', globOptions)),
                ...(await (0, fast_glob_1.default)('@*/n8n-nodes-*', { ...globOptions, deep: 2 })),
            ];
        for (const packagePath of installedPackagePaths) {
            try {
                await this.runDirectoryLoader(n8n_core_1.LazyPackageDirectoryLoader, path_1.default.join(nodeModulesDir, packagePath));
            }
            catch (error) {
                this.logger.error(error.message);
                n8n_workflow_1.ErrorReporterProxy.error(error);
            }
        }
    }
    resolveIcon(packageName, url) {
        const loader = this.loaders[packageName];
        if (!loader) {
            return undefined;
        }
        const pathPrefix = `/icons/${packageName}/`;
        const filePath = path_1.default.resolve(loader.directory, url.substring(pathPrefix.length));
        return (0, path_util_1.isContainedWithin)(loader.directory, filePath) ? filePath : undefined;
    }
    getCustomDirectories() {
        const customDirectories = [this.instanceSettings.customExtensionDir];
        if (process.env[n8n_core_1.CUSTOM_EXTENSION_ENV] !== undefined) {
            const customExtensionFolders = process.env[n8n_core_1.CUSTOM_EXTENSION_ENV].split(';');
            customDirectories.push(...customExtensionFolders);
        }
        return customDirectories;
    }
    async loadNodesFromCustomDirectories() {
        for (const directory of this.getCustomDirectories()) {
            await this.runDirectoryLoader(n8n_core_1.CustomDirectoryLoader, directory);
        }
    }
    async loadPackage(packageName) {
        const finalNodeUnpackedPath = path_1.default.join(this.instanceSettings.nodesDownloadDir, 'node_modules', packageName);
        return await this.runDirectoryLoader(n8n_core_1.PackageDirectoryLoader, finalNodeUnpackedPath);
    }
    async unloadPackage(packageName) {
        if (packageName in this.loaders) {
            this.loaders[packageName].reset();
            delete this.loaders[packageName];
        }
    }
    supportsProxyAuth(description) {
        if (!description.credentials)
            return false;
        return description.credentials.some(({ name }) => {
            const credType = this.types.credentials.find((t) => t.name === name);
            if (!credType) {
                this.logger.warn(`Failed to load Custom API options for the node "${description.name}": Unknown credential name "${name}"`);
                return false;
            }
            if (credType.authenticate !== undefined)
                return true;
            return (Array.isArray(credType.extends) &&
                credType.extends.some((parentType) => ['oAuth2Api', 'googleOAuth2Api', 'oAuth1Api'].includes(parentType)));
        });
    }
    injectCustomApiCallOptions() {
        this.types.nodes.forEach((node) => {
            const isLatestVersion = node.defaultVersion === undefined || node.defaultVersion === node.version;
            if (isLatestVersion) {
                if (!this.supportsProxyAuth(node))
                    return;
                node.properties.forEach((p) => {
                    if (['resource', 'operation'].includes(p.name) &&
                        Array.isArray(p.options) &&
                        p.options[p.options.length - 1].name !== constants_1.CUSTOM_API_CALL_NAME) {
                        p.options.push({
                            name: constants_1.CUSTOM_API_CALL_NAME,
                            value: constants_1.CUSTOM_API_CALL_KEY,
                        });
                    }
                });
            }
        });
    }
    async runDirectoryLoader(constructor, dir) {
        const loader = new constructor(dir, this.excludeNodes, this.includeNodes);
        if (loader instanceof n8n_core_1.PackageDirectoryLoader && loader.packageName in this.loaders) {
            throw new n8n_workflow_1.ApplicationError(picocolors_1.default.red(`nodes package ${loader.packageName} is already loaded.\n Please delete this second copy at path ${dir}`));
        }
        await loader.loadAll();
        this.loaders[loader.packageName] = loader;
        return loader;
    }
    createAiTools() {
        const usableNodes = this.types.nodes.filter((nodetype) => nodetype.usableAsTool === true);
        for (const usableNode of usableNodes) {
            const description = structuredClone(usableNode);
            const wrapped = n8n_workflow_1.NodeHelpers.convertNodeToAiTool({ description }).description;
            this.types.nodes.push(wrapped);
            this.known.nodes[wrapped.name] = structuredClone(this.known.nodes[usableNode.name]);
            const credentialNames = Object.entries(this.known.credentials)
                .filter(([_, credential]) => credential?.supportedNodes?.includes(usableNode.name))
                .map(([credentialName]) => credentialName);
            credentialNames.forEach((name) => this.known.credentials[name]?.supportedNodes?.push(wrapped.name));
        }
    }
    async postProcessLoaders() {
        this.known = { nodes: {}, credentials: {} };
        this.loaded = { nodes: {}, credentials: {} };
        this.types = { nodes: [], credentials: [] };
        for (const loader of Object.values(this.loaders)) {
            const { known, types, directory } = loader;
            this.types.nodes = this.types.nodes.concat(types.nodes);
            this.types.credentials = this.types.credentials.concat(types.credentials);
            for (const nodeTypeName in loader.nodeTypes) {
                this.loaded.nodes[nodeTypeName] = loader.nodeTypes[nodeTypeName];
            }
            for (const credentialTypeName in loader.credentialTypes) {
                this.loaded.credentials[credentialTypeName] = loader.credentialTypes[credentialTypeName];
            }
            for (const type in known.nodes) {
                const { className, sourcePath } = known.nodes[type];
                this.known.nodes[type] = {
                    className,
                    sourcePath: path_1.default.join(directory, sourcePath),
                };
            }
            for (const type in known.credentials) {
                const { className, sourcePath, supportedNodes, extends: extendsArr, } = known.credentials[type];
                this.known.credentials[type] = {
                    className,
                    sourcePath: path_1.default.join(directory, sourcePath),
                    supportedNodes: loader instanceof n8n_core_1.PackageDirectoryLoader
                        ? supportedNodes?.map((nodeName) => `${loader.packageName}.${nodeName}`)
                        : undefined,
                    extends: extendsArr,
                };
            }
        }
        this.createAiTools();
        this.injectCustomApiCallOptions();
        for (const postProcessor of this.postProcessors) {
            await postProcessor();
        }
    }
    async setupHotReload() {
        const { default: debounce } = await Promise.resolve().then(() => __importStar(require('lodash/debounce')));
        const { watch } = await Promise.resolve().then(() => __importStar(require('chokidar')));
        const { Push } = await Promise.resolve().then(() => __importStar(require('./push')));
        const push = typedi_1.Container.get(Push);
        Object.values(this.loaders).forEach(async (loader) => {
            try {
                await promises_1.default.access(loader.directory);
            }
            catch {
                return;
            }
            const realModulePath = path_1.default.join(await promises_1.default.realpath(loader.directory), path_1.default.sep);
            const reloader = debounce(async () => {
                const modulesToUnload = Object.keys(require.cache).filter((filePath) => filePath.startsWith(realModulePath));
                modulesToUnload.forEach((filePath) => {
                    delete require.cache[filePath];
                });
                loader.reset();
                await loader.loadAll();
                await this.postProcessLoaders();
                push.broadcast('nodeDescriptionUpdated', {});
            }, 100);
            const toWatch = loader.isLazyLoaded
                ? ['**/nodes.json', '**/credentials.json']
                : ['**/*.js', '**/*.json'];
            const files = await (0, fast_glob_1.default)(toWatch, {
                cwd: realModulePath,
                ignore: ['node_modules/**'],
            });
            const watcher = watch(files, {
                cwd: realModulePath,
                ignoreInitial: true,
            });
            watcher.on('add', reloader).on('change', reloader).on('unlink', reloader);
        });
    }
};
exports.LoadNodesAndCredentials = LoadNodesAndCredentials;
exports.LoadNodesAndCredentials = LoadNodesAndCredentials = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        n8n_core_1.InstanceSettings,
        config_1.GlobalConfig])
], LoadNodesAndCredentials);
//# sourceMappingURL=load-nodes-and-credentials.js.map