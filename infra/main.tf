terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_key_pair" "server_key" {
  key_name   = "my-server-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aws_security_group" "app_sg" {
  name        = "app-security-group"
  description = "Allow web + SSH"

  ingress {
    description = "SSH from my IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip}/32"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
  description = "Backend worklog"
  from_port   = 7001
  to_port     = 7001
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

ingress {
  description = "Backend auth"
  from_port   = 7002
  to_port     = 7002
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app_server" {
  ami                    = "ami-0c7217cdde317cfec"
  instance_type          = "t3.small"
  key_name               = aws_key_pair.server_key.key_name
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = file("bootstrap.sh")

  tags = {
    Name = "app-server"
  }
}

resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"
}