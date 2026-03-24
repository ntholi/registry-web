import type { DashboardRole } from '@/core/auth/permissions';
import type { letters, letterTemplates } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import { resolveTemplate } from '../_lib/resolve';
import LetterTemplateRepository, { LetterRepository } from './repository';

class LetterTemplateService extends BaseService<typeof letterTemplates, 'id'> {
	private repo: LetterTemplateRepository;

	constructor() {
		const repo = new LetterTemplateRepository();
		super(repo, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { 'letter-templates': ['create'] },
			updateAuth: { 'letter-templates': ['update'] },
			deleteAuth: { 'letter-templates': ['delete'] },
			activityTypes: {
				create: 'letter_template_created',
				update: 'letter_template_updated',
				delete: 'letter_template_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllActive(role?: DashboardRole) {
		return withPermission(() => this.repo.findAllActive(role), 'dashboard');
	}
}

export const letterTemplatesService = serviceWrapper(
	LetterTemplateService,
	'LetterTemplateService'
);

class LetterService extends BaseService<typeof letters, 'id'> {
	private repo: LetterRepository;

	constructor() {
		const repo = new LetterRepository();
		super(repo, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { letters: ['create'] },
			deleteAuth: { letters: ['delete'] },
			activityTypes: {
				create: 'letter_created',
				delete: 'letter_deleted',
			},
		});
		this.repo = repo;
	}

	async generate(templateId: string, stdNo: number, statusId?: string) {
		return withPermission(async (session) => {
			const [template, studentData] = await Promise.all([
				letterTemplatesService.get(templateId),
				this.repo.getStudentForLetter(stdNo),
			]);

			if (!template) throw new UserFacingError('Template not found');
			if (!studentData) throw new UserFacingError('Student not found');

			const content = resolveTemplate(template.content, studentData);

			const audit = this.buildAuditOptions(session, 'create');
			return this.repo.generate(
				{
					templateId,
					stdNo,
					content,
					statusId: statusId ?? null,
					createdBy: session!.user.id,
				},
				audit
			);
		}, this.createAuth());
	}

	async findByStudent(stdNo: number, page: number, search: string) {
		return withPermission(
			() => this.repo.findByStudent(stdNo, page, search),
			'dashboard'
		);
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repo.getWithRelations(id), 'dashboard');
	}

	async findWithRelations(page: number, search: string) {
		return withPermission(
			() => this.repo.findWithRelations(page, search),
			'dashboard'
		);
	}

	async getStudentForLetter(stdNo: number) {
		return withPermission(
			() => this.repo.getStudentForLetter(stdNo),
			'dashboard'
		);
	}
}

export const lettersService = serviceWrapper(LetterService, 'LetterService');
