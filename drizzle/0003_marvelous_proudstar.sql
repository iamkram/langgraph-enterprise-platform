CREATE TABLE `agent_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_config_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_config_id` int NOT NULL,
	`version_number` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`agent_type` varchar(50) NOT NULL,
	`worker_agents` text,
	`tools` text,
	`security_enabled` int NOT NULL,
	`checkpointing_enabled` int NOT NULL,
	`model_name` varchar(100) NOT NULL,
	`system_prompt` text,
	`max_iterations` int NOT NULL,
	`max_retries` int NOT NULL,
	`change_description` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`description` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `agent_tags` ADD CONSTRAINT `agent_tags_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_tags` ADD CONSTRAINT `agent_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_versions` ADD CONSTRAINT `agent_versions_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_versions` ADD CONSTRAINT `agent_versions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;