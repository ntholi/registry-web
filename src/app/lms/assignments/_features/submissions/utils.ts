import type { SubmissionFile, SubmissionUser } from '../../types';

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSubmissionFiles(user: SubmissionUser): SubmissionFile[] {
	if (!user.submission?.plugins) return [];

	const files: SubmissionFile[] = [];
	for (const plugin of user.submission.plugins) {
		if (plugin.fileareas) {
			for (const area of plugin.fileareas) {
				files.push(...area.files);
			}
		}
	}
	return files;
}
