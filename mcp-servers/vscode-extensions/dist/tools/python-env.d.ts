export declare const pythonEnvTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            path?: undefined;
            type?: undefined;
            packages?: undefined;
            requirements?: undefined;
            dev?: undefined;
            outdated?: undefined;
            name?: undefined;
            python?: undefined;
        };
        required?: undefined;
    };
    handler: () => Promise<({
        type: string;
        path: string;
        python: string;
        active: boolean;
        name?: undefined;
        version?: undefined;
    } | {
        type: string;
        name: string;
        path: any;
        active: boolean;
        python?: undefined;
        version?: undefined;
    } | {
        type: string;
        version: string;
        active: boolean;
        path?: undefined;
        python?: undefined;
        name?: undefined;
    } | {
        type: string;
        python: string;
        path: string;
        active?: undefined;
        name?: undefined;
        version?: undefined;
    })[]>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            path: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            packages?: undefined;
            requirements?: undefined;
            dev?: undefined;
            outdated?: undefined;
            name?: undefined;
            python?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<{
        command: string;
        instruction: string;
        vscodeSettings: {
            "python.defaultInterpreterPath": any;
        };
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            packages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            requirements: {
                type: string;
                description: string;
            };
            dev: {
                type: string;
                description: string;
            };
            path?: undefined;
            type?: undefined;
            outdated?: undefined;
            name?: undefined;
            python?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<({
        type: string;
        stdout: string;
        stderr: string;
        file?: undefined;
    } | {
        type: string;
        file: string;
        stdout?: undefined;
        stderr?: undefined;
    })[]>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            outdated: {
                type: string;
                description: string;
            };
            path?: undefined;
            type?: undefined;
            packages?: undefined;
            requirements?: undefined;
            dev?: undefined;
            name?: undefined;
            python?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<any>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
            };
            python: {
                type: string;
                description: string;
            };
            path?: undefined;
            type?: undefined;
            packages?: undefined;
            requirements?: undefined;
            dev?: undefined;
            outdated?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<{
        created: any;
        activation: string;
        vscodeConfigured: boolean;
    }>;
})[];
//# sourceMappingURL=python-env.d.ts.map