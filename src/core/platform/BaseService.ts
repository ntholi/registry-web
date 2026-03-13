import type { PgTable as Table } from 'drizzle-orm/pg-core';
import type { Session } from '@/core/auth';
import type { AuthRequirement } from '@/core/auth/permissions';
import type BaseRepository from './BaseRepository';
import type { AuditOptions, QueryOptions } from './BaseRepository';
import { withPermission } from './withPermission';

type ModelInsert<T extends Table> = T['$inferInsert'];
type ModelSelect<T extends Table> = T['$inferSelect'];

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type LegacyAuthConfig = readonly string[];
type AuthConfig = AuthRequirement | AccessCheckFunction;
type ServiceAuthConfig = AuthConfig | LegacyAuthConfig;

interface BaseServiceConfig {
	byIdAuth?: AuthConfig;
	findAllAuth?: AuthConfig;
	createAuth?: AuthConfig;
	updateAuth?: AuthConfig;
	deleteAuth?: AuthConfig;
	countAuth?: AuthConfig;
	byIdRoles?: ServiceAuthConfig;
	findAllRoles?: ServiceAuthConfig;
	createRoles?: ServiceAuthConfig;
	updateRoles?: ServiceAuthConfig;
	deleteRoles?: ServiceAuthConfig;
	countRoles?: ServiceAuthConfig;
	activityTypes?: {
		create?: string;
		update?: string;
		delete?: string;
	};
}

abstract class BaseService<
	T extends Table,
	PK extends keyof T & keyof ModelSelect<T>,
> {
	private defaultByIdAuth: ServiceAuthConfig;
	private defaultFindAllAuth: ServiceAuthConfig;
	private defaultCreateAuth: ServiceAuthConfig;
	private defaultUpdateAuth: ServiceAuthConfig;
	private defaultDeleteAuth: ServiceAuthConfig;
	private defaultCountAuth: ServiceAuthConfig;
	private activityTypes?: BaseServiceConfig['activityTypes'];

	constructor(
		protected readonly repository: BaseRepository<T, PK>,
		config: BaseServiceConfig = {}
	) {
		this.defaultByIdAuth = config.byIdAuth ?? config.byIdRoles ?? ['dashboard'];
		this.defaultFindAllAuth = config.findAllAuth ??
			config.findAllRoles ?? ['dashboard'];
		this.defaultCreateAuth = config.createAuth ?? config.createRoles ?? [];
		this.defaultUpdateAuth = config.updateAuth ?? config.updateRoles ?? [];
		this.defaultDeleteAuth = config.deleteAuth ?? config.deleteRoles ?? [];
		this.defaultCountAuth = config.countAuth ?? config.countRoles ?? [];
		this.activityTypes = config.activityTypes;
	}

	protected byIdAuth(): ServiceAuthConfig {
		return this.defaultByIdAuth;
	}

	protected findAllAuth(): ServiceAuthConfig {
		return this.defaultFindAllAuth;
	}

	protected createAuth(): ServiceAuthConfig {
		return this.defaultCreateAuth;
	}

	protected updateAuth(): ServiceAuthConfig {
		return this.defaultUpdateAuth;
	}

	protected deleteAuth(): ServiceAuthConfig {
		return this.defaultDeleteAuth;
	}

	protected countAuth(): ServiceAuthConfig {
		return this.defaultCountAuth;
	}

	protected byIdRoles(): ServiceAuthConfig {
		return this.byIdAuth();
	}

	protected findAllRoles(): ServiceAuthConfig {
		return this.findAllAuth();
	}

	protected createRoles(): ServiceAuthConfig {
		return this.createAuth();
	}

	protected updateRoles(): ServiceAuthConfig {
		return this.updateAuth();
	}

	protected deleteRoles(): ServiceAuthConfig {
		return this.deleteAuth();
	}

	protected countRoles(): ServiceAuthConfig {
		return this.countAuth();
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
