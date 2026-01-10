export function getResourceUrl(fileName: string) {
	const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
	return `${baseUrl}/library/resources/${fileName}`;
}
