PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment_receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`graduation_clearance_id` integer NOT NULL,
	`payment_type` text NOT NULL,
	`receipt_no` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graduation_clearance_id`) REFERENCES `graduation_clearance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_payment_receipts`("id", "graduation_clearance_id", "payment_type", "receipt_no", "created_at") SELECT "id", "graduation_clearance_id", "payment_type", "receipt_no", "created_at" FROM `payment_receipts`;--> statement-breakpoint
DROP TABLE `payment_receipts`;--> statement-breakpoint
ALTER TABLE `__new_payment_receipts` RENAME TO `payment_receipts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;