export declare const copilotTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            context?: undefined;
            language?: undefined;
            topic?: undefined;
        };
        required?: undefined;
    };
    handler: () => Promise<{
        installed: {
            copilot: boolean;
            copilotChat: boolean;
        };
        githubCliStatus: string | null;
        vscodeIntegration: string;
        features: string[];
        error?: undefined;
    } | {
        error: string;
        installed?: undefined;
        githubCliStatus?: undefined;
        vscodeIntegration?: undefined;
        features?: undefined;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            context: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                description: string;
            };
            topic?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<{
        context: any;
        language: any;
        suggestions: {
            type: string;
            pattern: string;
            tip: string;
        }[];
        tips: string[];
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            topic: {
                type: string;
                enum: string[];
                description: string;
            };
            context?: undefined;
            language?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<any>;
})[];
//# sourceMappingURL=copilot.d.ts.map