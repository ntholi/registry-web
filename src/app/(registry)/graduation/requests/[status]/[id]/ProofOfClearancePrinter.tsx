'use client';

import { Button, Loader } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ProofOfClearancePDF from '@/app/(student-portal)/student/graduation/components/ProofOfClearancePDF';
import {
	getGraduationClearanceData,
	getGraduationRequest,
} from '@/server/graduation/requests/actions';

type ProofOfClearancePrinterProps = {
	requestId: string;
};

export default function ProofOfClearancePrinter({
	requestId,
}: ProofOfClearancePrinterProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const { data: graduationRequest, isLoading: isLoadingRequest } = useQuery({
		queryKey: ['graduationRequest', requestId],
		queryFn: () => getGraduationRequest(Number(requestId)),
	});

	const { data: graduationData, isLoading: isLoadingData } = useQuery({
		queryKey: ['graduationClearanceData', requestId],
		queryFn: async () => {
			if (!graduationRequest) throw new Error('No graduation request found');
			return getGraduationClearanceData(graduationRequest.id);
		},
		enabled: !!graduationRequest,
	});

	const handlePrint = async () => {
		setIsGenerating(true);
		try {
			if (!graduationData) {
				console.error('Invalid graduation data for PDF generation');
				setIsGenerating(false);
				return;
			}

			console.log(
				'Generating Proof of Clearance PDF for student:',
				graduationData.studentProgram.student.stdNo
			);

			const blob = await pdf(
				<ProofOfClearancePDF graduationData={graduationData} />
			).toBlob();

			console.log('PDF blob generated, size:', blob.size);

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

	const isLoading = isLoadingRequest || isLoadingData;

	return (
		<Button
			leftSection={
				isLoading ? <Loader size={'xs'} /> : <IconPrinter size='1rem' />
			}
			variant='subtle'
			color='gray'
			size='xs'
			disabled={isGenerating || !graduationData}
			onClick={handlePrint}
		>
			Print
		</Button>
	);
}
