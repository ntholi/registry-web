'use client';

import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import {
	createTranscriptPrint,
	extractTranscriptData,
} from '@registry/print/transcript';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getPublishedAcademicHistory } from '../../../_server/actions';
import TranscriptPDF from './TranscriptPDF';

type Props = {
	disabled?: boolean;
	stdNo: number;
};

export default function TranscriptPrinter({ stdNo, disabled }: Props) {
	const [isGenerating, setIsGenerating] = useState(false);
	const { data: session } = useSession();

	const { data: student } = useQuery({
		queryKey: ['student', stdNo, 'published'],
		queryFn: () => getPublishedAcademicHistory(stdNo),
	});

	const createPrintRecord = async () => {
		try {
			if (!session?.user?.id) {
				console.error('No authenticated user found');
				return null;
			}

			if (!student) {
				console.error('No student data found');
				return null;
			}

			const printData = extractTranscriptData(student);

			const record = await createTranscriptPrint({
				...printData,
				printedBy: session.user.id,
			});

			return record;
		} catch (error) {
			console.error('Failed to create print record:', error);
			return null;
		}
	};

	const handlePrint = async () => {
		setIsGenerating(true);
		try {
			if (!student || !student.programs) {
				console.error('Invalid student data for PDF generation');
				setIsGenerating(false);
				return;
			}

			const printRecord = await createPrintRecord();

			if (!printRecord) {
				console.error('Failed to create print record');
				setIsGenerating(false);
				return;
			}

			const blob = await pdf(<TranscriptPDF student={student} />).toBlob();

			if (blob.size === 0) {
				throw new Error('Generated PDF is empty');
			}

			const url = URL.createObjectURL(blob);

			const iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			iframe.src = url;
			document.body.appendChild(iframe);

			iframe.onload = () => {
				if (iframe.contentWindow) {
					iframe.contentWindow.focus();
					iframe.contentWindow.print();

					const handleAfterPrint = () => {
						URL.revokeObjectURL(url);
						if (iframe.parentNode) {
							iframe.parentNode.removeChild(iframe);
						}
						setIsGenerating(false);
						if (iframe.contentWindow) {
							iframe.contentWindow.removeEventListener(
								'afterprint',
								handleAfterPrint
							);
						}
					};

					iframe.contentWindow.addEventListener('afterprint', handleAfterPrint);
				} else {
					console.error('Failed to access iframe content window.');
					URL.revokeObjectURL(url);
					if (iframe.parentNode) {
						iframe.parentNode.removeChild(iframe);
					}
					setIsGenerating(false);
				}
			};

			iframe.onerror = () => {
				console.error('Failed to load PDF in iframe.');
				URL.revokeObjectURL(url);
				if (iframe.parentNode) {
					iframe.parentNode.removeChild(iframe);
				}
				setIsGenerating(false);
			};
		} catch (error) {
			console.error('Error generating PDF for printing:', error);
			setIsGenerating(false);
		}
	};

	return (
		<Button
			leftSection={<IconPrinter size='1rem' />}
			variant='subtle'
			color='gray'
			size='xs'
			disabled={isGenerating || disabled}
			onClick={handlePrint}
		>
			Transcript
		</Button>
	);
}
