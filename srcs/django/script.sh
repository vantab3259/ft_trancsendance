#!/bin/bash

python manage.py makemigrations
python manage.py migrate
watchmedo auto-restart \
  --patterns="*.py;*.html;*.css;*.js" \
  --recursive \
  --directory=./ \
  -- daphne -b 0.0.0.0 -p 8000 mysite.asgi:application





