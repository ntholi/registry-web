import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { formatDate, formatSemester } from '@/shared/lib/utils/utils';
import type { getStudentRegistrationData } from '../../../_server/actions';

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
		black: '#000000',
		white: '#ffffff',
		gray: {
			'4a': '#4a4a4a',
			'666': '#666666',
			bd: '#bdbdbd',
		} as unknown as Record<number, string>,
	},
});

type StudentRegistrationData = NonNullable<
	Awaited<ReturnType<typeof getStudentRegistrationData>>
>;

type StudentModule =
	StudentRegistrationData['programs'][0]['semesters'][0]['studentModules'][0];

type ProofOfRegistrationPDFProps = {
	student: StudentRegistrationData;
};

export default function ProofOfRegistrationPDF({
	student,
}: ProofOfRegistrationPDFProps) {
	if (!student || !student.programs || student.programs.length === 0) {
		return (
			<Document>
				<Page
					size='A4'
					style={tw(
						'flex-col bg-white py-[30pt] px-[35pt] font-tahoma text-[10pt] leading-[1.1]'
					)}
				>
					<Text>No student data available</Text>
				</Page>
			</Document>
		);
	}

	const activeProgram = student.programs.find((p) => p.status === 'Active');

	if (!activeProgram) {
		return (
			<Document>
				<Page
					size='A4'
					style={tw(
						'flex-col bg-white py-[30pt] px-[35pt] font-tahoma text-[10pt] leading-[1.1]'
					)}
				>
					<Text>No active program found</Text>
				</Page>
			</Document>
		);
	}

	const latestSemester = activeProgram.semesters.at(-1);

	if (!latestSemester) {
		return (
			<Document>
				<Page
					size='A4'
					style={tw(
						'flex-col bg-white py-[30pt] px-[35pt] font-tahoma text-[10pt] leading-[1.1]'
					)}
				>
					<Text>No semester data available</Text>
				</Page>
			</Document>
		);
	}

	const activeModules = latestSemester.studentModules.filter(
		(sm: StudentModule) => sm.status !== 'Drop' && sm.status !== 'Delete'
	);

	const totalCredits = activeModules.reduce(
		(sum: number, sm: StudentModule) => sum + (sm.credits || 0),
		0
	);

	return (
		<Document>
			<Page
				size='A4'
				style={tw(
					'flex-col bg-white py-[30pt] px-[35pt] font-tahoma text-[10pt] leading-[1.1]'
				)}
			>
				<View style={tw('pb-[15pt] border-b border-solid border-black')}>
					<Text
						style={tw(
							'text-[14pt] font-bold mb-[8pt] leading-[1.1] text-black'
						)}
					>
						Limkokwing University of Creative Technology
					</Text>
					<View style={tw('flex-row items-start justify-between w-[100%]')}>
						<View style={tw('mt-[5pt]')}>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								Moshoshoe Road Maseru Central
							</Text>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								P.O. Box 8571
							</Text>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								Maseru Maseru 0101
							</Text>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								Lesotho
							</Text>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								+(266) 22315767 | Ext. 116
							</Text>
							<Text style={tw('text-[9pt] mb-[1pt] leading-[1.1] text-black')}>
								registry@limkokwing.ac.ls
							</Text>
						</View>
						<Image
							style={tw('w-auto h-[95pt] ml-[10pt]')}
							src='/images/logo-lesotho.jpg'
						/>
					</View>
				</View>

				<Text
					style={tw(
						'text-[12pt] font-bold mt-[25pt] mb-[20pt] text-left text-black'
					)}
				>
					PROOF OF REGISTRATION
				</Text>

				<View style={tw('mb-[25pt] border-b border-solid')}>
					<View style={tw('w-[100%]')}>
						<View
							style={tw(
								'flex-row border-t border-l border-r border-solid border-gray-bd min-h-[22pt]'
							)}
						>
							<View
								style={tw(
									'w-[25%] p-[8pt] font-bold border-r border-solid border-gray-bd justify-center text-[9pt]'
								)}
							>
								<Text>Student Number:</Text>
							</View>
							<View
								style={tw('w-[75%] p-[8pt] justify-center text-[9pt] bg-white')}
							>
								<Text>{student.stdNo}</Text>
							</View>
						</View>
						<View
							style={tw(
								'flex-row border-t border-l border-r border-solid border-gray-bd min-h-[22pt]'
							)}
						>
							<View
								style={tw(
									'w-[25%] p-[8pt] font-bold border-r border-solid border-gray-bd justify-center text-[9pt]'
								)}
							>
								<Text>Student Name:</Text>
							</View>
							<View
								style={tw('w-[75%] p-[8pt] justify-center text-[9pt] bg-white')}
							>
								<Text>{student.name}</Text>
							</View>
						</View>
						<View
							style={tw(
								'flex-row border-t border-l border-r border-solid border-gray-bd min-h-[22pt]'
							)}
						>
							<View
								style={tw(
									'w-[25%] p-[8pt] font-bold border-r border-solid border-gray-bd justify-center text-[9pt]'
								)}
							>
								<Text>Program:</Text>
							</View>
							<View
								style={tw('w-[75%] p-[8pt] justify-center text-[9pt] bg-white')}
							>
								<Text>{activeProgram.structure.program.name}</Text>
							</View>
						</View>
						<View
							style={tw(
								'flex-row border-t border-l border-r border-solid border-gray-bd min-h-[22pt]'
							)}
						>
							<View
								style={tw(
									'w-[25%] p-[8pt] font-bold border-r border-solid border-gray-bd justify-center text-[9pt]'
								)}
							>
								<Text>Term:</Text>
							</View>
							<View
								style={tw('w-[75%] p-[8pt] justify-center text-[9pt] bg-white')}
							>
								<Text>{latestSemester.termCode}</Text>
							</View>
						</View>
						<View
							style={tw(
								'flex-row border border-solid border-gray-bd min-h-[22pt]'
							)}
						>
							<View
								style={tw(
									'w-[25%] p-[8pt] font-bold border-r border-solid border-gray-bd justify-center text-[9pt]'
								)}
							>
								<Text>Semester:</Text>
							</View>
							<View
								style={tw('w-[75%] p-[8pt] justify-center text-[9pt] bg-white')}
							>
								<Text>
									{formatSemester(
										latestSemester.structureSemester?.semesterNumber,
										'full'
									)}
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={tw('mb-[20pt]')}>
					<Text style={tw('text-[11pt] font-bold mb-[12pt] text-black')}>
						REGISTERED MODULES
					</Text>

					<View
						style={tw('w-[100%] border border-solid border-black mb-[12pt]')}
					>
						<View
							style={tw(
								'flex-row bg-gray-4a border-b border-solid border-gray-666 min-h-[25pt]'
							)}
						>
							<View
								style={tw(
									'w-[6%] p-[4pt] border-r border-solid border-gray-666 justify-center items-center'
								)}
							>
								<Text style={tw('text-[9pt] font-bold text-white text-center')}>
									#
								</Text>
							</View>
							<View
								style={tw(
									'w-[64%] p-[4pt] border-r border-solid border-gray-666 justify-center items-center'
								)}
							>
								<Text style={tw('text-[9pt] font-bold text-white text-center')}>
									Module Code & Description
								</Text>
							</View>
							<View
								style={tw(
									'w-[15%] p-[4pt] border-r border-solid border-gray-666 justify-center items-center'
								)}
							>
								<Text style={tw('text-[9pt] font-bold text-white text-center')}>
									Status
								</Text>
							</View>
							<View
								style={tw(
									'w-[15%] p-[4pt] border-r border-solid border-gray-666 justify-center items-center'
								)}
							>
								<Text style={tw('text-[9pt] font-bold text-white text-center')}>
									Credits
								</Text>
							</View>
						</View>

						{activeModules.map(
							(studentModule: StudentModule, index: number) => {
								const isLastRow = index === activeModules.length - 1;
								return (
									<View
										key={studentModule.id}
										style={tw(
											`flex-row min-h-[35pt] ${isLastRow ? '' : 'border-b border-solid border-gray-666'}`
										)}
									>
										<View
											style={tw(
												'w-[6%] p-[4pt] border-r border-solid border-gray-666 justify-center'
											)}
										>
											<Text
												style={tw(
													'text-[9pt] font-bold text-center text-black'
												)}
											>
												{index + 1}
											</Text>
										</View>
										<View
											style={tw(
												'w-[64%] p-[4pt] border-r border-solid border-gray-666 justify-center'
											)}
										>
											<Text
												style={tw('text-[9pt] font-bold mb-[2pt] text-black')}
											>
												{studentModule.semesterModule.module?.code || 'N/A'}
											</Text>
											<Text style={tw('text-[8pt] text-black')}>
												{studentModule.semesterModule.module?.name || 'N/A'}
											</Text>
										</View>
										<View
											style={tw(
												'w-[15%] p-[4pt] border-r border-solid border-gray-666 justify-center'
											)}
										>
											<Text style={tw('text-[9pt] text-center text-black')}>
												{studentModule.status}
											</Text>
										</View>
										<View
											style={tw(
												'w-[15%] p-[4pt] border-r border-solid border-gray-666 justify-center'
											)}
										>
											<Text style={tw('text-[9pt] text-center text-black')}>
												{studentModule.credits.toFixed(1)}
											</Text>
										</View>
									</View>
								);
							}
						)}
					</View>

					<View style={tw('flex-row justify-end mt-[8pt]')}>
						<Text style={tw('text-[10pt] font-bold text-black')}>
							Credits: {totalCredits.toFixed(1)}
						</Text>
					</View>
				</View>

				<View
					style={tw(
						'flex-row justify-between mt-[15pt] pt-[12pt] border-t border-solid border-gray-bd'
					)}
				>
					<View style={tw('flex-row')}>
						<Text style={tw('text-[9pt] font-bold text-black')}>
							Date Requested:{' '}
						</Text>
						<Text style={tw('text-[9pt] text-black')}>
							{latestSemester.registrationRequest?.createdAt
								? formatDate(latestSemester.registrationRequest.createdAt)
								: 'N/A'}
						</Text>
					</View>
					<View style={tw('flex-row')}>
						<Text style={tw('text-[9pt] font-bold text-black')}>
							Date Registered:{' '}
						</Text>
						<Text style={tw('text-[9pt] text-black')}>
							{latestSemester.registrationRequest?.dateRegistered
								? formatDate(latestSemester.registrationRequest.dateRegistered)
								: 'N/A'}
						</Text>
					</View>
				</View>

				<View
					style={tw('mt-[20pt] pt-[15pt] border-t border-solid border-black')}
				>
					<Text style={tw('text-[7pt] text-justify leading-[1.2] text-black')}>
						This document serves as official proof of registration for the above
						student. Generated on {formatDate(new Date())}.
					</Text>
				</View>
			</Page>
		</Document>
	);
}
