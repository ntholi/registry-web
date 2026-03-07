'use server';

import { createNotification } from '@admin/notifications/_server/actions';
import { auth } from '@/core/auth';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import { getPublicUrl, StoragePaths } from '@/core/integrations/storage-utils';
import { termSettingsService as service } from './service';

export async function getTermSettings(termId: number) {
	return service.findByTermId(termId);
}

export async function updateResultsPublished(
	termId: number,
	published: boolean
) {
	return service.updateResultsPublished(termId, published);
}

interface PublishOptions {
	sendNotification: boolean;
	closeGradebook: boolean;
	moveRejectedToBlocked: boolean;
}

export async function updateResultsPublishedWithNotification(
	termId: number,
	published: boolean,
	termCode: string,
	options: PublishOptions
) {
	const result = await service.updateResultsPublished(termId, published);

	if (published) {
		if (options.closeGradebook) {
			await service.updateGradebookAccess(termId, false);
		}

		if (options.moveRejectedToBlocked) {
			await service.moveRejectedToBlocked(termId);
		}

		if (options.sendNotification) {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('Unauthorized');
			}

			const visibleFrom = new Date();
			const visibleUntil = new Date();
			visibleUntil.setMonth(visibleUntil.getMonth() + 3);

			await createNotification({
				title: 'Results Published',
				message: `Results for term ${termCode} have been published. Click to view your transcript.`,
				link: `/student-portal/transcripts?term=${termCode}`,
				targetType: 'role',
				targetRoles: ['student'],
				visibleFrom,
				visibleUntil,
				isActive: true,
			});
		}
	}

	return result;
}

export async function updateGradebookAccess(termId: number, access: boolean) {
	return service.updateGradebookAccess(termId, access);
}

export async function moveRejectedToBlocked(termId: number) {
	return service.moveRejectedToBlocked(termId);
}

export async function getUnpublishedTermCodes() {
	return service.getUnpublishedTermCodes();
}

export async function getPublicationAttachments(termCode: string) {
	const attachments = await service.getPublicationAttachments(termCode);
	return attachments.map((att) => ({
		...att,
		url: getPublicUrl(
			att.storageKey ||
				StoragePaths.termPublication(att.termCode, att.type, att.fileName)
		),
	}));
}

export async function savePublicationAttachment(data: {
	termCode: string;
	fileName: string;
	type: 'scanned-pdf' | 'raw-marks' | 'other';
	storageKey?: string;
}) {
	return service.createPublicationAttachment(data);
}

export async function uploadPublicationAttachment(data: {
	termCode: string;
	file: File;
	type: 'scanned-pdf' | 'raw-marks' | 'other';
}) {
	const key = StoragePaths.termPublication(
		data.termCode,
		data.type,
		data.file.name
	);
	await uploadFile(data.file, key);
	return service.createPublicationAttachment({
		termCode: data.termCode,
		fileName: data.file.name,
		type: data.type,
		storageKey: key,
	});
}

export async function deletePublicationAttachment(id: string) {
	return service.deletePublicationAttachment(id);
}

export async function deletePublicationAttachmentWithFile(id: string) {
	const attachment = await service.getPublicationAttachment(id);
	if (attachment?.storageKey) {
		await deleteFile(attachment.storageKey);
	} else if (attachment) {
		const fallbackKey = StoragePaths.termPublication(
			attachment.termCode,
			attachment.type,
			attachment.fileName
		);
		await deleteFile(fallbackKey);
	}

	return service.deletePublicationAttachment(id);
}
