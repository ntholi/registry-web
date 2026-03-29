import type { MailTriggerType } from '../_lib/types';
import {
	renderApplicationEmail,
	renderClearanceEmail,
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
import { isTriggerEnabled } from '../settings/_server/repository';

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
	const triggerType = STATUS_TRIGGER_MAP[params.action];
	if (!(await isTriggerEnabled(triggerType))) return;

	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

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
	if (!(await isTriggerEnabled('notification_mirror'))) return;

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
	if (!(await isTriggerEnabled(params.triggerType))) return;

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

type ReferralTriggerParams = {
	referralId: string;
	studentName: string;
	stdNo: number;
	reason: string;
	description: string;
	referrerName: string;
	recipientEmails: string[];
};

export async function triggerReferralCreatedEmail(
	params: ReferralTriggerParams
): Promise<void> {
	if (params.recipientEmails.length === 0) return;

	const portalUrl = `${BASE_URL}/student-services/referrals/${params.referralId}`;
	const reasonLabel = params.reason.replace(/_/g, ' ');

	await triggerGenericEmail({
		to: params.recipientEmails,
		heading: `Student Referral: ${params.studentName} (${params.stdNo})`,
		body: `<p><strong>${params.referrerName}</strong> has referred student <strong>${params.studentName}</strong> (${params.stdNo}) for <strong>${reasonLabel}</strong>.</p><p>${params.description.slice(0, 300)}</p>`,
		ctaText: 'View Referral',
		ctaUrl: portalUrl,
		triggerType: 'referral_created',
		triggerEntityId: params.referralId,
	});
}

type ApplicationTriggerParams = {
	applicationId: string;
	applicantName: string;
	applicantUserId: string;
	programName: string;
	accepted: boolean;
	rejectionReason?: string;
};

export async function triggerApplicationEmail(
	params: ApplicationTriggerParams
): Promise<void> {
	const triggerType: MailTriggerType = params.accepted
		? 'application_accepted'
		: 'application_rejected';

	if (!(await isTriggerEnabled(triggerType))) return;

	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

	if (await mailQueueRepo.isDuplicate(triggerType, params.applicationId))
		return;

	const emails = await resolveUserEmails([params.applicantUserId]);
	if (emails.length === 0) return;

	const portalUrl = `${BASE_URL}/apply`;
	const rendered = await renderApplicationEmail({
		applicantName: params.applicantName,
		programName: params.programName,
		accepted: params.accepted,
		rejectionReason: params.rejectionReason,
		portalUrl,
	});

	await sendEmail({
		to: emails[0],
		subject: rendered.subject,
		htmlBody: rendered.html,
		textBody: rendered.text,
		triggerType,
		triggerEntityId: params.applicationId,
		mailAccountId: primary.id,
	});
}

type ClearanceTriggerParams = {
	clearanceId: number;
	stdNo: number;
	studentName: string;
	department: string;
	approved: boolean;
	clearanceType: 'registration' | 'graduation';
	reason?: string;
};

export async function triggerClearanceEmail(
	params: ClearanceTriggerParams
): Promise<void> {
	const prefix =
		params.clearanceType === 'graduation'
			? 'graduation_clearance'
			: 'clearance';
	const triggerType: MailTriggerType = params.approved
		? (`${prefix}_approved` as MailTriggerType)
		: (`${prefix}_rejected` as MailTriggerType);

	if (!(await isTriggerEnabled(triggerType))) return;

	const primary = await mailAccountRepo.findActivePrimary();
	if (!primary) return;

	const entityId = `${params.clearanceType}_${params.clearanceId}`;
	if (await mailQueueRepo.isDuplicate(triggerType, entityId)) return;

	const email = await resolveStudentEmail(params.stdNo);
	if (!email) return;

	const portalUrl =
		params.clearanceType === 'registration'
			? `${BASE_URL}/student-portal/registration`
			: `${BASE_URL}/student-portal/graduation`;

	const rendered = await renderClearanceEmail({
		studentName: params.studentName,
		stdNo: String(params.stdNo),
		department: params.department,
		approved: params.approved,
		clearanceType: params.clearanceType,
		reason: params.reason,
		portalUrl,
	});

	await sendEmail({
		to: email,
		subject: rendered.subject,
		htmlBody: rendered.html,
		textBody: rendered.text,
		triggerType,
		triggerEntityId: entityId,
		mailAccountId: primary.id,
	});
}
