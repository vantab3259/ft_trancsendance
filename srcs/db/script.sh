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
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
EOF

>&2 echo "Tables dropped. PostgreSQL is ready."


wait
