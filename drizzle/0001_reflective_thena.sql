CREATE TABLE `agent_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`agent_type` varchar(50) NOT NULL,
	`worker_agents` text,
	`tools` text,
	`security_enabled` int NOT NULL DEFAULT 1,
	`checkpointing_enabled` int NOT NULL DEFAULT 1,
	`model_name` varchar(100) NOT NULL DEFAULT 'gpt-4o',
	`system_prompt` text,
	`max_iterations` int NOT NULL DEFAULT 10,
	`max_retries` int NOT NULL DEFAULT 3,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_code` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_config_id` int NOT NULL,
	`code_type` varchar(50) NOT NULL,
	`code` text NOT NULL,
	`language` varchar(20) NOT NULL DEFAULT 'python',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_code_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_configs` ADD CONSTRAINT `agent_configs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generated_code` ADD CONSTRAINT `generated_code_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;