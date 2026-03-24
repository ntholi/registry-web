import type { DashboardRole } from '@/core/auth/permissions';
import type {
	letterRecipients,
	letters,
	letterTemplates,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import { resolveTemplate } from '../_lib/resolve';
import LetterTemplateRepository, {
	LetterRecipientRepository,
	LetterRepository,
} from './repository';

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

	async generate(
		templateId: string,
		stdNo: number,
		opts: { recipientId?: string; salutation?: string; statusId?: string }
	) {
		return withPermission(async (session) => {
			const [template, studentData] = await Promise.all([
				letterTemplatesService.get(templateId),
				this.repo.getStudentForLetter(stdNo),
			]);

			if (!template) throw new UserFacingError('Template not found');
			if (!studentData) throw new UserFacingError('Student not found');

			const content = resolveTemplate(template.content, studentData);
			const subject = template.subject
				? resolveTemplate(template.subject, studentData)
				: null;
			const salutation = opts.salutation || template.salutation;

			if (opts.recipientId) {
				recipientRepo.incrementPopularity(opts.recipientId);
			}

			const audit = this.buildAuditOptions(session, 'create');
			return this.repo.generate(
				{
					templateId,
					stdNo,
					content,
					subject,
					salutation,
					recipientId: opts.recipientId ?? null,
					statusId: opts.statusId ?? null,
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

	async findByTemplate(templateId: string, page: number, search: string) {
		return withPermission(
			() => this.repo.findByTemplate(templateId, page, search),
			'dashboard'
		);
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

const recipientRepo = new LetterRecipientRepository();

class LetterRecipientService extends BaseService<
	typeof letterRecipients,
	'id'
> {
	private repo: LetterRecipientRepository;

	constructor() {
		const repo = new LetterRecipientRepository();
		super(repo, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { letters: ['create'] },
			deleteAuth: { 'letter-templates': ['update'] },
		});
		this.repo = repo;
	}

	async findByTemplate(templateId: string) {
		return withPermission(
			() => this.repo.findByTemplate(templateId),
			'dashboard'
		);
	}
}

export const letterRecipientsService = serviceWrapper(
	LetterRecipientService,
	'LetterRecipientService'
);
