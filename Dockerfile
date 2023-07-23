FROM node:lts

# Create and switch to your application directory
# that will exist inside your Docker container.
WORKDIR /usr/src/app

# Copy your source file(s) to this directory
# This assumes that this Dockerfile is at the same level as your server file.
# This will probably change
COPY All_Project_Code/components/index.js ./
COPY All_Project_Code/components/resources/ ./resources
COPY All_Project_Code/components/.env ./
COPY All_Project_Code/components/views/ ./views
COPY All_Project_Code/components/package.json ./
COPY All_Project_Code/components/package-lock.json ./

ENV NODE_ENV production
RUN npm clean-install --only=production

# Expose port 80, the default port for a web server to listen on.
EXPOSE 80

# Start up your application
CMD ["node", "index.js"]