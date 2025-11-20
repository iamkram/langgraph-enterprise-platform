/**
 * RDS Module
 * 
 * Creates Multi-AZ PostgreSQL database with pgvector extension support,
 * automated backups, and security groups.
 */

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id
  
  ingress {
    description = "PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rds-sg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.name_prefix}-"
  description = "Subnet group for RDS"
  subnet_ids  = var.private_subnet_ids
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# DB Parameter Group for PostgreSQL with pgvector
resource "aws_db_parameter_group" "postgres" {
  name_prefix = "${var.name_prefix}-postgres15-"
  family      = "postgres15"
  description = "PostgreSQL 15 with pgvector support"
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pgvector"
  }
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1s
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres-params"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier_prefix = "${var.name_prefix}-"
  
  # Engine configuration
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Database configuration
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password
  port     = 5432
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High availability
  multi_az = var.multi_az
  
  # Backup configuration
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.postgres.name
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  
  # Deletion protection
  deletion_protection = var.deletion_protection
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres"
  })
  
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.name_prefix}-rds-monitoring-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.alarm_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.name_prefix}-rds-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240 # 10 GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.alarm_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = var.tags
}
