import type { mailTriggerType } from '../_schema/mailQueue';

export type MailTriggerType = (typeof mailTriggerType.enumValues)[number];

export type MailTrigger = {
	type: MailTriggerType;
	label: string;
	description: string;
	toggleable: boolean;
};

export const mailTriggers: MailTrigger[] = [
	{
		type: 'student_status_created',
		label: 'Student Status Created',
		description: 'Email sent when student submits status request',
		toggleable: true,
	},
	{
		type: 'student_status_updated',
		label: 'Student Status Updated',
		description: 'Email sent when student updates status request',
		toggleable: true,
	},
	{
		type: 'student_status_approved',
		label: 'Student Status Approved',
		description: 'Email sent when approver approves status',
		toggleable: true,
	},
	{
		type: 'student_status_rejected',
		label: 'Student Status Rejected',
		description: 'Email sent when approver rejects status',
		toggleable: true,
	},
	{
		type: 'notification_mirror',
		label: 'Notification Mirror',
		description: 'In-app notifications mirrored as email',
		toggleable: true,
	},
	{
		type: 'manual',
		label: 'Manual',
		description: 'Manually composed emails',
		toggleable: false,
	},
	{
		type: 'reply',
		label: 'Reply',
		description: 'Replies to received emails',
		toggleable: false,
	},
	{
		type: 'referral_created',
		label: 'Student Referral Created',
		description: 'Email sent when a student referral is created',
		toggleable: true,
	},
];

export const toggleableTriggers = mailTriggers.filter((t) => t.toggleable);
