'use client';

import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import {
	useAssessmentMarksQuery,
	useAssessmentsQuery,
	useModuleGradesQuery,
} from '../../hooks/useAssessmentsQuery';
import { useStudentsQuery } from '../../hooks/useStudentsQuery';
import { exportToExcel } from './exportToExcel';

type Props = {
	moduleId: number;
	semesterModuleIds: number[];
	moduleName?: string;
	moduleCode?: string;
	lecturerName?: string;
	termCode?: string;
	className?: string;
};

export default function ExportButton({
	moduleId,
	semesterModuleIds,
	moduleName,
	moduleCode,
	lecturerName,
	termCode,
	className,
}: Props) {
	const [isExporting, setIsExporting] = useState(false);
	const [programId] = useQueryState('programId');

	const { data: students } = useStudentsQuery({
		semesterModuleIds,
		searchQuery: '',
	});
	const { data: assessments } = useAssessmentsQuery(moduleId);
	const { data: assessmentMarks } = useAssessmentMarksQuery(moduleId);
	const { data: moduleGrades } = useModuleGradesQuery(moduleId);

	async function handleExport() {
		if (!students || !assessments || !assessmentMarks || !moduleGrades) {
			return;
		}

		setIsExporting(true);
		try {
			let filteredStudents = students;
			if (programId) {
				filteredStudents = students.filter(
					(it) => it.programId?.toString() === programId
				);
			}

			await exportToExcel({
				students: filteredStudents,
				assessments,
				assessmentMarks,
				moduleGrades,
				moduleName: moduleName || 'Unknown Module',
				moduleCode: moduleCode || 'N/A',
				lecturerName: lecturerName || 'Unknown Lecturer',
				termCode: termCode || 'N/A',
				className: className || 'All Programs',
			});
		} finally {
			setIsExporting(false);
		}
	}

	return (
		<Button
			onClick={handleExport}
			loading={isExporting}
			size='xs'
			leftSection={<IconDownload size={16} />}
			variant='light'
			disabled={!students || !assessments}
		>
			Export
		</Button>
	);
}
