import { getAcademicHistory } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import { Document, Font, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { getCleanedSemesters } from '../../AcademicsView/statements/utils';

Font.register({
  family: 'Arial',
  src: '/fonts/ARIAL.TTF',
});

Font.register({
  family: 'Arial-Bold',
  src: '/fonts/ARIALBD.TTF',
});

Font.register({
  family: 'ui-sans-serif',
  src: '/fonts/ARIAL.TTF',
});

Font.register({
  family: 'ui-sans-serif-bold',
  src: '/fonts/ARIALBD.TTF',
});

const tw = createTw({
  theme: {
    fontFamily: {
      sans: ['Arial'],
      bold: ['Arial-Bold'],
    },
    extend: {
      colors: {
        border: '#000000',
      },
      borderWidth: {
        DEFAULT: '0.1pt',
      },
    },
  },
});

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

const HeaderRow = ({ label, value }: { label: string; value: string }) => (
  <View style={tw('flex flex-row items-start')}>
    <Text style={tw('w-[90pt] font-bold')}>{label}</Text>
    <Text style={tw('w-[10pt]')}>:</Text>
    <Text style={tw('flex-1')}>{value}</Text>
  </View>
);

const TableHeader = () => (
  <View style={tw('flex flex-row font-bold py-1')}>
    <Text style={tw('w-[60pt]')}>Code</Text>
    <Text style={tw('flex-1')}>Module Name</Text>
    <Text style={tw('w-[40pt] text-right')}>Credit</Text>
    <Text style={tw('w-[35pt] text-center')}>Grade</Text>
  </View>
);

const GradeRow = ({
  courseCode,
  courseName,
  credits,
  grade,
}: {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: string;
}) => (
  <View style={tw('flex flex-row min-h-[7pt] items-start')}>
    <Text style={tw('w-[60pt]')}>{courseCode}</Text>
    <Text style={tw('flex-1')}>{courseName}</Text>
    <Text style={tw('w-[40pt] text-right')}>{credits}</Text>
    <Text style={tw('w-[35pt] text-center')}>{grade}</Text>
  </View>
);

const TermSummary = ({
  gpa,
  credits,
  cgpa,
  cumulativeCredits,
}: {
  gpa: number;
  credits: number;
  cgpa: number;
  cumulativeCredits: number;
}) => (
  <View style={tw('ml-[60pt] mt-1')}>
    <View style={tw('flex flex-row justify-between w-[84%]')}>
      <View style={tw('w-[60pt] flex-row justify-between')}>
        <Text>GPA</Text>
        <Text>{`: ${gpa}`}</Text>
      </View>
      <View style={tw('w-[100pt] flex-row justify-between')}>
        <Text>Credits Earned</Text>
        <View style={tw('flex-row justify-between w-[16pt]')}>
          <Text>:</Text>
          <Text>{credits}</Text>
        </View>
      </View>
    </View>
    <View style={tw('flex flex-row justify-between w-[84%]')}>
      <View style={tw('w-[60pt] flex-row justify-between')}>
        <Text>CGPA</Text>
        <Text>{`: ${cgpa}`}</Text>
      </View>
      <View style={tw('w-[100pt] flex-row justify-between')}>
        <Text>Cumulative Credits</Text>
        <View style={tw('flex-row justify-between w-[16pt]')}>
          <Text>:</Text>
          <Text>{cumulativeCredits}</Text>
        </View>
      </View>
    </View>
  </View>
);

const TermSection = ({
  semester,
  academicRemarks,
}: {
  semester: ReturnType<typeof getCleanedSemesters>[number];
  academicRemarks: ReturnType<typeof getAcademicRemarks>;
}) => {
  const semesterPoint = academicRemarks.points.find(
    (point) => point.semesterId === semester.id
  );

  const semesterIndex = academicRemarks.points.findIndex(
    (point) => point.semesterId === semester.id
  );

  const cumulativeCredits = academicRemarks.points
    .slice(0, semesterIndex + 1)
    .reduce((sum, point) => sum + (point.creditsCompleted || 0), 0);

  return (
    <View style={tw('mb-2')}>
      <Text style={tw('mb-0.5 font-bold')}>{semester.term}</Text>
      {(semester.studentModules || []).map((sm, j) => (
        <GradeRow
          key={j}
          courseCode={sm.semesterModule?.module?.code || ''}
          courseName={sm.semesterModule?.module?.name || ''}
          credits={sm.semesterModule?.credits || 0}
          grade={sm.grade || ''}
        />
      ))}
      <TermSummary
        gpa={Number((semesterPoint?.gpa || 0).toFixed(2))}
        credits={semesterPoint?.creditsCompleted || 0}
        cgpa={Number((semesterPoint?.cgpa || 0).toFixed(2))}
        cumulativeCredits={cumulativeCredits}
      />
    </View>
  );
};

export default function TranscriptPDF({ student }: { student: Student }) {
  const completedPrograms = (student.programs || []).filter(
    (program) => program && program.status === 'Completed'
  );

  if (!completedPrograms || completedPrograms.length === 0) {
    return (
      <Document>
        <Page size='A4' style={tw('pt-5 px-4 pb-10 font-sans text-[7.12pt]')}>
          <Text>No completed programs found</Text>
        </Page>
      </Document>
    );
  }

  const academicRemarks = getAcademicRemarks(completedPrograms);

  const primaryProgram = completedPrograms[0];
  const programName =
    primaryProgram?.structure?.program?.name || 'Unknown Program';

  const completionDate = primaryProgram?.graduationDate
    ? new Date(primaryProgram.graduationDate).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'November 2024';

  const firstSemester = completedPrograms[0]
    ? getCleanedSemesters(completedPrograms[0])[0]
    : null;
  const admissionDate = firstSemester?.term || 'Unknown';

  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const allSemesters = completedPrograms.flatMap((program) =>
    getCleanedSemesters(program)
  );

  const leftTerms = allSemesters.slice(0, 6);
  const rightTerms = allSemesters.slice(6);

  return (
    <Document>
      <Page
        size='A4'
        style={tw('pt-5 px-4 pb-10 font-sans text-[7.12pt] pt-[155pt]')}
      >
        {/* Header Section */}
        <View style={tw('border-t border-b py-1')}>
          <View style={tw('flex flex-row')}>
            <View style={tw('w-1/2 pr-3')}>
              <HeaderRow label='Student Name' value={student.name} />
              <HeaderRow label='Student ID' value={String(student.stdNo)} />
              <HeaderRow label='IC / Passport No.' value={student.nationalId} />
              <HeaderRow label='Gender' value={student.gender || 'N/A'} />
              <HeaderRow label='Nationality' value='Mosotho' />
            </View>
            <View style={tw('w-1/2 pl-3')}>
              <HeaderRow label='Date of Admission' value={admissionDate} />
              <HeaderRow label='Date of Completion' value={completionDate} />
              <HeaderRow
                label='Programme'
                value={correctSpelling(programName)}
              />
              <HeaderRow label='Faculty' value={findFaculty(programName)} />
              <HeaderRow label='Issued Date' value={issueDate} />
            </View>
          </View>
        </View>

        {/* Content Header */}
        <View style={tw('mt-1.5 flex flex-row gap-5 border-t border-b')}>
          <View style={tw('flex-1')}>
            <TableHeader />
          </View>
          <View style={tw('flex-1')}>
            <TableHeader />
          </View>
        </View>

        {/* Content */}
        <View style={tw('mt-2 flex flex-row gap-5')}>
          <View style={tw('flex-1')}>
            {leftTerms.map((semester, i) => (
              <TermSection
                key={i}
                semester={semester}
                academicRemarks={academicRemarks}
              />
            ))}
          </View>
          <View style={tw('flex-1')}>
            {rightTerms.map((semester, i) => (
              <TermSection
                key={i}
                semester={semester}
                academicRemarks={academicRemarks}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={tw('absolute bottom-[50pt] left-[85pt]')}>
          {['Total MPU Credits', 'Total Credit Transferred'].map((label) => (
            <View key={label} style={tw('flex flex-row items-start')}>
              <Text style={tw('w-[160pt]')}>{label}</Text>
              <Text>{': '}-</Text>
            </View>
          ))}
          {['Total Credits Earned', 'Total Cumulative Credits'].map((label) => (
            <View key={label} style={tw('flex flex-row items-start')}>
              <Text style={tw('w-[160pt]')}>{label}</Text>
              <Text>
                {': '}
                {academicRemarks.totalCreditsCompleted}
              </Text>
            </View>
          ))}
        </View>

        {/* Registrar Signature */}
        <View
          style={tw('absolute bottom-[50pt] right-14 w-[190pt] border-t pt-1')}
        >
          <Text style={tw('pt-0.5 text-center font-bold')}>REGISTRAR</Text>
          <Text style={tw('text-justify')}>
            This is not a valid record unless it bears both the stamp and
            signatory on behalf of the university
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function findFaculty(programName: string) {
  const program = programs.find((p) =>
    programName.toLowerCase().includes(p.name.toLowerCase())
  );
  if (!program) {
    return 'Unknown Faculty';
  }
  return program.faculty;
}

function correctSpelling(name: string) {
  return name.replace('Entreprenuership', 'Entrepreneurship');
}
const programs = [
  {
    name: 'Architectur',
    faculty: 'Faculty of Architecture and the Built Environment',
  },
  {
    name: 'Entreprenuership',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Entrepreneurship',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Human Resource Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'International Business',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Business Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Marketing',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Retail Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Performing Arts',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Professional Communication',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Journalism & Media',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Public Relations',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting & Journalism',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Digital Film Production',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting Radio & TV',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Film Production',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Tourism',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Events Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Event Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Hotel Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'International Tourism',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Tourism Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Professional Design',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Creative Advertising',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Graphic Design',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Fashion & Retailing',
    faculty: 'Faculty of Fashion and Lifestyle Design',
  },
  {
    name: 'Fashion & Apparel Design',
    faculty: 'Faculty of Fashion and Lifestyle Design',
  },
  {
    name: 'Business Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Software Engineering with Multimedia',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Business Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Multimedia & Software Engineering',
    faculty: 'Faculty of Information & Communication Technology',
  },
];
