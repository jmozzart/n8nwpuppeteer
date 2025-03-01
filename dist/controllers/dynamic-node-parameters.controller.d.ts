import type { INodePropertyOptions, NodeParameterValueType } from 'n8n-workflow';
import { DynamicNodeParametersRequest } from '../requests';
import { DynamicNodeParametersService } from '../services/dynamic-node-parameters.service';
export declare class DynamicNodeParametersController {
    private readonly service;
    constructor(service: DynamicNodeParametersService);
    getOptions(req: DynamicNodeParametersRequest.Options): Promise<INodePropertyOptions[]>;
    getResourceLocatorResults(req: DynamicNodeParametersRequest.ResourceLocatorResults): Promise<import("n8n-workflow").INodeListSearchResult>;
    getResourceMappingFields(req: DynamicNodeParametersRequest.ResourceMapperFields): Promise<import("n8n-workflow").ResourceMapperFields>;
    getActionResult(req: DynamicNodeParametersRequest.ActionResult): Promise<NodeParameterValueType>;
}
