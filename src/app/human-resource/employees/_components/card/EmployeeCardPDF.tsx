import {
	Document,
	Font,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';
import type { getEmployee } from '../../_server/actions';

Font.register({
	family: 'Tahoma',
	fonts: [
		{ src: '/fonts/TAHOMA_NORMAL.TTF' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold' },
	],
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Tahoma',
		padding: 0,
	},
	cardContainer: {
		width: 242.6,
		height: 175,
		marginBottom: 20,
		position: 'relative',
		border: '1px solid #000',
	},
	blackHeader: {
		width: '100%',
		backgroundColor: '#000000',
		padding: 2,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	universityLogo: {
		width: 100,
		height: 40,
	},
	cardBody: {
		flexDirection: 'row',
		padding: 8,
		flex: 1,
	},
	leftSection: {
		flex: 1,
		paddingRight: 8,
	},
	name: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#000000',
		marginBottom: 0,
	},
	empNo: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#000000',
		marginBottom: 0,
	},
	department: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#000000',
		marginBottom: 0,
	},
	type: {
		fontSize: 10,
		fontWeight: 'bold',
		color: '#000000',
		marginBottom: 0,
	},
	year: {
		fontSize: 10,
		fontWeight: 'bold',
		color: '#000000',
	},
	rightSection: {
		alignItems: 'flex-end',
	},
	photoContainer: {
		width: 80,
		height: 100,
		marginBottom: 5,
		overflow: 'hidden',
	},
	photo: {
		width: '100%',
		objectFit: 'cover',
		height: '100%',
	},
	photoPlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: '#f0f0f0',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	photoPlaceholderText: {
		fontSize: 6,
		color: '#666666',
	},
	campusInfo: {
		fontSize: 6,
		fontWeight: 'bold',
		color: '#000000',
		textAlign: 'center',
	},
	cardFooter: {
		position: 'absolute',
		bottom: 1,
		left: 1,
		right: 1,
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
	},
	footerText: {
		fontSize: 4,
		fontWeight: 'bold',
		color: '#000000',
	},
});

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
	photoUrl: string | null;
};

export default function EmployeeCardPDF({ employee, photoUrl }: Props) {
	const department = employee.school?.name ?? 'N/A';
	const currentYear = new Date().getFullYear();

	return (
		<Document>
			<Page size={[242.6, 175]} style={styles.page}>
				<View style={styles.cardContainer}>
					<View style={styles.blackHeader}>
						<Image style={styles.universityLogo} src='/images/logo-dark.png' />
					</View>

					<View style={styles.cardBody}>
						<View style={styles.leftSection}>
							<Text style={styles.name}>{employee.name}</Text>
							<Text style={styles.empNo}>{employee.empNo}</Text>
							<Text style={styles.department}>{department}</Text>
							<Text style={styles.type}>
								{(employee.type ?? 'STAFF').toUpperCase()}
							</Text>
							<Text style={styles.year}>{currentYear}</Text>
							<View style={styles.cardFooter}>
								<Text style={styles.footerText}>
									If found please return to:
								</Text>
								<Text style={styles.footerText}>
									Limkokwing University Lesotho Campus
								</Text>
								<Text style={styles.footerText}>Tel: 22315747</Text>
							</View>
						</View>

						<View style={styles.rightSection}>
							<View style={styles.photoContainer}>
								{photoUrl ? (
									<Image style={styles.photo} src={photoUrl} />
								) : (
									<View style={styles.photoPlaceholder}>
										<Text style={styles.photoPlaceholderText}>NO PHOTO</Text>
									</View>
								)}
							</View>
							<Text style={styles.campusInfo}>LUCT LESOTHO</Text>
						</View>
					</View>
				</View>
			</Page>
		</Document>
	);
}
