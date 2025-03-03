"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptionOverrides = void 0;
exports.getConnectionOptions = getConnectionOptions;
exports.arePostgresOptions = arePostgresOptions;
const config_1 = require("@n8n/config");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const typedi_1 = require("typedi");
const entities_1 = require("./entities");
const mysqldb_1 = require("./migrations/mysqldb");
const postgresdb_1 = require("./migrations/postgresdb");
const sqlite_1 = require("./migrations/sqlite");
const subscribers_1 = require("./subscribers");
const getCommonOptions = () => {
    const { tablePrefix: entityPrefix, logging: loggingConfig } = typedi_1.Container.get(config_1.GlobalConfig).database;
    let loggingOption = loggingConfig.enabled;
    if (loggingOption) {
        const optionsString = loggingConfig.options.replace(/\s+/g, '');
        if (optionsString === 'all') {
            loggingOption = optionsString;
        }
        else {
            loggingOption = optionsString.split(',');
        }
    }
    return {
        entityPrefix,
        entities: Object.values(entities_1.entities),
        subscribers: Object.values(subscribers_1.subscribers),
        migrationsTableName: `${entityPrefix}migrations`,
        migrationsRun: false,
        synchronize: false,
        maxQueryExecutionTime: loggingConfig.maxQueryExecutionTime,
        logging: loggingOption,
    };
};
const getOptionOverrides = (dbType) => {
    const globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
    const dbConfig = globalConfig.database[dbType];
    return {
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.user,
        password: dbConfig.password,
    };
};
exports.getOptionOverrides = getOptionOverrides;
const getSqliteConnectionOptions = () => {
    const globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
    const sqliteConfig = globalConfig.database.sqlite;
    const commonOptions = {
        ...getCommonOptions(),
        database: path_1.default.resolve(typedi_1.Container.get(n8n_core_1.InstanceSettings).n8nFolder, sqliteConfig.database),
        migrations: sqlite_1.sqliteMigrations,
    };
    if (sqliteConfig.poolSize > 0) {
        return {
            type: 'sqlite-pooled',
            poolSize: sqliteConfig.poolSize,
            enableWAL: true,
            acquireTimeout: 60_000,
            destroyTimeout: 5_000,
            ...commonOptions,
        };
    }
    else {
        return {
            type: 'sqlite',
            enableWAL: sqliteConfig.enableWAL,
            ...commonOptions,
        };
    }
};
const getPostgresConnectionOptions = () => {
    const postgresConfig = typedi_1.Container.get(config_1.GlobalConfig).database.postgresdb;
    const { ssl: { ca: sslCa, cert: sslCert, key: sslKey, rejectUnauthorized: sslRejectUnauthorized }, } = postgresConfig;
    let ssl = postgresConfig.ssl.enabled;
    if (sslCa !== '' || sslCert !== '' || sslKey !== '' || !sslRejectUnauthorized) {
        ssl = {
            ca: sslCa || undefined,
            cert: sslCert || undefined,
            key: sslKey || undefined,
            rejectUnauthorized: sslRejectUnauthorized,
        };
    }
    return {
        type: 'postgres',
        ...getCommonOptions(),
        ...(0, exports.getOptionOverrides)('postgresdb'),
        schema: postgresConfig.schema,
        poolSize: postgresConfig.poolSize,
        migrations: postgresdb_1.postgresMigrations,
        connectTimeoutMS: postgresConfig.connectionTimeoutMs,
        ssl,
    };
};
const getMysqlConnectionOptions = (dbType) => ({
    type: dbType === 'mysqldb' ? 'mysql' : 'mariadb',
    ...getCommonOptions(),
    ...(0, exports.getOptionOverrides)('mysqldb'),
    migrations: mysqldb_1.mysqlMigrations,
    timezone: 'Z',
});
function getConnectionOptions() {
    const globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
    const { type: dbType } = globalConfig.database;
    switch (dbType) {
        case 'sqlite':
            return getSqliteConnectionOptions();
        case 'postgresdb':
            return getPostgresConnectionOptions();
        case 'mariadb':
        case 'mysqldb':
            return getMysqlConnectionOptions(dbType);
        default:
            throw new n8n_workflow_1.ApplicationError('Database type currently not supported', { extra: { dbType } });
    }
}
function arePostgresOptions(options) {
    return options.type === 'postgres';
}
//# sourceMappingURL=config.js.map