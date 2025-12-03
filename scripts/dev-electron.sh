#!/bin/bash

# Electron Development Script
# This script starts the Next.js dev server and Electron app

echo "🚀 Starting KnowFlow Electron Development..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development environment
echo "🔧 Starting Next.js dev server and Electron..."
npm run electron:dev
