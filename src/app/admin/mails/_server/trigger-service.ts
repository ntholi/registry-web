import type { MailTriggerType } from '../_lib/types';
import {
	renderGenericEmail,
	renderNotificationEmail,
	renderStudentStatusEmail,
} from '../_templates/render';
import { sendEmail } from '../accounts/_server/gmail-client';
import { mailAccountRepo } from '../accounts/_server/repository';
import {
	mailQueueRepo,
	resolveApproverEmails,
	resolveStudentEmail,
	resolveUserEmails,
} from '../queues/_server/repository';

const BASE_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

const BATCH_SIZE = 450;

const STATUS_TRIGGER_MAP: Record<
	StudentStatusTriggerParams['action'],
	MailTriggerType
> = {
	created: 'student_status_created',
	updated: 'student_status_updated',
	approved: 'student_status_approved',
	rejected: 'student_status_rejected',
};

type StudentStatusTriggerParams = {
	stdNo: number;
	studentName: string;
	statusId: string;
	statusType: string;
	action: 'created' | 'updated' | 'approved' | 'rejected';
	reason?: string;
	approverName?: string;
};

type NotificationTriggerParams = {
	notificationId: number;
	title: string;
	message: string;
	link?: string;
	senderName?: string;
	recipientUserIds?: string[];
};

type GenericTriggerParams = {
	to: string | string[];
	heading: string;
	body: string;
	ctaText?: string;
	ctaUrl?: string;
	triggerType: MailTriggerType;
	triggerEntityId?: string;
};

export async function triggerStudentStatusEmail(
	params: StudentStatusTriggerParams
): Promise<void> {
	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

	const triggerType = STATUS_TRIGGER_MAP[params.action];

	if (await mailQueueRepo.isDuplicate(triggerType, params.statusId)) return;

	let recipients: string[];
	if (params.action === 'created' || params.action === 'updated') {
		recipients = await resolveApproverEmails(params.statusId);
	} else {
		const email = await resolveStudentEmail(params.stdNo);
		recipients = email ? [email] : [];
	}

	if (recipients.length === 0) return;

	const portalUrl = `${BASE_URL}/registry/student-statuses/${params.statusId}`;
	const rendered = await renderStudentStatusEmail({
		studentName: params.studentName,
		stdNo: String(params.stdNo),
		statusType: params.statusType,
		action: params.action,
		reason: params.reason,
		approverName: params.approverName,
		portalUrl,
	});

	await sendEmail({
		to: recipients,
		subject: rendered.subject,
		htmlBody: rendered.html,
		textBody: rendered.text,
		triggerType,
		triggerEntityId: params.statusId,
		mailAccountId: primary.id,
	});
}

export async function triggerNotificationEmail(
	params: NotificationTriggerParams
): Promise<void> {
	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

	if (
		await mailQueueRepo.isDuplicate(
			'notification_mirror',
			String(params.notificationId)
		)
	)
		return;

	const recipients = params.recipientUserIds?.length
		? await resolveUserEmails(params.recipientUserIds)
		: [];

	if (recipients.length === 0) return;

	const rendered = await renderNotificationEmail({
		title: params.title,
		message: params.message,
		link: params.link,
		senderName: params.senderName,
	});

	for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
		const batch = recipients.slice(i, i + BATCH_SIZE);
		await sendEmail({
			to: batch[0],
			bcc: batch.length > 1 ? batch.slice(1) : undefined,
			subject: rendered.subject,
			htmlBody: rendered.html,
			textBody: rendered.text,
			triggerType: 'notification_mirror',
			triggerEntityId: String(params.notificationId),
			mailAccountId: primary.id,
		});
	}
}

export async function triggerGenericEmail(
	params: GenericTriggerParams
): Promise<void> {
	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

	const rendered = await renderGenericEmail({
		heading: params.heading,
		body: params.body,
		ctaText: params.ctaText,
		ctaUrl: params.ctaUrl,
	});

	await sendEmail({
		to: params.to,
		subject: rendered.subject,
		htmlBody: rendered.html,
		textBody: rendered.text,
		triggerType: params.triggerType,
		triggerEntityId: params.triggerEntityId,
		mailAccountId: primary.id,
	});
}
