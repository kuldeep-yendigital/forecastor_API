#!/bin/bash

set -e

mkdir -p ./downloads
cd ./downloads

aws s3 cp s3://$DB_BACKUP_BUCKET/$DB_BACKUP_PATH/YearlyForecaster.csv.zip ./
unzip YearlyForecaster.csv.zip
rm -f YearlyForecaster.csv.zip

aws s3 cp s3://$DB_BACKUP_BUCKET/$DB_BACKUP_PATH/YearlyForecasterComplex.csv.zip ./
unzip YearlyForecasterComplex.csv.zip
rm -f YearlyForecasterComplex.csv.zip

aws s3 cp s3://$DB_BACKUP_BUCKET/$DB_BACKUP_PATH/QuarterlyForecaster.csv.zip ./
unzip QuarterlyForecaster.csv.zip
rm -f QuarterlyForecaster.csv.zip

aws s3 cp s3://$DB_BACKUP_BUCKET/$DB_BACKUP_PATH/QuarterlyForecasterComplex.csv.zip ./
unzip QuarterlyForecasterComplex.csv.zip
rm -f QuarterlyForecasterComplex.csv.zip

# Check for a schema file at /schema.sql and load it
if [[ -e /var/db/schema/schema.sql ]]; then
	echo "Loading schema from /schema.sql"
	cat /var/db/schema/schema.sql
	memsql < /var/db/schema/schema.sql
else
	echo "schema.sql not found"
fi

if [[ -e /var/db/schema/import.sql ]]; then 
	echo "Importing data from /import.sql"
	cat /var/db/schema/import.sql
	memsql < /var/db/schema/import.sql
else
	echo "import.sql not found"
fi