# Variables
DEV_COMPOSE = docker/dev/docker-compose.yml
PROD_COMPOSE = docker/prod/docker-compose.yml

# Comandos de desarrollo
dev-up:
	docker compose -f $(DEV_COMPOSE) up -d

dev-down:
	docker compose -f $(DEV_COMPOSE) down

dev-build:
	docker compose -f $(DEV_COMPOSE) build

dev-logs:
	docker compose -f $(DEV_COMPOSE) logs -f

# Comandos de producción
prod-up:
	docker compose -f $(PROD_COMPOSE) up -d

prod-down:
	docker compose -f $(PROD_COMPOSE) down

prod-build:
	docker compose -f $(PROD_COMPOSE) build

prod-logs:
	docker compose -f $(PROD_COMPOSE) logs -f

# Despliegue en producción (zero downtime)
prod-deploy:
	docker compose -f $(PROD_COMPOSE) build
	docker compose -f $(PROD_COMPOSE) up -d --no-deps --scale app=2 --no-recreate

# Comandos generales
stop-all:
	docker compose -f $(DEV_COMPOSE) down
	docker compose -f $(PROD_COMPOSE) down

clean:
	docker system prune -f

.PHONY: dev-up dev-down dev-build dev-logs prod-up prod-down prod-build prod-logs prod-deploy stop-all clean