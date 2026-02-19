'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
	assignedModules,
	db,
	feedbackCategories,
	feedbackCycles,
	feedbackPassphrases,
	feedbackQuestions,
	feedbackResponses,
	modules,
	semesterModules,
	users,
} from '@/core/database';

export async function validatePassphrase(passphrase: string) {
	const row = await db
		.select({
			passphraseId: feedbackPassphrases.id,
			cycleId: feedbackCycles.id,
			cycleName: feedbackCycles.name,
			termId: feedbackCycles.termId,
			structureSemesterId: feedbackPassphrases.structureSemesterId,
			used: feedbackPassphrases.used,
			startDate: feedbackCycles.startDate,
			endDate: feedbackCycles.endDate,
		})
		.from(feedbackPassphrases)
		.innerJoin(
			feedbackCycles,
			eq(feedbackPassphrases.cycleId, feedbackCycles.id)
		)
		.where(
			eq(
				sql`lower(${feedbackPassphrases.passphrase})`,
				passphrase.toLowerCase()
			)
		)
		.limit(1)
		.then((rows) => rows[0]);

	if (!row) return null;

	const today = new Date().toISOString().split('T')[0];
	let cycleStatus: 'upcoming' | 'open' | 'closed';
	if (today < row.startDate) cycleStatus = 'upcoming';
	else if (today > row.endDate) cycleStatus = 'closed';
	else cycleStatus = 'open';

	return {
		passphraseId: row.passphraseId,
		cycleId: row.cycleId,
		cycleName: row.cycleName,
		termId: row.termId,
		structureSemesterId: row.structureSemesterId,
		used: row.used,
		cycleStatus,
		endDate: row.endDate,
	};
}

export async function getLecturersForClass(
	structureSemesterId: number,
	termId: number
) {
	return db
		.select({
			assignedModuleId: assignedModules.id,
			lecturerName: users.name,
			lecturerImage: users.image,
			moduleCode: modules.code,
			moduleName: modules.name,
		})
		.from(assignedModules)
		.innerJoin(
			semesterModules,
			eq(assignedModules.semesterModuleId, semesterModules.id)
		)
		.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
		.innerJoin(users, eq(assignedModules.userId, users.id))
		.where(
			and(
				eq(assignedModules.termId, termId),
				eq(assignedModules.active, true),
				eq(semesterModules.semesterId, structureSemesterId)
			)
		);
}

export async function getQuestionsByCategory() {
	return db
		.select({
			categoryId: feedbackCategories.id,
			categoryName: feedbackCategories.name,
			questionId: feedbackQuestions.id,
			questionText: feedbackQuestions.text,
		})
		.from(feedbackQuestions)
		.innerJoin(
			feedbackCategories,
			eq(feedbackQuestions.categoryId, feedbackCategories.id)
		)
		.orderBy(feedbackCategories.name, feedbackQuestions.id);
}

export async function getExistingResponses(passphraseId: string) {
	return db
		.select({
			assignedModuleId: feedbackResponses.assignedModuleId,
			questionId: feedbackResponses.questionId,
			rating: feedbackResponses.rating,
			comment: feedbackResponses.comment,
		})
		.from(feedbackResponses)
		.where(eq(feedbackResponses.passphraseId, passphraseId));
}

export async function saveResponses(
	passphraseId: string,
	assignedModuleId: number,
	responses: {
		questionId: string;
		rating: number | null;
		comment: string | null;
	}[]
) {
	if (responses.length === 0) return;
	const values = responses.map((r) => ({
		passphraseId,
		assignedModuleId,
		questionId: r.questionId,
		rating: r.rating,
		comment: r.comment,
	}));

	await db
		.insert(feedbackResponses)
		.values(values)
		.onConflictDoUpdate({
			target: [
				feedbackResponses.passphraseId,
				feedbackResponses.assignedModuleId,
				feedbackResponses.questionId,
			],
			set: {
				rating: sql`excluded.rating`,
				comment: sql`excluded.comment`,
			},
		});
}

export async function markSkipped(
	passphraseId: string,
	assignedModuleId: number,
	questionIds: string[]
) {
	if (questionIds.length === 0) return;
	const values = questionIds.map((qId) => ({
		passphraseId,
		assignedModuleId,
		questionId: qId,
		rating: null,
		comment: null,
	}));

	await db
		.insert(feedbackResponses)
		.values(values)
		.onConflictDoUpdate({
			target: [
				feedbackResponses.passphraseId,
				feedbackResponses.assignedModuleId,
				feedbackResponses.questionId,
			],
			set: {
				rating: sql`excluded.rating`,
				comment: sql`excluded.comment`,
			},
		});
}

export async function finalize(passphraseId: string) {
	await db
		.update(feedbackPassphrases)
		.set({ used: true, usedAt: new Date() })
		.where(eq(feedbackPassphrases.id, passphraseId));
}
