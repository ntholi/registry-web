import { auth } from '@/auth';
import type { graduationLists } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { graduationRequestsRepository } from '@/server/graduation/requests/repository';
import type { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';
import GraduationListRepository from './repository';
import {
	checkGoogleSheetsAccess,
	createGraduationSpreadsheet,
	populateGraduationSpreadsheet,
} from './sheet';

type GraduationList = typeof graduationLists.$inferInsert;

class GraduationListService {
	constructor(private readonly repository = new GraduationListRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), []);
	}

	async getAll(params: QueryOptions<typeof graduationLists>) {
		return withAuth(async () => this.repository.query(params), []);
	}

	async create(data: GraduationList) {
		return withAuth(async () => this.repository.create(data), []);
	}

	async update(id: string, data: GraduationList) {
		return withAuth(async () => this.repository.update(id, data), []);
	}

	async delete(id: string) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async populate(id: string) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			const graduationList = await this.repository.findById(id);
			if (!graduationList) {
				throw new Error('Graduation list not found');
			}

			const hasScope = await checkGoogleSheetsAccess(session.user.id);
			if (!hasScope) {
				throw new Error('Google Sheets access not granted');
			}

			const clearedStudents = await graduationRequestsRepository.findAllClearedStudents();

			let spreadsheetId = graduationList.spreadsheetId;
			let spreadsheetUrl = graduationList.spreadsheetUrl;

			if (!spreadsheetId) {
				const result = await createGraduationSpreadsheet(session.user.id, graduationList.name);
				spreadsheetId = result.spreadsheetId;
				spreadsheetUrl = result.spreadsheetUrl;
			}

			await populateGraduationSpreadsheet(session.user.id, spreadsheetId, clearedStudents);

			await this.repository.update(id, {
				spreadsheetId,
				spreadsheetUrl,
				status: 'populated',
				populatedAt: new Date(),
			});

			return {
				spreadsheetId,
				spreadsheetUrl,
				studentCount: clearedStudents.length,
			};
		}, ['registry', 'admin']);
	}

	async checkGoogleSheetsAccess() {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				return false;
			}
			return checkGoogleSheetsAccess(session.user.id);
		}, []);
	}
}

export const graduationListsService = serviceWrapper(GraduationListService, 'GraduationList');
