.PHONY: dev dev-frontend dev-backend dev-mongodb setup setup-env setup-frontend setup-backend setup-mongodb stop-mongodb checkout-latest checkout clean clean-frontend clean-backend clean-mongodb setup-docker-compose-env

start-backend: 
	make -j start-backend-worklog start-backend-notification start-backend-task

start-backend-worklog:
	cd ./backend/worklog && ./mvnw liberty:start

start-backend-notification:
	cd ./backend/notification && ./mvnw liberty:start

start-backend-task:
	cd ./backend/task && ./mvnw liberty:start

stop-backend:
	cd backend/worklog && ./mvnw liberty:stop || true
	cd backend/notification && ./mvnw liberty:stop || true
	cd backend/task && ./mvnw liberty:stop || true

dev:
	make dev-mongodb
	make dev-frontend & make dev-backend & wait

dev-frontend:
	cd ./frontend && npm run dev

dev-backend: stop-backend
	make -j dev-backend-worklog dev-backend-notification dev-backend-task

dev-backend-worklog:
	cd ./backend/worklog && ./mvnw liberty:dev

dev-backend-notification:
	cd ./backend/notification && ./mvnw liberty:dev

dev-backend-task:
	cd ./backend/task && ./mvnw liberty:dev

dev-backend-clean:
	cd ./backend/worklog && ./mvnw clean
	cd ./backend/notification && ./mvnw clean
	cd ./backend/task && ./mvnw clean

dev-backend-stop:
	cd ./backend/worklog && ./mvnw liberty:stop
	cd ./backend/notification && ./mvnw liberty:stop
	cd ./backend/task && ./mvnw liberty:stop

check-deps:
	@command -v docker >/dev/null 2>&1 || { echo "Error: Docker not found. Install from https://www.docker.com/products/docker-desktop"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm not found. Install from https://nodejs.org"; exit 1; }
	@command -v java >/dev/null 2>&1 || { echo "Error: Java not found. Install from https://adoptium.net"; exit 1; }
	@command -v git >/dev/null 2>&1 || { echo "Error: Git not found. Install from https://git-scm.com"; exit 1; }
	@docker version --format '{{.Client.Version}}' 2>/dev/null | awk -F. '{if ($$1+0 < 20) print "Warning: Docker v20+ recommended, you have v" $$1}'
	@npm --version 2>/dev/null | awk -F. '{if ($$1+0 < 9) print "Warning: npm v9+ recommended, you have v" $$1}'
	@java -version 2>&1 | awk -F '"' '/version/ {if ($$2+0 < 21) print "Warning: Java v21+ recommended, you have v" $$2}'
	@git --version 2>/dev/null | awk '{if ($$3+0 < 2) print "Warning: Git v2+ recommended, you have v" $$3}'
	@docker info >/dev/null 2>&1 || { echo "Error: Docker is not running. Please start Docker Desktop or install docker."; exit 1; }
	@echo "All dependencies found."

setup: setup-env check-deps setup-mongodb setup-frontend setup-backend

setup-env:
	node ./utils/setup-env.js

setup-docker-compose-env:
	node ./utils/setup-env-docker-compose.js

setup-frontend:
	cd ./frontend && npm install

setup-backend:
	@echo "This will spin up mongodb container using Docker"
	@if [ -z "$$(docker ps -q -f name=csc480-mongodb-container)" ]; then \
		echo "MongoDB container not running, starting it..."; \
		"$(MAKE)" setup-mongodb; \
	else \
		echo "MongoDB container already running, skipping setup."; \
	fi
	cd ./backend/worklog && ./mvnw clean install
	cd ./backend/notification && ./mvnw clean install
	cd ./backend/task && ./mvnw clean install

setup-mongodb dev-mongodb:
	docker compose -f docker-compose.dev.yml up -d

stop-mongodb:
	docker compose -f docker-compose.dev.yml down

clean: clean-backend clean-frontend clean-mongodb

clean-frontend:
	cd frontend && rm -rf node_modules dist .next

clean-backend:
	cd backend/task && ./mvnw clean
	cd backend/worklog && ./mvnw clean
	cd backend/notification && ./mvnw clean

clean-mongodb:
	docker rm -f csc480-mongodb-container || true
	docker compose -f docker-compose.dev.yml down -v

run-docker-compose:
	make setup-docker-compose-env
	docker compose -f docker-compose.yml up -d
	docker ps

stop-docker-compose:
	docker compose -f docker-compose.yml down
