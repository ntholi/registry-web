'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import { exportAttendanceForm } from '../_server/actions';

type Props = {
	semesterModuleId: number;
	termId: number;
	moduleCode: string;
	moduleName: string;
	className: string;
};

type ExportResult = Awaited<ReturnType<typeof exportAttendanceForm>>;

export default function AttendanceDownload({
	semesterModuleId,
	termId,
	moduleCode,
	moduleName,
	className,
}: Props) {
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			const result: ExportResult = await exportAttendanceForm({
				semesterModuleId,
				termId,
				moduleCode,
				moduleName,
				className,
			});

			if (!result.success || !result.data) {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export attendance form',
					color: 'red',
				});
				return;
			}

			const byteCharacters = atob(result.data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i += 1) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = result.fileName ?? 'attendance-form.xlsx';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			notifications.show({
				title: 'Success',
				message: 'Attendance form exported successfully',
				color: 'green',
			});
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'An unexpected error occurred while exporting',
				color: 'red',
			});
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Button
			size='xs'
			variant='light'
			leftSection={<IconDownload size={14} />}
			onClick={handleDownload}
			loading={isDownloading}
			disabled={isDownloading}
		>
			Download
		</Button>
	);
}
