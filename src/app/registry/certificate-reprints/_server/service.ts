import type { certificateReprints } from '@registry/_database';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import CertificateReprintsRepository from './repository';

type CertificateReprint = typeof certificateReprints.$inferInsert;

class CertificateReprintsService {
	private repository: CertificateReprintsRepository;

	constructor() {
		this.repository = new CertificateReprintsRepository();
	}

	async get(id: number) {
		return withAuth(() => this.repository.findById(id), ['registry', 'admin']);
	}

	async findByStdNo(stdNo: number) {
		return withAuth(
			() => this.repository.findByStdNo(stdNo),
			['registry', 'admin']
		);
	}

	async create(data: CertificateReprint) {
		return withAuth(
			(session) =>
				this.repository.create(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint',
					stdNo: data.stdNo,
				}),
			['registry', 'admin']
		);
	}

	async update(id: number, data: Partial<CertificateReprint>) {
		return withAuth(
			(session) =>
				this.repository.update(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint',
					stdNo: data.stdNo,
				}),
			['registry', 'admin']
		);
	}

	async delete(id: number) {
		return withAuth(
			(session) =>
				this.repository.delete(id, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'certificate_reprint',
				}),
			['registry', 'admin']
		);
	}
}

export const certificateReprintsService = new CertificateReprintsService();
