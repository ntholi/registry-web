import { formatDate } from '@/lib/utils';
import { getAcademicHistory } from '@/server/students/actions';
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

type StatementOfResultsPDFProps = {
  student: NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
  qrCodeDataURL?: string;
  includeSignature?: boolean;
};

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
      fontWeight: 'normal',
      fontStyle: 'italic',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000',
    paddingBottom: 15,
  },
  logo: {
    height: 90,
    alignSelf: 'center',
    marginBottom: 10,
  },
  universityHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  universityAddress: {
    fontSize: 9,
    color: '#666',
    marginTop: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  studentInfo: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    border: '1px solid #ccc',
    borderRadius: 2,
  },
  studentInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    borderBottom: '1px solid #ccc',
    paddingBottom: 5,
  },
  studentDetail: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    width: 140,
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#000',
  },
  programSection: {
    marginBottom: 15,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 2,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#000',
    color: '#fff',
    padding: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  semesterSection: {
    marginBottom: 10,
    padding: 10,
  },
  semesterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: 6,
    borderRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleText: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 5,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    padding: 4,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#ccc',
    textAlign: 'left',
  },
  codeCell: {
    width: '18%',
  },
  nameCell: {
    width: '52%',
  },
  creditsCell: {
    width: '12%',
    textAlign: 'center',
  },
  gradeCell: {
    width: '10%',
    textAlign: 'center',
  },
  pointsCell: {
    width: '8%',
    textAlign: 'center',
  },
  summarySection: {
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValue: {
    color: '#000',
  },
  cumulativeSummary: {
    marginTop: 20,
    border: '2px solid #000',
    padding: 15,
    borderRadius: 2,
  },
  cumulativeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#000',
    borderBottom: '1px solid #000',
    paddingBottom: 8,
  },
  cumulativeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cumulativeColumn: {
    flex: 1,
  },
  cumulativeItem: {
    marginBottom: 8,
  },
  cumulativeLabel: {
    fontSize: 10,
    marginBottom: 2,
    color: '#333',
  },
  cumulativeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  academicRemarksColumn: {
    flex: 1,
    paddingLeft: 20,
  },
  academicRemarksSection: {
    marginBottom: 12,
  },
  academicRemarksLabel: {
    fontSize: 10,
    marginBottom: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  academicRemarksValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  academicRemarksDetails: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  outstandingModulesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #e0e0e0',
  },
  outstandingModulesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  outstandingModuleItem: {
    fontSize: 8,
    marginBottom: 2,
    color: '#000',
    paddingLeft: 4,
  },
  remarksDetails: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  signatureAndQrContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 50,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 3,
  },
  signatureSection: {
    alignItems: 'center',
    width: 200,
  },
  signatureImage: {
    width: 120,
    height: 60,
  },
  signatureLine: {
    borderBottom: '1px solid #333',
    width: 150,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  qrCodeSection: {
    alignItems: 'center',
    width: 120,
  },
  qrCodeImage: {
    width: 60,
    height: 60,
    marginBottom: 3,
  },
  qrCodeLabel: {
    fontSize: 7,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  registrarInfo: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  officialText: {
    flex: 1,
    paddingRight: 20,
  },
  failedGrade: {
    color: '#000',
    fontWeight: 'bold',
  },
  passedGrade: {
    color: '#333',
  },
  outstandingGrade: {
    color: '#000',
    fontWeight: 'bold',
  },
  warningText: {
    color: '#666',
    fontWeight: 'bold',
  },
  gradeScale: {
    marginTop: 15,
    fontSize: 8,
    color: '#666',
  },
});

import {
  getAcademicRemarks,
  getGradePoints,
  isFailingGrade,
} from '@/utils/grades';
import { getCleanedSemesters } from './utils';

function getGradeStyle(grade: string) {
  if (isFailingGrade(grade)) return 'failedGrade';
  if (['A+', 'A', 'A-'].includes(grade)) return 'outstandingGrade';
  return 'passedGrade';
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
          <Page size='A4' style={styles.page}>
            <Text>No student data available</Text>
          </Page>
        </Document>
      );
    }

    const activePrograms = (student.programs || []).filter(
      (program) => program && program.status === 'Active'
    );

    const academicRemarks = getAcademicRemarks(activePrograms);

    return (
      <Document>
        <Page size='A4' style={styles.page}>
          <View style={styles.header}>
            <Image style={styles.logo} src='/images/logo-lesotho.jpg' />
            <Text style={styles.title}>STATEMENT OF RESULTS</Text>
            <Text style={styles.universityAddress}>
              This document does not certify graduation
            </Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentInfoTitle}>STUDENT INFORMATION</Text>
            <View style={styles.studentDetail}>
              <Text style={styles.label}>Student Number:</Text>
              <Text style={styles.value}>{student.stdNo}</Text>
            </View>
            <View style={styles.studentDetail}>
              <Text style={styles.label}>Full Name:</Text>
              <Text style={styles.value}>{student.name}</Text>
            </View>
            <View style={styles.studentDetail}>
              <Text style={styles.label}>ID/Passport:</Text>
              <Text style={styles.value}>{student.nationalId}</Text>
            </View>
            <View style={styles.studentDetail}>
              <Text style={styles.label}>Date of Issue:</Text>
              <Text style={styles.value}>{formatDate(new Date())}</Text>
            </View>
          </View>
          {activePrograms.map((program) => (
            <View key={program.id} style={styles.programSection}>
              <Text style={styles.programTitle}>
                {program.structure.program.name}
              </Text>
              {getCleanedSemesters(program).map((semester) => {
                const semesterPoint = academicRemarks.points.find(
                  (point) => point.semesterId === semester.id
                );
                const semesterGPA = semesterPoint?.gpa || 0;

                return (
                  <View key={semester.id} style={styles.semesterSection}>
                    <View style={styles.semesterTitle} wrap={false}>
                      <Text>{semester.term}</Text>
                      <Text>GPA: {semesterGPA.toFixed(2)}</Text>
                    </View>

                    <View style={styles.table}>
                      <View
                        style={[styles.tableRow, styles.tableHeader]}
                        wrap={false}
                      >
                        <Text
                          style={[
                            styles.tableCell,
                            styles.codeCell,
                            styles.moduleText,
                          ]}
                        >
                          Code
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.nameCell,
                            styles.moduleText,
                          ]}
                        >
                          Module Name
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.creditsCell,
                            styles.moduleText,
                          ]}
                        >
                          Credits
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.gradeCell,
                            styles.moduleText,
                          ]}
                        >
                          Grade
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.pointsCell,
                            styles.moduleText,
                          ]}
                        >
                          Points
                        </Text>
                      </View>
                      {(semester.studentModules || []).map((sm, index) => (
                        <View
                          key={`${semester.id}-${sm.semesterModuleId}-${index}`}
                          style={styles.tableRow}
                          wrap={false}
                        >
                          <Text
                            style={[
                              styles.tableCell,
                              styles.codeCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.module?.code ??
                              `${sm.semesterModuleId}`}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.nameCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.module?.name ??
                              `<<Semester Module ID: ${sm.semesterModuleId}>>`}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.creditsCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.credits || 0}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.gradeCell,
                              styles.moduleText,
                              styles[getGradeStyle(sm.grade || 'NM')],
                            ]}
                          >
                            {sm.grade || 'NM'}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.pointsCell,
                              styles.moduleText,
                            ]}
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
          ))}
          <View wrap={false}>
            <View style={styles.cumulativeSummary}>
              <Text style={styles.cumulativeTitle}>
                CUMULATIVE ACADEMIC SUMMARY
              </Text>
              <View style={styles.cumulativeGrid}>
                <View style={styles.cumulativeColumn}>
                  <View style={styles.cumulativeItem}>
                    <Text style={styles.cumulativeLabel}>
                      Credits Attempted
                    </Text>
                    <Text style={styles.cumulativeValue}>
                      {academicRemarks.totalCreditsAttempted}
                    </Text>
                  </View>
                  <View style={styles.cumulativeItem}>
                    <Text style={styles.cumulativeLabel}>Credits Earned</Text>
                    <Text style={styles.cumulativeValue}>
                      {academicRemarks.totalCreditsCompleted}
                    </Text>
                  </View>
                  <View style={styles.cumulativeItem}>
                    <Text style={styles.cumulativeLabel}>Cumulative GPA</Text>
                    <Text style={styles.cumulativeValue}>
                      {academicRemarks.latestPoints?.cgpa.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.academicRemarksColumn}>
                  <View style={styles.academicRemarksSection}>
                    <Text style={styles.academicRemarksLabel}>
                      Academic Status
                    </Text>
                    <Text style={styles.academicRemarksValue}>
                      {academicRemarks.status}
                    </Text>
                    <Text style={styles.academicRemarksDetails}>
                      {academicRemarks.details}
                    </Text>
                  </View>
                  {(academicRemarks.failedModules.length > 0 ||
                    academicRemarks.supplementaryModules.length > 0) && (
                    <View style={styles.outstandingModulesSection}>
                      <Text style={styles.outstandingModulesTitle}>
                        Outstanding Requirements (
                        {academicRemarks.failedModules.length +
                          academicRemarks.supplementaryModules.length}
                        )
                      </Text>
                      {academicRemarks.failedModules.map((module, index) => (
                        <Text
                          key={`failed-${module.code}-${index}`}
                          style={styles.outstandingModuleItem}
                        >
                          • {module.code} - {module.name} (Repeat)
                        </Text>
                      ))}
                      {academicRemarks.supplementaryModules.map(
                        (module, index) => (
                          <Text
                            key={`supplementary-${module.code}-${index}`}
                            style={styles.outstandingModuleItem}
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
              <View style={styles.signatureContainer}>
                <View style={styles.signatureSection}>
                  <Image
                    style={styles.signatureImage}
                    src='/images/signature_small.png'
                  />
                  <Text style={styles.signatureLine}></Text>
                  <Text style={styles.signatureLabel}>Registrar</Text>
                </View>
                {qrCodeDataURL && (
                  <View style={styles.qrCodeSection}>
                    <Image style={styles.qrCodeImage} src={qrCodeDataURL} />
                    <Text style={styles.qrCodeLabel}>
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
        <Page size='A4' style={styles.page}>
          <Text>Error generating statement of results</Text>
        </Page>
      </Document>
    );
  }
}
