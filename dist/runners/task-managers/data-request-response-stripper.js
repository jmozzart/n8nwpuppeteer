"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRequestResponseStripper = void 0;
class DataRequestResponseStripper {
    constructor(dataResponse, stripParams) {
        this.dataResponse = dataResponse;
        this.stripParams = stripParams;
        this.requestedNodeNames = new Set();
        this.requestedNodeNames = new Set(stripParams.dataOfNodes);
        if (this.stripParams.prevNode && this.stripParams.dataOfNodes !== 'all') {
            this.requestedNodeNames.add(this.determinePrevNodeName());
        }
    }
    strip() {
        const { dataResponse: dr } = this;
        return {
            ...dr,
            inputData: this.stripInputData(dr.inputData),
            envProviderState: this.stripEnvProviderState(dr.envProviderState),
            runExecutionData: this.stripRunExecutionData(dr.runExecutionData),
        };
    }
    stripRunExecutionData(runExecutionData) {
        if (this.stripParams.dataOfNodes === 'all') {
            return runExecutionData;
        }
        return {
            startData: runExecutionData.startData,
            resultData: {
                error: runExecutionData.resultData.error,
                lastNodeExecuted: runExecutionData.resultData.lastNodeExecuted,
                metadata: runExecutionData.resultData.metadata,
                runData: this.stripRunData(runExecutionData.resultData.runData),
                pinData: this.stripPinData(runExecutionData.resultData.pinData),
            },
            executionData: runExecutionData.executionData,
        };
    }
    stripRunData(runData) {
        return this.filterObjectByNodeNames(runData);
    }
    stripPinData(pinData) {
        return pinData ? this.filterObjectByNodeNames(pinData) : undefined;
    }
    stripEnvProviderState(envProviderState) {
        if (this.stripParams.env) {
            return envProviderState;
        }
        return {
            env: {},
            isEnvAccessBlocked: envProviderState.isEnvAccessBlocked,
            isProcessAvailable: envProviderState.isProcessAvailable,
        };
    }
    stripInputData(inputData) {
        if (this.stripParams.input) {
            return inputData;
        }
        return {};
    }
    filterObjectByNodeNames(obj) {
        if (this.stripParams.dataOfNodes === 'all') {
            return obj;
        }
        const filteredObj = {};
        for (const nodeName in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, nodeName)) {
                continue;
            }
            if (this.requestedNodeNames.has(nodeName)) {
                filteredObj[nodeName] = obj[nodeName];
            }
        }
        return filteredObj;
    }
    determinePrevNodeName() {
        const sourceData = this.dataResponse.connectionInputSource?.main?.[0];
        if (!sourceData) {
            return '';
        }
        return sourceData.previousNode;
    }
}
exports.DataRequestResponseStripper = DataRequestResponseStripper;
//# sourceMappingURL=data-request-response-stripper.js.map