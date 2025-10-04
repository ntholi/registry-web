ALTER TABLE `student_card_prints` RENAME COLUMN "reference" TO "receipt_no";--> statement-breakpoint
DROP INDEX `student_card_prints_reference_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `student_card_prints_receiptNo_unique` ON `student_card_prints` (`receipt_no`);