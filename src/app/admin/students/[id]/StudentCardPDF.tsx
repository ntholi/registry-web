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
    border: '2px solid #000',
    borderRadius: 8,
    marginBottom: 20,
    position: 'relative',
  },
  cardFront: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    padding: 15,
    borderRadius: 6,
  },
  universityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  universityInfo: {
    flex: 1,
  },
  universityName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.9,
  },
  logo: {
    width: 40,
    height: 40,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  studentDetails: {
    flex: 1,
    paddingRight: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  studentField: {
    fontSize: 9,
    color: '#ffffff',
    marginBottom: 3,
    opacity: 0.9,
  },
  photoContainer: {
    width: 70,
    height: 90,
    border: '2px solid #ffffff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.7,
  },
  cardFooter: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validityText: {
    fontSize: 7,
    color: '#ffffff',
    opacity: 0.8,
  },
  cardNumber: {
    fontSize: 7,
    color: '#ffffff',
    opacity: 0.8,
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
  const programName = activeProgram?.structure?.program?.name || 'N/A';
  const currentYear = new Date().getFullYear();
  const validUntil = currentYear + 1;

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.cardFront}>
            <View style={styles.universityHeader}>
              <View style={styles.universityInfo}>
                <Text style={styles.universityName}>LIMKOKWING UNIVERSITY</Text>
                <Text style={styles.cardTitle}>Student ID Card</Text>
              </View>
              <Image style={styles.logo} src='/images/logo-lesotho.jpg' />
            </View>

            <View style={styles.studentInfo}>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentField}>ID: {student.stdNo}</Text>
                <Text style={styles.studentField}>Program: {programName}</Text>
                <Text style={styles.studentField}>
                  DOB:{' '}
                  {student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.photoContainer}>
                {photoUrl ? (
                  <Image style={styles.photo} src={photoUrl} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>NO PHOTO</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.validityText}>
                Valid: {currentYear} - {validUntil}
              </Text>
              <Text style={styles.cardNumber}>Card #{student.stdNo}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <View style={[styles.cardFront, { backgroundColor: '#f8f9fa' }]}>
            <View
              style={{
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Text
                style={[
                  styles.universityName,
                  { color: '#000', fontSize: 10, marginBottom: 15 },
                ]}
              >
                LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY
              </Text>
              <Text
                style={[
                  styles.studentField,
                  { color: '#000', textAlign: 'center', marginBottom: 10 },
                ]}
              >
                This card is the property of Limkokwing University
              </Text>
              <Text
                style={[
                  styles.studentField,
                  { color: '#000', textAlign: 'center', marginBottom: 10 },
                ]}
              >
                If found, please return to the Registry Office
              </Text>
              <Text
                style={[
                  styles.studentField,
                  { color: '#000', textAlign: 'center', marginBottom: 15 },
                ]}
              >
                Moshoshoe Road, Maseru Central, Lesotho
              </Text>
              <Text
                style={[styles.validityText, { color: '#666', fontSize: 8 }]}
              >
                Emergency Contact: +(266) 22315767
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
