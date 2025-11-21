CREATE TABLE `schedule_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schedule_id` int NOT NULL,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failure') NOT NULL,
	`result` text,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `schedules` RENAME COLUMN `input_data` TO `input`;--> statement-breakpoint
ALTER TABLE `schedules` RENAME COLUMN `enabled` TO `is_active`;--> statement-breakpoint
ALTER TABLE `schedules` RENAME COLUMN `last_run_at` TO `last_executed_at`;--> statement-breakpoint
ALTER TABLE `schedules` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `notify_on_completion` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `next_run_at`;