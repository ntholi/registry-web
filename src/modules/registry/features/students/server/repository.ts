import {
	and,
	asc,
	desc,
	eq,
	ilike,
	notInArray,
	or,
	type SQL,
	sql,
} from 'drizzle-orm';
import {
	db,
	nextOfKins,
	programs,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
	terms,
	users,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';
import type { StudentFilter } from './actions';

export default class StudentRepository extends BaseRepository<
	typeof students,
	'stdNo'
> {
	constructor() {
		super(students, students.stdNo);
	}

	async findRegistrationData(stdNo: number) {
		return this.findStudentByStdNo(stdNo);
	}

	async findRegistrationDataByTerm(stdNo: number, termCode: string) {
		return await db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
			with: {
				user: true,
				programs: {
					columns: {
						id: true,
						status: true,
						structureId: true,
						intakeDate: true,
						graduationDate: true,
					},
					with: {
						structure: {
							with: {
								program: {
									columns: {
										id: true,
										name: true,
										code: true,
									},
									with: {
										school: {
											columns: {
												id: true,
												name: true,
											},
										},
									},
								},
							},
						},
						semesters: {
							columns: {
								id: true,
								term: true,
								status: true,
								structureSemesterId: true,
								sponsorId: true,
								studentProgramId: true,
							},
							where: eq(studentSemesters.term, termCode),
							with: {
								structureSemester: {
									columns: {
										semesterNumber: true,
									},
								},
								studentModules: {
									columns: {
										id: true,
										semesterModuleId: true,
										grade: true,
										marks: true,
										status: true,
										credits: true,
									},
									with: {
										semesterModule: {
											columns: {
												type: true,
											},
											with: {
												module: {
													columns: {
														id: true,
														code: true,
														name: true,
													},
												},
											},
										},
									},
								},
							},
							orderBy: [asc(structureSemesters.id)],
						},
					},
				},
			},
		});
	}

	async findStudentByStdNo(stdNo: number) {
		return await db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
			with: {
				user: true,
				programs: {
					columns: {
						id: true,
						status: true,
						structureId: true,
						intakeDate: true,
						graduationDate: true,
					},
					with: {
						structure: {
							with: {
								program: {
									columns: {
										id: true,
										name: true,
										code: true,
									},
									with: {
										school: {
											columns: {
												id: true,
												name: true,
											},
										},
									},
								},
							},
						},
						semesters: {
							columns: {
								id: true,
								term: true,
								status: true,
								structureSemesterId: true,
								sponsorId: true,
								studentProgramId: true,
							},
							with: {
								structureSemester: {
									columns: {
										semesterNumber: true,
									},
								},
								studentModules: {
									columns: {
										id: true,
										semesterModuleId: true,
										grade: true,
										marks: true,
										status: true,
										credits: true,
									},
									with: {
										semesterModule: {
											columns: {
												type: true,
											},
											with: {
												module: {
													columns: {
														id: true,
														code: true,
														name: true,
													},
												},
											},
										},
									},
								},
							},
							orderBy: [asc(structureSemesters.id)],
						},
					},
				},
			},
		});
	}

	async findStudentByUserId(userId: string) {
		const student = await db.query.students.findFirst({
			where: eq(students.userId, userId),
			columns: {
				stdNo: true,
			},
		});

		if (!student) {
			return null;
		}

		return this.findStudentByStdNo(student.stdNo);
	}

	async findAcademicHistory(stdNo: number) {
		return this.findStudentByStdNo(stdNo);
	}

	async findByModuleId(moduleId: number, termCode: string) {
		return await db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programId: structures.programId,
				semesterModuleId: studentModules.semesterModuleId,
			})
			.from(students)
			.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(
				studentSemesters,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(
				studentModules,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.innerJoin(
				semesterModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.where(
				and(
					eq(semesterModules.moduleId, moduleId),
					eq(studentSemesters.term, termCode),
					notInArray(studentModules.status, ['Delete', 'Drop'])
				)
			)
			.groupBy(
				students.stdNo,
				students.name,
				structures.programId,
				studentModules.semesterModuleId
			);
	}

	protected override buildQueryCriteria(
		options: QueryOptions<typeof students>
	) {
		const criteria = super.buildQueryCriteria(options);
		if (!options.sort || options.sort.length === 0) {
			criteria.orderBy = [desc(students.stdNo)];
		}

		return criteria;
	}

	async queryBasic(
		options: QueryOptions<typeof students> & { filter?: StudentFilter }
	): Promise<{
		items: { stdNo: number; name: string }[];
		totalPages: number;
		totalItems: number;
	}> {
		const { orderBy, offset, limit } = this.buildQueryCriteria(options);
		let customWhere: SQL | undefined;

		if (options.search) {
			const searchTerms = options.search.trim().split(/\s+/).filter(Boolean);

			if (searchTerms.length > 0) {
				const searchConditions = searchTerms.map((term) => {
					const conditions = [];

					const digitCount = (term.match(/\d/g) || []).length;
					if (digitCount >= 5) {
						conditions.push(sql`${students.stdNo}::text ilike ${`%${term}%`}`);
						conditions.push(ilike(students.nationalId, `%${term}%`));
						conditions.push(ilike(students.phone1, `%${term}%`));
						conditions.push(ilike(students.phone2, `%${term}%`));
					}

					const normalizedTerm = normalizeSearchTerm(term);
					conditions.push(ilike(students.name, `%${normalizedTerm}%`));
					conditions.push(
						sql`similarity(${students.name}, ${normalizedTerm}::text) > 0.25`
					);

					return or(...conditions);
				});

				customWhere = and(...searchConditions);
			}
		}

		const filterConditions: SQL[] = [];
		if (options.filter) {
			if (options.filter.schoolId) {
				filterConditions.push(eq(programs.schoolId, options.filter.schoolId));
			}

			if (options.filter.programId) {
				filterConditions.push(
					eq(structures.programId, options.filter.programId)
				);
			}

			if (options.filter.termId) {
				filterConditions.push(eq(terms.id, options.filter.termId));
			}

			if (options.filter.semesterNumber) {
				filterConditions.push(
					eq(structureSemesters.semesterNumber, options.filter.semesterNumber)
				);
			}
		}

		if (filterConditions.length > 0) {
			const filterWhere = and(...filterConditions);
			customWhere = customWhere ? and(customWhere, filterWhere) : filterWhere;
		}

		const needsJoins =
			options.filter &&
			(options.filter.schoolId ||
				options.filter.programId ||
				options.filter.termId ||
				options.filter.semesterNumber);

		const needsTermJoin = options.filter?.termId;
		const needsSemesterJoin =
			options.filter &&
			(options.filter.termId || options.filter.semesterNumber);

		let items: { stdNo: number; name: string }[];
		let totalItems: number;

		if (needsJoins) {
			let joinedQuery = db
				.select({
					stdNo: students.stdNo,
					name: students.name,
				})
				.from(students)
				.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));

			if (needsSemesterJoin) {
				joinedQuery = joinedQuery
					.innerJoin(
						studentSemesters,
						eq(studentSemesters.studentProgramId, studentPrograms.id)
					)
					.innerJoin(
						structureSemesters,
						eq(studentSemesters.structureSemesterId, structureSemesters.id)
					);
			}

			if (needsTermJoin) {
				joinedQuery = joinedQuery.innerJoin(
					terms,
					eq(terms.code, studentSemesters.term)
				);
			}

			items = await joinedQuery
				.orderBy(...orderBy)
				.where(customWhere)
				.limit(limit)
				.offset(offset)
				.groupBy(students.stdNo, students.name);

			let countJoinedQuery = db
				.select({ count: students.stdNo })
				.from(students)
				.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));

			if (needsSemesterJoin) {
				countJoinedQuery = countJoinedQuery
					.innerJoin(
						studentSemesters,
						eq(studentSemesters.studentProgramId, studentPrograms.id)
					)
					.innerJoin(
						structureSemesters,
						eq(studentSemesters.structureSemesterId, structureSemesters.id)
					);
			}

			if (needsTermJoin) {
				countJoinedQuery = countJoinedQuery.innerJoin(
					terms,
					eq(terms.code, studentSemesters.term)
				);
			}

			totalItems = await countJoinedQuery
				.where(customWhere)
				.then((results) => new Set(results.map((r) => r.count)).size);
		} else {
			items = await db
				.select({
					stdNo: students.stdNo,
					name: students.name,
				})
				.from(students)
				.orderBy(...orderBy)
				.where(customWhere)
				.limit(limit)
				.offset(offset)
				.groupBy(students.stdNo, students.name);

			totalItems = await db
				.select({ count: students.stdNo })
				.from(students)
				.where(customWhere)
				.then((results) => new Set(results.map((r) => r.count)).size);
		}

		return {
			items,
			totalPages: Math.ceil(totalItems / limit),
			totalItems,
		};
	}

	override async findById(stdNo: number) {
		return await db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
			with: {
				user: true,
				nextOfKins: {
					orderBy: [desc(nextOfKins.id)],
				},
				programs: {
					orderBy: [desc(studentPrograms.id)],
					columns: {
						id: true,
						status: true,
						structureId: true,
						intakeDate: true,
						regDate: true,
						startTerm: true,
						stream: true,
						graduationDate: true,
						assistProvider: true,
					},
					with: {
						structure: {
							columns: {
								id: true,
								code: true,
								desc: true,
								programId: true,
								createdAt: true,
							},
							with: {
								program: {
									columns: {
										id: true,
										name: true,
										code: true,
									},
									with: {
										school: {
											columns: {
												id: true,
												name: true,
											},
										},
									},
								},
							},
						},
						semesters: {
							columns: {
								id: true,
								term: true,
								status: true,
								structureSemesterId: true,
								sponsorId: true,
								studentProgramId: true,
							},
							with: {
								structureSemester: {
									columns: {
										semesterNumber: true,
									},
								},
								studentModules: {
									columns: {
										id: true,
										semesterModuleId: true,
										grade: true,
										marks: true,
										status: true,
										credits: true,
									},
									with: {
										semesterModule: {
											columns: {
												type: true,
											},
											with: {
												module: {
													columns: {
														id: true,
														code: true,
														name: true,
													},
												},
											},
										},
									},
								},
							},
							orderBy: [asc(structureSemesters.id)],
						},
					},
				},
			},
		});
	}

	async updateUserId(stdNo: number, userId: string | null) {
		return await db.transaction(async (tx) => {
			if (userId) {
				await tx
					.update(students)
					.set({ userId: null })
					.where(eq(students.userId, userId));
			}
			const updatedStudent = await tx
				.update(students)
				.set({ userId })
				.where(eq(students.stdNo, stdNo))
				.returning();
			if (userId) {
				await tx
					.update(users)
					.set({ role: 'student' })
					.where(eq(users.id, userId));
			}

			return updatedStudent;
		});
	}

	async updateProgramStructure(stdNo: number, structureId: number) {
		return await db
			.update(studentPrograms)
			.set({ structureId })
			.where(
				and(
					eq(studentPrograms.stdNo, stdNo),
					eq(studentPrograms.status, 'Active')
				)
			)
			.returning();
	}
}

function normalizeSearchTerm(term: string): string {
	return term
		.replace(/[''`´]/g, "'")
		.replace(/[""]/g, '"')
		.trim();
}

export const studentsRepository = new StudentRepository();
