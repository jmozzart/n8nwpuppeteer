import type { WorkflowEntity as Workflow } from '../databases/entities/workflow-entity';
import type { Risk } from '../security-audit/types';
type Node = Workflow['nodes'][number];
export declare const toFlaggedNode: ({ node, workflow }: {
    node: Node;
    workflow: Workflow;
}) => {
    kind: "node";
    workflowId: string;
    workflowName: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
};
export declare const toReportTitle: (riskCategory: Risk.Category) => string;
export declare function getNodeTypes(workflows: Workflow[], test: (element: Node) => boolean): Risk.NodeLocation[];
export {};
