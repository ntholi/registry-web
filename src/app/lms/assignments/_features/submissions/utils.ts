import type { SubmissionFile, SubmissionUser } from '../../types';

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
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
