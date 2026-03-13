import type { certificateReprints } from '@registry/_database';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
import CertificateReprintsRepository from './repository';

type CertificateReprint = typeof certificateReprints.$inferInsert;

class CertificateReprintsService {
	private repository: CertificateReprintsRepository;

	constructor() {
		this.repository = new CertificateReprintsRepository();
	}

	async get(id: string) {
		return withPermission(() => this.repository.findById(id), {
			'certificate-reprints': ['read'],
		});
	}

	async findByStdNo(stdNo: number) {
		return withPermission(() => this.repository.findByStdNo(stdNo), {
			'certificate-reprints': ['read'],
		});
	}

	async queryAll(page: number, search: string) {
		return withPermission(() => this.repository.queryPaginated(page, search), {
			'certificate-reprints': ['read'],
		});
	}

	async create(data: CertificateReprint) {
		return withPermission(
			async (session) => {
				const hasGradDate = await this.repository.hasGraduationDate(data.stdNo);
				if (!hasGradDate) {
					throw new Error(
						'Student does not have a graduation date. Certificate reprints can only be created for graduated students.'
					);
				}
				const userId = requireSessionUserId(session);
				return this.repository.create(
					{ ...data, createdBy: userId },
					{
						userId,
						role: session!.user!.role!,
						activityType: 'certificate_reprint_created',
						stdNo: data.stdNo,
					}
				);
			},
			{ 'certificate-reprints': ['create'] }
		);
	}

	async update(id: string, data: Partial<CertificateReprint>) {
		return withPermission(
			(session) =>
				this.repository.update(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint_updated',
					stdNo: data.stdNo,
				}),
			{ 'certificate-reprints': ['update'] }
		);
	}

	async delete(id: string) {
		return withPermission(
			(session) =>
				this.repository.delete(id, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint_deleted',
				}),
			{ 'certificate-reprints': ['delete'] }
		);
	}
}

export const certificateReprintsService = new CertificateReprintsService();
