import type { entryRequirements } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
			activityTypes: {
				create: 'entry_requirement_created',
				update: 'entry_requirement_updated',
				delete: 'entry_requirement_deleted',
			},
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(
			async () => this.repo.findById(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findAllWithRelations(page: number, search: string) {
		return withAuth(
			async () => this.repo.findAllWithRelations(page, search),
			['registry', 'marketing', 'admin']
		);
	}

	async findProgramsWithRequirements(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		return withAuth(
			async () => this.repo.findProgramsWithRequirements(page, search, filter),
			['registry', 'marketing', 'admin']
		);
	}

	async findByProgram(programId: number) {
		return withAuth(
			async () => this.repo.findByProgram(programId),
			['registry', 'marketing', 'admin']
		);
	}

	async findByProgramAndCertificate(
		programId: number,
		certificateTypeId: string
	) {
		return withAuth(
			async () =>
				this.repo.findByProgramAndCertificate(programId, certificateTypeId),
			['registry', 'marketing', 'admin']
		);
	}

	async findAllForEligibility() {
		return withAuth(
			async () => this.repo.findAllForEligibility(),
			['registry', 'marketing', 'admin', 'applicant']
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
		return withAuth(async () => {
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
		}, ['registry', 'marketing', 'admin']);
	}
}

export const entryRequirementsService = serviceWrapper(
	EntryRequirementService,
	'EntryRequirementService'
);
