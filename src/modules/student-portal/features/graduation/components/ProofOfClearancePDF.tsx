import {
	Document,
	Font,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';
import type { getGraduationClearanceData } from '@registry/graduation/clearance/server';
import { formatDate, toTitleCase } from '@/shared/lib/utils/utils';

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
	clearanceSection: {
		marginBottom: 25,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: 'bold',
		marginBottom: 12,
		color: '#000',
	},
	statementText: {
		fontSize: 10,
		lineHeight: 1.4,
		marginBottom: 20,
		textAlign: 'justify',
		color: '#000',
	},
	paymentSection: {
		marginBottom: 20,
	},
	paymentTable: {
		width: '100%',
		borderTop: '1px solid #000',
		borderLeft: '1px solid #000',
		borderRight: '1px solid #000',
		borderBottom: '1px solid #000',
		marginBottom: 12,
	},
	paymentHeaderRow: {
		flexDirection: 'row',
		backgroundColor: '#4a4a4a',
		borderBottom: '1px solid #666666',
		minHeight: 25,
	},
	paymentHeaderCell: {
		padding: 6,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
		alignItems: 'center',
	},
	paymentHeaderText: {
		fontSize: 9,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center',
	},
	paymentDataRow: {
		flexDirection: 'row',
		borderBottom: '1px solid #666666',
		minHeight: 30,
	},
	paymentLastDataRow: {
		flexDirection: 'row',
		minHeight: 30,
	},
	paymentDataCell: {
		padding: 6,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
	},
	paymentLastDataCell: {
		padding: 6,
		borderRight: '1px solid #666666',
		justifyContent: 'center',
	},
	paymentTypeCol: {
		width: '50%',
	},
	receiptNoCol: {
		width: '50%',
	},
	paymentTypeText: {
		fontSize: 9,
		color: '#000',
		textAlign: 'center',
	},
	receiptNoText: {
		fontSize: 9,
		color: '#000',
		textAlign: 'center',
	},
	warningSection: {
		marginTop: 15,
		marginBottom: 15,
		padding: 15,
		border: '2px solid #ff6b35',
		backgroundColor: '#fff5f3',
	},
	warningTitle: {
		fontSize: 11,
		fontWeight: 'bold',
		color: '#d63031',
		marginBottom: 8,
		textAlign: 'center',
	},
	warningText: {
		fontSize: 9,
		lineHeight: 1.4,
		color: '#d63031',
		textAlign: 'justify',
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

type GraduationClearanceData = NonNullable<
	Awaited<ReturnType<typeof getGraduationClearanceData>>
>;

type ProofOfClearancePDFProps = {
	graduationData: GraduationClearanceData;
};

export default function ProofOfClearancePDF({
	graduationData,
}: ProofOfClearancePDFProps) {
	if (!graduationData) {
		return (
			<Document>
				<Page size='A4' style={styles.page}>
					<Text>No graduation data available</Text>
				</Page>
			</Document>
		);
	}

	const {
		studentProgram,
		graduationClearances: _graduationClearances,
		paymentReceipts = [],
	} = graduationData;
	const student = studentProgram.student;
	const program = studentProgram.structure.program;
	const school = program.school;

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

				<Text style={styles.title}>PROOF OF CLEARANCE</Text>

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
								<Text>National ID:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{student.nationalId}</Text>
							</View>
						</View>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>Program:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{program.name}</Text>
							</View>
						</View>
						<View style={styles.tableRow}>
							<View style={[styles.labelCell]}>
								<Text>School:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{school?.name || 'N/A'}</Text>
							</View>
						</View>
						<View style={styles.lastTableRow}>
							<View style={[styles.labelCell]}>
								<Text>Clearance Date:</Text>
							</View>
							<View style={[styles.valueCell]}>
								<Text>{formatDate(new Date())}</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={styles.clearanceSection}>
					<Text style={styles.statementText}>
						The student has successfully completed all program requirements and
						has met all university obligations. This clearance is issued to
						confirm that there are no outstanding issues that would prevent the
						not prevented from graduating.
					</Text>
				</View>

				{paymentReceipts && paymentReceipts.length > 0 && (
					<View style={styles.paymentSection}>
						<Text style={styles.sectionTitle}>PAYMENT RECEIPTS</Text>

						<View style={styles.paymentTable}>
							<View style={styles.paymentHeaderRow}>
								<View style={[styles.paymentHeaderCell, styles.paymentTypeCol]}>
									<Text style={styles.paymentHeaderText}>Payment Type</Text>
								</View>
								<View style={[styles.paymentHeaderCell, styles.receiptNoCol]}>
									<Text style={styles.paymentHeaderText}>Receipt Number</Text>
								</View>
							</View>

							{paymentReceipts.map((receipt, index) => {
								const isLastRow = index === paymentReceipts.length - 1;

								return (
									<View
										key={receipt.id}
										style={
											isLastRow
												? styles.paymentLastDataRow
												: styles.paymentDataRow
										}
									>
										<View
											style={[
												isLastRow
													? styles.paymentLastDataCell
													: styles.paymentDataCell,
												styles.paymentTypeCol,
											]}
										>
											<Text style={styles.paymentTypeText}>
												{toTitleCase(receipt.paymentType.replace(/_/g, ' '))}
											</Text>
										</View>
										<View
											style={[
												isLastRow
													? styles.paymentLastDataCell
													: styles.paymentDataCell,
												styles.receiptNoCol,
											]}
										>
											<Text style={styles.receiptNoText}>
												{receipt.receiptNo}
											</Text>
										</View>
									</View>
								);
							})}
						</View>
					</View>
				)}

				<View style={styles.warningSection}>
					<Text style={styles.warningTitle}>IMPORTANT NOTICE</Text>
					<Text style={styles.warningText}>
						Please verify that all information on this document, especially the
						student name and national ID number, are correct. If you find any
						discrepancies, please contact the Registry Office immediately! This
						document is only valid if all information is accurate and complete.
					</Text>
				</View>

				<View style={styles.footerSection}>
					<Text style={styles.footerText}>
						Document ID: clearance_{student.stdNo}_
						{formatDate(new Date()).replace(/\//g, '')} | This document serves
						as official proof that all departmental clearances have been
						approved for graduation. All academic, financial, and library
						obligations have been satisfied. Clearance processed through the
						official university system on {formatDate(new Date())}. This
						certificate is invalid if any information is found to be incorrect.
					</Text>
				</View>
			</Page>
		</Document>
	);
}
