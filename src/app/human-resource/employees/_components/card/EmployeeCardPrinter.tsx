'use client';

import { Button, Loader } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { convertUrlToBase64 } from '@/shared/lib/utils/utils';
import {
	type getEmployee,
	getEmployeePhoto,
	logEmployeeCardPrint,
} from '../../_server/actions';
import EmployeeCardPDF from './EmployeeCardPDF';

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
	isActive?: boolean;
};

export default function EmployeeCardPrinter({
	employee,
	isActive = true,
}: Props) {
	const [isGenerating, setIsGenerating] = useState(false);

	const { data: photoUrl, isLoading: photoLoading } = useQuery({
		queryKey: ['employee-photo', employee.empNo],
		queryFn: () => getEmployeePhoto(employee.empNo),
		staleTime: 1000 * 60 * 3,
		enabled: isActive,
	});

	const processPhotoUrl = async (url: string): Promise<string> => {
		if (url.startsWith('http')) {
			try {
				return await convertUrlToBase64(url);
			} catch (error) {
				console.error('Failed to convert photo URL to base64:', error);
				return url;
			}
		}
		return url;
	};

	const handlePrint = async () => {
		if (!employee || !photoUrl) return;

		setIsGenerating(true);

		try {
			await logEmployeeCardPrint(employee.empNo);

			const processedPhotoUrl = await processPhotoUrl(photoUrl);

			const blob = await pdf(
				<EmployeeCardPDF employee={employee} photoUrl={processedPhotoUrl} />
			).toBlob();

			if (blob.size === 0) {
				throw new Error('Generated PDF is empty');
			}

			const url = URL.createObjectURL(blob);
			const iframe = document.createElement('iframe');

			iframe.style.display = 'none';
			iframe.src = url;
			document.body.appendChild(iframe);

			const cleanup = () => {
				URL.revokeObjectURL(url);
				if (iframe.parentNode) {
					iframe.parentNode.removeChild(iframe);
				}
				setIsGenerating(false);
			};

			iframe.onload = () => {
				if (iframe.contentWindow) {
					iframe.contentWindow.focus();
					iframe.contentWindow.print();
					iframe.contentWindow.addEventListener('afterprint', cleanup);
				} else {
					cleanup();
				}
			};

			iframe.onerror = cleanup;
		} catch (error) {
			console.error('Error generating Employee Card PDF:', error);
			setIsGenerating(false);
		}
	};

	return (
		<Button
			leftSection={
				photoLoading ? <Loader size='xs' /> : <IconPrinter size='1rem' />
			}
			onClick={handlePrint}
			variant='subtle'
			color='gray'
			size='xs'
			disabled={isGenerating || !photoUrl}
		>
			Print
		</Button>
	);
}
