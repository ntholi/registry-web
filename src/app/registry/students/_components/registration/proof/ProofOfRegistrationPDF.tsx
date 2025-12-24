'use client';

import {
	Document,
	Font,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';

Font.register({
	family: 'Times-Roman',
	fonts: [
		{
			src: '/fonts/Times-Roman.ttf',
			fontWeight: 'normal',
		},
		{
			src: '/fonts/Times-Bold.ttf',
			fontWeight: 'bold',
		},
	],
});

const styles = StyleSheet.create({
	page: {
		padding: 30,
		fontFamily: 'Times-Roman',
		fontSize: 9,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
		paddingBottom: 10,
		borderBottomWidth: 2,
		borderBottomColor: '#000',
	},
	logo: {
		width: 80,
		height: 80,
	},
	headerText: {
		flex: 1,
		textAlign: 'center',
		marginHorizontal: 10,
	},
	universityName: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 3,
	},
	documentTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginTop: 5,
		textDecoration: 'underline',
	},
	termCode: {
		fontSize: 11,
		marginTop: 3,
	},
	studentInfo: {
		marginBottom: 15,
	},
	infoRow: {
		flexDirection: 'row',
		marginBottom: 3,
	},
	infoLabel: {
		width: 120,
		fontWeight: 'bold',
	},
	infoValue: {
		flex: 1,
	},
	moduleTable: {
		marginTop: 10,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: '#f0f0f0',
		borderWidth: 1,
		borderColor: '#000',
		fontWeight: 'bold',
	},
	tableRow: {
		flexDirection: 'row',
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: '#000',
	},
	tableCell: {
		padding: 4,
		borderRightWidth: 1,
		borderColor: '#000',
	},
	tableCellLast: {
		padding: 4,
	},
	colNo: { width: '5%' },
	colCode: { width: '15%' },
	colName: { width: '45%' },
	colCredits: { width: '10%', textAlign: 'center' },
	colType: { width: '12%', textAlign: 'center' },
	colSemester: { width: '13%', textAlign: 'center' },
	footer: {
		marginTop: 20,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
	},
	footerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 30,
	},
	signatureBlock: {
		width: '45%',
	},
	signatureLine: {
		borderBottomWidth: 1,
		borderBottomColor: '#000',
		marginBottom: 3,
		marginTop: 30,
	},
	signatureLabel: {
		fontSize: 8,
		textAlign: 'center',
	},
	dateText: {
		fontSize: 8,
		textAlign: 'right',
		marginTop: 10,
	},
	summarySection: {
		marginTop: 10,
		padding: 8,
		backgroundColor: '#f9f9f9',
		borderWidth: 1,
		borderColor: '#ccc',
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 3,
	},
	summaryLabel: {
		fontWeight: 'bold',
	},
	stamp: {
		position: 'absolute',
		right: 30,
		bottom: 100,
		width: 80,
		height: 80,
		opacity: 0.7,
	},
});

type Module = {
	code: string;
	name: string;
	credits: number;
	type: string;
	semesterNumber: string;
};

type ProofOfRegistrationData = {
	stdNo: number;
	name: string;
	program: string;
	faculty: string;
	semesterNumber: string;
	semesterStatus: string;
	termCode: string;
	modules: Module[];
	sponsor?: string;
	registrationDate: Date;
};

type Props = {
	data: ProofOfRegistrationData;
};

function formatSemester(semesterNo: string) {
	const num = Number.parseInt(semesterNo, 10);
	if (Number.isNaN(num)) return semesterNo;
	const year = Math.ceil(num / 2);
	const sem = num % 2 === 1 ? 1 : 2;
	return `Year ${year} Semester ${sem}`;
}

export default function ProofOfRegistrationPDF({ data }: Props) {
	const totalCredits = data.modules.reduce((sum, m) => sum + m.credits, 0);

	return (
		<Document>
			<Page size='A4' style={styles.page}>
				<View style={styles.header}>
					<Image style={styles.logo} src='/images/logo.png' />
					<View style={styles.headerText}>
						<Text style={styles.universityName}>
							LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY
						</Text>
						<Text>Office of the Registrar</Text>
						<Text style={styles.documentTitle}>PROOF OF REGISTRATION</Text>
						<Text style={styles.termCode}>{data.termCode}</Text>
					</View>
					<Image style={styles.logo} src='/images/logo.png' />
				</View>

				<View style={styles.studentInfo}>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Student Number:</Text>
						<Text style={styles.infoValue}>{data.stdNo}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Student Name:</Text>
						<Text style={styles.infoValue}>{data.name}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Programme:</Text>
						<Text style={styles.infoValue}>{data.program}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Faculty:</Text>
						<Text style={styles.infoValue}>{data.faculty}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Semester:</Text>
						<Text style={styles.infoValue}>
							{formatSemester(data.semesterNumber)} ({data.semesterStatus})
						</Text>
					</View>
					{data.sponsor && (
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Sponsor:</Text>
							<Text style={styles.infoValue}>{data.sponsor}</Text>
						</View>
					)}
				</View>

				<View style={styles.moduleTable}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableCell, styles.colNo]}>#</Text>
						<Text style={[styles.tableCell, styles.colCode]}>Code</Text>
						<Text style={[styles.tableCell, styles.colName]}>Module Name</Text>
						<Text style={[styles.tableCell, styles.colCredits]}>Credits</Text>
						<Text style={[styles.tableCell, styles.colType]}>Type</Text>
						<Text style={[styles.tableCellLast, styles.colSemester]}>
							Semester
						</Text>
					</View>
					{data.modules.map((module, index) => (
						<View key={index} style={styles.tableRow}>
							<Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
							<Text style={[styles.tableCell, styles.colCode]}>
								{module.code}
							</Text>
							<Text style={[styles.tableCell, styles.colName]}>
								{module.name}
							</Text>
							<Text style={[styles.tableCell, styles.colCredits]}>
								{module.credits}
							</Text>
							<Text style={[styles.tableCell, styles.colType]}>
								{module.type}
							</Text>
							<Text style={[styles.tableCellLast, styles.colSemester]}>
								{formatSemester(module.semesterNumber)}
							</Text>
						</View>
					))}
				</View>

				<View style={styles.summarySection}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Modules:</Text>
						<Text>{data.modules.length}</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Credits:</Text>
						<Text>{totalCredits}</Text>
					</View>
				</View>

				<View style={styles.footer}>
					<View style={styles.footerRow}>
						<View style={styles.signatureBlock}>
							<View style={styles.signatureLine} />
							<Text style={styles.signatureLabel}>Registrar</Text>
						</View>
						<View style={styles.signatureBlock}>
							<View style={styles.signatureLine} />
							<Text style={styles.signatureLabel}>Date / Official Stamp</Text>
						</View>
					</View>
					<Text style={styles.dateText}>
						Generated on:{' '}
						{new Date().toLocaleDateString('en-GB', {
							day: '2-digit',
							month: 'long',
							year: 'numeric',
						})}
					</Text>
				</View>
			</Page>
		</Document>
	);
}
