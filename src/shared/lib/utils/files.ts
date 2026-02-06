export function getFileExtension(name: string): string {
	const idx = name.lastIndexOf('.');
	if (idx === -1 || idx === name.length - 1) return '';
	return name.slice(idx);
}

export function getFileBaseName(name: string): string {
	const ext = getFileExtension(name);
	return ext ? name.slice(0, -ext.length) : name;
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
