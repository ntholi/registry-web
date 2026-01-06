'use client';

import { ActionIcon } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStudentRegistrationDataByTerm } from '../../../_server/actions';
import ProofOfRegistrationPDF from './ProofOfRegistrationPDF';

type Props = {
	stdNo: number;
	termCode: string;
};

export default function ProofOfRegistrationTermPrinter({
	stdNo,
	termCode,
}: Props) {
	const [isGenerating, setIsGenerating] = useState(false);

	const { refetch } = useQuery({
		queryKey: ['student-registration-data-term', stdNo, termCode],
		queryFn: () => getStudentRegistrationDataByTerm(stdNo, termCode),
		enabled: false,
	});

	const handlePrint = async () => {
		setIsGenerating(true);
		try {
			const result = await refetch();
			const studentData = result.data;

			if (
				!studentData ||
				!studentData.programs ||
				studentData.programs.length === 0
			) {
				console.error('Invalid student data for PDF generation');
				setIsGenerating(false);
				return;
			}

			const blob = await pdf(
				<ProofOfRegistrationPDF student={studentData} />
			).toBlob();

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
		<ActionIcon disabled={isGenerating} onClick={handlePrint} variant='default'>
			<IconPrinter size='1rem' />
		</ActionIcon>
	);
}
