# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "${var.name_prefix}-ecs-exec-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  tags = var.tags
}
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  name_prefix = "${var.name_prefix}-ecs-task-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  tags = var.tags
}
resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow"; Action = ["s3:*"]; Resource = "*" },
      { Effect = "Allow"; Action = ["secretsmanager:GetSecretValue"]; Resource = "*" }
    ]
  })
}
EOF3
