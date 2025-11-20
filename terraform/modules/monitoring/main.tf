/**
 * Monitoring Module
 * 
 * Creates CloudWatch dashboards, alarms, and SNS topics for monitoring.
 */

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.name_prefix}-alarms"
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.sns_alarm_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.sns_alarm_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      # ECS Service CPU
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS CPU Utilization"
        }
      },
      # ECS Service Memory
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS Memory Utilization"
        }
      },
      # ALB Request Count
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "ALB Request Count"
        }
      },
      # ALB Target Response Time
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Target Response Time"
        }
      }
    ]
  })
}

# CloudWatch Alarms - ECS CPU
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.name_prefix}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
  
  tags = var.tags
}

# CloudWatch Alarms - ECS Memory
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.name_prefix}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS memory utilization is too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
  
  tags = var.tags
}

# CloudWatch Alarms - ALB 5XX Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is returning too many 5XX errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }
  
  tags = var.tags
}

# CloudWatch Alarms - ALB Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.name_prefix}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 2
  alarm_description   = "ALB response time is too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  
  tags = var.tags
}

# CloudWatch Alarms - Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "${var.name_prefix}-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "One or more targets are unhealthy"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }
  
  tags = var.tags
}

data "aws_region" "current" {}
