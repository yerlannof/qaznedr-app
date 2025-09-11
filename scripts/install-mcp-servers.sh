#!/bin/bash

# MCP Server Installation Script for Claude Code CLI
# This script installs MCP servers for Claude Code (terminal-based Claude)

echo "🚀 Installing MCP Servers for Claude Code CLI"
echo "=============================================="
echo ""

# Check if claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI not found!"
    echo ""
    echo "Please install Claude Code first:"
    echo "1. Visit: https://claude.ai/download"
    echo "2. Download and install Claude Code for your platform"
    echo "3. Run 'claude' in terminal to verify installation"
    exit 1
fi

echo "✅ Claude Code CLI detected"
echo ""
echo "📦 Installing MCP Servers..."
echo "============================"
echo ""

# List of available MCP servers for Claude Code
declare -A servers=(
    ["filesystem"]="File system operations"
    ["github"]="GitHub integration" 
    ["gitlab"]="GitLab integration"
    ["git"]="Git operations"
    ["google-drive"]="Google Drive access"
    ["slack"]="Slack integration"
    ["postgres"]="PostgreSQL database"
    ["sqlite"]="SQLite database"
    ["fetch"]="Fetch web content"
    ["puppeteer"]="Browser automation"
    ["brave-search"]="Web search"
    ["google-maps"]="Maps and location"
    ["memory"]="Persistent memory"
    ["everart"]="Image generation"
    ["sequentialthinking"]="Complex reasoning"
    ["youtube-transcript"]="YouTube transcripts"
)

echo "Available MCP servers for installation:"
echo ""

for server in "${!servers[@]}"; do
    echo "  • $server - ${servers[$server]}"
done

echo ""
echo "🔧 Installing recommended servers for QAZNEDR.KZ project..."
echo ""

# Recommended servers for this project
recommended=(
    "filesystem"
    "github"
    "postgres"  # For Supabase PostgreSQL
    "fetch"
    "brave-search"
    "memory"
)

installed=0
failed=0

for server in "${recommended[@]}"; do
    echo -n "Installing $server... "
    if claude mcp install "$server" 2>/dev/null; then
        echo "✅"
        ((installed++))
    else
        # Try alternative installation method
        if claude mcp add "$server" 2>/dev/null; then
            echo "✅"
            ((installed++))
        else
            echo "⚠️  (may already be installed or not available)"
            ((failed++))
        fi
    fi
done

echo ""
echo "📊 Installation Summary:"
echo "========================"
echo "✅ Successfully installed: $installed servers"
if [ $failed -gt 0 ]; then
    echo "⚠️  Skipped or failed: $failed servers"
fi

echo ""
echo "🔍 Checking installed MCP servers..."
echo ""
claude mcp list 2>/dev/null || echo "Unable to list servers. They will be available in your next Claude session."

echo ""
echo "⚙️  Supabase Configuration for Claude Code"
echo "==========================================="
echo ""
echo "Since Claude Code doesn't have a direct Supabase MCP server,"
echo "you should use the 'postgres' MCP server with your Supabase credentials:"
echo ""
echo "1. Get your Supabase database connection string from:"
echo "   https://app.supabase.com/project/_/settings/database"
echo ""
echo "2. Configure the postgres MCP server:"
echo "   claude mcp configure postgres"
echo ""
echo "3. Enter your Supabase PostgreSQL connection details:"
echo "   - Host: db.xxxx.supabase.co"
echo "   - Port: 5432"
echo "   - Database: postgres"
echo "   - User: postgres"
echo "   - Password: [your-database-password]"
echo ""

echo "📝 Configuration File Location"
echo "=============================="
echo ""
echo "MCP server configurations are stored in:"
echo "  ~/.claude/mcp_servers.json"
echo ""
echo "You can manually edit this file to add server configurations."
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Start a new Claude Code session: 'claude'"
echo "2. Test MCP servers with: '/mcp list'"
echo "3. Configure postgres server for Supabase access"
echo "4. Use '/help' to see all available commands"
echo ""

echo "💡 Quick Test Commands:"
echo "======================"
echo "  /mcp list                    # List installed servers"
echo "  /mcp test filesystem         # Test filesystem access"
echo "  /mcp test postgres           # Test database connection"
echo "  /mcp configure [server]      # Configure a server"
echo ""

echo "✨ MCP Server installation script complete!"
echo ""
echo "For more help, visit: https://docs.anthropic.com/claude/docs/mcp"