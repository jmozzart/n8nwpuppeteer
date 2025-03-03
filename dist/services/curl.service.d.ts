interface Parameter {
    parameterType?: string;
    name: string;
    value: string;
}
interface HttpNodeParameters {
    url?: string;
    method: string;
    sendBody?: boolean;
    authentication: string;
    contentType?: 'form-urlencoded' | 'multipart-form-data' | 'json' | 'raw' | 'binaryData';
    rawContentType?: string;
    specifyBody?: 'json' | 'keypair';
    bodyParameters?: {
        parameters: Parameter[];
    };
    jsonBody?: object;
    options: {
        allowUnauthorizedCerts?: boolean;
        proxy?: string;
        timeout?: number;
        redirect: {
            redirect: {
                followRedirects?: boolean;
                maxRedirects?: number;
            };
        };
        response: {
            response: {
                fullResponse?: boolean;
                responseFormat?: string;
                outputPropertyName?: string;
            };
        };
    };
    sendHeaders?: boolean;
    headerParameters?: {
        parameters: Parameter[];
    };
    sendQuery?: boolean;
    queryParameters?: {
        parameters: Parameter[];
    };
}
export declare const flattenObject: (obj: {
    [x: string]: any;
}, prefix?: string) => {};
export declare class CurlService {
    toHttpNodeParameters(curlCommand: string): HttpNodeParameters;
}
export {};
