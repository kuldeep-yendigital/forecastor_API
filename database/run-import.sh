#!/bin/bash

docker exec memsql-db /bin/sh -c "/var/db/scripts/import.sh"
docker exec memsql-db /bin/sh -c "/var/db/scripts/cleanup.sh"