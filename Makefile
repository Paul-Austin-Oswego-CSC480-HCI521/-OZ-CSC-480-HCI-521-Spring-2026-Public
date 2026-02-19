.PHONY: dev dev-frontend dev-backend dev-mongodb setup setup-frontend setup-backend setup-mongodb checkout-latest checkout

dev:
	make dev-mongodb
	make dev-frontend & make dev-backend & wait

dev-frontend:
	cd ./frontend && npm run dev

dev-backend:
	cd ./backend/finish && ./mvnw liberty:dev

dev-mongodb:
	docker start csc480-mongodb-container 2>/dev/null || true

setup: setup-mongodb setup-frontend setup-backend

setup-frontend:
	cd ./frontend && npm install

setup-backend:
	cd ./backend/finish && ./mvnw clean install

setup-mongodb:
	docker rm -f csc480-mongodb-container 2>/dev/null || true
	cd ./backend && docker build -t csc480-mongodb -f assets/Dockerfile .
	docker run --name csc480-mongodb-container -p 27017:27017 -d csc480-mongodb
	sleep 5
	docker cp \
		csc480-mongodb-container:/home/mongodb/certs/truststore.p12 \
		./backend/finish/src/main/liberty/config/resources/security
