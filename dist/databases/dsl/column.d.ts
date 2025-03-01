import type { Driver, TableColumnOptions } from '@n8n/typeorm';
export declare class Column {
    private name;
    private type;
    private isGenerated;
    private isNullable;
    private isPrimary;
    private length;
    private defaultValue;
    private primaryKeyConstraintName;
    constructor(name: string);
    get bool(): this;
    get int(): this;
    varchar(length?: number): this;
    get text(): this;
    get json(): this;
    timestamp(msPrecision?: number): this;
    get uuid(): this;
    get primary(): this;
    primaryWithName(name?: string): this;
    get notNull(): this;
    default(value: unknown): this;
    get autoGenerate(): this;
    toOptions(driver: Driver): TableColumnOptions;
}
