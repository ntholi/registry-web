'use client';

import { Box, Center, Loader, Text } from '@mantine/core';
import { PDFViewer } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import { getAcademicHistory } from '../../../server/actions';
import TranscriptPDF from './TranscriptPDF';

type TranscriptPreviewProps = {
	stdNo: number;
	isActive: boolean;
};

export default function TranscriptPreview({
	stdNo,
	isActive,
}: TranscriptPreviewProps) {
	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo, 'no-active-term'],
		queryFn: () => getAcademicHistory(stdNo, true),
		enabled: isActive,
	});

	if (isLoading) {
		return (
			<Center h={600}>
				<Loader size='lg' />
			</Center>
		);
	}

	if (!student) {
		return (
			<Center h={600}>
				<Text c='dimmed'>No student data available</Text>
			</Center>
		);
	}

	return (
		<Box h={600}>
			<PDFViewer width='100%' height='100%' showToolbar={false}>
				<TranscriptPDF student={student} />
			</PDFViewer>
		</Box>
	);
}
