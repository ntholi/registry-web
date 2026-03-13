import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { entryRequirements } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import EntryRequirementRepository, {
	type EntryRequirementsFilter,
} from './repository';

class EntryRequirementService extends BaseService<
	typeof entryRequirements,
	'id'
> {
	private repo: EntryRequirementRepository;

	constructor() {
		const repo = new EntryRequirementRepository();
		super(repo, {
			byIdAuth: { 'entry-requirements': ['read'] },
			findAllAuth: { 'entry-requirements': ['read'] },
			createAuth: { 'entry-requirements': ['create'] },
			updateAuth: { 'entry-requirements': ['update'] },
			deleteAuth: { 'entry-requirements': ['delete'] },
			activityTypes: {
				create: 'entry_requirement_created',
				update: 'entry_requirement_updated',
				delete: 'entry_requirement_deleted',
			},
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withPermission(
			async () => this.repo.findById(id),
			async (session) =>
				hasSessionPermission(session, 'entry-requirements', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async findAllWithRelations(page: number, search: string) {
		return withPermission(
			async () => this.repo.findAllWithRelations(page, search),
			{ 'entry-requirements': ['read'] }
		);
	}

	async findProgramsWithRequirements(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		return withPermission(
			async () => this.repo.findProgramsWithRequirements(page, search, filter),
			{ 'entry-requirements': ['read'] }
		);
	}

	async findByProgram(programId: number) {
		return withPermission(async () => this.repo.findByProgram(programId), {
			'entry-requirements': ['read'],
		});
	}

	async findByProgramAndCertificate(
		programId: number,
		certificateTypeId: string
	) {
		return withPermission(
			async () =>
				this.repo.findByProgramAndCertificate(programId, certificateTypeId),
			{ 'entry-requirements': ['read'] }
		);
	}

	async findAllForEligibility() {
		return withPermission(
			async () => this.repo.findAllForEligibility(),
			async (session) =>
				hasSessionPermission(session, 'entry-requirements', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async findPublicCoursesData(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		return this.repo.findPublicCoursesData(page, search, filter);
	}

	override async create(data: typeof entryRequirements.$inferInsert) {
		return withPermission(
			async () => {
				const existing = await this.repo.findByProgramAndCertificate(
					data.programId,
					data.certificateTypeId
				);
				if (existing) {
					throw new Error(
						'DUPLICATE_ENTRY_REQUIREMENT: Entry requirement already exists for this program and certificate type'
					);
				}
				return this.repo.create(data);
			},
			{ 'entry-requirements': ['create'] }
		);
	}
}

export const entryRequirementsService = serviceWrapper(
	EntryRequirementService,
	'EntryRequirementService'
);
