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
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(async () => this.repo.findById(id), ['registry', 'admin']);
	}

	async findAllWithRelations(page: number, search: string) {
		return withAuth(
			async () => this.repo.findAllWithRelations(page, search),
			['registry', 'admin']
		);
	}

	async findProgramsWithRequirements(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		return withAuth(
			async () => this.repo.findProgramsWithRequirements(page, search, filter),
			['registry', 'admin']
		);
	}

	async findByProgram(programId: number) {
		return withAuth(
			async () => this.repo.findByProgram(programId),
			['registry', 'admin']
		);
	}

	async findByProgramAndCertificate(
		programId: number,
		certificateTypeId: string
	) {
		return withAuth(
			async () =>
				this.repo.findByProgramAndCertificate(programId, certificateTypeId),
			['registry', 'admin']
		);
	}

	async findAllForEligibility() {
		return withAuth(
			async () => this.repo.findAllForEligibility(),
			['registry', 'admin']
		);
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
		}, ['registry', 'admin']);
	}
}

export const entryRequirementsService = serviceWrapper(
	EntryRequirementService,
	'EntryRequirementService'
);
