'use server';

import { announcementRepliesService as service } from './service';

export async function createReply(data: {
	announcementId: string;
	courseId: string;
	text: string;
}) {
	try {
		const reply = await service.createReply(data);
		return { success: true, data: reply };
	} catch (error) {
		console.error('Failed to create reply:', error);
		return { success: false, error: 'Failed to create reply' };
	}
}

export async function getRepliesByAnnouncementId(announcementId: string) {
	return service.getRepliesByAnnouncementId(announcementId);
}

export async function getReplyCount(announcementId: string) {
	return service.getReplyCount(announcementId);
}
