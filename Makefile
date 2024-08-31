DOCKER_COMPOSE_FILE=/mnt/nfs/homes/mudoh/Desktop/ft_transcendance/srcs/docker-compose.yml
SSL_FOLDER=/mnt/nfs/homes/mudoh/Desktop/ft_transcendance/srcs/nginx/certs
CREATE_KEY_SSL=openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./srcs/nginx/certs/transcendance.key -out ./srcs/nginx/certs/transcendance.crt -subj "/CN=testi"

build:
	mkdir -p $(SSL_FOLDER)
	$(CREATE_KEY_SSL)
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

clean: down
	if [ -n "$(CONTAINERS)" ]; then docker rm -f $(CONTAINERS); fi
	if [ -n "$(VOLUMES)" ]; then docker volume rm -f $(VOLUMES); fi
	if [ -n "$(IMAGES)" ]; then docker image rm -f $(IMAGES); fi
	docker system prune -a --volumes -f
	rm -rf srcs/nginx/certs

re: clean
	$(MAKE) build

revolume: down
	if [ -n "$(VOLUMES)" ]; then docker volume rm -f $(VOLUMES); fi
	sudo rm -rf $(SSL_FOLDER)
	$(MAKE) build

.PHONY: up build down clean re revolume logs