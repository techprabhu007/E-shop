local setup jenkins so i used cloudflared for webhook triggered.
without using access key and secret key instead of i have to use aws sso config for connecting aws and jenkins
#using commands
sudo apt update
sudo apt install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
cloudflared --version
cloudflared tunnel --url http://localhost:8080

npm install
aws configure sso
aws sts get-caller-identity --profile personal-sso
aws sso login --profile personal-sso
asusual using docker commands
docker build
docker run 
