import { formatDate, formatDateTime } from '@/lib/utils';
import { getGraduationClearanceData } from '@/server/graduation/requests/actions';
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  clearanceTable: {
    width: '100%',
    borderTop: '1px solid #000',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    marginBottom: 12,
  },
  clearanceHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#4a4a4a',
    borderBottom: '1px solid #666666',
    minHeight: 25,
  },
  clearanceHeaderCell: {
    padding: 4,
    borderRight: '1px solid #666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearanceHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  clearanceDataRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #666666',
    minHeight: 35,
  },
  clearanceLastDataRow: {
    flexDirection: 'row',
    minHeight: 35,
  },
  clearanceDataCell: {
    padding: 4,
    borderRight: '1px solid #666666',
    justifyContent: 'center',
  },
  clearanceLastDataCell: {
    padding: 4,
    borderRight: '1px solid #666666',
    justifyContent: 'center',
  },
  departmentCol: {
    width: '30%',
  },
  statusCol: {
    width: '20%',
  },
  dateCol: {
    width: '25%',
  },
  messageCol: {
    width: '25%',
  },
  departmentName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'capitalize',
  },
  statusText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#000',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#000',
  },
  messageText: {
    fontSize: 8,
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
  approvalStamp: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: 'green',
    border: '2px solid green',
    padding: 10,
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

  const { studentProgram, graduationClearances } = graduationData;
  const student = studentProgram.student;
  const program = studentProgram.structure.program;
  const school = program.school;

  // Sort clearances by department order
  const departmentOrder = ['academic', 'finance', 'library'];
  const sortedClearances = [...graduationClearances].sort((a, b) => {
    const orderA = departmentOrder.indexOf(a.clearance.department);
    const orderB = departmentOrder.indexOf(b.clearance.department);
    return orderA - orderB;
  });

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
                <Text>Graduation Date:</Text>
              </View>
              <View style={[styles.valueCell]}>
                <Text>{formatDate(new Date())}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.clearanceSection}>
          <Text style={styles.sectionTitle}>DEPARTMENTAL CLEARANCES</Text>

          <View style={styles.clearanceTable}>
            <View style={styles.clearanceHeaderRow}>
              <View style={[styles.clearanceHeaderCell, styles.departmentCol]}>
                <Text style={styles.clearanceHeaderText}>Department</Text>
              </View>
              <View style={[styles.clearanceHeaderCell, styles.statusCol]}>
                <Text style={styles.clearanceHeaderText}>Status</Text>
              </View>
              <View style={[styles.clearanceHeaderCell, styles.dateCol]}>
                <Text style={styles.clearanceHeaderText}>Approval Date</Text>
              </View>
              <View style={[styles.clearanceHeaderCell, styles.messageCol]}>
                <Text style={styles.clearanceHeaderText}>Notes</Text>
              </View>
            </View>

            {sortedClearances.map((clearanceMapping, index) => {
              const clearance = clearanceMapping.clearance;
              const isLastRow = index === sortedClearances.length - 1;

              return (
                <View
                  key={clearance.id}
                  style={
                    isLastRow
                      ? styles.clearanceLastDataRow
                      : styles.clearanceDataRow
                  }
                >
                  <View
                    style={[
                      isLastRow
                        ? styles.clearanceLastDataCell
                        : styles.clearanceDataCell,
                      styles.departmentCol,
                    ]}
                  >
                    <Text style={styles.departmentName}>
                      {clearance.department}
                    </Text>
                  </View>
                  <View
                    style={[
                      isLastRow
                        ? styles.clearanceLastDataCell
                        : styles.clearanceDataCell,
                      styles.statusCol,
                    ]}
                  >
                    <Text style={styles.statusText}>{clearance.status}</Text>
                  </View>
                  <View
                    style={[
                      isLastRow
                        ? styles.clearanceLastDataCell
                        : styles.clearanceDataCell,
                      styles.dateCol,
                    ]}
                  >
                    <Text style={styles.dateText}>
                      {clearance.responseDate
                        ? formatDate(clearance.responseDate)
                        : 'Pending'}
                    </Text>
                  </View>
                  <View
                    style={[
                      isLastRow
                        ? styles.clearanceLastDataCell
                        : styles.clearanceDataCell,
                      styles.messageCol,
                    ]}
                  >
                    <Text style={styles.messageText}>
                      {clearance.message || 'No notes'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.approvalStamp}>
          <Text>✓ ALL DEPARTMENTS CLEARED FOR GRADUATION</Text>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Document ID: clearance_{student.stdNo}_
            {formatDate(new Date()).replace(/\//g, '')} | This document serves
            as official proof that all departmental clearances have been
            approved for graduation. All academic, financial, and library
            obligations have been satisfied. Clearance processed through the
            official university system on {formatDate(new Date())}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
