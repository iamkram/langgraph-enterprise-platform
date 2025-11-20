CREATE TABLE `agent_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_config_id` int NOT NULL,
	`version` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`jira_issue_key` varchar(100),
	`jira_issue_id` varchar(100),
	`embedding` text,
	`approved_by` varchar(255),
	`approved_at` timestamp,
	`deployed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_registry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`agent_config_id` int,
	`total_executions` int NOT NULL DEFAULT 0,
	`total_tokens` int NOT NULL DEFAULT 0,
	`avg_execution_time_ms` int,
	`unique_users` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_config_id` int NOT NULL,
	`user_id` int NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`model_name` varchar(100),
	`tokens_used` int,
	`execution_time_ms` int,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(255) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`issue_key` varchar(100),
	`issue_id` varchar(100),
	`status` varchar(50),
	`payload` text NOT NULL,
	`processed` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_events_event_id_unique` UNIQUE(`event_id`)
);
--> statement-breakpoint
ALTER TABLE `agent_configs` ADD `agent_status` varchar(50) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_configs` ADD `jira_issue_key` varchar(100);--> statement-breakpoint
ALTER TABLE `agent_registry` ADD CONSTRAINT `agent_registry_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_metrics` ADD CONSTRAINT `daily_metrics_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_logs` ADD CONSTRAINT `usage_logs_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_logs` ADD CONSTRAINT `usage_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;