# MCP Server Setup Guide for Claude Code CLI

## Overview

This guide explains how to install and configure MCP (Model Context Protocol) servers for Claude Code CLI - the terminal-based version of Claude.

## Prerequisites

- Claude Code CLI installed (`claude` command available)
- Terminal access
- Internet connection for server installation

## Quick Installation

Run the installation script:

```bash
./scripts/install-mcp-servers.sh
```

This will:

1. Check for Claude Code CLI installation
2. Install recommended MCP servers
3. Provide configuration instructions

## Manual Installation

### Available MCP Servers for Claude Code

Install servers using the Claude CLI:

```bash
# Core servers for development
claude mcp install filesystem    # File system access
claude mcp install github        # GitHub integration
claude mcp install postgres      # PostgreSQL (for Supabase)
claude mcp install fetch         # Web content fetching
claude mcp install brave-search  # Web search
claude mcp install memory        # Persistent memory

# Additional servers
claude mcp install git           # Git operations
claude mcp install sqlite        # SQLite databases
claude mcp install slack         # Slack integration
claude mcp install puppeteer     # Browser automation
```

### List Installed Servers

```bash
claude mcp list
```

Or within a Claude session:

```
/mcp list
```

## Supabase Configuration

Since Claude Code doesn't have a dedicated Supabase MCP server, use the PostgreSQL server:

### 1. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → Database**
4. Find your connection details:
   - Host: `db.xxxxxxxxxxxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: Your database password

### 2. Configure PostgreSQL MCP

```bash
claude mcp configure postgres
```

Enter your Supabase connection details when prompted:

- **Host**: Your Supabase host (db.xxxx.supabase.co)
- **Port**: 5432
- **Database**: postgres
- **Username**: postgres
- **Password**: Your database password

### 3. Test Connection

In a Claude session:

```
/mcp test postgres
```

Or query your database:

```
Can you show me the tables in my Supabase database?
```

## GitHub Configuration

### 1. Create Personal Access Token

1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token with `repo` scope
4. Copy the token

### 2. Configure GitHub MCP

```bash
claude mcp configure github
```

Enter your GitHub token when prompted.

### 3. Test GitHub Access

In a Claude session:

```
/mcp test github
```

Or:

```
Show me the recent commits in this repository
```

## File System Configuration

The filesystem server is usually pre-configured, but you can update settings:

```bash
claude mcp configure filesystem
```

Set the allowed directories for file access.

## Using MCP Servers in Claude Code

### In-Session Commands

Once in a Claude session (`claude` command), use:

- `/mcp list` - List available MCP servers
- `/mcp test <server>` - Test a server connection
- `/mcp status` - Check server status
- `/mcp help` - Get MCP help

### Example Usage

```bash
# Start Claude Code
claude

# In the Claude session:
> /mcp list
Available MCP servers:
- filesystem ✓
- github ✓
- postgres ✓
- brave-search ✓

> Can you query my Supabase database for all listings?
[Claude will use the postgres MCP to query your database]

> Search the web for Kazakhstan mining regulations
[Claude will use brave-search MCP]

> What files are in the src directory?
[Claude will use filesystem MCP]
```

## Configuration Files

MCP configurations are stored in:

- `~/.claude/mcp_servers.json` - Server configurations
- `~/.claude/settings.json` - General Claude settings

### Manual Configuration Example

Edit `~/.claude/mcp_servers.json`:

```json
{
  "postgres": {
    "enabled": true,
    "config": {
      "host": "db.xxxxxxxxxxxx.supabase.co",
      "port": 5432,
      "database": "postgres",
      "user": "postgres",
      "password": "your-password"
    }
  },
  "github": {
    "enabled": true,
    "config": {
      "token": "ghp_xxxxxxxxxxxx"
    }
  },
  "filesystem": {
    "enabled": true,
    "config": {
      "allowed_paths": ["/Users/yourname/Documents/qaznedr-app"]
    }
  }
}
```

## Troubleshooting

### MCP servers not working

1. **Restart Claude Code**: Exit and restart the CLI
2. **Check installation**: Run `claude mcp list`
3. **Verify configuration**: Check `~/.claude/mcp_servers.json`
4. **Test individually**: Use `/mcp test <server>`

### postgres connection fails

- Verify Supabase is not paused (free tier pauses after 1 week)
- Check firewall/network settings
- Ensure credentials are correct
- Try connection pooler endpoint if available

### Permission denied errors

- For filesystem: Check allowed_paths in configuration
- For GitHub: Verify token has correct scopes
- For postgres: Ensure user has necessary permissions

### Servers not listed

```bash
# Reinstall servers
claude mcp install <server-name>

# Or manually add to config
edit ~/.claude/mcp_servers.json
```

## Best Practices

1. **Security**
   - Never commit MCP configuration files
   - Use environment variables for sensitive data when possible
   - Rotate tokens regularly

2. **Performance**
   - Only enable servers you actively use
   - Test connections before heavy usage
   - Monitor rate limits (especially for APIs)

3. **Development Workflow**
   - Start sessions with `/mcp status` to verify servers
   - Use specific servers for specific tasks
   - Combine multiple servers for complex operations

## Advanced Usage

### Chaining MCP Operations

```
# In Claude session
1. Use GitHub MCP to check recent issues
2. Use postgres MCP to query related data
3. Use filesystem MCP to update code
4. Use GitHub MCP to create a commit
```

### Custom Scripts with MCP

Create bash scripts that utilize Claude with MCP:

```bash
#!/bin/bash
# query_database.sh
echo "SELECT * FROM listings WHERE status = 'ACTIVE';" | \
  claude --mcp postgres --execute
```

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Supabase PostgreSQL Docs](https://supabase.com/docs/guides/database)
- [Project Documentation](./README.md)

## Support

For issues specific to this project:

1. Check this guide
2. Run `./scripts/install-mcp-servers.sh` for automated setup
3. Use `/help` in Claude Code for general help
4. Report issues at the project repository
