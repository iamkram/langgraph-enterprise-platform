variable "name_prefix" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "target_port" { type = number; default = 3000 }
variable "certificate_arn" { type = string; default = "" }
variable "enable_deletion_protection" { type = bool; default = false }
variable "tags" { type = map(string); default = {} }
EOF
