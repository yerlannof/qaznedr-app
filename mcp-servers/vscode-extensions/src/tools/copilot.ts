import { execa } from 'execa';

export const copilotTools = [
  {
    name: 'copilot_status',
    description: 'Check GitHub Copilot status and configuration',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      try {
        // Check if Copilot is installed
        const { stdout: extensions } = await execa('code', [
          '--list-extensions',
        ]);
        const hasCopilot = extensions.includes('GitHub.copilot');
        const hasCopilotChat = extensions.includes('GitHub.copilot-chat');

        // Get Copilot status via GitHub CLI if available
        let githubStatus = null;
        try {
          const { stdout } = await execa('gh', ['copilot', 'status']);
          githubStatus = stdout;
        } catch {}

        return {
          installed: {
            copilot: hasCopilot,
            copilotChat: hasCopilotChat,
          },
          githubCliStatus: githubStatus,
          vscodeIntegration: hasCopilot ? 'active' : 'not installed',
          features: hasCopilot
            ? [
                'Inline code suggestions',
                'Multi-line completions',
                'Unit test generation',
                'Comment-to-code',
                'Chat interface (if GitHub.copilot-chat installed)',
              ]
            : [],
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },
  {
    name: 'copilot_suggest',
    description:
      'Get Copilot suggestions for code (simulated - actual suggestions require VS Code UI)',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Code context or comment describing what you want',
        },
        language: {
          type: 'string',
          description: 'Programming language',
        },
      },
      required: ['context'],
    },
    handler: async (args: any) => {
      // This is a simulation since actual Copilot suggestions require VS Code UI
      // But we can provide common patterns and best practices

      const suggestions = [];
      const lang = args.language || 'typescript';

      // Analyze context and provide pattern-based suggestions
      if (args.context.toLowerCase().includes('test')) {
        suggestions.push({
          type: 'unit_test',
          pattern: `describe('Component', () => {\n  it('should work', () => {\n    // Test implementation\n  });\n});`,
          tip: 'Copilot works best with descriptive test names',
        });
      }

      if (
        args.context.toLowerCase().includes('api') ||
        args.context.toLowerCase().includes('fetch')
      ) {
        suggestions.push({
          type: 'api_call',
          pattern: `async function fetchData() {\n  try {\n    const response = await fetch('/api/endpoint');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}`,
          tip: 'Copilot can generate error handling automatically',
        });
      }

      if (args.context.toLowerCase().includes('component')) {
        suggestions.push({
          type: 'react_component',
          pattern: `function Component({ prop1, prop2 }) {\n  return (\n    <div>\n      {/* Component content */}\n    </div>\n  );\n}`,
          tip: 'Start with component name and props for better suggestions',
        });
      }

      return {
        context: args.context,
        language: lang,
        suggestions,
        tips: [
          'Write clear comments before functions',
          'Use descriptive variable names',
          'Copilot learns from your codebase patterns',
          'Press Tab to accept suggestions in VS Code',
          'Use Ctrl+Enter to see multiple suggestions',
        ],
      };
    },
  },
  {
    name: 'copilot_explain',
    description: 'Explain how to use Copilot effectively',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['shortcuts', 'best_practices', 'troubleshooting', 'features'],
          description: 'Topic to explain',
        },
      },
    },
    handler: async (args: any) => {
      const guides = {
        shortcuts: {
          accept: 'Tab - Accept suggestion',
          reject: 'Esc - Reject suggestion',
          nextSuggestion: 'Alt+] - Next suggestion',
          prevSuggestion: 'Alt+[ - Previous suggestion',
          openCompletions: 'Ctrl+Enter - Open completions panel',
          toggleCopilot: 'Ctrl+Alt+S - Toggle Copilot',
        },
        best_practices: [
          'Write descriptive comments before complex functions',
          'Use meaningful variable and function names',
          'Keep consistent code style in your project',
          'Break down complex problems into smaller functions',
          'Review and understand generated code before using',
          'Use type annotations for better suggestions',
        ],
        troubleshooting: {
          noSuggestions: 'Check internet connection and GitHub authentication',
          poorQuality: 'Provide more context with comments and better naming',
          notWorking: 'Ensure Copilot extension is enabled for the workspace',
          slow: 'Check VS Code performance and disable conflicting extensions',
        },
        features: {
          codeSuggestions: 'Real-time code completions',
          testGeneration: 'Generate unit tests from functions',
          docGeneration: 'Create documentation from code',
          refactoring: 'Suggest code improvements',
          chat: 'Interactive chat for coding help (with Copilot Chat)',
          multiLanguage: 'Support for 100+ programming languages',
        },
      };

      return args.topic ? (guides as any)[args.topic] : guides;
    },
  },
];
