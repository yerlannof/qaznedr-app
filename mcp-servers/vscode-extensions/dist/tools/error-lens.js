import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
export const errorLensTools = [
    {
        name: "errorlens_get_diagnostics",
        description: "Get all diagnostics (errors, warnings, info) from the current project",
        inputSchema: {
            type: "object",
            properties: {
                severity: {
                    type: "string",
                    enum: ["error", "warning", "info", "all"],
                    description: "Filter by severity level",
                },
                file: {
                    type: "string",
                    description: "Filter diagnostics for a specific file",
                },
            },
        },
        handler: async (args) => {
            try {
                // Use VS Code CLI to get diagnostics
                const { stdout } = await execa("code", ["--list-extensions"]);
                // Check if Error Lens is installed
                if (!stdout.includes("usernamehw.errorlens")) {
                    return { error: "Error Lens extension not installed" };
                }
                // Get diagnostics via TypeScript compiler or ESLint
                const diagnostics = [];
                // Try TypeScript diagnostics
                try {
                    const { stdout: tscOutput } = await execa("npx", ["tsc", "--noEmit", "--pretty", "false"], {
                        reject: false,
                    });
                    if (tscOutput) {
                        const lines = tscOutput.split("\n").filter(Boolean);
                        for (const line of lines) {
                            const match = line.match(/^(.+?)\((\d+),(\d+)\): (error|warning) TS\d+: (.+)$/);
                            if (match) {
                                const [, file, line, column, severity, message] = match;
                                if (!args.file || file.includes(args.file)) {
                                    if (args.severity === "all" || args.severity === severity) {
                                        diagnostics.push({
                                            file,
                                            line: parseInt(line),
                                            column: parseInt(column),
                                            severity,
                                            message,
                                            source: "TypeScript",
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    // TypeScript not available
                }
                // Try ESLint diagnostics
                try {
                    const { stdout: eslintOutput } = await execa("npx", ["eslint", ".", "--format", "json"], {
                        reject: false,
                    });
                    if (eslintOutput) {
                        const results = JSON.parse(eslintOutput);
                        for (const result of results) {
                            if (result.messages && result.messages.length > 0) {
                                for (const msg of result.messages) {
                                    const severity = msg.severity === 2 ? "error" : "warning";
                                    if (!args.file || result.filePath.includes(args.file)) {
                                        if (args.severity === "all" || args.severity === severity) {
                                            diagnostics.push({
                                                file: result.filePath,
                                                line: msg.line,
                                                column: msg.column,
                                                severity,
                                                message: msg.message,
                                                rule: msg.ruleId,
                                                source: "ESLint",
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    // ESLint not available
                }
                return {
                    total: diagnostics.length,
                    diagnostics,
                };
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : String(error) };
            }
        },
    },
    {
        name: "errorlens_inline_suggestions",
        description: "Get inline error suggestions and quick fixes",
        inputSchema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    description: "File path to analyze",
                },
                line: {
                    type: "number",
                    description: "Line number with error",
                },
            },
            required: ["file", "line"],
        },
        handler: async (args) => {
            try {
                // Read the file content
                const content = await fs.readFile(args.file, "utf-8");
                const lines = content.split("\n");
                if (args.line > lines.length) {
                    return { error: "Line number out of range" };
                }
                const problematicLine = lines[args.line - 1];
                const suggestions = [];
                // Common TypeScript/JavaScript fixes
                if (problematicLine.includes("cannot find module")) {
                    suggestions.push({
                        type: "install",
                        message: "Install missing dependency",
                        command: "npm install <package-name>",
                    });
                }
                if (problematicLine.includes("is not defined")) {
                    suggestions.push({
                        type: "import",
                        message: "Add import statement",
                        fix: "Import the missing variable/function",
                    });
                }
                if (problematicLine.includes("unused")) {
                    suggestions.push({
                        type: "remove",
                        message: "Remove unused declaration",
                        fix: "Delete or comment out the unused code",
                    });
                }
                return {
                    file: args.file,
                    line: args.line,
                    content: problematicLine,
                    suggestions,
                };
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : String(error) };
            }
        },
    },
    {
        name: "errorlens_summary",
        description: "Get a summary of all project issues",
        inputSchema: {
            type: "object",
            properties: {},
        },
        handler: async () => {
            try {
                const summary = {
                    errors: 0,
                    warnings: 0,
                    info: 0,
                    byFile: {},
                    topIssues: [],
                };
                // Get all diagnostics
                const { stdout: tscOutput } = await execa("npx", ["tsc", "--noEmit", "--pretty", "false"], {
                    reject: false,
                });
                if (tscOutput) {
                    const lines = tscOutput.split("\n").filter(Boolean);
                    for (const line of lines) {
                        const match = line.match(/^(.+?)\((\d+),(\d+)\): (error|warning) TS\d+: (.+)$/);
                        if (match) {
                            const [, file, , , severity] = match;
                            if (severity === "error")
                                summary.errors++;
                            else if (severity === "warning")
                                summary.warnings++;
                            const fileName = path.basename(file);
                            if (!summary.byFile[fileName]) {
                                summary.byFile[fileName] = { errors: 0, warnings: 0 };
                            }
                            if (severity === "error")
                                summary.byFile[fileName].errors++;
                            else if (severity === "warning")
                                summary.byFile[fileName].warnings++;
                        }
                    }
                }
                // Get top issues
                const fileList = Object.entries(summary.byFile)
                    .sort((a, b) => (b[1].errors + b[1].warnings) - (a[1].errors + a[1].warnings))
                    .slice(0, 5);
                summary.topIssues = fileList.map(([file, counts]) => ({
                    file,
                    ...counts,
                }));
                return summary;
            }
            catch (error) {
                return { error: error instanceof Error ? error.message : String(error) };
            }
        },
    },
];
//# sourceMappingURL=error-lens.js.map