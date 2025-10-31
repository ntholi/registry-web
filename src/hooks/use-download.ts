import { useState } from 'react';

export interface UseDownloadOptions {
	onSuccess?: (filename: string) => void;
	onError?: (error: Error) => void;
}

export function useDownload(options: UseDownloadOptions = {}) {
	const [isDownloading, setIsDownloading] = useState(false);

	const downloadFromBase64 = (
		base64Data: string,
		filename: string,
		mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	) => {
		try {
			const binaryString = window.atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);

			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			const blob = new Blob([bytes], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();

			URL.revokeObjectURL(url);
			document.body.removeChild(a);

			options.onSuccess?.(filename);
		} catch (error) {
			const downloadError = error instanceof Error ? error : new Error('Download failed');
			options.onError?.(downloadError);
		}
	};

	const downloadWithMutation = async <T extends string>(
		mutationFn: () => Promise<T>,
		getFilename: (data: T) => string
	) => {
		setIsDownloading(true);
		try {
			const data = await mutationFn();
			const filename = getFilename(data);
			downloadFromBase64(data, filename);
			return data;
		} catch (error) {
			const downloadError = error instanceof Error ? error : new Error('Download failed');
			options.onError?.(downloadError);
			throw downloadError;
		} finally {
			setIsDownloading(false);
		}
	};

	return {
		isDownloading,
		downloadFromBase64,
		downloadWithMutation,
	};
}
