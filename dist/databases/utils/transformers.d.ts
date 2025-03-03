import type { ValueTransformer, FindOperator } from '@n8n/typeorm';
export declare const idStringifier: {
    from: (value?: number) => string | undefined;
    to: (value: string | FindOperator<unknown> | undefined) => number | FindOperator<unknown> | undefined;
};
export declare const lowerCaser: {
    from: (value: string) => string;
    to: (value: string) => string;
};
export declare const objectRetriever: ValueTransformer;
export declare const sqlite: {
    jsonColumn: ValueTransformer;
};
