#!/bin/bash
apt update -y
apt upgrade -y
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker
apt install -y git