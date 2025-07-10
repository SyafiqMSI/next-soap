#!/bin/sh

echo "Starting SOAP Server..."
cd /app/server && node server.js &

sleep 5

echo "Starting Frontend..."
cd /app && npm start 