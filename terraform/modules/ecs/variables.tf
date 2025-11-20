variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for ECS tasks"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB for metrics"
  type        = string
  default     = ""
}

variable "target_group_arn_suffix" {
  description = "ARN suffix of the target group for metrics"
  type        = string
  default     = ""
}

variable "task_execution_role_arn" {
  description = "ARN of the task execution role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the task role"
  type        = string
}

variable "container_image" {
  description = "Docker image for ECS task"
  type        = string
}

variable "container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization percentage for auto-scaling"
  type        = number
  default     = 80
}

variable "request_count_target_value" {
  description = "Target request count per target for auto-scaling"
  type        = number
  default     = 1000
}

variable "scale_in_cooldown" {
  description = "Cooldown period in seconds for scale-in"
  type        = number
  default     = 300
}

variable "scale_out_cooldown" {
  description = "Cooldown period in seconds for scale-out"
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
