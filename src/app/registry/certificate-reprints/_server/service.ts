import type { certificateReprints } from '@registry/_database';
import withAuth, { requireSessionUserId } from '@/core/platform/withPermission';
import CertificateReprintsRepository from './repository';

type CertificateReprint = typeof certificateReprints.$inferInsert;

class CertificateReprintsService {
	private repository: CertificateReprintsRepository;

	constructor() {
		this.repository = new CertificateReprintsRepository();
	}

	async get(id: string) {
		return withAuth(() => this.repository.findById(id), ['registry', 'admin']);
	}

	async findByStdNo(stdNo: number) {
		return withAuth(
			() => this.repository.findByStdNo(stdNo),
			['registry', 'admin']
		);
	}

	async queryAll(page: number, search: string) {
		return withAuth(
			() => this.repository.queryPaginated(page, search),
			['registry', 'admin']
		);
	}

	async create(data: CertificateReprint) {
		return withAuth(
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
			['registry', 'admin']
		);
	}

	async update(id: string, data: Partial<CertificateReprint>) {
		return withAuth(
			(session) =>
				this.repository.update(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint_updated',
					stdNo: data.stdNo,
				}),
			['registry', 'admin']
		);
	}

	async delete(id: string) {
		return withAuth(
			(session) =>
				this.repository.delete(id, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint_deleted',
				}),
			['registry', 'admin']
		);
	}
}

export const certificateReprintsService = new CertificateReprintsService();
