import type { PgTable as Table } from 'drizzle-orm/pg-core';
import type { Session } from 'next-auth';
import type { UserRole } from '@/core/database/schema';
import type BaseRepository from './BaseRepository';
import type { QueryOptions } from './BaseRepository';
import withAuth from './withAuth';

type ModelInsert<T extends Table> = T['$inferInsert'];
type ModelSelect<T extends Table> = T['$inferSelect'];

type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = Role[] | AccessCheckFunction;

interface BaseServiceConfig {
	byIdRoles?: AuthConfig;
	findAllRoles?: AuthConfig;
	createRoles?: AuthConfig;
	updateRoles?: AuthConfig;
	deleteRoles?: AuthConfig;
	countRoles?: AuthConfig;
}

abstract class BaseService<
	T extends Table,
	PK extends keyof T & keyof ModelSelect<T>,
> {
	private defaultByIdRoles: AuthConfig;
	private defaultFindAllRoles: AuthConfig;
	private defaultCreateRoles: AuthConfig;
	private defaultUpdateRoles: AuthConfig;
	private defaultDeleteRoles: AuthConfig;
	private defaultCountRoles: AuthConfig;

	constructor(
		protected readonly repository: BaseRepository<T, PK>,
		config: BaseServiceConfig = {}
	) {
		this.defaultByIdRoles = config.byIdRoles ?? ['dashboard'];
		this.defaultFindAllRoles = config.findAllRoles ?? ['dashboard'];
		this.defaultCreateRoles = config.createRoles ?? [];
		this.defaultUpdateRoles = config.updateRoles ?? [];
		this.defaultDeleteRoles = config.deleteRoles ?? [];
		this.defaultCountRoles = config.countRoles ?? [];
	}

	protected byIdRoles(): AuthConfig {
		return this.defaultByIdRoles;
	}

	protected findAllRoles(): AuthConfig {
		return this.defaultFindAllRoles;
	}

	protected createRoles(): AuthConfig {
		return this.defaultCreateRoles;
	}

	protected updateRoles(): AuthConfig {
		return this.defaultUpdateRoles;
	}

	protected deleteRoles(): AuthConfig {
		return this.defaultDeleteRoles;
	}

	protected countRoles(): AuthConfig {
		return this.defaultCountRoles;
	}

	async get(id: ModelSelect<T>[PK]) {
		const roles = this.byIdRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.findById(id), roles as Role[]);
	}

	async findAll(params: QueryOptions<T>) {
		const roles = this.findAllRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.query(params), roles as Role[]);
	}

	async getAll() {
		const roles = this.findAllRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.findAll(), roles as Role[]);
	}

	async first() {
		const roles = this.byIdRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.findFirst(), roles as Role[]);
	}

	async create(data: ModelInsert<T>) {
		const roles = this.createRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.create(data), roles as Role[]);
	}

	async update(id: ModelSelect<T>[PK], data: Partial<ModelInsert<T>>) {
		const roles = this.updateRoles() as Role[] | AccessCheckFunction;
		return withAuth(
			async () => this.repository.update(id, data),
			roles as Role[]
		);
	}

	async delete(id: ModelSelect<T>[PK]) {
		const roles = this.deleteRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.delete(id), roles as Role[]);
	}

	async count() {
		const roles = this.countRoles() as Role[] | AccessCheckFunction;
		return withAuth(async () => this.repository.count(), roles as Role[]);
	}
}

export default BaseService;
