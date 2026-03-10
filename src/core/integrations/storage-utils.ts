import { nanoid } from 'nanoid';
import { getFileExtension } from '@/shared/lib/utils/files';

export const StoragePaths = {
	studentPhoto: (stdNo: number, ext: string) =>
		`registry/students/photos/${stdNo}.${ext}`,

	studentDocument: (stdNo: number, fileName: string) =>
		`registry/students/documents/${stdNo}/${fileName}`,

	studentNoteAttachment: (stdNo: number, fileName: string) =>
		`registry/student-notes/${stdNo}/${fileName}`,

	termPublication: (termCode: string, type: string, fileName: string) =>
		`registry/terms/publications/${termCode}/${type}/${fileName}`,

	employeePhoto: (empNo: string, ext: string) =>
		`human-resource/employees/photos/${empNo}.${ext}`,

	applicantDocument: (applicantId: string, fileName: string) =>
		`admissions/applicants/documents/${applicantId}/${fileName}`,

	admissionDeposit: (applicationId: string, fileName: string) =>
		`admissions/deposits/${applicationId}/${fileName}`,

	questionPaper: (fileName: string) => `library/question-papers/${fileName}`,

	publication: (fileName: string) => `library/publications/${fileName}`,
} as const;

const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

export function getPublicUrl(key: string): string {
	if (!key) return '';
	if (key.startsWith('http')) return key;
	if (key.startsWith('data:')) return key;
	return `${PUBLIC_URL}/${key}`;
}

export function generateUploadKey(
	pathBuilder: (fileName: string) => string,
	originalFileName: string
): string {
	const ext = getFileExtension(originalFileName) || '.bin';
	const fileName = `${nanoid()}${ext}`;
	return pathBuilder(fileName);
}
