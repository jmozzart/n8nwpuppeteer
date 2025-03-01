"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Column = void 0;
class Column {
    constructor(name) {
        this.name = name;
        this.isGenerated = false;
        this.isNullable = true;
        this.isPrimary = false;
    }
    get bool() {
        this.type = 'boolean';
        return this;
    }
    get int() {
        this.type = 'int';
        return this;
    }
    varchar(length) {
        this.type = 'varchar';
        this.length = length ?? 'auto';
        return this;
    }
    get text() {
        this.type = 'text';
        return this;
    }
    get json() {
        this.type = 'json';
        return this;
    }
    timestamp(msPrecision = 3) {
        this.type = 'timestamp';
        this.length = msPrecision ?? 'auto';
        return this;
    }
    get uuid() {
        this.type = 'uuid';
        return this;
    }
    get primary() {
        this.isPrimary = true;
        return this;
    }
    primaryWithName(name) {
        this.isPrimary = true;
        this.primaryKeyConstraintName = name;
        return this;
    }
    get notNull() {
        this.isNullable = false;
        return this;
    }
    default(value) {
        this.defaultValue = value;
        return this;
    }
    get autoGenerate() {
        this.isGenerated = true;
        return this;
    }
    toOptions(driver) {
        const { name, type, isNullable, isPrimary, isGenerated, length, primaryKeyConstraintName } = this;
        const isMysql = 'mysql' in driver;
        const isPostgres = 'postgres' in driver;
        const isSqlite = 'sqlite' in driver;
        const options = {
            primaryKeyConstraintName,
            name,
            isNullable,
            isPrimary,
            type,
        };
        if (options.type === 'int' && isSqlite) {
            options.type = 'integer';
        }
        else if (type === 'boolean' && isMysql) {
            options.type = 'tinyint(1)';
        }
        else if (type === 'timestamp') {
            options.type = isPostgres ? 'timestamptz' : 'datetime';
        }
        else if (type === 'json' && isSqlite) {
            options.type = 'text';
        }
        else if (type === 'uuid') {
            if (isMysql)
                options.type = 'varchar(36)';
            if (isSqlite)
                options.type = 'varchar';
        }
        if ((type === 'varchar' || type === 'timestamp') && length !== 'auto') {
            options.type = `${options.type}(${length})`;
        }
        if (isGenerated) {
            options.isGenerated = true;
            options.generationStrategy = type === 'uuid' ? 'uuid' : 'increment';
        }
        if (isPrimary || isGenerated) {
            options.isNullable = false;
        }
        if (this.defaultValue !== undefined) {
            if (type === 'timestamp' && this.defaultValue === 'NOW()') {
                options.default = isSqlite
                    ? "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')"
                    : 'CURRENT_TIMESTAMP(3)';
            }
            else {
                options.default = this.defaultValue;
            }
        }
        return options;
    }
}
exports.Column = Column;
//# sourceMappingURL=column.js.map