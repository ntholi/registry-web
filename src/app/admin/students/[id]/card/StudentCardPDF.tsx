import { getStudent } from '@/server/students/actions';
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
  family: 'Arial',
  fonts: [
    { src: '/fonts/ARIAL.TTF' },
    { src: '/fonts/ARIALBD.TTF', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Arial',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    width: 340,
    height: 215,
    border: '1px solid #000',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  blackHeader: {
    width: '100%',
    height: 80,
    backgroundColor: '#000000',
    padding: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  universityLogo: {
    width: 200,
    height: 60,
  },
  universityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  universitySubtitle: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 15,
    flex: 1,
    backgroundColor: '#ffffff',
  },
  leftSection: {
    flex: 1,
    paddingRight: 15,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  studentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  studentProgram: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  studentType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  studentYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  photoContainer: {
    width: 90,
    height: 110,
    border: '1px solid #000',
    marginBottom: 10,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
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
    fontSize: 8,
    color: '#666666',
  },
  campusInfo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 5,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#000000',
  },
});

type StudentCardPDFProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  photoUrl: string;
};

export default function StudentCardPDF({
  student,
  photoUrl,
}: StudentCardPDFProps) {
  const activeProgram = student.programs?.find((p) => p.status === 'Active');
  const programCode = activeProgram?.structure?.program?.code || 'N/A';
  const currentYear = new Date().getFullYear();

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.blackHeader}>
            <Image style={styles.universityLogo} src='/images/logo-dark.png' />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.leftSection}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentId}>{student.stdNo}</Text>
              <Text style={styles.studentProgram}>{programCode}</Text>
              <Text style={styles.studentType}>STUDENT</Text>
              <Text style={styles.studentYear}>{currentYear}</Text>
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

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>If found please return to:</Text>
          </View>
          <View style={[styles.cardFooter, { bottom: -5 }]}>
            <Text style={styles.footerText}>
              Limkokwing University, Lesotho Campus
            </Text>
          </View>
          <View style={[styles.cardFooter, { bottom: -15 }]}>
            <Text style={styles.footerText}>Telephone Number: 22314551</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
