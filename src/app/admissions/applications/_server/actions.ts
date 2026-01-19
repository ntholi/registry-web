'use server';

import type { ApplicationStatus, applications } from '@/core/database';
import type { ApplicationFilters } from '../_lib/types';
import { applicationsService } from './service';

type Application = typeof applications.$inferInsert;

export async function getApplication(id: string) {
	return applicationsService.get(id);
}

export async function findAllApplications(
	page = 1,
	search = '',
	filters?: ApplicationFilters
) {
	return applicationsService.search(page, search, filters);
}

export async function createApplication(data: Application) {
	return applicationsService.create(data);
}

export async function updateApplication(id: string, data: Application) {
	return applicationsService.update(id, data);
}

export async function deleteApplication(id: string) {
	return applicationsService.delete(id);
}

export async function changeApplicationStatus(
	applicationId: string,
	newStatus: ApplicationStatus,
	notes?: string,
	rejectionReason?: string
) {
	return applicationsService.changeStatus(
		applicationId,
		newStatus,
		notes,
		rejectionReason
	);
}

export async function addApplicationNote(
	applicationId: string,
	content: string
) {
	return applicationsService.addNote(applicationId, content);
}

export async function getApplicationNotes(applicationId: string) {
	return applicationsService.getNotes(applicationId);
}

export async function recordApplicationPayment(
	applicationId: string,
	receiptId: string
) {
	return applicationsService.recordPayment(applicationId, receiptId);
}

export async function getApplicationPaymentInfo(applicationId: string) {
	return applicationsService.getPaymentInfo(applicationId);
}

export async function findApplicationsByApplicant(applicantId: string) {
	return applicationsService.findByApplicant(applicantId);
}

export async function countApplicationsByStatus(status: ApplicationStatus) {
	return applicationsService.countByStatus(status);
}

export async function countPendingApplications() {
	return applicationsService.countPending();
}
