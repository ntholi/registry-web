'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getCourseOutline } from '../server/actions';
import CourseOutlinePDF, {
	type CourseOutlinePDFData,
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

	async function handleDownload() {
		if (!outlineData) {
			return;
		}

		setIsGenerating(true);
		try {
			const pdfData: CourseOutlinePDFData = {
				courseName,
				courseCode,
				programme: 'Course Outline',
				academicStaff: ['Course Instructor'],
				rationale:
					'This course is an essential component of the program as it addresses the increasing demand for professionals skilled in this field.',
				semester: 'Current Semester',
				lectureHours: 48,
				tutorialHours: 24,
				labTestHours: 22,
				assignmentHours: 30,
				totalHours: 124,
				creditValue: 12,
				prerequisites: 'None',
				objectives: outlineData.sections.map(
					(section) => section.content || section.title
				),
				learningOutcomes: outlineData.sections.map((section) => section.title),
				transferableSkills: [
					'Problem-solving: Students develop critical thinking skills to identify and solve design and implementation challenges.',
					'Creativity: Students learn to think creatively to design visually appealing and engaging interfaces.',
					'Communication: Students develop effective communication skills to articulate concepts, present their work, and collaborate with team members.',
					'Collaboration: Students engage in group projects, fostering teamwork and effective collaboration.',
				],
				teachingStrategy:
					"The Guided Discovery Strategy whereby the lecturer sets a problem, students explore the problem, and lecturer and students discuss and formulate conclusions. Discussion Strategy is used to stimulate discussion and refresh students' memories about the assigned readings.",
				synopsis: `This course is designed to provide students with a comprehensive understanding of the principles and techniques. Through a combination of theoretical concepts and practical applications, students will learn how to create engaging and interactive content. This course emphasizes hands-on learning, enabling students to develop their skills in designing and implementing dynamic interfaces.`,
				modeOfDelivery: 'Lecture & Tutorial',
				assessmentMethods: [
					{ type: 'Assignment 1:', weight: '15%' },
					{ type: 'Lab Test 1:', weight: '20%' },
					{ type: 'Group Project:', weight: '35%' },
					{ type: 'Lab Test 2:', weight: '30%' },
					{ type: 'TOTAL:', weight: '100%' },
				],
				courseObjectivesMapping: [
					{ objectives: '1,2,3', programmeObjectives: 'PO2' },
					{ objectives: '4', programmeObjectives: 'PO3' },
				],
				learningOutcomeMapping: [
					{ learningOutcome: '1,2', programmeLearningOutcome: 'LO1' },
					{ learningOutcome: '3', programmeLearningOutcome: 'LO4' },
					{ learningOutcome: '4', programmeLearningOutcome: 'LO5, LO6' },
				],
				topics: outlineData.topics,
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
