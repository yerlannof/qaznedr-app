import Docker from "dockerode";
export declare const dockerTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            all: {
                type: string;
                description: string;
            };
            container?: undefined;
            tail?: undefined;
            command?: undefined;
            detach?: undefined;
            build?: undefined;
            volumes?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<{
        id: string;
        names: string[];
        image: string;
        state: string;
        status: string;
        ports: string[];
    }[]>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            container: {
                type: string;
                description: string;
            };
            tail: {
                type: string;
                description: string;
            };
            all?: undefined;
            command?: undefined;
            detach?: undefined;
            build?: undefined;
            volumes?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<string>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            container: {
                type: string;
                description: string;
            };
            all?: undefined;
            tail?: undefined;
            command?: undefined;
            detach?: undefined;
            build?: undefined;
            volumes?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<Docker.ContainerInspectInfo>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            container: {
                type: string;
                description: string;
            };
            command: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            all?: undefined;
            tail?: undefined;
            detach?: undefined;
            build?: undefined;
            volumes?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<string>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            all?: undefined;
            container?: undefined;
            tail?: undefined;
            command?: undefined;
            detach?: undefined;
            build?: undefined;
            volumes?: undefined;
        };
        required?: undefined;
    };
    handler: () => Promise<{
        id: string;
        repoTags: string[] | undefined;
        size: string;
        created: string;
    }[]>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            detach: {
                type: string;
                description: string;
            };
            build: {
                type: string;
                description: string;
            };
            all?: undefined;
            container?: undefined;
            tail?: undefined;
            command?: undefined;
            volumes?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<{
        stdout: string;
        stderr: string;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            volumes: {
                type: string;
                description: string;
            };
            all?: undefined;
            container?: undefined;
            tail?: undefined;
            command?: undefined;
            detach?: undefined;
            build?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<{
        stdout: string;
        stderr: string;
    }>;
})[];
//# sourceMappingURL=docker.d.ts.map