import type { questionPapers } from '../_schema/questionPapers';

export type QuestionPaper = typeof questionPapers.$inferSelect;
export type QuestionPaperInsert = typeof questionPapers.$inferInsert;

export type QuestionPaperWithRelations = QuestionPaper & {
	document: {
		id: string;
		fileName: string;
		fileUrl: string | null;
	};
	module: {
		id: number;
		code: string;
		name: string;
	};
	term: {
		id: number;
		code: string;
		name: string | null;
	};
};

export type QuestionPaperFormData = {
	moduleId: number;
	termId: number;
	assessmentType: string;
	file?: File;
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
