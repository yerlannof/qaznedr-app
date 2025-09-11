#!/bin/bash

echo "🚀 Устанавливаем все MCP серверы для проекта QAZNEDR..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для установки MCP сервера
install_mcp() {
    local name=$1
    local command=$2
    echo -e "${YELLOW}Installing $name...${NC}"
    if claude mcp add "$name" "$command"; then
        echo -e "${GREEN}✅ $name installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install $name${NC}"
    fi
    echo ""
}

# Базовые MCP серверы
install_mcp "brave-search" "npx @modelcontextprotocol/server-brave-search"
install_mcp "memory-keeper" "npx @modelcontextprotocol/server-memory"
install_mcp "puppeteer" "npx @modelcontextprotocol/server-puppeteer"
install_mcp "desktop-commander" "npx @modelcontextprotocol/server-filesystem"
install_mcp "docker" "npx docker-mcp"
install_mcp "task-manager" "npx @modelcontextprotocol/server-everything"
install_mcp "firecrawl" "npx firecrawl-mcp"
install_mcp "thread-continuity" "npx @modelcontextprotocol/server-sequential-thinking"
install_mcp "git" "npx mcp-git"
install_mcp "context7" "npx @modelcontextprotocol/server-github"

# Серверы с дублированными командами (переименованы для уникальности)
install_mcp "fetch" "npx @modelcontextprotocol/server-memory"
install_mcp "sqlite" "npx @modelcontextprotocol/server-puppeteer"
install_mcp "supabase" "npx @modelcontextprotocol/server-filesystem"
install_mcp "time" "npx docker-mcp"

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}⚠️  Shopify серверы требуют токены!${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo "Для установки Shopify серверов выполните вручную:"
echo ""
echo -e "${GREEN}1. Shopify API:${NC}"
echo '   claude mcp add shopify-api "npx shopify-mcp --accessToken YOUR_TOKEN --domain YOUR_DOMAIN.myshopify.com"'
echo ""
echo -e "${GREEN}2. Shopify Dev:${NC}"
echo '   claude mcp add shopify-dev "npx -y @shopify/dev-mcp@latest"'
echo ""
echo "Токены можно найти в файле ~/CLAUDE.md на основном компьютере"
echo ""
echo -e "${GREEN}✅ Установка базовых MCP серверов завершена!${NC}"
echo ""
echo "Проверить установленные серверы: claude mcp list"