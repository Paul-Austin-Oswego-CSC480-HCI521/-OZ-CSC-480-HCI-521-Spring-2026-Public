.PHONY: dev dev-frontend dev-backend dev-mongodb setup setup-frontend setup-backend setup-mongodb checkout-latest checkout clean

dev:
	make dev-mongodb
	make dev-frontend & make dev-backend & wait

dev-frontend:
	cd ./frontend && npm run dev

dev-mongodb:
	docker start csc480-mongodb-container 2>/dev/null || true

dev-backend:
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

setup: check-deps setup-mongodb setup-frontend setup-backend

setup-frontend:
	cd ./frontend && npm install

setup-backend:
	@echo "This will spin up mongodb container using Docker"
	@if [ -z "$$(docker ps -q -f name=csc480-mongodb-container)" ]; then \
		echo "MongoDB container not running, starting it..."; \
		$(MAKE) setup-mongodb; \
	else \
		echo "MongoDB container already running, skipping setup."; \
	fi
	cd ./backend/worklog && ./mvnw clean install
	cd ./backend/notification && ./mvnw clean install
	cd ./backend/task && ./mvnw clean install

setup-mongodb:
	docker rm -f csc480-mongodb-container 2>/dev/null || true
	cd ./backend && docker build -t csc480-mongodb -f assets/Dockerfile .
	docker run --name csc480-mongodb-container -p 27017:27017 -d csc480-mongodb
	sleep 5
	docker cp \
		csc480-mongodb-container:/home/mongodb/certs/truststore.p12 \
		./backend/worklog/src/main/liberty/config/resources/security
	docker cp \
		csc480-mongodb-container:/home/mongodb/certs/truststore.p12 \
		./backend/notification/src/main/liberty/config/resources/security
	docker cp \
		csc480-mongodb-container:/home/mongodb/certs/truststore.p12 \
		./backend/task/src/main/liberty/config/resources/security

clean:
	docker rm -fv csc480-mongodb-container 2>/dev/null || true
	docker rmi -f csc480-mongodb 2>/dev/null || true
	rm -f ./backend/worklog/src/main/liberty/config/resources/security/truststore.p12
	rm -f ./backend/notification/src/main/liberty/config/resources/security/truststore.p12
	rm -f ./backend/task/src/main/liberty/config/resources/security/truststore.p12
	
