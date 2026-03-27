'use server';

import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { auth } from '@/core/auth';
import {
	executeReadOnlyQuery,
	getDbSchema,
} from '@/core/database/read-only-db';
import type { QueryStep } from '../_lib/types';

const model = google('gemini-3-flash-preview');

const MAX_RETRIES = 3;

const sqlOutputSchema = z.object({
	sql: z.string(),
	explanation: z.string(),
	suggestedColumns: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
			})
		)
		.optional(),
	needsColumnConfirmation: z.boolean(),
	confidence: z.number().min(0).max(100),
});

const refinementSchema = z.object({
	sql: z.string(),
	explanation: z.string(),
	isCorrect: z.boolean(),
	issue: z.string().optional(),
});

export async function generateAndExecuteQuery(
	userQuery: string,
	selectedColumns?: string[]
): Promise<QueryStep[]> {
	const session = await auth();
	if (!session?.user?.id || session.user.role !== 'admin') {
		return [{ type: 'error', message: 'Unauthorized: Admin access required' }];
	}

	const steps: QueryStep[] = [];

	try {
		steps.push({ type: 'generating', message: 'Analyzing your query...' });

		const dbSchema = await getDbSchema();

		const systemPrompt = `You are an expert PostgreSQL query builder for a university student registry system.
The database uses snake_case for column and table names.
You MUST generate ONLY read-only SELECT queries. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.
Always use proper JOINs when relating tables. Use meaningful column aliases for readability.
Limit results to 500 rows max unless the user specifies otherwise.

Important domain knowledge:
- Student numbers are in the "students" table (column: std_no)
- Student names are stored as "name" in the students table  
- Programs are academic degree programs (e.g., Diploma in IT)
- Terms follow YYYY-MM format (e.g., 2025-02)
- CGPA and GPA are stored as numeric values
- Schools are equivalent to Faculties
- Semesters track student enrollment per term
- The "student_modules" table links students to their modules with grades
- Grade points are numeric values, grades are letter grades (A+, A, B+, etc.)

DATABASE SCHEMA:
${dbSchema}`;

		const { output: sqlOutput } = await generateText({
			model,
			system: systemPrompt,
			output: Output.object({
				schema: sqlOutputSchema,
				name: 'SQLQuery',
				description: 'Generated SQL query from natural language',
			}),
			messages: [
				{
					role: 'user',
					content: `Generate a PostgreSQL SELECT query for: "${userQuery}"

${selectedColumns ? `The user wants these specific columns: ${selectedColumns.join(', ')}` : ''}

Respond with:
- sql: The complete SQL query
- explanation: A brief explanation of what the query does
- suggestedColumns: If the query could return many different column sets, suggest the most relevant ones
- needsColumnConfirmation: true ONLY if the query is highly ambiguous about what data to show
- confidence: 0-100 how confident you are this query is correct`,
				},
			],
		});

		if (!sqlOutput) {
			return [
				...steps,
				{ type: 'error', message: 'AI could not generate a query' },
			];
		}

		if (
			sqlOutput.needsColumnConfirmation &&
			sqlOutput.suggestedColumns?.length
		) {
			return [
				...steps,
				{
					type: 'confirm_columns',
					columns: sqlOutput.suggestedColumns,
					sql: sqlOutput.sql,
					explanation: sqlOutput.explanation,
				},
			];
		}

		steps.push({
			type: 'validating',
			sql: sqlOutput.sql,
			explanation: sqlOutput.explanation,
		});

		let currentSql = sqlOutput.sql;
		let currentExplanation = sqlOutput.explanation;
		let lastError = '';

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				steps.push({ type: 'executing', sql: currentSql });

				const startTime = Date.now();
				const result = await executeReadOnlyQuery(currentSql);
				const executionTime = Date.now() - startTime;

				steps.push({
					type: 'success',
					sql: currentSql,
					explanation: currentExplanation,
					columns: result.columns,
					rows: result.rows,
					rowCount: result.rowCount,
					executionTime,
				});

				return steps;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Unknown error';
				lastError = errorMessage;

				if (attempt < MAX_RETRIES - 1) {
					steps.push({
						type: 'refining',
						attempt: attempt + 1,
						error: errorMessage,
					});

					const { output: refined } = await generateText({
						model,
						system: systemPrompt,
						output: Output.object({
							schema: refinementSchema,
							name: 'RefinedQuery',
							description: 'Refined SQL query after error',
						}),
						messages: [
							{
								role: 'user',
								content: `The previous query failed. Fix it.

Original request: "${userQuery}"
Previous SQL: ${currentSql}
Error: ${errorMessage}

Generate a corrected query. If the error indicates a missing table or column, adjust accordingly.`,
							},
						],
					});

					if (refined) {
						currentSql = refined.sql;
						currentExplanation = refined.explanation;
					}
				}
			}
		}

		return [
			...steps,
			{
				type: 'error',
				message: `Query failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`,
			},
		];
	} catch (err) {
		const msg =
			err instanceof Error ? err.message : 'An unexpected error occurred';
		return [...steps, { type: 'error', message: msg }];
	}
}

export async function executeWithConfirmedColumns(
	userQuery: string,
	selectedColumns: string[]
): Promise<QueryStep[]> {
	return generateAndExecuteQuery(userQuery, selectedColumns);
}
