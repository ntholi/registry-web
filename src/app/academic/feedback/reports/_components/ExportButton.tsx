'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import type { FeedbackReportData, FeedbackReportFilter } from '../_lib/types';
import { exportFeedbackReportExcel } from '../_server/actions';

type Props = {
	data: FeedbackReportData;
	filter: FeedbackReportFilter;
};

export default function ExportButton({ data, filter }: Props) {
	const [loading, setLoading] = useState(false);

	async function handleExport() {
		setLoading(true);
		try {
			const base64 = await exportFeedbackReportExcel(data, filter);
			const byteCharacters = atob(base64);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `feedback-report-${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			notifications.show({
				title: 'Success',
				message: 'Feedback report exported successfully',
				color: 'green',
			});
		} catch {
			notifications.show({
				title: 'Error',
				message: 'Failed to export feedback report',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button
			leftSection={<IconDownload size={16} />}
			variant='light'
			loading={loading}
			onClick={handleExport}
		>
			Export Excel
		</Button>
	);
}
