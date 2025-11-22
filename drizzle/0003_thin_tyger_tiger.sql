CREATE TABLE `template_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` varchar(100) NOT NULL,
	`featured` int NOT NULL DEFAULT 0,
	`verified` int NOT NULL DEFAULT 0,
	`total_clones` int NOT NULL DEFAULT 0,
	`total_completions` int NOT NULL DEFAULT 0,
	`avg_rating` int NOT NULL DEFAULT 0,
	`total_reviews` int NOT NULL DEFAULT 0,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_metadata_template_id_unique` UNIQUE(`template_id`)
);
--> statement-breakpoint
CREATE TABLE `template_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` varchar(100) NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`helpful` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` varchar(100) NOT NULL,
	`user_id` int NOT NULL,
	`agent_config_id` int,
	`cloned_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`abandoned` int NOT NULL DEFAULT 0,
	CONSTRAINT `template_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `template_reviews` ADD CONSTRAINT `template_reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_usage` ADD CONSTRAINT `template_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_usage` ADD CONSTRAINT `template_usage_agent_config_id_agent_configs_id_fk` FOREIGN KEY (`agent_config_id`) REFERENCES `agent_configs`(`id`) ON DELETE set null ON UPDATE no action;