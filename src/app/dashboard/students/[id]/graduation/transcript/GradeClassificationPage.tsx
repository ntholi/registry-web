import { Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { grades } from '@/utils/grades';

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
        DEFAULT: '0.5pt',
      },
    },
  },
});

const gradeClassifications = grades
  .filter((g) => g.marksRange || g.grade === 'EXP' || g.grade === 'Def')
  .map((g) => ({
    marks: g.marksRange ? `${g.marksRange.min}-${g.marksRange.max}` : '',
    grade: g.grade,
    gpa: g.points !== null ? g.points.toFixed(2) : '-',
    description: g.description,
  }));

function getAwardClassifications() {
  const uniqueDescriptions = Array.from(
    new Set(
      grades
        .filter((g) => g.points !== null && g.points > 0)
        .map((g) => g.description)
    )
  );

  const awards = [];

  for (const description of uniqueDescriptions) {
    const gradesWithDescription = grades.filter(
      (g) => g.description === description && g.points !== null
    );

    if (gradesWithDescription.length > 0) {
      const minPoints = Math.min(
        ...gradesWithDescription.map((g) => g.points as number)
      );
      const maxPoints = Math.max(
        ...gradesWithDescription.map((g) => g.points as number)
      );
      awards.push({
        cgpa: `${minPoints.toFixed(2)} - ${maxPoints.toFixed(2)}`,
        award: description,
      });
    }
  }

  return awards.sort((a, b) => {
    const aMin = parseFloat(a.cgpa.split(' ')[1]);
    const bMin = parseFloat(b.cgpa.split(' ')[1]);
    return bMin - aMin;
  });
}

const awardClassifications = getAwardClassifications();

export default function GradeClassificationPage() {
  return (
    <Page size='A4' style={tw('pt-12 px-12 pb-10 font-sans text-[9pt]')}>
      <View style={tw('flex items-center mb-6')}>
        <Text style={tw('text-[14pt] font-bold')}>
          UNIVERSITY GRADING SYSTEM
        </Text>
      </View>

      <View style={tw('border border-black')}>
        {/* Table Header */}
        <View style={tw('flex flex-row border-b border-black bg-gray-100')}>
          <View style={tw('w-[25%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>Marks</Text>
          </View>
          <View style={tw('w-[15%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>Grade</Text>
          </View>
          <View style={tw('w-[20%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>GPA & CGPA</Text>
          </View>
          <View style={tw('w-[40%] p-2')}>
            <Text style={tw('font-bold text-center')}>Description</Text>
          </View>
        </View>

        {/* Table Rows */}
        {gradeClassifications.map((item, index) => (
          <View
            key={index}
            style={tw(
              `flex flex-row ${index < gradeClassifications.length - 1 ? 'border-b border-black' : ''}`
            )}
          >
            <View
              style={tw(
                'w-[25%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center')}>{item.marks}</Text>
            </View>
            <View
              style={tw(
                'w-[15%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center font-bold')}>{item.grade}</Text>
            </View>
            <View
              style={tw(
                'w-[20%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center')}>{item.gpa}</Text>
            </View>
            <View style={tw('w-[40%] p-2 flex justify-center')}>
              <Text style={tw('text-center')}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Award Classifications Section */}
      <View style={tw('mt-8')}>
        <Text style={tw('text-[12pt] font-bold mb-3')}>
          Award Classifications
        </Text>

        <View style={tw('border border-black')}>
          {/* Table Header */}
          <View style={tw('flex flex-row border-b border-black bg-gray-100')}>
            <View style={tw('w-[40%] border-r border-black p-2')}>
              <Text style={tw('font-bold text-center')}>CGPA Range</Text>
            </View>
            <View style={tw('w-[60%] p-2')}>
              <Text style={tw('font-bold text-center')}>Award</Text>
            </View>
          </View>

          {/* Table Rows */}
          {awardClassifications.map((item, index) => (
            <View
              key={index}
              style={tw(
                `flex flex-row ${index < awardClassifications.length - 1 ? 'border-b border-black' : ''}`
              )}
            >
              <View
                style={tw(
                  'w-[40%] border-r border-black p-2 flex justify-center'
                )}
              >
                <Text style={tw('text-center')}>{item.cgpa}</Text>
              </View>
              <View style={tw('w-[60%] p-2 flex justify-center')}>
                <Text style={tw('text-center')}>{item.award}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}
