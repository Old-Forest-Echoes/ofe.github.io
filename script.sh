# Clean up all subfolders in current directory
rm -rf */

# Download the website
wget --recursive \
     --span-hosts \
     --convert-links \
     --adjust-extension \
     --no-host-directories \
     --domains=barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io,cdn.prod.website-files.com \
     https://barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io/

# Deploy
git add .
git commit -m "Update"
git push
