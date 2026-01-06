'use client';

import { Button, Group, Loader, Modal, Stack, TextInput } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { createStudentCardPrintWithReceipt } from '@registry/print/student-card';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { convertUrlToBase64 } from '@/shared/lib/utils/utils';
import { type getStudent, getStudentPhoto } from '../../_server/actions';
import StudentCardPDF from './StudentCardPDF';

type StudentCardPrinterProps = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	photoUrl?: string | null | undefined;
	disabled?: boolean;
	isActive?: boolean;
};

export default function StudentCardPrinter({
	student,
	photoUrl,
	disabled,
	isActive = true,
}: StudentCardPrinterProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [modalOpened, setModalOpened] = useState(false);
	const [receiptNo, setReceiptNo] = useState('');
	const { data: session } = useSession();

	const { data: fetchedPhotoUrl, isLoading: photoLoading } = useQuery({
		queryKey: ['student-photo', student.stdNo],
		queryFn: () => getStudentPhoto(student.stdNo),
		staleTime: 1000 * 60 * 3,
		enabled: isActive && !photoUrl,
	});

	const finalPhotoUrl = photoUrl || fetchedPhotoUrl;

	const openReceiptModal = () => {
		setReceiptNo('');
		setModalOpened(true);
	};

	const createPrintRecord = async () => {
		if (!session?.user?.id) {
			throw new Error('No authenticated user found');
		}

		const printData = {
			stdNo: student.stdNo,
			printedBy: session.user.id,
			receiptNo: receiptNo.trim() || `initial_${student.stdNo}`,
		};

		return await createStudentCardPrintWithReceipt(printData);
	};

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
		if (!student || !finalPhotoUrl) {
			console.error('Missing student data or photo');
			return;
		}

		setIsGenerating(true);
		setModalOpened(false);

		try {
			await createPrintRecord();

			const processedPhotoUrl = await processPhotoUrl(finalPhotoUrl);

			const blob = await pdf(
				<StudentCardPDF student={student} photoUrl={processedPhotoUrl} />
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
			console.error('Error generating Student Card PDF:', error);
			setIsGenerating(false);
		}
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				title='Student Card Print'
				size='sm'
			>
				<Stack gap='md'>
					<TextInput
						label='Receipt Number'
						placeholder='Leave blank for initial print'
						value={receiptNo}
						onChange={(e) => setReceiptNo(e.currentTarget.value)}
						description='Enter receipt number or leave blank if this is the first print'
					/>
					<Group justify='flex-end'>
						<Button variant='subtle' onClick={() => setModalOpened(false)}>
							Cancel
						</Button>
						<Button onClick={handlePrint}>Print</Button>
					</Group>
				</Stack>
			</Modal>

			<Button
				leftSection={
					photoLoading ? <Loader size={'xs'} /> : <IconPrinter size='1rem' />
				}
				onClick={openReceiptModal}
				variant='subtle'
				color='gray'
				size='xs'
				disabled={isGenerating || disabled || !finalPhotoUrl}
			>
				Print
			</Button>
		</>
	);
}
