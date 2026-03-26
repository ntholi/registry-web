import { Pool } from 'pg';

const connectionString = process.env.READ_ONLY_DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
	if (!connectionString) {
		throw new Error('READ_ONLY_DATABASE_URL is not configured');
	}
	if (!pool) {
		pool = new Pool({
			connectionString,
			max: 5,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 10000,
			statement_timeout: 30000,
			query_timeout: 30000,
		});
	}
	return pool;
}

const FORBIDDEN_PATTERNS = [
	/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i,
	/\b(COPY|EXECUTE|CALL)\b/i,
	/\bINTO\s+(?:OUTFILE|DUMPFILE)\b/i,
	/;\s*\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/i,
];

function validateReadOnly(sql: string): void {
	const trimmed = sql.trim();
	if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
		throw new Error('Only SELECT queries are allowed');
	}
	for (const pattern of FORBIDDEN_PATTERNS) {
		if (pattern.test(trimmed)) {
			throw new Error('Query contains forbidden operations');
		}
	}
}

const MAX_ROWS = 500;

export async function executeReadOnlyQuery(sql: string): Promise<{
	columns: string[];
	rows: Record<string, unknown>[];
	rowCount: number;
}> {
	validateReadOnly(sql);

	const limited = sql.replace(/;?\s*$/, '');
	const hasLimit = /\bLIMIT\b/i.test(limited);
	const finalSql = hasLimit ? limited : `${limited} LIMIT ${MAX_ROWS}`;

	const client = await getPool().connect();
	try {
		await client.query('BEGIN');
		await client.query('SET TRANSACTION READ ONLY');
		try {
			const result = await client.query(finalSql);
			await client.query('COMMIT');

			const columns = result.fields.map((f) => f.name);
			return {
				columns,
				rows: result.rows as Record<string, unknown>[],
				rowCount: result.rowCount ?? 0,
			};
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		}
	} finally {
		client.release();
	}
}

export async function getDbSchema(): Promise<string> {
	const client = await getPool().connect();
	try {
		const tables = await client.query<{
			table_name: string;
			column_name: string;
			data_type: string;
			is_nullable: string;
		}>(`
			SELECT c.table_name, c.column_name, c.data_type, c.is_nullable
			FROM information_schema.columns c
			JOIN information_schema.tables t
				ON c.table_name = t.table_name AND c.table_schema = t.table_schema
			WHERE c.table_schema = 'public'
				AND t.table_type = 'BASE TABLE'
			ORDER BY c.table_name, c.ordinal_position
		`);

		const fkeys = await client.query<{
			source_table: string;
			source_column: string;
			target_table: string;
			target_column: string;
		}>(`
			SELECT
				kcu.table_name AS source_table,
				kcu.column_name AS source_column,
				ccu.table_name AS target_table,
				ccu.column_name AS target_column
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
				ON tc.constraint_name = kcu.constraint_name
				AND tc.table_schema = kcu.table_schema
			JOIN information_schema.constraint_column_usage ccu
				ON ccu.constraint_name = tc.constraint_name
				AND ccu.table_schema = tc.table_schema
			WHERE tc.constraint_type = 'FOREIGN KEY'
				AND tc.table_schema = 'public'
		`);

		const grouped: Record<string, string[]> = {};
		for (const row of tables.rows) {
			if (!grouped[row.table_name]) {
				grouped[row.table_name] = [];
			}
			const nullable = row.is_nullable === 'YES' ? ' (nullable)' : '';
			grouped[row.table_name].push(
				`  ${row.column_name}: ${row.data_type}${nullable}`
			);
		}

		const fkMap: Record<string, string[]> = {};
		for (const fk of fkeys.rows) {
			if (!fkMap[fk.source_table]) {
				fkMap[fk.source_table] = [];
			}
			fkMap[fk.source_table].push(
				`  FK: ${fk.source_column} -> ${fk.target_table}.${fk.target_column}`
			);
		}

		let schema = '';
		for (const [table, cols] of Object.entries(grouped)) {
			schema += `${table}:\n${cols.join('\n')}`;
			if (fkMap[table]) {
				schema += `\n${fkMap[table].join('\n')}`;
			}
			schema += '\n\n';
		}

		return schema;
	} finally {
		client.release();
	}
}
