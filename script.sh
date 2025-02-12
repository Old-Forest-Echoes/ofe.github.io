# Download the website with specific file types and convert links
wget -r -k -E -nH \
     --convert-links \
     --span-hosts \
     --domains=barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io,cdn.prod.website-files.com \
     https://barbora-xu-af5e6eb293c41d4bdd0c2e8c4636.webflow.io/
