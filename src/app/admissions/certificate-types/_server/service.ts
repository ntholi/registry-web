import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { certificateTypes, gradeMappings } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import CertificateTypeRepository from './repository';

type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};

class CertificateTypeService extends BaseService<
	typeof certificateTypes,
	'id'
> {
	private repo: CertificateTypeRepository;

	constructor() {
		const repo = new CertificateTypeRepository();
		super(repo, {
			byIdAuth: { 'certificate-types': ['read'] },
			findAllAuth: { 'certificate-types': ['read'] },
			createAuth: { 'certificate-types': ['create'] },
			updateAuth: { 'certificate-types': ['update'] },
			deleteAuth: { 'certificate-types': ['delete'] },
			activityTypes: {
				create: 'certificate_type_created',
				update: 'certificate_type_updated',
				delete: 'certificate_type_deleted',
			},
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withPermission(
			async () => this.repo.findById(id),
			async (session) =>
				hasSessionPermission(session, 'certificate-types', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async search(page: number, search: string) {
		return withPermission(
			async () => this.repo.search(page, search),
			async (session) =>
				hasSessionPermission(session, 'certificate-types', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async createWithMappings(
		data: typeof certificateTypes.$inferInsert,
		mappings?: GradeMapping[]
	) {
		return withPermission(
			async (session) => {
				if (data.lqfLevel < 4) {
					throw new Error('INVALID_LQF_LEVEL: LQF level must be 4 or higher');
				}

				return this.repo.createWithMappings(
					data,
					mappings,
					this.buildAuditOptions(session, 'create')
				);
			},
			{ 'certificate-types': ['create'] }
		);
	}

	async findByName(name: string) {
		return this.repo.findByName(name);
	}

	async updateWithMappings(
		id: string,
		data: Partial<typeof certificateTypes.$inferInsert>,
		mappings?: GradeMapping[]
	) {
		return withPermission(
			async (session) => {
				if (data.lqfLevel !== undefined && data.lqfLevel < 4) {
					throw new Error('INVALID_LQF_LEVEL: LQF level must be 4 or higher');
				}

				return this.repo.updateWithMappings(
					id,
					data,
					mappings,
					this.buildAuditOptions(session, 'update')
				);
			},
			{ 'certificate-types': ['update'] }
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const isInUse = await this.repo.isInUse(id);
				if (isInUse) {
					throw new Error(
						'CERTIFICATE_TYPE_IN_USE: Cannot delete certificate type in use'
					);
				}

				return this.repo.delete(id, this.buildAuditOptions(session, 'delete'));
			},
			{ 'certificate-types': ['delete'] }
		);
	}

	async isInUse(id: string) {
		return withPermission(async () => this.repo.isInUse(id), {
			'certificate-types': ['read'],
		});
	}

	async mapGrade(certificateTypeId: string, originalGrade: string) {
		return withPermission(
			async () => this.repo.mapGrade(certificateTypeId, originalGrade),
			async (session) =>
				hasSessionPermission(session, 'certificate-types', 'read', [
					'applicant',
					'user',
				])
		);
	}
}

export const certificateTypesService = serviceWrapper(
	CertificateTypeService,
	'CertificateTypeService'
);
