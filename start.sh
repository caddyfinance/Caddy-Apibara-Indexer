#!/bin/bash

# Add Apibara to PATH
export PATH="$HOME/.local/bin:$PATH"

# Install Apibara if not already installed
if ! command -v apibara &> /dev/null; then
    echo "Installing Apibara..."
    curl -sL https://install.apibara.com | bash
fi

# Prepare and build
apibara prepare
apibara build

# Start the indexer
apibara start 