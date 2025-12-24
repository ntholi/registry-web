'use client';

import { Button, Group, Loader } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { getStudentForProofOfRegistration } from '@registry/registration';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ProofOfRegistrationPDF from './ProofOfRegistrationPDF';

type Props = {
	registrationId: number;
};

export default function ProofOfRegistrationPrinter({ registrationId }: Props) {
	const [isPrinting, setIsPrinting] = useState(false);

	const { data, isLoading, error } = useQuery({
		queryKey: ['proof-of-registration', registrationId],
		queryFn: () => getStudentForProofOfRegistration(registrationId),
	});

	const handlePrint = async () => {
		if (!data) return;

		setIsPrinting(true);
		try {
			const blob = await pdf(<ProofOfRegistrationPDF data={data} />).toBlob();
			const url = URL.createObjectURL(blob);

			const iframe = document.createElement('iframe');
			iframe.style.position = 'fixed';
			iframe.style.right = '0';
			iframe.style.bottom = '0';
			iframe.style.width = '0';
			iframe.style.height = '0';
			iframe.style.border = 'none';
			document.body.appendChild(iframe);

			iframe.src = url;

			iframe.onload = () => {
				setTimeout(() => {
					iframe.contentWindow?.print();
				}, 500);
			};

			setTimeout(() => {
				document.body.removeChild(iframe);
				URL.revokeObjectURL(url);
			}, 60000);
		} catch (err) {
			console.error('Failed to print proof of registration:', err);
		} finally {
			setIsPrinting(false);
		}
	};

	if (isLoading) {
		return (
			<Group gap='xs'>
				<Loader size='xs' />
				<span>Loading...</span>
			</Group>
		);
	}

	if (error || !data) {
		return null;
	}

	return (
		<Button
			leftSection={
				isPrinting ? <Loader size='xs' /> : <IconPrinter size={16} />
			}
			onClick={handlePrint}
			disabled={isPrinting}
			variant='light'
		>
			{isPrinting ? 'Preparing...' : 'Print Proof of Registration'}
		</Button>
	);
}
