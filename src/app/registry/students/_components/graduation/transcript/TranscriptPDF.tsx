import { Document, Font, Page, Text, View } from '@react-pdf/renderer';
import { Fragment } from 'react';
import { createTw } from 'react-pdf-tailwind';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import type { getAcademicHistory } from '../../../_server/actions';
import { getCleanedSemesters } from '../../academics/statements/utils';
import GradeClassificationPage from './GradeClassificationPage';

Font.register({
	family: 'Tahoma',
	fonts: [
		{ src: '/fonts/TAHOMA_NORMAL.TTF' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold' },
		{ src: '/fonts/TAHOMA_NORMAL.TTF', fontStyle: 'italic' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold', fontStyle: 'italic' },
	],
});

Font.register({
	family: 'ui-sans-serif',
	fonts: [
		{ src: '/fonts/TAHOMA_NORMAL.TTF' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold' },
	],
});

const tw = createTw({
	fontFamily: {
		tahoma: ['Tahoma'],
		sans: ['Tahoma'],
	},
	colors: {
		black: '#000000',
	},
});

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

const HeaderRow = ({ label, value }: { label: string; value: string }) => (
	<View style={tw('flex flex-row items-start font-tahoma')}>
		<Text style={tw('w-[90pt] font-bold')}>{label}</Text>
		<Text style={tw('w-[10pt]')}>:</Text>
		<Text style={tw('flex-1')}>{value}</Text>
	</View>
);

const TableHeader = () => (
	<View style={tw('flex flex-row font-bold py-1 font-tahoma')}>
		<Text style={tw('w-[60pt]')}>Code</Text>
		<Text style={tw('flex-1')}>Module Name</Text>
		<Text style={tw('w-[38pt] text-right mr-2')}>Credit</Text>
		<Text style={tw('w-[35pt] text-left')}>Grade</Text>
	</View>
);

function formatMonthYear(date?: string | null) {
	if (!date) return 'N/A';
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return 'N/A';
	return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function formatTerm(term: string) {
	if (!term) return 'N/A';
	const parts = term.split('-');
	if (parts.length !== 2) return term;
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
		return term;
	}
	const date = new Date(year, month);
	return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const GradeRow = ({
	courseCode,
	courseName,
	credits,
	grade,
}: {
	courseCode: string;
	courseName: string;
	credits: number;
	grade: string;
}) => (
	<View style={tw('flex flex-row min-h-[7pt] items-start font-tahoma')}>
		<Text style={tw('w-[60pt]')}>{courseCode}</Text>
		<Text style={tw('flex-1')}>{courseName}</Text>
		<Text style={tw('w-[38pt] text-right mr-2')}>{credits}</Text>
		<Text style={tw('w-[35pt] text-left')}>{grade}</Text>
	</View>
);

const TermSummary = ({
	gpa,
	credits,
	cgpa,
	cumulativeCredits,
}: {
	gpa: number;
	credits: number;
	cgpa: number;
	cumulativeCredits: number;
}) => (
	<View style={tw('ml-[60pt] mt-1 font-tahoma')}>
		<View style={tw('flex flex-row justify-between w-[85%]')}>
			<View style={tw('w-[60pt] flex-row justify-between')}>
				<Text>GPA</Text>
				<Text>{`: ${gpa}`}</Text>
			</View>
			<View style={tw('w-[100pt] flex-row justify-between')}>
				<Text>Credits Earned</Text>
				<View style={tw('flex-row justify-between w-[13pt]')}>
					<Text>:</Text>
					<Text>{credits}</Text>
				</View>
			</View>
		</View>
		<View style={tw('flex flex-row justify-between w-[85%]')}>
			<View style={tw('w-[60pt] flex-row justify-between')}>
				<Text>CGPA</Text>
				<Text>{`: ${cgpa}`}</Text>
			</View>
			<View style={tw('w-[100pt] flex-row justify-between')}>
				<Text>Cumulative Credits</Text>
				<View style={tw('flex-row justify-between w-[13pt]')}>
					<Text>:</Text>
					<Text>{cumulativeCredits}</Text>
				</View>
			</View>
		</View>
	</View>
);

const TermSection = ({
	semester,
	academicRemarks,
}: {
	semester: ReturnType<typeof getCleanedSemesters>[number];
	academicRemarks: ReturnType<typeof getAcademicRemarks>;
}) => {
	const semesterPoint = academicRemarks.points.find(
		(point) => point.semesterId === semester.id
	);

	const semesterIndex = academicRemarks.points.findIndex(
		(point) => point.semesterId === semester.id
	);

	const cumulativeCredits = academicRemarks.points
		.slice(0, semesterIndex + 1)
		.reduce((sum, point) => sum + (point.creditsCompleted || 0), 0);

	return (
		<View style={tw('mb-2 font-tahoma')}>
			<Text style={tw('mb-0.5 font-bold')}>
				{formatTerm(semester.termCode)}
			</Text>
			{(semester.studentModules || []).map((sm, smIdx) => (
				<GradeRow
					key={`${sm.semesterModule?.module?.code}-${sm.id}-${smIdx}`}
					courseCode={sm.semesterModule?.module?.code || ''}
					courseName={sm.semesterModule?.module?.name || ''}
					credits={sm.credits || 0}
					grade={sm.grade || ''}
				/>
			))}
			<TermSummary
				gpa={Number((semesterPoint?.gpa || 0).toFixed(2))}
				credits={semesterPoint?.creditsCompleted || 0}
				cgpa={Number((semesterPoint?.cgpa || 0).toFixed(2))}
				cumulativeCredits={cumulativeCredits}
			/>
		</View>
	);
};

export function TranscriptPages({
	student,
	studentIndex,
}: {
	student: Student;
	studentIndex?: number;
}) {
	const completedPrograms = (student.programs || []).filter(
		(program) => program && program.status === 'Completed'
	);

	if (!completedPrograms || completedPrograms.length === 0) {
		return null;
	}

	const issueDate = new Date().toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return (
		<>
			{completedPrograms.map((program, pIdx) => {
				const programSemesters = getCleanedSemesters(program);
				const programRemarks = getAcademicRemarks([program]);

				const programPrimarySemester = programSemesters[0] || null;
				const admissionDate = program.intakeDate
					? formatMonthYear(program.intakeDate)
					: programPrimarySemester?.termCode || 'Unknown';

				const completionDate = program.graduationDate
					? new Date(program.graduationDate).toLocaleDateString('en-GB', {
							month: 'long',
							year: 'numeric',
						})
					: 'N/A';

				const allSemesters = programSemesters;
				const leftTerms = allSemesters.slice(0, 6);
				const rightTerms = allSemesters.slice(6);

				const key =
					studentIndex !== undefined
						? `student-${studentIndex}-program-${pIdx}`
						: `program-${pIdx}`;

				return (
					<Fragment key={key}>
						<Page
							size='A4'
							style={tw('pt-5 px-10 pb-10 font-tahoma text-[6.5pt] pt-[155pt]')}
						>
							<View style={tw('border-t border-b border-black py-1')}>
								<View style={tw('flex flex-row')}>
									<View style={tw('w-1/2 pr-1')}>
										<HeaderRow label='Student Name' value={student.name} />
										<HeaderRow
											label='Student ID'
											value={String(student.stdNo)}
										/>
										<HeaderRow
											label='IC / Passport No.'
											value={student.nationalId}
										/>
										<HeaderRow label='Gender' value={student.gender || 'N/A'} />
										<HeaderRow label='Nationality' value='Mosotho' />
									</View>
									<View style={tw('w-1/2 pl-1')}>
										<HeaderRow
											label='Date of Admission'
											value={admissionDate}
										/>
										<HeaderRow
											label='Date of Completion'
											value={completionDate}
										/>
										<HeaderRow
											label='Programme'
											value={program?.structure?.program?.name}
										/>
										<HeaderRow
											label='Faculty'
											value={program?.structure?.program?.school.name}
										/>
										<HeaderRow label='Issued Date' value={issueDate} />
									</View>
								</View>
							</View>

							<View
								style={tw(
									'mt-1.5 flex flex-row gap-2 border-t border-b border-black'
								)}
							>
								<View style={tw('flex-1')}>
									<TableHeader />
								</View>
								<View style={tw('flex-1')}>
									<TableHeader />
								</View>
							</View>

							<View style={tw('mt-2 flex flex-row gap-2')}>
								<View style={tw('flex-1')}>
									{leftTerms.map((semester, idx) => (
										<TermSection
											key={`l-${semester.id}-${idx}`}
											semester={semester}
											academicRemarks={programRemarks}
										/>
									))}
								</View>
								<View style={tw('flex-1')}>
									{rightTerms.map((semester, idx) => (
										<TermSection
											key={`r-${semester.id}-${idx}`}
											semester={semester}
											academicRemarks={programRemarks}
										/>
									))}
								</View>
							</View>

							<View style={tw('absolute bottom-[50pt] left-[85pt]')}>
								{['Total MPU Credits', 'Total Credit Transferred'].map(
									(label) => (
										<View key={label} style={tw('flex flex-row items-start')}>
											<Text style={tw('w-[160pt]')}>{label}</Text>
											<Text>{': '}-</Text>
										</View>
									)
								)}
								{['Total Credits Earned', 'Total Cumulative Credits'].map(
									(label) => (
										<View key={label} style={tw('flex flex-row items-start')}>
											<Text style={tw('w-[160pt]')}>{label}</Text>
											<Text>
												{': '}
												{programRemarks.totalCreditsCompleted}
											</Text>
										</View>
									)
								)}
							</View>

							<View
								style={tw(
									'absolute bottom-[50pt] right-14 w-[190pt] border-t border-black pt-1'
								)}
							>
								<Text style={tw('pt-0.5 text-center font-bold')}>
									REGISTRAR
								</Text>
								<Text style={tw('text-justify')}>
									This is not a valid record unless it bears both the stamp and
									signatory on behalf of the university
								</Text>
							</View>
						</Page>

						<GradeClassificationPage />
					</Fragment>
				);
			})}
		</>
	);
}

export default function TranscriptPDF({ student }: { student: Student }) {
	const completedPrograms = (student.programs || []).filter(
		(program) => program && program.status === 'Completed'
	);

	if (!completedPrograms || completedPrograms.length === 0) {
		return (
			<Document>
				<Page size='A4' style={tw('pt-5 px-10 pb-10 font-tahoma text-[7pt]')}>
					<Text>No completed programs found</Text>
				</Page>
			</Document>
		);
	}

	return (
		<Document>
			<TranscriptPages student={student} />
		</Document>
	);
}
