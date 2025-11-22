CREATE TABLE `custom_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` text NOT NULL,
	`goal` text NOT NULL,
	`backstory` text NOT NULL,
	`tools` text NOT NULL,
	`allow_delegation` int NOT NULL DEFAULT 0,
	`is_public` int NOT NULL DEFAULT 0,
	`usage_count` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`rating_count` int NOT NULL DEFAULT 0,
	`tags` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`parameters` text NOT NULL,
	`is_public` int NOT NULL DEFAULT 0,
	`usage_count` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`rating_count` int NOT NULL DEFAULT 0,
	`tags` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_tools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_type` varchar(20) NOT NULL,
	`item_id` int NOT NULL,
	`rating` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_agents` ADD CONSTRAINT `custom_agents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_tools` ADD CONSTRAINT `custom_tools_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;