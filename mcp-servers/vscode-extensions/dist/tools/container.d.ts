export declare const containerTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            action?: undefined;
            name?: undefined;
            namespace?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<{
        created: string;
        config: any;
        instructions: string;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type?: undefined;
            features?: undefined;
            action?: undefined;
            name?: undefined;
            namespace?: undefined;
        };
        required?: undefined;
    };
    handler: () => Promise<{
        isContainer: boolean;
        isRemote: boolean;
        isWSL: boolean;
        containerInfo: null;
        remoteInfo: null;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            type?: undefined;
            features?: undefined;
            namespace?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<any>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            namespace: {
                type: string;
                description: string;
            };
            type?: undefined;
            features?: undefined;
            name?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<any>;
})[];
//# sourceMappingURL=container.d.ts.map