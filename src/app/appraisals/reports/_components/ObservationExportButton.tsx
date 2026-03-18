'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import type { ObservationReportData, ReportFilter } from '../_lib/types';
import { exportObservationExcel } from '../_server/actions';

type Props = {
	data: ObservationReportData;
	filter: ReportFilter;
};

export default function ObservationExportButton({ data, filter }: Props) {
	const [loading, setLoading] = useState(false);

	async function handleExport() {
		setLoading(true);
		try {
			const base64 = await exportObservationExcel(data, filter);
			downloadBase64(base64, 'observation-report');
			notifications.show({
				title: 'Success',
				message: 'Observation report exported successfully',
				color: 'green',
			});
		} catch {
			notifications.show({
				title: 'Error',
				message: 'Failed to export observation report',
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

function downloadBase64(base64: string, prefix: string) {
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const blob = new Blob([new Uint8Array(byteNumbers)], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${prefix}-${new Date().toISOString().split('T')[0]}.xlsx`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}
