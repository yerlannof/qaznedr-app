# Claude Code CLI - Quick Start Guide

## Installation Check

First, verify Claude Code CLI is installed:

```bash
claude --version
```

If not installed, visit: https://claude.ai/download

## MCP Server Setup for QAZNEDR.KZ

### Step 1: Run Installation Script

```bash
# Make script executable
chmod +x scripts/install-mcp-servers.sh

# Run installation
./scripts/install-mcp-servers.sh
```

### Step 2: Install MCP Servers Manually (if script fails)

```bash
# Essential servers for this project
claude mcp install filesystem
claude mcp install github  
claude mcp install postgres
claude mcp install fetch
claude mcp install brave-search
claude mcp install memory
```

### Step 3: Configure Supabase (PostgreSQL)

```bash
# Configure postgres MCP for Supabase
claude mcp configure postgres
```

When prompted, enter:
- Host: `db.[YOUR-PROJECT-ID].supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `[Your Supabase password]`

Get these from: https://app.supabase.com/project/_/settings/database

### Step 4: Configure GitHub (Optional)

```bash
claude mcp configure github
```

Enter your GitHub personal access token with `repo` scope.

### Step 5: Test MCP Servers

Start a new Claude session:

```bash
claude
```

In the Claude session, test servers:

```
/mcp list
/mcp test filesystem
/mcp test postgres
/mcp test github
```

## Common Commands in Claude Code

### MCP Commands
- `/mcp list` - Show installed servers
- `/mcp test [server]` - Test server connection
- `/mcp status` - Check all server statuses
- `/mcp configure [server]` - Configure a server

### Session Commands
- `/help` - Show all commands
- `/clear` - Clear conversation
- `/exit` - Exit Claude
- `/save` - Save conversation
- `/load` - Load saved conversation

## Example Workflows

### 1. Database Operations with Supabase

```
You: Can you show me all tables in my Supabase database?
Claude: [Uses postgres MCP to query database]

You: Create a new table for user analytics
Claude: [Creates table using postgres MCP]
```

### 2. Code Development

```
You: What files are in the src/components directory?
Claude: [Uses filesystem MCP to list files]

You: Update the Header component to add a new navigation item
Claude: [Uses filesystem MCP to read and modify files]
```

### 3. GitHub Integration

```
You: Show me the recent commits
Claude: [Uses github MCP to fetch commits]

You: Create a new branch for the feature
Claude: [Uses github MCP to create branch]
```

## Troubleshooting

### "No MCP servers configured"

1. Run: `claude mcp list`
2. If empty, reinstall: `claude mcp install [server-name]`
3. Restart Claude Code

### "postgres connection failed"

1. Check Supabase is not paused
2. Verify credentials: `claude mcp configure postgres`
3. Test with: `/mcp test postgres`

### "filesystem access denied"

1. Configure allowed paths: `claude mcp configure filesystem`
2. Add project directory to allowed paths

## Configuration Files

Your MCP settings are stored in:
- `~/.claude/mcp_servers.json` - Server configurations
- `~/.claude/settings.json` - General settings

## Quick Test

After setup, try this in a Claude session:

```
1. /mcp list
   (Should show your installed servers)

2. List all files in the current project
   (Should use filesystem MCP)

3. Query the Supabase database for listings
   (Should use postgres MCP)

4. Search web for "Kazakhstan mining regulations"
   (Should use brave-search MCP)
```

## Need Help?

1. Check the full guide: `MCP_SETUP_GUIDE.md`
2. Run setup script: `./scripts/install-mcp-servers.sh`
3. In Claude: `/help`
4. Documentation: https://docs.anthropic.com/claude-code