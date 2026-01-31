#!/bin/bash

git config --global --add safe.directory /opt/apps/chat-assist

echo pwd
# Navigate to the directory
echo "----------------------- Changing directory to /opt/apps/chat-assist... -----------------------"
cd /opt/apps/chat-assist
echo changed dir to: $(pwd)
echo user: $(whoami)
nvm use v20

echo "----------------------- Current directory: $(pwd) -----------------------"
# zip -r backup_build.zip dist/
echo "----------------------- Current directory: $(pwd) -----------------------"
ls -ltr

# Add Node.js tools to PATH
# export PATH=$PATH:/root/.nvm/versions/node/v18.17.0/bin
echo yarn: $(which yarn)
echo node: $(which node)
echo npm: $(which npm)

# Pull the latest code from the repository
echo "----------------------- Pulling the latest code from the repository... -----------------------"
git reset --hard && git checkout release/chat-assist-prod && git pull --all

echo "----------------------- Current directory: $(pwd) -----------------------"
echo "----------------------- backup build initiated. -----------------------"
# zip -r backup_build.zip dist/
if [ $? -ne 0 ]; then
    echo "----------------------- Build backup failed. -----------------------"
fi

echo "----------------------- Current directory: $(pwd) -----------------------"
ls -ltr


# Check if the git operations were successful
if [ $? -ne 0 ]; then
    echo "----------------------- Git operations failed. Exiting... -----------------------"
    exit 1
fi

# Install the dependencies
echo "----------------------- Installing dependencies... -----------------------"
yarn

# Check if the installation was successful
if [ $? -ne 0 ]; then
    echo "----------------------- Dependency installation failed. Exiting... -----------------------"
    exit 1
fi

# Build the project
echo "----------------------- Building the project... -----------------------"
yarn build:prod

# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "----------------------- Build failed. Rollback to last version changes ... -----------------------"
    echo "----------------------- Rollback initiated ... -----------------------"
    # unzip backup_build.zip -d dist
    echo "----------------------- Rollback successful ... -----------------------"
    exit 1
fi

# Restart the pm2 process
echo "----------------------- Restarting the pm2 process for 'chat-assist'... -----------------------"
pm2 restart chat-assist

# Create a CloudFront invalidation
echo "----------------------- Creating a CloudFront invalidation... -----------------------"
# aws cloudfront create-invalidation --distribution-id E12538MTU1RKKZ --paths '/*'

# Check if the CloudFront invalidation was successful
if [ $? -ne 0 ]; then
    echo "----------------------- CloudFront invalidation failed. Exiting... -----------------------"
    exit 1
fi

echo "----------------------- Deployment completed successfully! -----------------------"
