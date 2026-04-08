output "server_ip" {
  value       = aws_eip.app_eip.public_ip
  description = "Your server public IP"
}