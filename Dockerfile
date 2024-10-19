# Use an official Node.js alpine image runtime as the base image
FROM node:20-alpine3.20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock into the working directory
COPY package.json yarn.lock /app

# Install dependencies using Yarn
RUN yarn install

# Copy the rest of the application code into the container
COPY . .


# Build Project
RUN yarn build

# Expose the port on which your app runs (default for Express apps)
EXPOSE 4000

# Generate Prisma client
RUN yarn prisma generate

CMD ["sh", "-c", "yarn prisma migrate deploy && yarn start"]
