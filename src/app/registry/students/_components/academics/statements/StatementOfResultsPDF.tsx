import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { formatDate, formatSemester } from '@/shared/lib/utils/utils';
import type { getAcademicHistory } from '../../../_server/actions';

type StatementOfResultsPDFProps = {
	student: NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
	qrCodeDataURL?: string;
	includeSignature?: boolean;
};

Font.register({
	family: 'Tahoma',
	fonts: [
		{ src: '/fonts/TAHOMA_NORMAL.TTF' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold' },
		{ src: '/fonts/TAHOMA_NORMAL.TTF', fontStyle: 'italic' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold', fontStyle: 'italic' },
	],
});

const tw = createTw({
	fontFamily: {
		tahoma: ['Tahoma'],
	},
	colors: {
		'gray-333': '#333333',
		'gray-666': '#666666',
		'gray-ccc': '#cccccc',
		'gray-e0': '#e0e0e0',
		'gray-f5': '#f5f5f5',
	},
});

import {
	getAcademicRemarks,
	getGradePoints,
	isFailingGrade,
} from '@/shared/lib/utils/grades';
import { getCleanedSemesters } from './utils';

function getGradeClassName(grade: string) {
	if (isFailingGrade(grade)) return 'text-black font-bold';
	if (['A+', 'A', 'A-'].includes(grade)) return 'text-black font-bold';
	return 'text-gray-333';
}

export default function StatementOfResultsPDF({
	student,
	qrCodeDataURL,
	includeSignature = true,
}: StatementOfResultsPDFProps) {
	try {
		if (!student || !student.programs) {
			return (
				<Document>
					<Page
						size='A4'
						style={tw('flex-col bg-white p-10 font-tahoma text-[10pt]')}
					>
						<Text>No student data available</Text>
					</Page>
				</Document>
			);
		}

		const programs = (student.programs || []).filter(
			(program) => program && ['Active', 'Completed'].includes(program.status)
		);

		const academicRemarks = getAcademicRemarks(programs);

		return (
			<Document>
				<Page
					size='A4'
					style={tw('flex-col bg-white p-10 font-tahoma text-[10pt]')}
				>
					<View style={tw('mb-[30pt] border-b-2 border-black pb-[15pt]')}>
						<Image
							style={tw('h-[90pt] self-center mb-[10pt]')}
							src='/images/logo-lesotho.jpg'
						/>
						<Text
							style={tw(
								'text-[18pt] font-bold text-center mt-[1pt] text-black tracking-[1pt] uppercase'
							)}
						>
							STATEMENT OF RESULTS
						</Text>
						<Text style={tw('text-[9pt] text-gray-666 mt-[1pt] text-center')}>
							This document does not certify graduation
						</Text>
					</View>
					<View
						style={tw(
							'mb-[25pt] bg-white p-[15pt] border border-gray-ccc rounded-[2pt]'
						)}
					>
						<Text
							style={tw(
								'text-[12pt] font-bold mb-[10pt] text-black border-b border-gray-ccc pb-[5pt]'
							)}
						>
							STUDENT INFORMATION
						</Text>
						<View style={tw('flex-row mb-[6pt]')}>
							<Text style={tw('font-bold w-[140pt] text-gray-333')}>
								Student Number:
							</Text>
							<Text style={tw('flex-1 text-black')}>{student.stdNo}</Text>
						</View>
						<View style={tw('flex-row mb-[6pt]')}>
							<Text style={tw('font-bold w-[140pt] text-gray-333')}>
								Full Name:
							</Text>
							<Text style={tw('flex-1 text-black')}>{student.name}</Text>
						</View>
						<View style={tw('flex-row mb-[6pt]')}>
							<Text style={tw('font-bold w-[140pt] text-gray-333')}>
								ID/Passport:
							</Text>
							<Text style={tw('flex-1 text-black')}>{student.nationalId}</Text>
						</View>
						<View style={tw('flex-row mb-[6pt]')}>
							<Text style={tw('font-bold w-[140pt] text-gray-333')}>
								Date of Issue:
							</Text>
							<Text style={tw('flex-1 text-black')}>
								{formatDate(new Date())}
							</Text>
						</View>
					</View>
					{programs.map((program) => {
						const semesters = getCleanedSemesters(program);

						return (
							<View key={program.id}>
								<Text
									style={tw(
										'text-[14pt] font-bold mb-[15pt] bg-black text-white p-[8pt] rounded-[2pt]'
									)}
								>
									{program.structure.program.name}
								</Text>
								{semesters.map((semester) => {
									const semesterPoint = academicRemarks.points.find(
										(point) => point.semesterId === semester.id
									);
									const semesterGPA = semesterPoint?.gpa || 0;
									const semesterNumber =
										semester.structureSemester?.semesterNumber;

									return (
										<View
											key={semester.id}
											style={tw('mb-[15pt]')}
											wrap={false}
										>
											<View
												style={tw(
													'text-[11pt] font-bold bg-gray-e0 text-gray-333 p-[8pt] flex-row justify-between items-center border border-gray-ccc border-b-0'
												)}
											>
												<Text>
													{semesterNumber
														? formatSemester(semesterNumber)
														: semester.termCode}{' '}
													({semester.termCode})
												</Text>
												<Text>GPA: {semesterGPA.toFixed(2)}</Text>
											</View>
											<View
												style={tw('w-auto border border-solid border-gray-ccc')}
											>
												<View
													style={tw(
														'flex-row font-bold text-gray-333 bg-gray-f5'
													)}
												>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc text-left w-[15%] text-[9pt] leading-[1.2]'
														)}
													>
														Code
													</Text>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc text-left w-[43%] text-[9pt] leading-[1.2]'
														)}
													>
														Module Name
													</Text>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2]'
														)}
													>
														Credits
													</Text>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[12%] text-center text-[9pt] leading-[1.2]'
														)}
													>
														Marks
													</Text>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2]'
														)}
													>
														Grade
													</Text>
													<Text
														style={tw(
															'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2]'
														)}
													>
														Points
													</Text>
												</View>
												{(semester.studentModules || []).map((sm, index) => (
													<View
														key={`${semester.id}-${sm.semesterModuleId}-${index}`}
														style={tw('flex-row')}
													>
														<Text
															style={tw(
																'p-[4pt] border-[0.5pt] border-solid border-gray-ccc text-left w-[15%] text-[9pt] leading-[1.2]'
															)}
														>
															{sm.semesterModule?.module?.code ??
																`${sm.semesterModuleId}`}
														</Text>
														<Text
															style={tw(
																'p-[4pt] border-[0.5pt] border-solid border-gray-ccc text-left w-[43%] text-[9pt] leading-[1.2]'
															)}
														>
															{sm.semesterModule?.module?.name ??
																`<<Semester Module ID: ${sm.semesterModuleId}>>`}
														</Text>
														<Text
															style={tw(
																'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2]'
															)}
														>
															{sm.credits || 0}
														</Text>
														<Text
															style={tw(
																'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[12%] text-center text-[9pt] leading-[1.2]'
															)}
														>
															{sm.marks || '-'}
														</Text>
														<Text
															style={tw(
																`p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2] ${getGradeClassName(sm.grade || 'NM')}`
															)}
														>
															{sm.grade || 'NM'}
														</Text>
														<Text
															style={tw(
																'p-[4pt] border-[0.5pt] border-solid border-gray-ccc w-[10%] text-center text-[9pt] leading-[1.2]'
															)}
														>
															{getGradePoints(sm.grade || 'NM').toFixed(1)}
														</Text>
													</View>
												))}
											</View>
										</View>
									);
								})}
							</View>
						);
					})}
					<View wrap={false}>
						<View
							style={tw(
								'mt-[20pt] border-2 border-black p-[15pt] rounded-[2pt]'
							)}
						>
							<Text
								style={tw(
									'text-[12pt] font-bold mb-[15pt] text-center text-black border-b border-black pb-[8pt]'
								)}
							>
								CUMULATIVE ACADEMIC SUMMARY
							</Text>
							<View style={tw('flex-row justify-between items-start')}>
								<View style={tw('flex-1')}>
									<View style={tw('mb-[8pt]')}>
										<Text style={tw('text-[10pt] mb-[2pt] text-gray-333')}>
											Credits Attempted
										</Text>
										<Text style={tw('text-[12pt] font-bold text-black')}>
											{academicRemarks.totalCreditsAttempted}
										</Text>
									</View>
									<View style={tw('mb-[8pt]')}>
										<Text style={tw('text-[10pt] mb-[2pt] text-gray-333')}>
											Credits Earned
										</Text>
										<Text style={tw('text-[12pt] font-bold text-black')}>
											{academicRemarks.totalCreditsCompleted}
										</Text>
									</View>
									<View style={tw('mb-[8pt]')}>
										<Text style={tw('text-[10pt] mb-[2pt] text-gray-333')}>
											Cumulative GPA
										</Text>
										<Text style={tw('text-[12pt] font-bold text-black')}>
											{academicRemarks.latestPoints?.cgpa.toFixed(2)}
										</Text>
									</View>
								</View>
								<View style={tw('flex-1 pl-[20pt]')}>
									<View style={tw('mb-[12pt]')}>
										<Text
											style={tw('text-[10pt] mb-[4pt] text-gray-333 font-bold')}
										>
											Academic Status
										</Text>
										<Text
											style={tw('text-[14pt] font-bold text-black mb-[2pt]')}
										>
											{academicRemarks.status}
										</Text>
										<Text
											style={tw('text-[9pt] text-gray-666 italic mb-[8pt]')}
										>
											{academicRemarks.details}
										</Text>
									</View>
									{(academicRemarks.failedModules.length > 0 ||
										academicRemarks.supplementaryModules.length > 0) && (
										<View
											style={tw('mt-[8pt] pt-[8pt] border-t border-gray-e0')}
										>
											<Text
												style={tw(
													'text-[10pt] font-bold mb-[6pt] text-gray-333'
												)}
											>
												Outstanding Requirements (
												{academicRemarks.failedModules.length +
													academicRemarks.supplementaryModules.length}
												)
											</Text>
											{academicRemarks.failedModules.map((module, index) => (
												<Text
													key={`failed-${module.code}-${index}`}
													style={tw('text-[8pt] mb-[2pt] text-black pl-[4pt]')}
												>
													• {module.code} - {module.name} (Repeat)
												</Text>
											))}
											{academicRemarks.supplementaryModules.map(
												(module, index) => (
													<Text
														key={`supplementary-${module.code}-${index}`}
														style={tw(
															'text-[8pt] mb-[2pt] text-black pl-[4pt]'
														)}
													>
														• {module.code} - {module.name} (Supplementary)
													</Text>
												)
											)}
										</View>
									)}
								</View>
							</View>
						</View>
						{includeSignature && (
							<View
								style={tw(
									'flex-row justify-between items-start mt-[20pt] mb-[3pt]'
								)}
							>
								<View style={tw('items-center w-[200pt]')}>
									<Image
										style={tw('w-[120pt] h-[60pt]')}
										src='/images/signature_small.png'
									/>
									<Text
										style={tw('border-b border-gray-333 w-[150pt] mb-[3pt]')}
									></Text>
									<Text style={tw('text-[8pt] text-gray-333 font-bold')}>
										Registrar
									</Text>
								</View>
								{qrCodeDataURL && (
									<View style={tw('items-center w-[120pt]')}>
										<Image
											style={tw('w-[60pt] h-[60pt] mb-[3pt]')}
											src={qrCodeDataURL}
										/>
										<Text
											style={tw(
												'text-[7pt] text-gray-333 text-center leading-[1.2]'
											)}
										>
											Scan to verify{'\n'}statement authenticity
										</Text>
									</View>
								)}
							</View>
						)}
					</View>
				</Page>
			</Document>
		);
	} catch (error) {
		console.error('Error generating statement of results:', error);
		return (
			<Document>
				<Page
					size='A4'
					style={tw('flex-col bg-white p-10 font-tahoma text-[10pt]')}
				>
					<Text>Error generating statement of results</Text>
				</Page>
			</Document>
		);
	}
}
