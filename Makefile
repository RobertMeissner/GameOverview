.PHONY: setup run clean check dev test compile run-backend run-frontend

compile:
	cd apps/api && ./mvnw clean package -DskipTests

run:
	fuser -k 8080/tcp & \
	fuser -k 4200/tcp & \
	cd apps/api && ./mvnw spring-boot:run & \
	cd apps/frontend && bun run start

run-backend:
	cd apps/api && ./mvnw spring-boot:run

run-frontend:
	cd apps/frontend && bun run start
	# ➜  htmx-test git:(vibe/htmx-exploration-361fae) ✗ python3 -m http.server 4200

test:
	cd apps/api && ./mvnw test
	cd apps/frontend && bun run test

clean:
	rm -rf apps/api/target && cd apps/api && ./mvnw clean install
