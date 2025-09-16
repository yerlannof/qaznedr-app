import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export const pythonEnvTools = [
  {
    name: 'python_list_environments',
    description: 'List all Python environments (venv, conda, pyenv)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const environments = [];

      // Check for local venv
      try {
        await fs.access('.venv');
        const { stdout: pythonVersion } = await execa('.venv/bin/python', [
          '--version',
        ]);
        environments.push({
          type: 'venv',
          path: '.venv',
          python: pythonVersion,
          active: process.env.VIRTUAL_ENV === path.resolve('.venv'),
        });
      } catch {}

      try {
        await fs.access('venv');
        const { stdout: pythonVersion } = await execa('venv/bin/python', [
          '--version',
        ]);
        environments.push({
          type: 'venv',
          path: 'venv',
          python: pythonVersion,
          active: process.env.VIRTUAL_ENV === path.resolve('venv'),
        });
      } catch {}

      // Check conda environments
      try {
        const { stdout: condaEnvs } = await execa('conda', [
          'env',
          'list',
          '--json',
        ]);
        const parsed = JSON.parse(condaEnvs);
        for (const env of parsed.envs) {
          const envName = path.basename(env);
          environments.push({
            type: 'conda',
            name: envName,
            path: env,
            active: process.env.CONDA_DEFAULT_ENV === envName,
          });
        }
      } catch {}

      // Check pyenv
      try {
        const { stdout: pyenvVersions } = await execa('pyenv', ['versions']);
        const lines = pyenvVersions.split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*(\*?)\s*(.+)$/);
          if (match) {
            const [, active, version] = match;
            environments.push({
              type: 'pyenv',
              version: version.trim(),
              active: !!active,
            });
          }
        }
      } catch {}

      // System Python
      try {
        const { stdout: systemPython } = await execa('python3', ['--version']);
        environments.push({
          type: 'system',
          python: systemPython,
          path: await execa('which', ['python3']).then((r) => r.stdout),
        });
      } catch {}

      return environments;
    },
  },
  {
    name: 'python_activate_environment',
    description: 'Activate a Python environment',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the environment or environment name',
        },
        type: {
          type: 'string',
          enum: ['venv', 'conda', 'pyenv'],
          description: 'Type of environment',
        },
      },
      required: ['path', 'type'],
    },
    handler: async (args: any) => {
      let activationCommand = '';

      switch (args.type) {
        case 'venv':
          activationCommand = `source ${args.path}/bin/activate`;
          break;
        case 'conda':
          activationCommand = `conda activate ${args.path}`;
          break;
        case 'pyenv':
          activationCommand = `pyenv local ${args.path}`;
          break;
      }

      return {
        command: activationCommand,
        instruction:
          'Run this command in your terminal to activate the environment',
        vscodeSettings: {
          'python.defaultInterpreterPath':
            args.type === 'venv' ? `${args.path}/bin/python` : args.path,
        },
      };
    },
  },
  {
    name: 'python_install_packages',
    description: 'Install Python packages in the current environment',
    inputSchema: {
      type: 'object',
      properties: {
        packages: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of packages to install',
        },
        requirements: {
          type: 'string',
          description: 'Path to requirements.txt file',
        },
        dev: {
          type: 'boolean',
          description: 'Install as dev dependencies',
        },
      },
    },
    handler: async (args: any) => {
      const commands = [];
      const results = [];

      if (args.requirements) {
        const { stdout, stderr } = await execa('pip', [
          'install',
          '-r',
          args.requirements,
        ]);
        results.push({ type: 'requirements', stdout, stderr });
      }

      if (args.packages && args.packages.length > 0) {
        const installArgs = ['install'];
        if (args.dev) {
          // For pip, dev dependencies are usually in requirements-dev.txt
          // For poetry, it would be --group dev
          installArgs.push(...args.packages);
        } else {
          installArgs.push(...args.packages);
        }

        const { stdout, stderr } = await execa('pip', installArgs);
        results.push({ type: 'packages', stdout, stderr });
      }

      // Update requirements.txt if needed
      if (args.packages && !args.requirements) {
        const reqFile = args.dev ? 'requirements-dev.txt' : 'requirements.txt';
        try {
          const existing = await fs.readFile(reqFile, 'utf-8');
          const newReqs = existing + '\n' + args.packages.join('\n');
          await fs.writeFile(reqFile, newReqs);
          results.push({ type: 'updated', file: reqFile });
        } catch {
          // File doesn't exist, create it
          await fs.writeFile(reqFile, args.packages.join('\n'));
          results.push({ type: 'created', file: reqFile });
        }
      }

      return results;
    },
  },
  {
    name: 'python_list_packages',
    description: 'List installed Python packages',
    inputSchema: {
      type: 'object',
      properties: {
        outdated: {
          type: 'boolean',
          description: 'Show only outdated packages',
        },
      },
    },
    handler: async (args: any) => {
      if (args.outdated) {
        const { stdout } = await execa('pip', [
          'list',
          '--outdated',
          '--format',
          'json',
        ]);
        return JSON.parse(stdout);
      } else {
        const { stdout } = await execa('pip', ['list', '--format', 'json']);
        return JSON.parse(stdout);
      }
    },
  },
  {
    name: 'python_create_environment',
    description: 'Create a new Python virtual environment',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the environment (default: .venv)',
        },
        python: {
          type: 'string',
          description: 'Python version to use (e.g., python3.11)',
        },
      },
    },
    handler: async (args: any) => {
      const envName = args.name || '.venv';
      const pythonExe = args.python || 'python3';

      // Create virtual environment
      await execa(pythonExe, ['-m', 'venv', envName]);

      // Create .gitignore entry
      try {
        const gitignore = await fs.readFile('.gitignore', 'utf-8');
        if (!gitignore.includes(envName)) {
          await fs.writeFile('.gitignore', gitignore + `\n${envName}/\n`);
        }
      } catch {
        await fs.writeFile('.gitignore', `${envName}/\n`);
      }

      // Create VS Code settings
      const vscodeSettings = {
        'python.defaultInterpreterPath': `\${workspaceFolder}/${envName}/bin/python`,
        'python.terminal.activateEnvironment': true,
      };

      try {
        await fs.mkdir('.vscode', { recursive: true });
        const settingsPath = '.vscode/settings.json';
        let settings = {};

        try {
          const existing = await fs.readFile(settingsPath, 'utf-8');
          settings = JSON.parse(existing);
        } catch {}

        Object.assign(settings, vscodeSettings);
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      } catch {}

      return {
        created: envName,
        activation: `source ${envName}/bin/activate`,
        vscodeConfigured: true,
      };
    },
  },
];
