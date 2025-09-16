export declare const errorLensTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            severity: {
                type: string;
                enum: string[];
                description: string;
            };
            file: {
                type: string;
                description: string;
            };
            line?: undefined;
        };
        required?: undefined;
    };
    handler: (args: any) => Promise<{
        error: string;
        total?: undefined;
        diagnostics?: undefined;
    } | {
        total: number;
        diagnostics: ({
            file: string;
            line: number;
            column: number;
            severity: string;
            message: string;
            source: string;
            rule?: undefined;
        } | {
            file: any;
            line: any;
            column: any;
            severity: string;
            message: any;
            rule: any;
            source: string;
        })[];
        error?: undefined;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            line: {
                type: string;
                description: string;
            };
            severity?: undefined;
        };
        required: string[];
    };
    handler: (args: any) => Promise<{
        error: string;
        file?: undefined;
        line?: undefined;
        content?: undefined;
        suggestions?: undefined;
    } | {
        file: any;
        line: any;
        content: string;
        suggestions: ({
            type: string;
            message: string;
            command: string;
            fix?: undefined;
        } | {
            type: string;
            message: string;
            fix: string;
            command?: undefined;
        })[];
        error?: undefined;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            severity?: undefined;
            file?: undefined;
            line?: undefined;
        };
        required?: undefined;
    };
    handler: () => Promise<{
        errors: number;
        warnings: number;
        info: number;
        byFile: {};
        topIssues: never[];
    } | {
        error: string;
    }>;
})[];
//# sourceMappingURL=error-lens.d.ts.map