# Leafy Bank UI - Makefile
# Frontend development commands (no Docker) + Docker compose targets.

FRONTEND_DIR := frontend
PORT := 3000

.PHONY: help install dev start build lint clean restart kill fresh \
        docker-build docker-start docker-stop docker-clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install        - Install dependencies (--legacy-peer-deps)"
	@echo "  make dev            - Start development server (port $(PORT))"
	@echo "  make start          - Start production server (requires build first)"
	@echo "  make build          - Build for production"
	@echo "  make lint           - Run ESLint"
	@echo "  make clean          - Remove node_modules and .next"
	@echo "  make restart        - Kill existing server and restart dev"
	@echo "  make kill           - Kill process running on port $(PORT)"
	@echo "  make fresh          - Clean install and start dev"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - docker-compose up --build -d"
	@echo "  make docker-start   - docker-compose start"
	@echo "  make docker-stop    - docker-compose stop"
	@echo "  make docker-clean   - docker-compose down --rmi all -v"

# Install dependencies (--legacy-peer-deps required by LeafyGreen UI peer deps)
install:
	cd $(FRONTEND_DIR) && npm install --legacy-peer-deps

# Start development server
dev:
	cd $(FRONTEND_DIR) && npm run dev

# Start production server
start:
	cd $(FRONTEND_DIR) && npm run start

# Build for production
build:
	cd $(FRONTEND_DIR) && npm run build

# Run linter
lint:
	cd $(FRONTEND_DIR) && npm run lint

# Clean build artifacts and dependencies
clean:
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/.next
	@echo "Cleaned node_modules and .next"

# Kill process on UI port
kill:
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || echo "No process running on port $(PORT)"

# Restart development server
restart: kill
	@sleep 1
	cd $(FRONTEND_DIR) && npm run dev

# Fresh install and start
fresh: clean install dev

# ---------- Docker compose (preserved from prior Makefile) ----------

docker-build:
	docker-compose up --build -d

docker-start:
	docker-compose start

docker-stop:
	docker-compose stop

docker-clean:
	docker-compose down --rmi all -v
