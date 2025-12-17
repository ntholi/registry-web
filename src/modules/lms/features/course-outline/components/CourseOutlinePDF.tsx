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

export type AcademicStaff = {
	name: string;
	qualification?: string;
};

export type Prerequisite = {
	code: string;
	name: string;
};

export type CourseOutlinePDFData = {
	courseName: string;
	courseCode: string;
	programmeName: string;
	semesterDisplay: string;
	academicStaff: AcademicStaff[];
	rationale: string;
	creditValue: number;
	prerequisites: Prerequisite[];
	objectives: string[];
	learningOutcomes: string[];
	transferableSkills: string[];
	teachingStrategy: string;
	synopsis: string;
	modeOfDelivery: string;
	topics: CourseTopic[];
	references?: {
		compulsory?: string;
		additional?: string;
	};
	additionalInfo?: string;
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
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"');
}

function Header({ programmeName }: { programmeName: string }) {
	return (
		<View style={tw('bg-[#4472C4] py-1.5 px-2 border border-black mb-0')} fixed>
			<Text style={tw('text-[10px] font-bold text-white text-center')}>
				{programmeName}
			</Text>
		</View>
	);
}

function Footer({ programmeName }: { programmeName: string }) {
	return (
		<View style={tw('absolute bottom-6 left-10 right-10')} fixed>
			<Text style={tw('text-[8px] italic')}>
				Limkokwing University of Creative Technology
			</Text>
			<Text style={tw('text-[8px] italic')}>{programmeName}</Text>
		</View>
	);
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
		<View
			style={tw(`flex-row ${isLast ? '' : 'border-b border-black'}`)}
			wrap={false}
		>
			<View
				style={tw(
					'w-[6%] py-2 px-1.5 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{number}</Text>
			</View>
			<View
				style={tw(
					'w-[18%] py-2 px-2 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{label}</Text>
			</View>
			<View style={tw('w-[76%] py-2 px-2 justify-start items-start')}>
				{children}
			</View>
		</View>
	);
}

function TableRowWrappable({
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
					'w-[6%] py-2 px-1.5 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{number}</Text>
			</View>
			<View
				style={tw(
					'w-[18%] py-2 px-2 border-r border-black justify-start items-start'
				)}
			>
				<Text style={tw('text-[9px]')}>{label}</Text>
			</View>
			<View style={tw('w-[76%] py-2 px-2 justify-start items-start')}>
				{children}
			</View>
		</View>
	);
}

function NumberedItem({ number, text }: { number: number; text: string }) {
	return (
		<View style={tw('flex-row mb-1 ml-4')}>
			<Text style={tw('text-[9px] w-[15px]')}>{number}.</Text>
			<Text style={tw('text-[9px] flex-1')}>{stripHtml(text)}</Text>
		</View>
	);
}

function BulletItem({ text, bold = false }: { text: string; bold?: boolean }) {
	return (
		<View style={tw('flex-row mb-0.5 ml-4')}>
			<Text style={tw('text-[9px] w-[15px]')}>•</Text>
			<Text style={tw(`text-[9px] flex-1 ${bold ? 'font-bold' : ''}`)}>
				{stripHtml(text)}
			</Text>
		</View>
	);
}

function TopicsTable({ topics }: { topics: CourseTopic[] }) {
	const sortedTopics = [...topics].sort((a, b) => a.weekNumber - b.weekNumber);

	const totals = {
		lecture: sortedTopics.length * 2,
		tutorial: sortedTopics.length * 1,
		sl: sortedTopics.length * 3,
		total: sortedTopics.length * 6,
	};

	return (
		<View style={tw('border border-black mt-1')}>
			<View style={tw('flex-row border-b border-black bg-white')}>
				<View style={tw('w-[55%] py-1.5 px-2 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>Topic</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>Lecture</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>Tutorial</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>SL</Text>
				</View>
				<View style={tw('w-[12%] py-1.5 px-1')}>
					<Text style={tw('text-[9px] font-bold text-center')}>Total SLL</Text>
				</View>
			</View>
			{sortedTopics.map((topic, index) => (
				<View
					key={topic.id}
					style={tw(
						`flex-row ${index === sortedTopics.length - 1 ? '' : 'border-b border-black'}`
					)}
					wrap={false}
				>
					<View style={tw('w-[55%] py-1.5 px-2 border-r border-black')}>
						<Text style={tw('text-[9px] font-bold')}>
							{topic.weekNumber}.0 {topic.title.toUpperCase()}
						</Text>
						{topic.description && (
							<View style={tw('mt-0.5')}>
								{stripHtml(topic.description)
									.split('\n')
									.filter((line) => line.trim())
									.map((line, i) => (
										<BulletItem key={`${topic.id}-${i}`} text={line.trim()} />
									))}
							</View>
						)}
					</View>
					<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
						<Text style={tw('text-[9px] text-center')}>2</Text>
					</View>
					<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
						<Text style={tw('text-[9px] text-center')}>1</Text>
					</View>
					<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
						<Text style={tw('text-[9px] text-center')}>3</Text>
					</View>
					<View style={tw('w-[12%] py-1.5 px-1')}>
						<Text style={tw('text-[9px] text-center')}>6</Text>
					</View>
				</View>
			))}
			<View style={tw('flex-row border-t border-black')} wrap={false}>
				<View style={tw('w-[55%] py-1.5 px-2 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-right')}>Total</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>
						{totals.lecture}
					</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>
						{totals.tutorial}
					</Text>
				</View>
				<View style={tw('w-[11%] py-1.5 px-1 border-r border-black')}>
					<Text style={tw('text-[9px] font-bold text-center')}>
						{totals.sl}
					</Text>
				</View>
				<View style={tw('w-[12%] py-1.5 px-1')}>
					<Text style={tw('text-[9px] font-bold text-center')}>
						{totals.total}
					</Text>
				</View>
			</View>
		</View>
	);
}

export default function CourseOutlinePDF({ data }: CourseOutlinePDFProps) {
	const prerequisitesText =
		data.prerequisites.length > 0
			? data.prerequisites.map((p) => `${p.code}, ${p.name}`).join('; ')
			: 'None';

	return (
		<Document>
			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-8 pb-16 px-10 leading-normal')}
			>
				<Header programmeName={data.programmeName} />
				<View style={tw('w-full border-l border-r border-b border-black')}>
					<TableRow number='1' label='Name of course'>
						<Text style={tw('text-[9px]')}>{data.courseName}</Text>
					</TableRow>
					<TableRow number='2' label='Course Code'>
						<Text style={tw('text-[9px]')}>{data.courseCode}</Text>
					</TableRow>
					<TableRow number='3' label='Name(s) of academic staff'>
						{data.academicStaff.map((staff, index) => (
							<View key={`staff-${index}`} style={tw(index > 0 ? 'mt-2' : '')}>
								<Text style={tw('text-[9px] font-bold')}>{staff.name}</Text>
								{staff.qualification && (
									<BulletItem text={staff.qualification} />
								)}
							</View>
						))}
					</TableRow>
					<TableRowWrappable
						number='4'
						label='Rationale for the inclusion of the course/ course in the programme'
					>
						<Text style={tw('text-[9px] text-justify leading-relaxed')}>
							{stripHtml(data.rationale)}
						</Text>
					</TableRowWrappable>
					<TableRow number='5' label='Semester and Year Offered'>
						<Text style={tw('text-[9px]')}>{data.semesterDisplay}</Text>
					</TableRow>
					<TableRow number='7' label='Credit Value'>
						<Text style={tw('text-[9px]')}>{data.creditValue}</Text>
					</TableRow>
					<TableRow number='8' label='Pre-requisites (if any)' isLast>
						<Text style={tw('text-[9px]')}>{prerequisitesText}</Text>
					</TableRow>
				</View>
				<Footer programmeName={data.programmeName} />
			</Page>

			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-8 pb-16 px-10 leading-normal')}
			>
				<View style={tw('w-full border border-black')}>
					<TableRowWrappable number='9' label='Objectives'>
						<Text style={tw('text-[9px] mb-1')}>
							In this course, students will be:
						</Text>
						{data.objectives.map((obj, i) => (
							<NumberedItem key={`obj-${i}`} number={i + 1} text={obj} />
						))}
					</TableRowWrappable>
					<TableRowWrappable number='10' label='Learning Outcomes'>
						<Text style={tw('text-[9px] mb-1')}>
							Upon completion of the course, students will be able to:
						</Text>
						{data.learningOutcomes.map((lo, i) => (
							<NumberedItem key={`lo-${i}`} number={i + 1} text={lo} />
						))}
					</TableRowWrappable>
					<TableRowWrappable number='11' label='Transferable skills'>
						<Text style={tw('text-[9px] mb-1')}>
							Students will acquire the following skills:
						</Text>
						{data.transferableSkills.map((skill, i) => (
							<NumberedItem key={`skill-${i}`} number={i + 1} text={skill} />
						))}
					</TableRowWrappable>
					<TableRowWrappable
						number='12'
						label='Teaching-learning and assessment strategy'
						isLast
					>
						<Text style={tw('text-[9px] text-justify leading-relaxed')}>
							{stripHtml(data.teachingStrategy)}
						</Text>
					</TableRowWrappable>
				</View>
				<Footer programmeName={data.programmeName} />
			</Page>

			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-8 pb-16 px-10 leading-normal')}
			>
				<View style={tw('w-full border border-black')}>
					<TableRowWrappable number='13' label='Synopsis'>
						<Text style={tw('text-[9px] text-justify leading-relaxed')}>
							{stripHtml(data.synopsis)}
						</Text>
					</TableRowWrappable>
					<TableRow number='14' label='Mode of Delivery' isLast>
						<Text style={tw('text-[9px]')}>{data.modeOfDelivery}</Text>
					</TableRow>
				</View>
				<Footer programmeName={data.programmeName} />
			</Page>

			{data.topics.length > 0 && (
				<Page
					size='A4'
					style={tw('font-arial text-[9px] pt-8 pb-16 px-10 leading-normal')}
				>
					<View style={tw('w-full border border-black')}>
						<View style={tw('flex-row')}>
							<View
								style={tw(
									'w-[6%] py-2 px-1.5 border-r border-black justify-start items-start'
								)}
							>
								<Text style={tw('text-[9px]')}>18</Text>
							</View>
							<View
								style={tw(
									'w-[18%] py-2 px-2 border-r border-black justify-start items-start'
								)}
							>
								<Text style={tw('text-[9px]')}>
									Content Outline of the course/module and the SLT per topic
								</Text>
							</View>
							<View style={tw('w-[76%] py-2 px-2 justify-start items-start')}>
								<TopicsTable topics={data.topics} />
							</View>
						</View>
					</View>
					<Footer programmeName={data.programmeName} />
				</Page>
			)}

			<Page
				size='A4'
				style={tw('font-arial text-[9px] pt-8 pb-16 px-10 leading-normal')}
			>
				<View style={tw('w-full border border-black')}>
					<TableRowWrappable number='19' label='References'>
						{data.references?.compulsory && (
							<View style={tw('mb-2')}>
								<Text style={tw('text-[9px] font-bold')}>Compulsory</Text>
								<Text style={tw('text-[9px] ml-4')}>
									{data.references.compulsory}
								</Text>
							</View>
						)}
						{data.references?.additional && (
							<View>
								<Text style={tw('text-[9px] font-bold')}>Additional</Text>
								<Text style={tw('text-[9px] ml-4')}>
									{data.references.additional}
								</Text>
							</View>
						)}
						{!data.references?.compulsory && !data.references?.additional && (
							<Text style={tw('text-[9px]')}>None</Text>
						)}
					</TableRowWrappable>
					<TableRow number='20' label='Additional Information' isLast>
						<Text style={tw('text-[9px]')}>
							{data.additionalInfo || 'None'}
						</Text>
					</TableRow>
				</View>
				<Footer programmeName={data.programmeName} />
			</Page>
		</Document>
	);
}
