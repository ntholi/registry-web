import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TermRepository, {
	type TermInsert,
	type TermQueryOptions,
} from './repository';

class TermService {
	constructor(private readonly repository = new TermRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), []);
	}

	async getActive() {
		return withAuth(async () => this.repository.getActive(), ['all']);
	}

	async findAll(params: TermQueryOptions) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async getAll() {
		return withAuth(async () => this.repository.findAll(), ['dashboard']);
	}

	async create(data: TermInsert) {
		return withAuth(async () => this.repository.create(data), []);
	}

	async update(id: number, data: Partial<TermInsert>) {
		return withAuth(async () => this.repository.update(id, data), []);
	}

	async delete(id: number) {
		return withAuth(async () => {
			const term = await this.repository.findById(id);
			await this.repository.delete(id);
			return term;
		}, []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const termsService = serviceWrapper(TermService, 'TermsService');
