FROM python:3.11

WORKDIR /usr/src/app

# Copier les fichiers de configuration
COPY requirements.txt ./

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Installer Redis
RUN apt-get update && apt-get install -y redis-server && apt-get clean && rm -rf /var/lib/apt/lists/* && apt-get install -y redis-tools

# Copier le reste du code
COPY . .

# Copier script.sh dans un répertoire non affecté par le volume monté
COPY script.sh /usr/local/bin/script.sh
RUN chmod +x /usr/local/bin/script.sh

ENTRYPOINT ["/usr/local/bin/script.sh"]
