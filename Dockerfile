FROM kkarczmarczyk/node-yarn:latest

# Create app folder
RUN mkdir -p /app
WORKDIR /app

# Install and cache npm dep's
COPY package.json /app/
COPY yarn.lock /app/
RUN yarn

# Copy source files
COPY . /app

EXPOSE 3000

CMD ["npm", "run", "start:production"]