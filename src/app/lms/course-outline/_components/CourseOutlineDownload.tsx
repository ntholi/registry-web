'use client';

import {
	getAssignedModuleByLmsCourseId,
	getLecturersByModule,
} from '@academic/assigned-modules';
import { getModulePrerequisites } from '@academic/semester-modules';
import { ActionIcon, Tooltip } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getCourseOutline } from '../_server/actions';
import CourseOutlinePDF, {
	type AcademicStaff,
	type CourseOutlinePDFData,
	type Prerequisite,
} from './CourseOutlinePDF';

type CourseOutlineDownloadProps = {
	courseId: number;
	courseName: string;
	courseCode: string;
};

export default function CourseOutlineDownload({
	courseId,
	courseName,
	courseCode,
}: CourseOutlineDownloadProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const { data: outlineData } = useQuery({
		queryKey: ['course-outline', courseId],
		queryFn: () => getCourseOutline(courseId),
	});

	const { data: assignedModule } = useQuery({
		queryKey: ['assigned-module-by-course', courseId],
		queryFn: () => getAssignedModuleByLmsCourseId(courseId.toString()),
	});

	const moduleId = assignedModule?.semesterModule?.moduleId;

	const { data: lecturers } = useQuery({
		queryKey: ['module-lecturers', moduleId],
		queryFn: () => getLecturersByModule(moduleId!),
		enabled: !!moduleId,
	});

	const semesterModuleId = assignedModule?.semesterModule?.id;

	const { data: prerequisites } = useQuery({
		queryKey: ['module-prerequisites', semesterModuleId],
		queryFn: () => getModulePrerequisites(semesterModuleId!),
		enabled: !!semesterModuleId,
	});

	async function handleDownload() {
		if (!outlineData) {
			return;
		}

		setIsGenerating(true);
		try {
			const semesterModule = assignedModule?.semesterModule;
			const semester = semesterModule?.semester;
			const structure = semester?.structure;
			const program = structure?.program;

			const semesterNumber = semester?.semesterNumber || '1';
			const semesterDisplay = formatSemester(semesterNumber, 'full').replace(
				' • ',
				', '
			);

			const programmeName = program?.name
				? `${program.name} (${semesterDisplay})`
				: `Course Outline (${semesterDisplay})`;

			const academicStaff: AcademicStaff[] =
				lecturers && lecturers.length > 0
					? lecturers.map((lecturer) => ({
							name: lecturer.name || 'Unknown',
							qualification: undefined,
						}))
					: [{ name: 'Course Instructor' }];

			const prerequisitesList: Prerequisite[] =
				prerequisites && prerequisites.length > 0
					? prerequisites.map((prereq) => ({
							code: prereq.code,
							name: prereq.name,
						}))
					: [];

			const creditValue = semesterModule?.credits || 12;

			const pdfData: CourseOutlinePDFData = {
				courseName,
				courseCode,
				programmeName,
				semesterDisplay,
				academicStaff,
				rationale:
					'This course is an essential component of the program as it addresses the increasing demand for professionals skilled in this field. By including this course, students gain valuable knowledge and practical experience. The course focuses on teaching essential principles, tools, and techniques, enabling students to develop creative and engaging solutions. Students are well-prepared to meet the demands of the industry and excel in their future careers.',
				creditValue,
				prerequisites: prerequisitesList,
				objectives:
					outlineData.sections.length > 0
						? outlineData.sections.map(
								(section) => section.content || section.title
							)
						: [
								'To introduce students to the core principles and concepts of this field.',
								'To enable students to create practical and innovative solutions through the implementation of learned techniques.',
								"To develop students' problem-solving skills and critical thinking abilities in the context of this discipline.",
								'To cultivate effective communication and collaboration skills through group projects and discussions.',
							],
				learningOutcomes:
					outlineData.sections.length > 0
						? outlineData.sections.map((section) => section.title)
						: [
								'Understand the fundamentals and how they enhance practical applications.',
								'Apply concepts and techniques to create functional and innovative solutions.',
								'Analyze and troubleshoot common issues in design and implementation.',
								'Collaborate effectively in a team setting, demonstrating effective communication and project management skills.',
							],
				transferableSkills: [
					'Problem-solving: Students develop critical thinking skills to identify and solve design and implementation challenges.',
					'Creativity: Students learn to think creatively to design visually appealing and engaging solutions that enhance user experiences.',
					'Communication: Students develop effective communication skills to articulate concepts, present their work, and collaborate with team members.',
					'Collaboration: Students engage in group projects, fostering teamwork and effective collaboration.',
				],
				teachingStrategy:
					"Teaching-learning strategy: A. The Guided Discovery Strategy whereby the lecturer sets a problem, the students explore the problem, and lecturer and students discuss the problem and formulate conclusions. The purpose of this strategy is to have students actively involved in their own learning and problem solving. B. Discussion Strategy: This strategy is used to stimulate discussion. Classes begin a lesson with a whole group discussion to refresh students' memories about the assigned reading(s). C. Case Method: In this teaching strategy, students have to apply what they learn in the classroom to real-life experiences. Assessment strategies: Summative Assessments are given periodically to determine what students know and do not know. Formative Assessments are used to help students learn more effectively through giving them feedback on their performance.",
				synopsis: `This course is designed to provide students with a comprehensive understanding of the principles and techniques in ${courseName}. Through a combination of theoretical concepts and practical applications, students will learn how to create engaging and interactive solutions. This course emphasizes hands-on learning, enabling students to develop their skills in designing and implementing dynamic and professional work.`,
				modeOfDelivery: 'Lecture & Tutorial',
				topics: outlineData.topics,
				references: undefined,
				additionalInfo: 'None',
			};

			const blob = await pdf(<CourseOutlinePDF data={pdfData} />).toBlob();

			if (blob.size === 0) {
				throw new Error('Generated PDF is empty');
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${courseName.replace(/\s+/g, '_')}_Course_Outline.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error generating course outline PDF:', error);
		} finally {
			setIsGenerating(false);
		}
	}

	const hasContent =
		outlineData &&
		(outlineData.sections.length > 0 || outlineData.topics.length > 0);

	return (
		<Tooltip label='Download Course Outline'>
			<ActionIcon
				onClick={handleDownload}
				loading={isGenerating}
				disabled={!hasContent}
				variant='default'
				size='lg'
			>
				<IconDownload size={18} />
			</ActionIcon>
		</Tooltip>
	);
}
