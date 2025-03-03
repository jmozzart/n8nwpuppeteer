import { VariablesRequest } from '../../requests';
import { VariablesService } from './variables.service.ee';
export declare class VariablesController {
    private readonly variablesService;
    constructor(variablesService: VariablesService);
    getVariables(): Promise<import("../../databases/entities/variables").Variables[]>;
    createVariable(req: VariablesRequest.Create): Promise<import("../../databases/entities/variables").Variables>;
    getVariable(req: VariablesRequest.Get): Promise<import("../../databases/entities/variables").Variables>;
    updateVariable(req: VariablesRequest.Update): Promise<import("../../databases/entities/variables").Variables>;
    deleteVariable(req: VariablesRequest.Delete): Promise<boolean>;
}
