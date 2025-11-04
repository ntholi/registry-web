'use client';

import { ActionIcon } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import ProofOfRegistrationPDF from '@/app/dashboard/students/[id]/registration/proof/ProofOfRegistrationPDF';
import { getStudentRegistrationDataByTerm } from '@/server/students/actions';

interface ProofOfRegistrationDownloadProps {
	stdNo: number;
	termName: string;
	semesterNumber: string;
}

export default function ProofOfRegistrationDownload({
	stdNo,
	termName,
	semesterNumber,
}: ProofOfRegistrationDownloadProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async () => {
		try {
			setLoading(true);

			const studentData = await getStudentRegistrationDataByTerm(
				stdNo,
				termName
			);

			if (
				!studentData ||
				!studentData.programs ||
				studentData.programs.length === 0
			) {
				console.error('No student data found for the specified term');
				return;
			}

			const activeProgram = studentData.programs.find(
				(p) => p.status === 'Active'
			) as NonNullable<(typeof studentData.programs)[number]>;

			if (!activeProgram) {
				console.error('No active program found');
				return;
			}

			const targetSemester = activeProgram.semesters.find(
				(s) =>
					s.term === termName &&
					s.structureSemester?.semesterNumber === semesterNumber
			);

			if (!targetSemester) {
				console.error(
					'No semester found for the specified term and semester number'
				);
				return;
			}

			const modifiedStudentData = {
				...studentData,
				programs: [
					{
						...activeProgram,
						semesters: [targetSemester],
					},
				],
			};

			const pdfBlob = await pdf(
				<ProofOfRegistrationPDF student={modifiedStudentData} />
			).toBlob();

			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `proof_of_registration_${stdNo}_${termName.replace(/\s+/g, '_')}_semester_${semesterNumber}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error generating PDF:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ActionIcon
			variant='light'
			color='blue'
			size='sm'
			onClick={handleDownload}
			loading={loading}
			loaderProps={{ size: 'xs' }}
		>
			{!loading && <IconDownload size={16} />}
		</ActionIcon>
	);
}
