-- Create new clearance table without registrationRequestId
CREATE TABLE `clearance` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `department` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `message` text,
  `email_sent` integer DEFAULT false NOT NULL,
  `responded_by` text,
  `response_date` integer,
  `created_at` integer DEFAULT (unixepoch())
);

-- Create registration_clearance mapping table
CREATE TABLE `registration_clearance` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `registration_request_id` integer NOT NULL,
  `clearance_id` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests` (`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`clearance_id`) REFERENCES `clearance` (`id`) ON UPDATE no action ON DELETE cascade
);

-- Create unique index for registration_clearance
CREATE UNIQUE INDEX `registration_clearance_unique` ON `registration_clearance` (`registration_request_id`, `clearance_id`);

-- Migrate data from registration_clearances to new tables
INSERT INTO `clearance` (`id`, `department`, `status`, `message`, `email_sent`, `responded_by`, `response_date`, `created_at`)
SELECT `id`, `department`, `status`, `message`, `email_sent`, `responded_by`, `response_date`, `created_at`
FROM `registration_clearances`;

-- Insert mapping data into registration_clearance
INSERT INTO `registration_clearance` (`registration_request_id`, `clearance_id`, `created_at`)
SELECT `registration_request_id`, `id`, `created_at`
FROM `registration_clearances`;

-- Create new clearance_audit table
CREATE TABLE `clearance_audit` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `clearance_id` integer NOT NULL,
  `previous_status` text,
  `new_status` text NOT NULL,
  `created_by` text NOT NULL,
  `date` integer DEFAULT (unixepoch()) NOT NULL,
  `message` text,
  `modules` text DEFAULT (json_array()) NOT NULL,
  FOREIGN KEY (`clearance_id`) REFERENCES `clearance` (`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE no action ON DELETE set null
);

-- Migrate data from registration_clearance_audit to clearance_audit
INSERT INTO `clearance_audit` (`id`, `clearance_id`, `previous_status`, `new_status`, `created_by`, `date`, `message`, `modules`)
SELECT `id`, `registration_clearance_id`, `previous_status`, `new_status`, `created_by`, `date`, `message`, `modules`
FROM `registration_clearance_audit`;

-- Drop old tables
DROP TABLE `registration_clearance_audit`;
DROP TABLE `registration_clearances`;

-- Add foreign key for responded_by in clearance table
CREATE TABLE `clearance_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `department` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `message` text,
  `email_sent` integer DEFAULT false NOT NULL,
  `responded_by` text,
  `response_date` integer,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `clearance_new` SELECT * FROM `clearance`;
DROP TABLE `clearance`;
ALTER TABLE `clearance_new` RENAME TO `clearance`;
