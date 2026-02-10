#!/bin/bash

# Update package lists
apt-get update && apt-get install -y python3 python3-pip

# Install Python dependencies
pip3 install edge-tts

# Install Node.js dependencies
npm install
