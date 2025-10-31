'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';

interface DownloadCSVButtonProps {
	status: 'pending' | 'approved' | 'rejected';
	onDownload: (status: 'pending' | 'approved' | 'rejected') => Promise<string>;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function DownloadCSVButton({
	status,
	onDownload,
	label = `Download ${status} clearances as CSV`,
	size = 16,
	color = 'blue',
	variant = 'default',
}: DownloadCSVButtonProps) {
	const [downloadLoading, setDownloadLoading] = useState(false);

	const handleDownloadCSV = async () => {
		try {
			setDownloadLoading(true);
			const csvData = await onDownload(status);

			const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute(
				'download',
				`${status}-clearances-${new Date().toISOString().split('T')[0]}.csv`
			);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading CSV:', error);
		} finally {
			setDownloadLoading(false);
		}
	};

	return (
		<Tooltip label={label}>
			<ActionIcon
				variant={variant}
				color={color}
				onClick={handleDownloadCSV}
				size={'input-sm'}
				loading={downloadLoading}
			>
				<IconDownload size={size} />
			</ActionIcon>
		</Tooltip>
	);
}
