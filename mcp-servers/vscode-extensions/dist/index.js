#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { dockerTools } from "./tools/docker.js";
import { errorLensTools } from "./tools/error-lens.js";
import { pythonEnvTools } from "./tools/python-env.js";
import { copilotTools } from "./tools/copilot.js";
import { containerTools } from "./tools/container.js";
const server = new Server({
    name: "vscode-extensions",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const allTools = [
    ...dockerTools,
    ...errorLensTools,
    ...pythonEnvTools,
    ...copilotTools,
    ...containerTools,
];
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
    })),
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = allTools.find(t => t.name === name);
    if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
    }
    try {
        const result = await tool.handler(args);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("VS Code Extensions MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map