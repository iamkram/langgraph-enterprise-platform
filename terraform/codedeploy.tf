/**
 * CodeDeploy Configuration
 * 
 * Configures blue-green deployments with canary patterns and automatic rollback.
 */

# IAM Role for CodeDeploy
resource "aws_iam_role" "codedeploy" {
  name_prefix = "${local.name_prefix}-codedeploy-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codedeploy.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "codedeploy" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

# CodeDeploy Application
resource "aws_codedeploy_app" "main" {
  compute_platform = "ECS"
  name             = "${local.name_prefix}-app"
  
  tags = local.common_tags
}

# CodeDeploy Deployment Group
resource "aws_codedeploy_deployment_group" "main" {
  app_name               = aws_codedeploy_app.main.name
  deployment_group_name  = "${local.name_prefix}-deployment-group"
  service_role_arn       = aws_iam_role.codedeploy.arn
  deployment_config_name = "CodeDeployDefault.ECSCanary10Percent5Minutes"
  
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  }
  
  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    
    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }
  
  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
  
  ecs_service {
    cluster_name = module.ecs.cluster_name
    service_name = module.ecs.service_name
  }
  
  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [module.alb.listener_arn]
      }
      
      target_group {
        name = module.alb.target_group_name
      }
      
      target_group {
        name = module.alb.green_target_group_name
      }
    }
  }
  
  # Alarm-based rollback
  alarm_configuration {
    enabled = true
    alarms  = [
      module.monitoring.ecs_cpu_alarm_name,
      module.monitoring.ecs_memory_alarm_name,
      module.monitoring.alb_5xx_alarm_name,
    ]
    ignore_poll_alarm_failure = false
  }
  
  tags = local.common_tags
}

# CloudWatch Alarm for Deployment Rollback - High Error Rate
resource "aws_cloudwatch_metric_alarm" "deployment_errors" {
  alarm_name          = "${local.name_prefix}-deployment-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Trigger rollback if too many errors during deployment"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    LoadBalancer = module.alb.alb_arn_suffix
    TargetGroup  = module.alb.target_group_arn_suffix
  }
  
  tags = local.common_tags
}

# CloudWatch Alarm for Deployment Rollback - High Response Time
resource "aws_cloudwatch_metric_alarm" "deployment_latency" {
  alarm_name          = "${local.name_prefix}-deployment-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 3
  alarm_description   = "Trigger rollback if response time is too high during deployment"
  
  dimensions = {
    LoadBalancer = module.alb.alb_arn_suffix
  }
  
  tags = local.common_tags
}

# Deployment Configuration - Custom Canary Pattern
resource "aws_codedeploy_deployment_config" "canary_10_15" {
  deployment_config_name = "${local.name_prefix}-canary-10-15"
  compute_platform       = "ECS"
  
  traffic_routing_config {
    type = "TimeBasedCanary"
    
    time_based_canary {
      interval   = 15
      percentage = 10
    }
  }
}

# Deployment Configuration - Linear Pattern
resource "aws_codedeploy_deployment_config" "linear_10_5" {
  deployment_config_name = "${local.name_prefix}-linear-10-5"
  compute_platform       = "ECS"
  
  traffic_routing_config {
    type = "TimeBasedLinear"
    
    time_based_linear {
      interval   = 5
      percentage = 10
    }
  }
}

# SNS Topic for Deployment Notifications
resource "aws_sns_topic" "deployments" {
  name = "${local.name_prefix}-deployments"
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "deployment_email" {
  count = var.sns_alarm_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.deployments.arn
  protocol  = "email"
  endpoint  = var.sns_alarm_email
}

# CloudWatch Event Rule for Deployment State Changes
resource "aws_cloudwatch_event_rule" "deployment_state_change" {
  name        = "${local.name_prefix}-deployment-state-change"
  description = "Capture CodeDeploy deployment state changes"
  
  event_pattern = jsonencode({
    source      = ["aws.codedeploy"]
    detail-type = ["CodeDeploy Deployment State-change Notification"]
    detail = {
      application = [aws_codedeploy_app.main.name]
    }
  })
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "deployment_sns" {
  rule      = aws_cloudwatch_event_rule.deployment_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.deployments.arn
}

resource "aws_sns_topic_policy" "deployment_events" {
  arn = aws_sns_topic.deployments.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.deployments.arn
    }]
  })
}
