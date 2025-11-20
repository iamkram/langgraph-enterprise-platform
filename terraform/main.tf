/**
 * LangGraph Platform - AWS Infrastructure
 * 
 * Main Terraform configuration for deploying the LangGraph agent platform
 * to AWS ECS Fargate with blue-green deployments, auto-scaling, and monitoring.
 */

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Configure backend in terraform init:
    # terraform init -backend-config="bucket=your-terraform-state-bucket"
    key    = "langgraph-platform/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "LangGraph Platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Local variables
locals {
  name_prefix = "langgraph-${var.environment}"
  
  common_tags = {
    Project     = "LangGraph Platform"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  name_prefix          = local.name_prefix
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  database_name        = var.database_name
  master_username      = var.database_username
  master_password      = var.database_password
  instance_class       = var.rds_instance_class
  allocated_storage    = var.rds_allocated_storage
  multi_az             = var.rds_multi_az
  backup_retention_days = var.rds_backup_retention_days
  
  tags = local.common_tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"
  
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  certificate_arn    = var.acm_certificate_arn
  
  tags = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix             = local.name_prefix
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  alb_target_group_arn    = module.alb.target_group_arn
  alb_security_group_id   = module.alb.security_group_id
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn           = module.iam.ecs_task_role_arn
  
  # Application configuration
  container_image     = var.container_image
  container_port      = var.container_port
  task_cpu            = var.ecs_task_cpu
  task_memory         = var.ecs_task_memory
  desired_count       = var.ecs_desired_count
  min_capacity        = var.ecs_min_capacity
  max_capacity        = var.ecs_max_capacity
  
  # Environment variables
  environment_variables = {
    NODE_ENV                = "production"
    DATABASE_URL            = module.rds.connection_string
    LANGSMITH_API_KEY       = var.langsmith_api_key
    LANGSMITH_PROJECT       = var.langsmith_project
    LANGSMITH_TRACING       = "true"
    JIRA_BASE_URL           = var.jira_base_url
    JIRA_EMAIL              = var.jira_email
    JIRA_API_TOKEN          = var.jira_api_token
    JIRA_PROJECT_KEY        = var.jira_project_key
    JIRA_WEBHOOK_SECRET     = var.jira_webhook_secret
  }
  
  tags = local.common_tags
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix           = local.name_prefix
  ecs_cluster_name      = module.ecs.cluster_name
  ecs_service_name      = module.ecs.service_name
  alb_arn_suffix        = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  sns_alarm_email       = var.sns_alarm_email
  
  tags = local.common_tags
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}
