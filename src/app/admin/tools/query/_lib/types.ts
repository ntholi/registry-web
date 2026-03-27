type QueryStep =
	| { type: 'generating'; message: string }
	| { type: 'validating'; sql: string; explanation: string }
	| { type: 'executing'; sql: string }
	| { type: 'refining'; attempt: number; error: string }
	| {
			type: 'confirm_columns';
			columns: Array<{ name: string; description: string }>;
			sql: string;
			explanation: string;
	  }
	| {
			type: 'success';
			sql: string;
			explanation: string;
			columns: string[];
			rows: Record<string, unknown>[];
			rowCount: number;
			executionTime: number;
	  }
	| { type: 'error'; message: string };

export type { QueryStep };
