.PHONY: setup run clean check dev test compile run-backend run-frontend

compile:
	cd apps/spring_api && ./mvnw clean package -DskipTests

run:
	cd apps/spring_api && ./mvnw spring-boot:run & \
	cd apps/frontend_ng && npm start

run-backend:
	cd apps/spring_api && ./mvnw spring-boot:run

run-frontend:
	cd apps/frontend_ng && npm start

test:
	cd apps/spring_api && ./mvnw test

clean:
	rm -rf apps/spring_api target && cd apps/spring_api && ./mvnw clean install
