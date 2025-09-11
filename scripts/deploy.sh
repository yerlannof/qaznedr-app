#!/bin/bash

# QAZNEDR.KZ Deployment Script
# This script handles production deployment using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT="production"
SERVICE=""
BUILD_ARGS=""
BACKUP_DATABASE=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "QAZNEDR.KZ Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show logs"
    echo "  status     - Show service status"
    echo "  update     - Update and restart services"
    echo "  backup     - Backup database"
    echo "  restore    - Restore database from backup"
    echo "  migrate    - Run database migrations"
    echo "  cleanup    - Clean up old images and containers"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV      Environment (production|development) [default: production]"
    echo "  -s, --service SVC  Specific service to operate on"
    echo "  -b, --build        Force rebuild images"
    echo "  --backup-db        Backup database before deploy"
    echo "  -h, --help         Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy to production"
    echo "  $0 deploy --build            # Deploy with image rebuild"
    echo "  $0 -e development start      # Start development environment"
    echo "  $0 -s app restart           # Restart only app service"
    echo "  $0 logs -s postgres         # Show PostgreSQL logs"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            -b|--build)
                BUILD_ARGS="--build"
                shift
                ;;
            --backup-db)
                BACKUP_DATABASE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|start|stop|restart|logs|status|update|backup|restore|migrate|cleanup)
                COMMAND="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check for environment file
    if [[ "$ENVIRONMENT" == "production" && ! -f "$PROJECT_DIR/.env.production" ]]; then
        log_error "Production environment file (.env.production) not found"
        log_info "Please copy .env.example to .env.production and configure it"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Get Docker Compose file
get_compose_file() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        echo "$PROJECT_DIR/docker-compose.dev.yml"
    else
        echo "$PROJECT_DIR/docker-compose.yml"
    fi
}

# Get environment file
get_env_file() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        echo "$PROJECT_DIR/.env.development"
    else
        echo "$PROJECT_DIR/.env.production"
    fi
}

# Load environment variables
load_env() {
    local env_file=$(get_env_file)
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    fi
}

# Deploy command
deploy() {
    log_info "Starting deployment for $ENVIRONMENT environment"
    
    # Backup database if requested
    if [[ "$BACKUP_DATABASE" == true ]]; then
        backup_database
    fi
    
    # Pull latest images (production only)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Pulling latest images..."
        docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" pull
    fi
    
    # Build and start services
    log_info "Building and starting services..."
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" up -d $BUILD_ARGS $SERVICE
    
    # Wait for services to be healthy
    wait_for_services
    
    # Run database migrations
    migrate_database
    
    log_success "Deployment completed successfully!"
    show_status
}

# Start services
start() {
    log_info "Starting services..."
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" up -d $SERVICE
    wait_for_services
    log_success "Services started successfully!"
}

# Stop services
stop() {
    log_info "Stopping services..."
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" stop $SERVICE
    log_success "Services stopped successfully!"
}

# Restart services
restart() {
    log_info "Restarting services..."
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" restart $SERVICE
    wait_for_services
    log_success "Services restarted successfully!"
}

# Show logs
show_logs() {
    if [[ -n "$SERVICE" ]]; then
        docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" logs -f "$SERVICE"
    else
        docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" logs -f
    fi
}

# Show status
show_status() {
    log_info "Service status:"
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" ps
    
    # Health check
    log_info "Health check:"
    if curl -s http://localhost:${APP_PORT:-3000}/api/health > /dev/null; then
        log_success "Application is healthy"
    else
        log_warning "Application health check failed"
    fi
}

# Update services
update() {
    log_info "Updating services..."
    
    # Backup database
    backup_database
    
    # Pull latest images
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" pull
    fi
    
    # Rebuild and restart
    docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" up -d --build $SERVICE
    
    # Wait for services
    wait_for_services
    
    # Run migrations
    migrate_database
    
    log_success "Update completed successfully!"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_dir="$PROJECT_DIR/backups"
    local backup_file="qaznedr_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    if docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" exec -T postgres pg_dump -U "${POSTGRES_USER:-qaznedr}" "${POSTGRES_DB:-qaznedr}" > "$backup_dir/$backup_file"; then
        log_success "Database backup created: $backup_dir/$backup_file"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Restore database
restore_database() {
    if [[ -z "$1" ]]; then
        log_error "Please specify backup file to restore"
        echo "Usage: $0 restore /path/to/backup.sql"
        exit 1
    fi
    
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will replace the current database. Are you sure? (y/N)"
    read -r confirmation
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database from $backup_file..."
    
    if docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" exec -T postgres psql -U "${POSTGRES_USER:-qaznedr}" "${POSTGRES_DB:-qaznedr}" < "$backup_file"; then
        log_success "Database restored successfully"
    else
        log_error "Database restore failed"
        exit 1
    fi
}

# Run database migrations
migrate_database() {
    log_info "Running database migrations..."
    
    if docker-compose -f "$(get_compose_file)" --env-file "$(get_env_file)" exec app npx prisma migrate deploy; then
        log_success "Database migrations completed"
    else
        log_warning "Database migrations failed or not needed"
    fi
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s http://localhost:${APP_PORT:-3000}/api/health > /dev/null; then
            log_success "Services are healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    log_warning "Services may not be fully healthy yet"
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images and containers..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful!)
    log_warning "Remove unused volumes? This may delete data! (y/N)"
    read -r confirmation
    if [[ "$confirmation" == "y" || "$confirmation" == "Y" ]]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Main function
main() {
    cd "$PROJECT_DIR"
    
    parse_args "$@"
    
    if [[ -z "$COMMAND" ]]; then
        log_error "No command specified"
        show_help
        exit 1
    fi
    
    check_prerequisites
    load_env
    
    case "$COMMAND" in
        deploy)
            deploy
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        update)
            update
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        migrate)
            migrate_database
            ;;
        cleanup)
            cleanup
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"