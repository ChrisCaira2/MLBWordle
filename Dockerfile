# Use the official Node.js image for building the frontend.
FROM node:14 as build

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install production dependencies.
RUN npm install
RUN cd frontend && npm install

# Copy local code to the container image.
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Use the official Python image for running the backend.
FROM python:3.9

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy the built frontend from the previous stage.
COPY --from=build /usr/src/app/frontend/build ./frontend/build

# Copy the backend code to the container image.
COPY . .

# Install Python dependencies.
RUN pip install -r backend/requirements.txt

# Install serve to serve the frontend
RUN npm install -g serve

# Run the web service on container startup.
CMD ["sh", "-c", "serve -s frontend/build & python backend/mlb_stats.py"]
