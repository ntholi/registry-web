'use client';

import { getStudent } from '@/server/students/actions';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatSemester } from '@/lib/utils';

type StatementOfResultsPDFProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  studentInfo: {
    marginBottom: 20,
  },
  studentDetail: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 150,
  },
  value: {
    flex: 1,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  semesterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  moduleText: {
    fontSize: 9,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  codeCell: {
    width: '20%',
  },
  nameCell: {
    width: '60%',
  },
  creditsCell: {
    width: '10%',
  },
  gradeCell: {
    width: '10%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    borderTop: '1px solid #000',
    paddingTop: 10,
  },
  failedGrade: {
    color: 'red',
  },
  passedGrade: {
    color: 'green',
  },
});

function failed(grade: string) {
  return [
    'F',
    'X',
    'GNS',
    'ANN',
    'FIN',
    'FX',
    'DNC',
    'DNA',
    'PP',
    'DNS',
  ].includes(grade);
}

export default function StatementOfResultsPDF({ student }: StatementOfResultsPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>STATEMENT OF RESULTS</Text>
        </View>
        
        <View style={styles.studentInfo}>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>Student Number:</Text>
            <Text style={styles.value}>{student.stdNo}</Text>
          </View>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{student.name}</Text>
          </View>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>ID/Passport Number:</Text>
            <Text style={styles.value}>{student.nationalId}</Text>
          </View>
        </View>
        
        {student.programs.map((program) => (
          <View key={program.id}>
            <Text style={styles.programTitle}>{program.structure.program.name}</Text>
            
            {program.semesters?.map((semester) => (
              <View key={semester.id}>
                <Text style={styles.semesterTitle}>
                  {semester.term} - {formatSemester(semester.semesterNumber)}
                </Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.codeCell, styles.moduleText]}>Code</Text>
                    <Text style={[styles.tableCell, styles.nameCell, styles.moduleText]}>Module Name</Text>
                    <Text style={[styles.tableCell, styles.creditsCell, styles.moduleText]}>Credits</Text>
                    <Text style={[styles.tableCell, styles.gradeCell, styles.moduleText]}>Grade</Text>
                  </View>
                  
                  {semester.studentModules?.map((sm) => (
                    <View key={sm.semesterModuleId} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.codeCell, styles.moduleText]}>
                        {sm.semesterModule.module?.code ?? `${sm.semesterModuleId}`}
                      </Text>
                      <Text style={[styles.tableCell, styles.nameCell, styles.moduleText]}>
                        {sm.semesterModule.module?.name ?? `<<Semester Module ID: ${sm.semesterModuleId}>>`}
                      </Text>
                      <Text style={[styles.tableCell, styles.creditsCell, styles.moduleText]}>
                        {sm.semesterModule.credits}
                      </Text>
                      <Text 
                        style={[
                          styles.tableCell, 
                          styles.gradeCell,
                          styles.moduleText,
                          failed(sm.grade) ? styles.failedGrade : styles.passedGrade
                        ]}
                      >
                        {sm.grade}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text>This is an official statement of results from Limkokwing University.</Text>
          <Text>Date Printed: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
