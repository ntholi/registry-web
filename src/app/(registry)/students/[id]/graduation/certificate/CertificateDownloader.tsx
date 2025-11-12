'use client';

import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getAcademicHistory } from '@/server/registry/students/actions';
import { generateCertificate } from './CertificatePDF';

type Props = {
	disabled?: boolean;
	stdNo: number;
	programId?: number;
};

export default function CertificateDownloader({
	stdNo,
	disabled,
	programId,
}: Props) {
	const [isGenerating, setIsGenerating] = useState(false);
	const { data: session } = useSession();

	const { data: student } = useQuery({
		queryKey: ['student', stdNo, 'no-current-term'],
		queryFn: () => getAcademicHistory(stdNo, true),
	});

	const handleDownload = async () => {
		setIsGenerating(true);
		try {
			if (!student || !student.programs) {
				console.error('Invalid student data for certificate generation');
				setIsGenerating(false);
				return;
			}

			const completedPrograms = student.programs.filter(
				(p) => p && p.status === 'Completed'
			);

			if (completedPrograms.length === 0) {
				console.error('No completed programs found');
				setIsGenerating(false);
				return;
			}

			const targetProgram = programId
				? completedPrograms.find((p) => p && p.id === programId)
				: completedPrograms[0];

			if (!targetProgram || !targetProgram.structure?.program) {
				console.error('Program data not found');
				setIsGenerating(false);
				return;
			}

			const programName = targetProgram.structure.program.name;
			const programCode = targetProgram.structure.program.code || '';

			const blob = await generateCertificate({
				studentName: student.name,
				programName: programName,
				programCode: programCode,
				stdNo: student.stdNo,
				graduationDate: targetProgram.graduationDate
					? new Date(targetProgram.graduationDate)
					: undefined,
			});

			if (blob.size === 0) {
				throw new Error('Generated certificate is empty');
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;

			const safeName = student.name.replace(/\s+/g, '_');
			const timestamp = new Date().toISOString().split('T')[0];
			link.download = `certificate_${safeName}_${timestamp}.pdf`;

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			setIsGenerating(false);
		} catch (error) {
			console.error('Error generating certificate:', error);
			setIsGenerating(false);
		}
	};

	return (
		<Button
			leftSection={<IconDownload size='1rem' />}
			variant='subtle'
			color='gray'
			size='xs'
			disabled={isGenerating || session?.user?.role !== 'admin' || disabled}
			onClick={handleDownload}
			loading={isGenerating}
		>
			Certificate
		</Button>
	);
}
