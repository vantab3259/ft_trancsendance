#!/bin/bash

echo "Starting PostgreSQL..."
docker-entrypoint.sh postgres &  

echo "Waiting for PostgreSQL to start..."

until psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is still starting up - sleeping"
  sleep 5
done

>&2 echo "Postgres is up - executing script"

psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
DO \$\$ DECLARE
    r RECORD;
    custom_user_exists BOOLEAN;
BEGIN
    -- Vérifier si la table mysite_customuser existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_name = 'mysite_customuser'
    ) INTO custom_user_exists;

    -- Si la table n'existe pas, supprimer toutes les autres tables
    IF NOT custom_user_exists THEN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END IF;
END \$\$;
EOF

>&2 echo "Script finished. PostgreSQL is ready."

wait
