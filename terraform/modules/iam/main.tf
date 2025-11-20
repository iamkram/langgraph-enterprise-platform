output "alb_id" { value = aws_lb.main.id }
output "alb_arn" { value = aws_lb.main.arn }
output "alb_arn_suffix" { value = aws_lb.main.arn_suffix }
output "alb_dns_name" { value = aws_lb.main.dns_name }
output "target_group_arn" { value = aws_lb_target_group.blue.arn }
output "target_group_arn_suffix" { value = aws_lb_target_group.blue.arn_suffix }
output "green_target_group_arn" { value = aws_lb_target_group.green.arn }
output "security_group_id" { value = aws_security_group.alb.id }
EOF2
