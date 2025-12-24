'use client';

import { ActionIcon } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import {
	getStudentRegistrationDataByTerm,
	ProofOfRegistrationPDF,
} from '@registry/students';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';

interface ProofOfRegistrationDownloadProps {
	stdNo: number;
	termCode: string;
	semesterNumber: string;
}

export default function ProofOfRegistrationDownload({
	stdNo,
	termCode,
	semesterNumber,
}: ProofOfRegistrationDownloadProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async () => {
		try {
			setLoading(true);

			const studentData = await getStudentRegistrationDataByTerm(
				stdNo,
				termCode
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
			);

			if (!activeProgram) {
				console.error('No active program found');
				return;
			}

			const targetSemester = activeProgram.semesters.find(
				(s) =>
					s.termCode === termCode &&
					s.structureSemester?.semesterNumber === semesterNumber
			);

			if (!targetSemester) {
				console.error(
					'No semester found for the specified term and semester number'
				);
				return;
			}

			const pdfData = {
				stdNo: studentData.stdNo,
				name: studentData.name,
				program: activeProgram.structure.program.name,
				faculty: activeProgram.structure.program.school?.name ?? '',
				semesterNumber: targetSemester.structureSemester?.semesterNumber ?? '',
				semesterStatus: targetSemester.status as 'Active' | 'Repeat',
				termCode: targetSemester.termCode ?? '',
				modules: targetSemester.studentModules.map((sm) => ({
					code: sm.semesterModule?.module?.code ?? '',
					name: sm.semesterModule?.module?.name ?? '',
					credits: sm.credits ?? 0,
					type: '',
					semesterNumber:
						targetSemester.structureSemester?.semesterNumber ?? '',
				})),
				sponsor: undefined,
				registrationDate: new Date(),
			};

			const pdfBlob = await pdf(
				<ProofOfRegistrationPDF data={pdfData} />
			).toBlob();

			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `proof_of_registration_${stdNo}_${termCode.replace(/\s+/g, '_')}_semester_${semesterNumber}.pdf`;
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
