import type { PgTable as Table } from 'drizzle-orm/pg-core';
import type { Session } from '@/core/auth';
import type { AuthRequirement } from '@/core/auth/permissions';
import type BaseRepository from './BaseRepository';
import type { AuditOptions, QueryOptions } from './BaseRepository';
import { withPermission } from './withPermission';

type ModelInsert<T extends Table> = T['$inferInsert'];
type ModelSelect<T extends Table> = T['$inferSelect'];

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = AuthRequirement | AccessCheckFunction;

interface BaseServiceConfig {
	byIdAuth?: AuthConfig;
	findAllAuth?: AuthConfig;
	createAuth?: AuthConfig;
	updateAuth?: AuthConfig;
	deleteAuth?: AuthConfig;
	countAuth?: AuthConfig;
	activityTypes?: {
		create?: string;
		update?: string;
		delete?: string;
	};
}

async function denyAccess() {
	return false;
}

abstract class BaseService<
	T extends Table,
	PK extends keyof T & keyof ModelSelect<T>,
> {
	private defaultByIdAuth: AuthConfig;
	private defaultFindAllAuth: AuthConfig;
	private defaultCreateAuth: AuthConfig;
	private defaultUpdateAuth: AuthConfig;
	private defaultDeleteAuth: AuthConfig;
	private defaultCountAuth: AuthConfig;
	private activityTypes?: BaseServiceConfig['activityTypes'];

	constructor(
		protected readonly repository: BaseRepository<T, PK>,
		config: BaseServiceConfig = {}
	) {
		this.defaultByIdAuth = config.byIdAuth ?? 'dashboard';
		this.defaultFindAllAuth = config.findAllAuth ?? 'dashboard';
		this.defaultCreateAuth = config.createAuth ?? denyAccess;
		this.defaultUpdateAuth = config.updateAuth ?? denyAccess;
		this.defaultDeleteAuth = config.deleteAuth ?? denyAccess;
		this.defaultCountAuth = config.countAuth ?? denyAccess;
		this.activityTypes = config.activityTypes;
	}

	protected byIdAuth(): AuthConfig {
		return this.defaultByIdAuth;
	}

	protected findAllAuth(): AuthConfig {
		return this.defaultFindAllAuth;
	}

	protected createAuth(): AuthConfig {
		return this.defaultCreateAuth;
	}

	protected updateAuth(): AuthConfig {
		return this.defaultUpdateAuth;
	}

	protected deleteAuth(): AuthConfig {
		return this.defaultDeleteAuth;
	}

	protected countAuth(): AuthConfig {
		return this.defaultCountAuth;
	}

	protected buildAuditOptions(
		session?: Session | null,
		operation?: 'create' | 'update' | 'delete'
	): AuditOptions | undefined {
		if (!session?.user?.id) return undefined;
		return {
			userId: session.user.id,
			activityType: operation ? this.activityTypes?.[operation] : undefined,
			role: session.user.role ?? undefined,
		};
	}

	async get(id: ModelSelect<T>[PK]) {
		return withPermission(
			async () => this.repository.findById(id),
			this.byIdAuth()
		);
	}

	async findAll(params: QueryOptions<T>) {
		return withPermission(
			async () => this.repository.query(params),
			this.findAllAuth()
		);
	}

	async getAll() {
		return withPermission(
			async () => this.repository.findAll(),
			this.findAllAuth()
		);
	}

	async first() {
		return withPermission(
			async () => this.repository.findFirst(),
			this.byIdAuth()
		);
	}

	async create(data: ModelInsert<T>) {
		return withPermission(async (session) => {
			const audit = this.buildAuditOptions(session, 'create');
			return this.repository.create(data, audit);
		}, this.createAuth());
	}

	async update(id: ModelSelect<T>[PK], data: Partial<ModelInsert<T>>) {
		return withPermission(async (session) => {
			const audit = this.buildAuditOptions(session, 'update');
			return this.repository.update(id, data, audit);
		}, this.updateAuth());
	}

	async delete(id: ModelSelect<T>[PK]) {
		return withPermission(async (session) => {
			const audit = this.buildAuditOptions(session, 'delete');
			return this.repository.delete(id, audit);
		}, this.deleteAuth());
	}

	async count() {
		return withPermission(
			async () => this.repository.count(),
			this.countAuth()
		);
	}
}

export default BaseService;
