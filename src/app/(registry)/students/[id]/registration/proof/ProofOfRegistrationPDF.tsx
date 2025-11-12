import {
	Document,
	Font,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';
import { formatDate, formatSemester } from '@/lib/utils/utils';
import type { getStudentRegistrationData } from '@/server/registry/students/actions';

Font.register({
	family: 'Arial',
	fonts: [
		{ src: '/fonts/ARIAL.TTF' },
		{ src: '/fonts/ARIALBD.TTF', fontWeight: 'bold' },
	],
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Arial',
		fontSize: 10,
		paddingTop: 30,
		paddingBottom: 30,
		paddingHorizontal: 35,
		lineHeight: 1.1,
	},
	headerContainer: {
		paddingBottom: 15,
		borderBottom: '1px solid #000',
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		width: '100%',
	},
	universityName: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
		lineHeight: 1.1,
		color: '#000',
	},
	addressContainer: {
		marginTop: 5,
	},
	addressLine: {
		fontSize: 9,
		marginBottom: 1,
		lineHeight: 1.1,
		color: '#000',
	},
	logo: {
		width: 'auto',
		height: 95,
		marginLeft: 10,
	},
	title: {
		fontSize: 12,
		fontWeight: 'bold',
		marginTop: 25,
		marginBottom: 20,
		textAlign: 'left',
		color: '#000',
	},
	studentInfoSection: {
		marginBottom: 25,
		borderBottom: '1px solid #666666',
	},
	infoTable: {
		width: '100%',
		border: '1px solid #BDBDBD',
	},
	tableRow: {
		flexDirection: 'row',
		borderBottom: '1px solid #BDBDBD',
		minHeight: 22,
	},
	lastTableRow: {
		flexDirection: 'row',
		minHeight: 22,
	},
	labelCell: {
		width: '25%',
		padding: 8,
		fontWeight: 'bold',
		borderRight: '1px solid #BDBDBD',
		justifyContent: 'center',
		fontSize: 9,
	},
	valueCell: {
		width: '75%',
		padding: 8,
		justifyContent: 'center',
		fontSize: 9,
		backgroundColor: '#ffffff',
	},
	modulesSection: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: 'bold',
		marginBottom: 12,
		color: '#000',
	},
	moduleTable: {
		width: '100%',
		borderTop: '1px solid #000',
		borderLeft: '1px solid #000',
		borderRight: '1px solid #000',
		borderBottom: '1px solid #000',
		marginBottom: 12,
	},
	moduleHeaderRow: {
		flexDirection: 'row',
		backgroundColor: '#4a4a4a',
		borderBottom: '1px solid #666666',
		minHeight: 25,
	},
	moduleHeaderCell: {
		padding: 4,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
		alignItems: 'center',
	},
	moduleHeaderText: {
		fontSize: 9,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center',
	},
	moduleDataRow: {
		flexDirection: 'row',
		borderBottom: '1px solid #666666',
		minHeight: 35,
	},
	moduleLastDataRow: {
		flexDirection: 'row',
		minHeight: 35,
	},
	moduleDataCell: {
		padding: 4,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
	},
	moduleLastDataCell: {
		padding: 4,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
	},
	moduleNumberCol: {
		width: '6%',
	},
	moduleCodeDescCol: {
		width: '64%',
	},
	moduleTypeCol: {
		width: '15%',
	},
	moduleCreditsCol: {
		width: '15%',
	},
	moduleCode: {
		fontSize: 9,
		fontWeight: 'bold',
		marginBottom: 2,
		color: '#000',
	},
	moduleDescription: {
		fontSize: 8,
		color: '#000',
	},
	moduleNumber: {
		fontSize: 9,
		fontWeight: 'bold',
		textAlign: 'center',
		color: '#000',
	},
	moduleType: {
		fontSize: 9,
		textAlign: 'center',
		color: '#000',
	},
	moduleCredits: {
		fontSize: 9,
		textAlign: 'center',
		color: '#000',
	},
	creditsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 8,
		marginBottom: 25,
	},
	creditsLabel: {
		fontSize: 10,
		fontWeight: 'bold',
		color: '#000',
	},
	footerSection: {
		marginTop: 20,
		paddingTop: 15,
		borderTop: '1px solid #000',
	},
	footerText: {
		fontSize: 7,
		textAlign: 'justify',
		lineHeight: 1.2,
		color: '#000',
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
				<Page size='A4' style={styles.page}>
					<Text>No student data available</Text>
				</Page>
			</Document>
		);
	}

	const activeProgram = student.programs.find((p) => p.status === 'Active');

	if (!activeProgram) {
		return (
			<Document>
				<Page size='A4' style={styles.page}>
					<Text>No active program found</Text>
				</Page>
			</Document>
		);
	}

	const latestSemester = activeProgram.semesters.at(-1);

	if (!latestSemester) {
		return (
			<Document>
				<Page size='A4' style={styles.page}>
					<Text>No semester data available</Text>
				</Page>
			</Document>
		);
	}

	const activeModules = latestSemester.studentModules.filter(
		(sm: StudentModule) => sm.status !== 'Drop' && sm.status !== 'Delete'
	);

	const totalCredits = activeModules.reduce(
		(sum: number, sm: StudentModule) => sum + (sm.semesterModule.credits || 0),
		0
	);

	return (
		<Document>
			<Page size='A4' style={styles.page}>
				<View style={styles.headerContainer}>
					<Text style={styles.universityName}>
						Limkokwing University of Creative Technology
					</Text>
					<View style={styles.headerContent}>
						<View style={styles.addressContainer}>
							<Text style={styles.addressLine}>
								Moshoshoe Road Maseru Central
							</Text>
							<Text style={styles.addressLine}>P.O. Box 8571</Text>
							<Text style={styles.addressLine}>Maseru Maseru 0101</Text>
							<Text style={styles.addressLine}>Lesotho</Text>
							<Text style={styles.addressLine}>+(266) 22315767 | Ext. 116</Text>
							<Text style={styles.addressLine}>registry@limkokwing.ac.ls</Text>
						</View>
						<Image style={styles.logo} src='/images/logo-lesotho.jpg' />
					</View>
				</View>

				<Text style={styles.title}>PROOF OF REGISTRATION</Text>

				<View style={styles.studentInfoSection}>
					<View style={styles.infoTable}>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>Student Number:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{student.stdNo}</Text>
							</View>
						</View>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>Student Name:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{student.name}</Text>
							</View>
						</View>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>Program:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{activeProgram.structure.program.name}</Text>
							</View>
						</View>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>Term:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{latestSemester.term}</Text>
							</View>
						</View>
						<View style={styles.lastTableRow}>
							<View style={[styles.labelCell]}>
								<Text>Semester:</Text>
							</View>
							<View style={[styles.valueCell]}>
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

				<View style={styles.modulesSection}>
					<Text style={styles.sectionTitle}>REGISTERED MODULES</Text>

					<View style={styles.moduleTable}>
						<View style={styles.moduleHeaderRow}>
							<View style={[styles.moduleHeaderCell, styles.moduleNumberCol]}>
								<Text style={styles.moduleHeaderText}>#</Text>
							</View>
							<View style={[styles.moduleHeaderCell, styles.moduleCodeDescCol]}>
								<Text style={styles.moduleHeaderText}>
									Module Code & Description
								</Text>
							</View>
							<View style={[styles.moduleHeaderCell, styles.moduleTypeCol]}>
								<Text style={styles.moduleHeaderText}>Type</Text>
							</View>
							<View style={[styles.moduleHeaderCell, styles.moduleCreditsCol]}>
								<Text style={styles.moduleHeaderText}>Credits</Text>
							</View>
						</View>

						{activeModules.map(
							(studentModule: StudentModule, index: number) => {
								const isLastRow = index === activeModules.length - 1;
								return (
									<View
										key={studentModule.id}
										style={
											isLastRow
												? styles.moduleLastDataRow
												: styles.moduleDataRow
										}
									>
										<View
											style={[
												isLastRow
													? styles.moduleLastDataCell
													: styles.moduleDataCell,
												styles.moduleNumberCol,
											]}
										>
											<Text style={styles.moduleNumber}>{index + 1}</Text>
										</View>
										<View
											style={[
												isLastRow
													? styles.moduleLastDataCell
													: styles.moduleDataCell,
												styles.moduleCodeDescCol,
											]}
										>
											<Text style={styles.moduleCode}>
												{studentModule.semesterModule.module?.code || 'N/A'}
											</Text>
											<Text style={styles.moduleDescription}>
												{studentModule.semesterModule.module?.name || 'N/A'}
											</Text>
										</View>
										<View
											style={[
												isLastRow
													? styles.moduleLastDataCell
													: styles.moduleDataCell,
												styles.moduleTypeCol,
											]}
										>
											<Text style={styles.moduleType}>
												{studentModule.semesterModule.type === 'Major'
													? 'Major'
													: 'Minor'}
											</Text>
										</View>
										<View
											style={[
												isLastRow
													? styles.moduleLastDataCell
													: styles.moduleDataCell,
												styles.moduleCreditsCol,
											]}
										>
											<Text style={styles.moduleCredits}>
												{studentModule.semesterModule.credits.toFixed(1)}
											</Text>
										</View>
									</View>
								);
							}
						)}
					</View>

					<View style={styles.creditsRow}>
						<Text style={styles.creditsLabel}>
							Credits: {totalCredits.toFixed(1)}
						</Text>
					</View>
				</View>

				<View style={styles.footerSection}>
					<Text style={styles.footerText}>
						Document ID: registration_{student.stdNo}_
						{latestSemester.term.replace(/\s+/g, '_')}_
						{formatDate(new Date()).replace(/\//g, '')} | This document serves
						as official proof of registration for the above student.
						Registration processed through the official university system on{' '}
						{formatDate(new Date())}.
					</Text>
				</View>
			</Page>
		</Document>
	);
}
