import type { mailTriggerType } from '../_schema/mailQueue';

export type MailTriggerType = (typeof mailTriggerType.enumValues)[number];

export type TriggerCategory = 'student_status' | 'clearance' | 'general';

export type MailTrigger = {
	type: MailTriggerType;
	label: string;
	description: string;
	toggleable: boolean;
	category: TriggerCategory;
};

export const triggerCategories: {
	key: TriggerCategory;
	label: string;
}[] = [
	{ key: 'student_status', label: 'Student Status' },
	{ key: 'clearance', label: 'Clearance' },
	{ key: 'general', label: 'General' },
];

export const mailTriggers: MailTrigger[] = [
	{
		type: 'student_status_created',
		label: 'Student Status Created',
		description: 'Email sent when student submits status request',
		toggleable: true,
		category: 'student_status',
	},
	{
		type: 'student_status_updated',
		label: 'Student Status Updated',
		description: 'Email sent when student updates status request',
		toggleable: true,
		category: 'student_status',
	},
	{
		type: 'student_status_approved',
		label: 'Student Status Approved',
		description: 'Email sent when approver approves status',
		toggleable: true,
		category: 'student_status',
	},
	{
		type: 'student_status_rejected',
		label: 'Student Status Rejected',
		description: 'Email sent when approver rejects status',
		toggleable: true,
		category: 'student_status',
	},
	{
		type: 'clearance_approved',
		label: 'Registration Clearance Approved',
		description: 'Email sent when registration clearance is approved',
		toggleable: true,
		category: 'clearance',
	},
	{
		type: 'clearance_rejected',
		label: 'Registration Clearance Rejected',
		description: 'Email sent when registration clearance is rejected',
		toggleable: true,
		category: 'clearance',
	},
	{
		type: 'graduation_clearance_approved',
		label: 'Graduation Clearance Approved',
		description: 'Email sent when graduation clearance is approved',
		toggleable: true,
		category: 'clearance',
	},
	{
		type: 'graduation_clearance_rejected',
		label: 'Graduation Clearance Rejected',
		description: 'Email sent when graduation clearance is rejected',
		toggleable: true,
		category: 'clearance',
	},
	{
		type: 'notification_mirror',
		label: 'Notification Mirror',
		description: 'In-app notifications mirrored as email',
		toggleable: true,
		category: 'general',
	},
	{
		type: 'manual',
		label: 'Manual',
		description: 'Manually composed emails',
		toggleable: false,
		category: 'general',
	},
	{
		type: 'reply',
		label: 'Reply',
		description: 'Replies to received emails',
		toggleable: false,
		category: 'general',
	},
	{
		type: 'referral_created',
		label: 'Student Referral Created',
		description: 'Email sent when a student referral is created',
		toggleable: true,
		category: 'general',
	},
];

export const toggleableTriggers = mailTriggers.filter((t) => t.toggleable);
