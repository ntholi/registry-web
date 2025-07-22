import { formatDate } from '@/lib/utils';
import { getStudentRegistrationData } from '@/server/students/actions';
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
    fontSize: 11,
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 25,
    lineHeight: 1.2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerContent: {
    flex: 1,
    paddingRight: 20,
  },
  universityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    lineHeight: 1.2,
  },
  addressLine: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.1,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textDecoration: 'underline',
  },
  studentInfoTable: {
    width: '100%',
    marginBottom: 25,
    border: '1px solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    minHeight: 25,
  },
  lastRow: {
    flexDirection: 'row',
    minHeight: 25,
  },
  labelColumn: {
    width: '25%',
    padding: 5,
    fontWeight: 'bold',
    borderRight: '1px solid #000',
    justifyContent: 'center',
  },
  valueColumn: {
    width: '75%',
    padding: 5,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  moduleTable: {
    width: '100%',
    border: '1px solid #000',
    marginBottom: 15,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottom: '1px solid #000',
    minHeight: 30,
  },
  moduleDataRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    minHeight: 30,
  },
  moduleLastRow: {
    flexDirection: 'row',
    minHeight: 30,
  },
  moduleNumberCol: {
    width: '8%',
    padding: 5,
    borderRight: '1px solid #000',
    textAlign: 'center',
    fontWeight: 'bold',
    justifyContent: 'center',
  },
  moduleCodeDescCol: {
    width: '62%',
    padding: 5,
    borderRight: '1px solid #000',
    justifyContent: 'center',
  },
  moduleTypeCol: {
    width: '15%',
    padding: 5,
    borderRight: '1px solid #000',
    textAlign: 'center',
    justifyContent: 'center',
  },
  moduleCreditsCol: {
    width: '15%',
    padding: 5,
    textAlign: 'center',
    justifyContent: 'center',
  },
  moduleCode: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  moduleDescription: {
    fontSize: 10,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  creditsText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 20,
  },
  footer: {
    fontSize: 8,
    textAlign: 'justify',
    marginTop: 10,
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

  const activeProgram = student.programs[0];
  const latestSemester = activeProgram.semesters[0];

  if (!latestSemester) {
    return (
      <Document>
        <Page size='A4' style={styles.page}>
          <Text>No semester data available</Text>
        </Page>
      </Document>
    );
  }

  const totalCredits = latestSemester.studentModules.reduce(
    (sum: number, sm: StudentModule) => sum + (sm.semesterModule.credits || 0),
    0,
  );

  const semesterNumber = latestSemester.semesterNumber || 1;
  const yearNumber = Math.ceil(semesterNumber / 2);
  const semesterInYear = semesterNumber % 2 === 0 ? '2' : '1';

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.universityName}>
              Limkokwing University of Creative Technology
            </Text>
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

        <View style={styles.dividerLine} />

        <Text style={styles.title}>PROOF OF REGISTRATION</Text>

        <View style={styles.studentInfoTable}>
          <View style={styles.tableRow}>
            <View style={styles.labelColumn}>
              <Text>Student Number:</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text>{student.stdNo}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelColumn}>
              <Text>Student Name:</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text>{student.name}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelColumn}>
              <Text>Program:</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text>{activeProgram.structure.program.name}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelColumn}>
              <Text>Term:</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text>{latestSemester.term}</Text>
            </View>
          </View>
          <View style={styles.lastRow}>
            <View style={styles.labelColumn}>
              <Text>Semester:</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text>
                Year {yearNumber} Semester {semesterInYear}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>REGISTERED MODULES</Text>

        <View style={styles.moduleTable}>
          <View style={styles.moduleHeaderRow}>
            <View style={styles.moduleNumberCol}>
              <Text>#</Text>
            </View>
            <View style={styles.moduleCodeDescCol}>
              <Text>Module Code & Description</Text>
            </View>
            <View style={styles.moduleTypeCol}>
              <Text>Type</Text>
            </View>
            <View style={styles.moduleCreditsCol}>
              <Text>Credits</Text>
            </View>
          </View>

          {latestSemester.studentModules.map(
            (studentModule: StudentModule, index: number) => {
              const isLastRow =
                index === latestSemester.studentModules.length - 1;
              return (
                <View
                  key={studentModule.id}
                  style={
                    isLastRow ? styles.moduleLastRow : styles.moduleDataRow
                  }
                >
                  <View style={styles.moduleNumberCol}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View style={styles.moduleCodeDescCol}>
                    <Text style={styles.moduleCode}>
                      {studentModule.semesterModule.module?.code || 'N/A'}
                    </Text>
                    <Text style={styles.moduleDescription}>
                      {studentModule.semesterModule.module?.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.moduleTypeCol}>
                    <Text>
                      {studentModule.semesterModule.type === 'Major'
                        ? 'Major'
                        : 'Minor'}
                    </Text>
                  </View>
                  <View style={styles.moduleCreditsCol}>
                    <Text>
                      {studentModule.semesterModule.credits.toFixed(1)}
                    </Text>
                  </View>
                </View>
              );
            },
          )}
        </View>

        <View style={styles.creditsRow}>
          <Text style={styles.creditsText}>
            Credits: {totalCredits.toFixed(1)}
          </Text>
        </View>

        <View style={styles.dividerLine} />

        <View style={styles.footer}>
          <Text>
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
