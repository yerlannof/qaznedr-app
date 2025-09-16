import Docker from "dockerode";
import { execa } from "execa";
const docker = new Docker();
export const dockerTools = [
    {
        name: "docker_list_containers",
        description: "List all Docker containers with their status",
        inputSchema: {
            type: "object",
            properties: {
                all: {
                    type: "boolean",
                    description: "Show all containers (default shows just running)",
                },
            },
        },
        handler: async (args) => {
            const containers = await docker.listContainers({ all: args.all || false });
            return containers.map(container => ({
                id: container.Id.substring(0, 12),
                names: container.Names,
                image: container.Image,
                state: container.State,
                status: container.Status,
                ports: container.Ports.map(p => `${p.PrivatePort}:${p.PublicPort}`),
            }));
        },
    },
    {
        name: "docker_container_logs",
        description: "Get logs from a Docker container",
        inputSchema: {
            type: "object",
            properties: {
                container: {
                    type: "string",
                    description: "Container ID or name",
                },
                tail: {
                    type: "number",
                    description: "Number of lines to show from the end",
                },
            },
            required: ["container"],
        },
        handler: async (args) => {
            const container = docker.getContainer(args.container);
            const stream = await container.logs({
                stdout: true,
                stderr: true,
                tail: args.tail || 100,
            });
            return stream.toString();
        },
    },
    {
        name: "docker_container_inspect",
        description: "Get detailed information about a Docker container",
        inputSchema: {
            type: "object",
            properties: {
                container: {
                    type: "string",
                    description: "Container ID or name",
                },
            },
            required: ["container"],
        },
        handler: async (args) => {
            const container = docker.getContainer(args.container);
            return await container.inspect();
        },
    },
    {
        name: "docker_container_exec",
        description: "Execute a command in a running container",
        inputSchema: {
            type: "object",
            properties: {
                container: {
                    type: "string",
                    description: "Container ID or name",
                },
                command: {
                    type: "array",
                    items: { type: "string" },
                    description: "Command to execute",
                },
            },
            required: ["container", "command"],
        },
        handler: async (args) => {
            const container = docker.getContainer(args.container);
            const exec = await container.exec({
                Cmd: args.command,
                AttachStdout: true,
                AttachStderr: true,
            });
            const stream = await exec.start({ Detach: false });
            return stream.toString();
        },
    },
    {
        name: "docker_images_list",
        description: "List Docker images",
        inputSchema: {
            type: "object",
            properties: {},
        },
        handler: async () => {
            const images = await docker.listImages();
            return images.map(img => ({
                id: img.Id.substring(7, 19),
                repoTags: img.RepoTags,
                size: `${Math.round(img.Size / 1024 / 1024)}MB`,
                created: new Date(img.Created * 1000).toISOString(),
            }));
        },
    },
    {
        name: "docker_compose_up",
        description: "Run docker-compose up",
        inputSchema: {
            type: "object",
            properties: {
                detach: {
                    type: "boolean",
                    description: "Run in detached mode",
                },
                build: {
                    type: "boolean",
                    description: "Build images before starting",
                },
            },
        },
        handler: async (args) => {
            const flags = [];
            if (args.detach)
                flags.push("-d");
            if (args.build)
                flags.push("--build");
            const { stdout, stderr } = await execa("docker-compose", ["up", ...flags]);
            return { stdout, stderr };
        },
    },
    {
        name: "docker_compose_down",
        description: "Stop and remove containers",
        inputSchema: {
            type: "object",
            properties: {
                volumes: {
                    type: "boolean",
                    description: "Remove named volumes",
                },
            },
        },
        handler: async (args) => {
            const flags = [];
            if (args.volumes)
                flags.push("-v");
            const { stdout, stderr } = await execa("docker-compose", ["down", ...flags]);
            return { stdout, stderr };
        },
    },
];
//# sourceMappingURL=docker.js.map