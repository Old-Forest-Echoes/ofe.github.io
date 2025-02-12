#!/bin/bash
set -e  # Exit on any error

echo "Starting website sync..."

# Clean up all subfolders in current directory
rm -rf */

# Download the website
echo "Downloading website..."
wget --recursive \
     --span-hosts \
     --convert-links \
     --adjust-extension \
     --no-host-directories \
     --domains=barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io,cdn.prod.website-files.com \
     https://barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io/

# Deploy
echo "Committing changes..."
git config --global user.name "GitHub Actions Bot"
git config --global user.email "actions@github.com"
git add .
git commit -m "Update from Webflow [skip ci]"
git push

echo "Sync completed successfully!"
