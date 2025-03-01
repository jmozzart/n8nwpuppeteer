import type { ILoadOptions, INodeListSearchResult, INodePropertyOptions, IWorkflowExecuteAdditionalData, ResourceMapperFields, INodeCredentials, INodeParameters, INodeTypeNameVersion, NodeParameterValueType, IDataObject } from 'n8n-workflow';
import { NodeTypes } from '../node-types';
export declare class DynamicNodeParametersService {
    private nodeTypes;
    constructor(nodeTypes: NodeTypes);
    getOptionsViaMethodName(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<INodePropertyOptions[]>;
    getOptionsViaLoadOptions(loadOptions: ILoadOptions, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<INodePropertyOptions[]>;
    getResourceLocatorResults(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials, filter?: string, paginationToken?: string): Promise<INodeListSearchResult>;
    getResourceMappingFields(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<ResourceMapperFields>;
    getActionResult(handler: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, payload: IDataObject | string | undefined, credentials?: INodeCredentials): Promise<NodeParameterValueType>;
    private getMethod;
    private getNodeType;
    private getWorkflow;
    private getThisArg;
}
