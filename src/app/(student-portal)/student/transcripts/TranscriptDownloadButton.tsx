'use client';

import { ActionIcon, Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { pdf } from '@react-pdf/renderer';
import StatementOfResultsPDF from '@registry/students/[id]/AcademicsView/statements/StatementOfResultsPDF';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getAcademicHistory } from '@/server/registry/students/actions';

interface TranscriptDownloadButtonProps {
	stdNo: number;
	studentName: string;
	disabled?: boolean;
}

export default function TranscriptDownloadButton({
	stdNo,
	studentName,
	disabled = false,
}: TranscriptDownloadButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const isMobile = useMediaQuery('(max-width: 768px)');

	const { data: student } = useQuery({
		queryKey: ['academic-history', stdNo, 'no-current-term'],
		queryFn: () => getAcademicHistory(stdNo, true),
		enabled: !!stdNo,
	});

	const handleDownload = async () => {
		if (!student) {
			console.error('No student data available for download');
			return;
		}

		setIsGenerating(true);
		try {
			const blob = await pdf(
				<StatementOfResultsPDF student={student} includeSignature={false} />
			).toBlob();

			if (blob.size === 0) {
				throw new Error('Generated PDF is empty');
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${studentName.replace(/\s+/g, '_')}_Transcript.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error generating transcript:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	return isMobile ? (
		<ActionIcon
			onClick={handleDownload}
			size='xl'
			loading={isGenerating}
			disabled={disabled || !student}
			variant='default'
		>
			<IconDownload size={16} />
		</ActionIcon>
	) : (
		<Button
			leftSection={<IconDownload size={16} />}
			onClick={handleDownload}
			loading={isGenerating}
			disabled={disabled || !student}
			variant='filled'
		>
			{isGenerating ? 'Generating...' : 'Download'}
		</Button>
	);
}
