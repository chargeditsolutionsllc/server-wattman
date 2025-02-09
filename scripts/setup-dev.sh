#!/bin/bash
set -e

echo "Setting up Server Power Monitor development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Create necessary directories
echo "Creating required directories..."
mkdir -p logs config

# Generate example configuration files if they don't exist
if [ ! -f ".env" ]; then
    echo "Generating example .env file..."
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

# Create example server config if it doesn't exist
if [ ! -f "config/servers.json" ]; then
    echo "Creating example server configuration..."
    echo '{
  "servers": [
    {
      "name": "example-server",
      "type": "iLO",
      "ip": "10.0.0.1",
      "username": "admin",
      "password": "CHANGE_ME"
    }
  ]
}' > config/servers.json
    echo "Please update config/servers.json with your server details"
fi

# Start Redis container
echo "Starting Redis container..."
docker compose up -d redis

echo "Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Update config/servers.json with your server details"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "For secure deployment:"
echo "1. Run 'npx ts-node scripts/generate-config.ts' to generate secure configurations"
echo "2. Set up SSL certificates for production"
echo "3. Configure proper firewall rules"
echo ""
echo "Happy monitoring!"
