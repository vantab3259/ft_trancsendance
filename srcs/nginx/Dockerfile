
FROM nginx:latest

RUN apt-get update && apt-get install -y openssl

RUN mkdir /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/transcendance.key \
    -out /etc/nginx/ssl/transcendance.crt \
    -subj "/CN=testi"


COPY ./nginx.conf /etc/nginx/nginx.conf


