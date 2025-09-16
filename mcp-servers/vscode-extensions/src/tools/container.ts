import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';

export const containerTools = [
  {
    name: 'container_dev_setup',
    description: 'Setup dev container configuration for the project',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['node', 'python', 'go', 'rust', 'java', 'dotnet'],
          description: 'Type of development container',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Additional features to include (docker-in-docker, git, etc.)',
        },
      },
      required: ['type'],
    },
    handler: async (args: any) => {
      const devContainerPath = '.devcontainer';
      await fs.mkdir(devContainerPath, { recursive: true });

      const baseImages: Record<string, string> = {
        node: 'mcr.microsoft.com/devcontainers/typescript-node:20',
        python: 'mcr.microsoft.com/devcontainers/python:3.11',
        go: 'mcr.microsoft.com/devcontainers/go:1.21',
        rust: 'mcr.microsoft.com/devcontainers/rust:1',
        java: 'mcr.microsoft.com/devcontainers/java:17',
        dotnet: 'mcr.microsoft.com/devcontainers/dotnet:7.0',
      };

      const devcontainerJson: any = {
        name: `${args.type} Dev Container`,
        image: baseImages[args.type],
        features: {},
        customizations: {
          vscode: {
            extensions: [],
            settings: {},
          },
        },
        forwardPorts: [],
        postCreateCommand: '',
        remoteUser: 'vscode',
      };

      // Add common features
      if (args.features?.includes('docker-in-docker')) {
        devcontainerJson.features[
          'ghcr.io/devcontainers/features/docker-in-docker:2'
        ] = {};
      }
      if (args.features?.includes('git')) {
        devcontainerJson.features['ghcr.io/devcontainers/features/git:1'] = {};
      }

      // Add language-specific extensions
      switch (args.type) {
        case 'node':
          devcontainerJson.customizations.vscode.extensions = [
            'dbaeumer.vscode-eslint',
            'esbenp.prettier-vscode',
            'ms-vscode.vscode-typescript-next',
          ];
          devcontainerJson.postCreateCommand = 'npm install';
          devcontainerJson.forwardPorts = [3000, 5173];
          break;
        case 'python':
          devcontainerJson.customizations.vscode.extensions = [
            'ms-python.python',
            'ms-python.vscode-pylance',
            'ms-python.black-formatter',
          ];
          devcontainerJson.postCreateCommand =
            'pip install -r requirements.txt';
          devcontainerJson.forwardPorts = [8000, 5000];
          break;
        case 'go':
          devcontainerJson.customizations.vscode.extensions = ['golang.go'];
          devcontainerJson.postCreateCommand = 'go mod download';
          devcontainerJson.forwardPorts = [8080];
          break;
      }

      await fs.writeFile(
        path.join(devContainerPath, 'devcontainer.json'),
        JSON.stringify(devcontainerJson, null, 2)
      );

      // Create Dockerfile if needed for custom setup
      if (args.features?.includes('custom')) {
        const dockerfile = `FROM ${baseImages[args.type]}

# Install additional tools
RUN apt-get update && apt-get install -y \\
    curl \\
    vim \\
    && rm -rf /var/lib/apt/lists/*

# Custom setup here
`;
        await fs.writeFile(
          path.join(devContainerPath, 'Dockerfile'),
          dockerfile
        );

        // Update devcontainer.json to use Dockerfile
        devcontainerJson.image = undefined;
        devcontainerJson['build'] = { dockerfile: 'Dockerfile' };

        await fs.writeFile(
          path.join(devContainerPath, 'devcontainer.json'),
          JSON.stringify(devcontainerJson, null, 2)
        );
      }

      return {
        created: devContainerPath,
        config: devcontainerJson,
        instructions:
          "Reopen in Container using Command Palette (F1) > 'Dev Containers: Reopen in Container'",
      };
    },
  },
  {
    name: 'container_remote_status',
    description: 'Check if running in a container or remote environment',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const status = {
        isContainer: false,
        isRemote: false,
        isWSL: false,
        containerInfo: null,
        remoteInfo: null,
      };

      // Check if running in container
      try {
        await fs.access('/.dockerenv');
        status.isContainer = true;
      } catch {}

      // Check container info
      if (status.isContainer) {
        try {
          const hostname = await fs.readFile('/etc/hostname', 'utf-8');
          (status as any).containerInfo = { hostname: hostname.trim() };
        } catch {}
      }

      // Check if in WSL
      try {
        const osRelease = await fs.readFile('/proc/version', 'utf-8');
        if (osRelease.toLowerCase().includes('microsoft')) {
          status.isWSL = true;
        }
      } catch {}

      // Check VS Code remote status via environment
      if (process.env.VSCODE_REMOTE_CONTAINERS) {
        status.isRemote = true;
        (status as any).remoteInfo = { type: 'container' };
      } else if (process.env.VSCODE_REMOTE_WSL) {
        status.isRemote = true;
        (status as any).remoteInfo = { type: 'wsl' };
      } else if (process.env.VSCODE_REMOTE_SSH) {
        status.isRemote = true;
        (status as any).remoteInfo = { type: 'ssh' };
      }

      return status;
    },
  },
  {
    name: 'container_volumes',
    description: 'Manage container volumes and mounts',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'inspect', 'create'],
          description: 'Action to perform',
        },
        name: {
          type: 'string',
          description: 'Volume name for inspect or create',
        },
      },
      required: ['action'],
    },
    handler: async (args: any) => {
      switch (args.action) {
        case 'list':
          const { stdout: volumes } = await execa('docker', [
            'volume',
            'ls',
            '--format',
            'json',
          ]);
          return volumes
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));

        case 'inspect':
          if (!args.name) throw new Error('Volume name required');
          const { stdout: info } = await execa('docker', [
            'volume',
            'inspect',
            args.name,
          ]);
          return JSON.parse(info);

        case 'create':
          if (!args.name) throw new Error('Volume name required');
          const { stdout: created } = await execa('docker', [
            'volume',
            'create',
            args.name,
          ]);
          return { created, name: args.name };

        default:
          throw new Error('Unknown action');
      }
    },
  },
  {
    name: 'container_kubernetes',
    description: 'Kubernetes integration helpers',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['context', 'pods', 'services', 'deployments'],
          description: 'Kubernetes resource to check',
        },
        namespace: {
          type: 'string',
          description: 'Kubernetes namespace',
        },
      },
      required: ['action'],
    },
    handler: async (args: any) => {
      const namespace = args.namespace || 'default';

      try {
        switch (args.action) {
          case 'context':
            const { stdout: context } = await execa('kubectl', [
              'config',
              'current-context',
            ]);
            const { stdout: contexts } = await execa('kubectl', [
              'config',
              'get-contexts',
            ]);
            return { current: context.trim(), all: contexts };

          case 'pods':
            const { stdout: pods } = await execa('kubectl', [
              'get',
              'pods',
              '-n',
              namespace,
              '-o',
              'json',
            ]);
            return JSON.parse(pods);

          case 'services':
            const { stdout: services } = await execa('kubectl', [
              'get',
              'services',
              '-n',
              namespace,
              '-o',
              'json',
            ]);
            return JSON.parse(services);

          case 'deployments':
            const { stdout: deployments } = await execa('kubectl', [
              'get',
              'deployments',
              '-n',
              namespace,
              '-o',
              'json',
            ]);
            return JSON.parse(deployments);

          default:
            throw new Error('Unknown action');
        }
      } catch (error) {
        return {
          error: 'kubectl not available or not configured',
          suggestion: 'Install kubectl and configure cluster access',
        };
      }
    },
  },
];
