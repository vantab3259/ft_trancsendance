import os
import sys

sys.path.append('/usr/src/app')

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
import django
django.setup()

from faker import Faker
from mysite.models.user import CustomUser
from random import choice
from datetime import datetime

fake = Faker()

def populate(n=10):
    for i in range(1, n + 1):
        is_online = choice([True, False])
        last_time_check_is_online = datetime.now() if is_online else None

        user = CustomUser.objects.create(
            email=fake.unique.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            pseudo=fake.user_name(),
            phone_number=fake.phone_number(),
            birth_city=fake.city(),
            birth_date=fake.date_of_birth(),
            is_active=True,
            is_online=is_online,
            last_time_check_is_online=last_time_check_is_online,
        )
        user.set_password('user')
        user.save()

        percent_complete = int((i / n) * 100)
        if percent_complete % 10 == 0 or i == n:
            print(f"{percent_complete}%")

if __name__ == '__main__':
    populate(100)
