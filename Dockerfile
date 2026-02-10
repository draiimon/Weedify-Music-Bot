# Base image with Node.js
FROM node:20-bullseye

# Install Python3, PIP, and FFmpeg (Required for Music & TTS)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    build-essential \
    python3-dev \
    libtool \
    autoconf \
    automake \
    && rm -rf /var/lib/apt/lists/*

# Install Edge-TTS (Python Dependency)
RUN pip3 install edge-tts

# Create App Directory
WORKDIR /usr/src/app

# Install Node Dependencies
COPY package*.json ./
RUN npm install

# Copy Source Code
COPY . .

# Expose Render Port (Defaults to 10000 if not set, but we use process.env.PORT)
EXPOSE 10000

# Start Bot
CMD ["node", "index.js"]
