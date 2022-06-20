#!/bin/bash
source /root/.bashrc
chmod -R 777 /var/www/forecaster-api
cd /var/www/forecaster-api
npm install -g forever
forever start ./index.js --env $(cat /etc/forecaster_env)