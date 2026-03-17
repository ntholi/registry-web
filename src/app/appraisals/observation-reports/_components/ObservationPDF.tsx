import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';

const RATING_LABELS: Record<number, string> = {
	1: 'Unsatisfactory performance',
	2: 'Performance not fully satisfactory',
	3: 'Satisfactory performance',
	4: 'Above satisfactory performance',
	5: 'Excellent performance',
};

const SECTION_LABELS: Record<string, string> = {
	teaching_observation: 'Section 1: Teaching Observation',
	assessments: 'Section 2: Assessment KPIs',
	other: 'Section 3: Other KPIs',
};

type RatingEntry = {
	criterionText: string;
	categoryName: string;
	section: string;
	rating: number | null;
};

type ObservationPDFData = {
	lecturerName: string;
	schoolName: string;
	programName: string;
	termName: string;
	moduleCode: string;
	moduleName: string;
	observerName: string;
	status: string;
	strengths: string | null;
	improvements: string | null;
	recommendations: string | null;
	trainingArea: string | null;
	submittedAt: string | null;
	acknowledgedAt: string | null;
	acknowledgmentComment: string | null;
	ratings: RatingEntry[];
};

const s = StyleSheet.create({
	page: {
		backgroundColor: '#ffffff',
		paddingHorizontal: 40,
		paddingVertical: 30,
		fontSize: 9,
		fontFamily: 'Helvetica',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	logo: { width: 60, height: 60, marginRight: 12 },
	headerTextBlock: { flex: 1 },
	headerSub: { fontSize: 8, color: '#555555', marginBottom: 2 },
	headerTitle: {
		fontSize: 14,
		fontFamily: 'Helvetica-Bold',
		textAlign: 'center',
		marginBottom: 6,
	},
	divider: {
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		marginBottom: 8,
	},
	infoTable: { marginBottom: 10 },
	infoRow: {
		flexDirection: 'row',
		borderBottomWidth: 0.5,
		borderBottomColor: '#cccccc',
		paddingVertical: 3,
	},
	infoLabel: {
		width: 120,
		fontFamily: 'Helvetica-Bold',
		fontSize: 9,
	},
	infoValue: { flex: 1, fontSize: 9 },
	sectionTitle: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		marginTop: 10,
		marginBottom: 4,
		backgroundColor: '#f0f0f0',
		paddingVertical: 3,
		paddingHorizontal: 4,
	},
	categoryTitle: {
		fontSize: 9,
		fontFamily: 'Helvetica-Bold',
		marginTop: 6,
		marginBottom: 2,
		paddingLeft: 4,
	},
	ratingTableHeader: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		paddingVertical: 2,
		backgroundColor: '#e8e8e8',
	},
	ratingRow: {
		flexDirection: 'row',
		borderBottomWidth: 0.5,
		borderBottomColor: '#cccccc',
		paddingVertical: 2,
	},
	criterionCol: { flex: 1, paddingHorizontal: 4, fontSize: 8 },
	ratingCol: {
		width: 28,
		textAlign: 'center',
		fontSize: 8,
		borderLeftWidth: 0.5,
		borderLeftColor: '#cccccc',
	},
	ratingFilled: {
		width: 28,
		textAlign: 'center',
		fontSize: 8,
		borderLeftWidth: 0.5,
		borderLeftColor: '#cccccc',
		backgroundColor: '#2B579A',
		color: '#ffffff',
		fontFamily: 'Helvetica-Bold',
	},
	remarksSection: { marginTop: 10 },
	remarksTitle: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		marginBottom: 3,
	},
	remarksText: {
		fontSize: 9,
		marginBottom: 6,
		paddingLeft: 4,
		lineHeight: 1.4,
	},
	signatureRow: {
		flexDirection: 'row',
		marginTop: 20,
		gap: 40,
	},
	signatureBlock: { flex: 1 },
	signatureLabel: { fontSize: 8, color: '#666666', marginBottom: 16 },
	signatureLine: {
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		marginBottom: 3,
	},
	signatureName: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
	signatureDate: { fontSize: 8, color: '#666666', marginTop: 2 },
	scaleTable: { marginBottom: 10 },
	scaleRow: {
		flexDirection: 'row',
		paddingVertical: 1,
	},
	scaleNum: {
		width: 20,
		fontFamily: 'Helvetica-Bold',
		fontSize: 8,
		textAlign: 'center',
	},
	scaleDesc: { flex: 1, fontSize: 8 },
	footer: {
		position: 'absolute',
		bottom: 20,
		left: 40,
		right: 40,
		textAlign: 'center',
		fontSize: 7,
		color: '#999999',
	},
});

type Props = { data: ObservationPDFData };

export default function ObservationPDF({ data }: Props) {
	const grouped = groupBySection(data.ratings);

	return (
		<Document>
			<Page size='A4' style={s.page}>
				<View style={s.headerRow}>
					<Image src='/images/logo.png' style={s.logo} />
					<View style={s.headerTextBlock}>
						<Text style={s.headerSub}>
							FMG008 FACULTY MANAGEMENT – HUMAN RESOURCE DEPARTMENT
						</Text>
						<Text style={s.headerTitle}>PRL REPORT</Text>
					</View>
				</View>

				<View style={s.divider} />

				<View style={s.infoTable}>
					<InfoRow label='Campus' value='Maseru' />
					<InfoRow label='Person Observed' value={data.lecturerName} />
					<InfoRow label='Faculty' value={data.schoolName} />
					<InfoRow label='Programme' value={data.programName} />
					<InfoRow label='Semester' value={data.termName} />
					<InfoRow label='Module Code' value={data.moduleCode} />
					<InfoRow label='Module Name' value={data.moduleName} />
					<InfoRow label='Evaluated By' value={data.observerName} />
					<InfoRow label='Designation' value='Academic Program Leader' />
				</View>

				<View style={s.scaleTable}>
					<Text style={s.remarksTitle}>Rating Scale</Text>
					{[1, 2, 3, 4, 5].map((n) => (
						<View style={s.scaleRow} key={n}>
							<Text style={s.scaleNum}>{n}</Text>
							<Text style={s.scaleDesc}>{RATING_LABELS[n]}</Text>
						</View>
					))}
				</View>

				{Object.entries(grouped).map(([section, categories]) => (
					<View key={section} wrap={false}>
						<Text style={s.sectionTitle}>
							{SECTION_LABELS[section] ?? section}
						</Text>
						{Object.entries(categories).map(([catName, criteria]) => (
							<View key={catName}>
								<Text style={s.categoryTitle}>{catName}</Text>
								<View style={s.ratingTableHeader}>
									<Text style={s.criterionCol}>Criterion</Text>
									{[1, 2, 3, 4, 5].map((n) => (
										<Text style={s.ratingCol} key={n}>
											{n}
										</Text>
									))}
								</View>
								{criteria.map((c, i) => (
									<View style={s.ratingRow} key={i}>
										<Text style={s.criterionCol}>{c.criterionText}</Text>
										{[1, 2, 3, 4, 5].map((n) => (
											<Text
												style={c.rating === n ? s.ratingFilled : s.ratingCol}
												key={n}
											>
												{c.rating === n ? '✓' : ''}
											</Text>
										))}
									</View>
								))}
							</View>
						))}
					</View>
				))}

				<View style={s.remarksSection}>
					<Text style={s.remarksTitle}>PRL Remarks</Text>
					{data.strengths && (
						<>
							<Text style={{ ...s.categoryTitle, marginTop: 2 }}>
								Strengths
							</Text>
							<Text style={s.remarksText}>{data.strengths}</Text>
						</>
					)}
					{data.improvements && (
						<>
							<Text style={{ ...s.categoryTitle, marginTop: 2 }}>
								Areas for Improvement
							</Text>
							<Text style={s.remarksText}>{data.improvements}</Text>
						</>
					)}
					{data.recommendations && (
						<>
							<Text style={{ ...s.categoryTitle, marginTop: 2 }}>
								Recommendations
							</Text>
							<Text style={s.remarksText}>{data.recommendations}</Text>
						</>
					)}
				</View>

				{data.trainingArea && (
					<View style={s.remarksSection}>
						<Text style={s.remarksTitle}>Identified Training Area</Text>
						<Text style={s.remarksText}>{data.trainingArea}</Text>
					</View>
				)}

				<View style={s.signatureRow}>
					<View style={s.signatureBlock}>
						<Text style={s.signatureLabel}>Observer&apos;s Signature</Text>
						<View style={s.signatureLine} />
						<Text style={s.signatureName}>{data.observerName}</Text>
						{data.submittedAt && (
							<Text style={s.signatureDate}>
								Date: {new Date(data.submittedAt).toLocaleDateString()}
							</Text>
						)}
					</View>
					<View style={s.signatureBlock}>
						<Text style={s.signatureLabel}>Lecturer&apos;s Signature</Text>
						<View style={s.signatureLine} />
						<Text style={s.signatureName}>{data.lecturerName}</Text>
						{data.acknowledgedAt && (
							<Text style={s.signatureDate}>
								Date: {new Date(data.acknowledgedAt).toLocaleDateString()}
							</Text>
						)}
					</View>
				</View>

				<Text
					style={s.footer}
					render={({ pageNumber, totalPages }) =>
						`Page ${pageNumber} of ${totalPages}`
					}
					fixed
				/>
			</Page>
		</Document>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={s.infoRow}>
			<Text style={s.infoLabel}>{label}:</Text>
			<Text style={s.infoValue}>{value}</Text>
		</View>
	);
}

function groupBySection(ratings: RatingEntry[]) {
	const result: Record<string, Record<string, RatingEntry[]>> = {};
	for (const r of ratings) {
		if (!result[r.section]) result[r.section] = {};
		if (!result[r.section][r.categoryName])
			result[r.section][r.categoryName] = [];
		result[r.section][r.categoryName].push(r);
	}
	return result;
}

export type { ObservationPDFData };
