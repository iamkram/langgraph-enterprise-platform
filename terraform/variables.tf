/**
 * Terraform Variables
 */

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# RDS Configuration
variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "langgraph"
}

variable "database_username" {
  description = "Master username for database"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "rds_backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# ECS Configuration
variable "container_image" {
  description = "Docker image for ECS task"
  type        = string
}

variable "container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 3000
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

# ALB Configuration
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

# LangSmith Configuration
variable "langsmith_api_key" {
  description = "LangSmith API key"
  type        = string
  sensitive   = true
}

variable "langsmith_project" {
  description = "LangSmith project name"
  type        = string
  default     = "langgraph-platform"
}

# Jira Configuration
variable "jira_base_url" {
  description = "Jira base URL"
  type        = string
}

variable "jira_email" {
  description = "Jira user email"
  type        = string
  sensitive   = true
}

variable "jira_api_token" {
  description = "Jira API token"
  type        = string
  sensitive   = true
}

variable "jira_project_key" {
  description = "Jira project key"
  type        = string
  default     = "AGENT"
}

variable "jira_webhook_secret" {
  description = "Jira webhook secret for HMAC verification"
  type        = string
  sensitive   = true
}

# Monitoring Configuration
variable "sns_alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
}
