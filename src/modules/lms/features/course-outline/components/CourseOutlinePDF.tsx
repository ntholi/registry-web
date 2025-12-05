'use client';

import { Document, Font, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import type { CourseTopic } from '../types';

Font.register({
	family: 'Arial',
	fonts: [
		{ src: '/fonts/ARIAL.TTF' },
		{ src: '/fonts/ARIALBD.TTF', fontWeight: 'bold' },
		{ src: '/fonts/ARIALI.TTF', fontStyle: 'italic' },
		{ src: '/fonts/ARIALBI.TTF', fontWeight: 'bold', fontStyle: 'italic' },
	],
});

const tw = createTw({
	theme: {
		fontFamily: {
			arial: ['Arial'],
		},
	},
});

export type CourseOutlinePDFData = {
	courseName: string;
	courseCode: string;
	programme?: string;
	academicStaff: string[];
	rationale: string;
	semester: string;
	lectureHours: number;
	tutorialHours: number;
	labTestHours: number;
	assignmentHours: number;
	totalHours: number;
	creditValue: number;
	prerequisites: string;
	objectives: string[];
	learningOutcomes: string[];
	transferableSkills: string[];
	teachingStrategy: string;
	synopsis: string;
	modeOfDelivery: string;
	assessmentMethods: Array<{ type: string; weight: string }>;
	courseObjectivesMapping: Array<{
		objectives: string;
		programmeObjectives: string;
	}>;
	learningOutcomeMapping: Array<{
		learningOutcome: string;
		programmeLearningOutcome: string;
	}>;
	topics: CourseTopic[];
};

type CourseOutlinePDFProps = {
	data: CourseOutlinePDFData;
};

function stripHtml(html: string): string {
	if (typeof document !== 'undefined') {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;
		return tempDiv.textContent || tempDiv.innerText || '';
	}
	return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

function TableRow({
	number,
	label,
	children,
	isLast = false,
}: {
	number: string;
	label: string;
	children: React.ReactNode;
	isLast?: boolean;
}) {
	return (
		<View style={tw(`flex-row ${isLast ? '' : 'border-b border-black'}`)}>
			<View
				style={tw(
					'w-[5%] py-1.5 px-1 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{number}</Text>
			</View>
			<View
				style={tw(
					'w-[20%] py-1.5 px-1.5 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{label}</Text>
			</View>
			<View style={tw('w-[75%] py-1.5 px-1.5 justify-start items-start')}>
				{children}
			</View>
		</View>
	);
}

function SubTableRow({
	children,
	isLast = false,
}: {
	children: React.ReactNode;
	isLast?: boolean;
}) {
	return (
		<View style={tw(`flex-row ${isLast ? '' : 'border-b border-black'}`)}>
			{children}
		</View>
	);
}

function SubTableCell({
	children,
	isLast = false,
	bold = false,
}: {
	children: React.ReactNode;
	isLast?: boolean;
	bold?: boolean;
}) {
	return (
		<View
			style={tw(
				`flex-1 py-1 px-1 text-center ${isLast ? '' : 'border-r border-black'}`
			)}
		>
			<Text style={tw(`text-[9px] text-center ${bold ? 'font-bold' : ''}`)}>
				{children}
			</Text>
		</View>
	);
}

export default function CourseOutlinePDF({ data }: CourseOutlinePDFProps) {
	return (
		<Document>
			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-10 pb-10 px-10 leading-normal')}
			>
				<Text style={tw('text-[11px] font-bold text-center mb-4 underline')}>
					{data.programme || 'Course Outline'}
				</Text>
				<View style={tw('w-full border border-black')}>
					<TableRow number='1' label='Name of course'>
						<Text style={tw('text-[9px]')}>{data.courseName}</Text>
					</TableRow>
					<TableRow number='2' label='Course Code'>
						<Text style={tw('text-[9px]')}>{data.courseCode}</Text>
					</TableRow>
					<TableRow number='3' label='Name(s) of academic staff'>
						{data.academicStaff.map((staff) => (
							<View key={staff} style={tw('ml-4 mt-0.5')}>
								<Text style={tw('text-[9px]')}>• {staff}</Text>
							</View>
						))}
					</TableRow>
					<TableRow
						number='4'
						label='Rationale for the inclusion of the course/course in the programme'
					>
						<Text style={tw('text-[9px]')}>{stripHtml(data.rationale)}</Text>
					</TableRow>
					<TableRow number='5' label='Semester and Year Offered'>
						<Text style={tw('text-[9px]')}>{data.semester}</Text>
					</TableRow>
					<TableRow number='6' label='Total Student Learning Time (SLT)'>
						<View style={tw('border border-black mt-1')}>
							<SubTableRow>
								<SubTableCell bold>Lecture</SubTableCell>
								<SubTableCell bold>Tutorial</SubTableCell>
								<SubTableCell bold>Lab Tests</SubTableCell>
								<SubTableCell bold>Assignments</SubTableCell>
								<SubTableCell bold isLast>
									Total Guided and Independent Learning
								</SubTableCell>
							</SubTableRow>
							<SubTableRow isLast>
								<SubTableCell>{data.lectureHours}</SubTableCell>
								<SubTableCell>{data.tutorialHours}</SubTableCell>
								<SubTableCell>{data.labTestHours}</SubTableCell>
								<SubTableCell>{data.assignmentHours}</SubTableCell>
								<SubTableCell isLast>{data.totalHours}</SubTableCell>
							</SubTableRow>
						</View>
					</TableRow>
					<TableRow number='7' label='Credit Value'>
						<Text style={tw('text-[9px]')}>{data.creditValue}</Text>
					</TableRow>
					<TableRow number='8' label='Pre-requisites (if any)' isLast>
						<Text style={tw('text-[9px]')}>{data.prerequisites || 'None'}</Text>
					</TableRow>
				</View>
				<Text style={tw('absolute bottom-5 left-10 text-[8px] italic')}>
					Limkokwing University of Creative Technology
				</Text>
			</Page>

			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-10 pb-10 px-10 leading-normal')}
			>
				<View style={tw('w-full border border-black')}>
					<TableRow number='9' label='Objectives'>
						<Text style={tw('text-[9px]')}>
							In this course, students will be:
						</Text>
						{data.objectives.map((obj, i) => (
							<View key={obj} style={tw('ml-2.5 mt-0.5')}>
								<Text style={tw('text-[9px]')}>
									{i + 1}. {stripHtml(obj)}
								</Text>
							</View>
						))}
					</TableRow>
					<TableRow number='10' label='Learning Outcomes'>
						<Text style={tw('text-[9px]')}>
							Upon completion of the course, students will be able to:
						</Text>
						{data.learningOutcomes.map((lo, i) => (
							<View key={lo} style={tw('ml-2.5 mt-0.5')}>
								<Text style={tw('text-[9px]')}>
									{i + 1}. {stripHtml(lo)}
								</Text>
							</View>
						))}
					</TableRow>
					<TableRow number='11' label='Transferable skills'>
						<Text style={tw('text-[9px]')}>
							Students will acquire the following skills:
						</Text>
						{data.transferableSkills.map((skill, i) => (
							<View key={skill} style={tw('ml-2.5 mt-0.5')}>
								<Text style={tw('text-[9px]')}>
									{i + 1}. {stripHtml(skill)}
								</Text>
							</View>
						))}
					</TableRow>
					<TableRow
						number='12'
						label='Teaching-learning and assessment strategy'
						isLast
					>
						<Text style={tw('text-[9px]')}>
							{stripHtml(data.teachingStrategy)}
						</Text>
					</TableRow>
				</View>
				<Text style={tw('absolute bottom-5 left-10 text-[8px] italic')}>
					Limkokwing University of Creative Technology
				</Text>
			</Page>

			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-10 pb-10 px-10 leading-normal')}
			>
				<View style={tw('w-full border border-black')}>
					<TableRow number='13' label='Synopsis'>
						<Text style={tw('text-[9px]')}>{stripHtml(data.synopsis)}</Text>
					</TableRow>
					<TableRow number='14' label='Mode of Delivery'>
						<Text style={tw('text-[9px]')}>{data.modeOfDelivery}</Text>
					</TableRow>
					<TableRow number='15' label='Assessment Methods and Types'>
						<View style={tw('border border-black mt-1')}>
							{data.assessmentMethods.map((method, i) => (
								<SubTableRow
									key={method.type}
									isLast={i === data.assessmentMethods.length - 1}
								>
									<SubTableCell>{method.type}</SubTableCell>
									<SubTableCell isLast>{method.weight}</SubTableCell>
								</SubTableRow>
							))}
						</View>
					</TableRow>
					<TableRow
						number='16'
						label='Mapping of the course/module to the Programme Objectives'
					>
						<View style={tw('border border-black mt-1')}>
							<SubTableRow>
								<SubTableCell bold>
									Course/Module (topic) Objectives
								</SubTableCell>
								<SubTableCell bold isLast>
									Programme Objectives
								</SubTableCell>
							</SubTableRow>
							{data.courseObjectivesMapping.map((mapping, i) => (
								<SubTableRow
									key={mapping.objectives}
									isLast={i === data.courseObjectivesMapping.length - 1}
								>
									<SubTableCell>{mapping.objectives}</SubTableCell>
									<SubTableCell isLast>
										{mapping.programmeObjectives}
									</SubTableCell>
								</SubTableRow>
							))}
						</View>
					</TableRow>
					<TableRow
						number='17'
						label='Mapping of the course/module to the Programme Learning Outcome'
						isLast
					>
						<View style={tw('border border-black mt-1')}>
							<SubTableRow>
								<SubTableCell bold>
									Course/Module (topic) Learning Outcome
								</SubTableCell>
								<SubTableCell bold isLast>
									Programme Learning Outcome
								</SubTableCell>
							</SubTableRow>
							{data.learningOutcomeMapping.map((mapping, i) => (
								<SubTableRow
									key={mapping.learningOutcome}
									isLast={i === data.learningOutcomeMapping.length - 1}
								>
									<SubTableCell>{mapping.learningOutcome}</SubTableCell>
									<SubTableCell isLast>
										{mapping.programmeLearningOutcome}
									</SubTableCell>
								</SubTableRow>
							))}
						</View>
					</TableRow>
				</View>
				<Text style={tw('absolute bottom-5 left-10 text-[8px] italic')}>
					Limkokwing University of Creative Technology
				</Text>
			</Page>

			{data.topics.length > 0 && (
				<Page
					size='A4'
					style={tw('font-arial text-[9px] pt-10 pb-10 px-10 leading-normal')}
				>
					<Text style={tw('text-[11px] font-bold text-center mb-4 underline')}>
						Course Topics
					</Text>
					<View style={tw('w-full border border-black')}>
						<View style={tw('flex-row border-b border-black')}>
							<View
								style={tw(
									'w-[10%] py-1.5 px-1 border-r border-black justify-start items-start'
								)}
							>
								<Text style={tw('text-[9px] font-bold')}>Week</Text>
							</View>
							<View
								style={tw(
									'w-[25%] py-1.5 px-1.5 border-r border-black justify-start items-start'
								)}
							>
								<Text style={tw('text-[9px] font-bold')}>Topic</Text>
							</View>
							<View
								style={tw('w-[65%] py-1.5 px-1.5 justify-start items-start')}
							>
								<Text style={tw('text-[9px] font-bold')}>Content</Text>
							</View>
						</View>
						{[...data.topics]
							.sort((a, b) => a.weekNumber - b.weekNumber)
							.map((topic, i) => (
								<View
									key={topic.id}
									style={tw(
										`flex-row ${i === data.topics.length - 1 ? '' : 'border-b border-black'}`
									)}
								>
									<View
										style={tw(
											'w-[10%] py-1.5 px-1 border-r border-black justify-start items-start'
										)}
									>
										<Text style={tw('text-[9px]')}>
											Week {topic.weekNumber}
										</Text>
									</View>
									<View
										style={tw(
											'w-[25%] py-1.5 px-1.5 border-r border-black justify-start items-start'
										)}
									>
										<Text style={tw('text-[9px]')}>{topic.title}</Text>
									</View>
									<View
										style={tw(
											'w-[65%] py-1.5 px-1.5 justify-start items-start'
										)}
									>
										<Text style={tw('text-[9px]')}>
											{stripHtml(topic.description)}
										</Text>
									</View>
								</View>
							))}
					</View>
					<Text style={tw('absolute bottom-5 left-10 text-[8px] italic')}>
						Limkokwing University of Creative Technology
					</Text>
				</Page>
			)}
		</Document>
	);
}
