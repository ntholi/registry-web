import type { certificateReprints } from '@registry/_database';
import withAuth from '@/core/platform/withAuth';
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
		return withAuth(() => this.repository.create(data), ['registry', 'admin']);
	}

	async update(id: number, data: Partial<CertificateReprint>) {
		return withAuth(
			() => this.repository.update(id, data),
			['registry', 'admin']
		);
	}

	async delete(id: number) {
		return withAuth(() => this.repository.delete(id), ['registry', 'admin']);
	}
}

export const certificateReprintsService = new CertificateReprintsService();
