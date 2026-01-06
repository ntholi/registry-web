import { Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { grades } from '@/shared/lib/utils/grades';

const tw = createTw({
	theme: {
		fontFamily: {
			sans: ['Tahoma'],
			bold: ['Tahoma'],
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
	.filter(
		(g) => g.marksRange || ['PX', 'PC', 'EXP', 'DEF', 'ANN'].includes(g.grade)
	)
	.filter((g) => g.grade !== 'PP')
	.map((g) => ({
		marks: g.marksRange ? `${g.marksRange.min}-${g.marksRange.max}` : '',
		grade: g.grade,
		gpa: g.points !== null ? g.points.toFixed(2) : '-',
		description: g.description,
	}));

const descriptionGroups: Array<{
	description: string;
	items: typeof gradeClassifications;
}> = [];
for (const item of gradeClassifications) {
	const last = descriptionGroups[descriptionGroups.length - 1];
	if (!last || last.description !== item.description) {
		descriptionGroups.push({
			description: item.description,
			items: [item],
		});
	} else {
		last.items.push(item);
	}
}

export default function GradeClassificationPage() {
	return (
		<Page size='A4' style={tw('pt-40 px-40 font-sans text-[7.5pt]')}>
			<View style={tw('flex items-center mb-6')}>
				<Text style={tw('text-[14pt] font-bold')}>GRADING SYSTEM</Text>
			</View>

			<View style={tw('border border-black')}>
				<View style={tw('flex flex-row border-b border-black bg-gray-100')}>
					<View style={tw('w-[25%] border-r border-black p-0.5')}>
						<Text style={tw('font-bold text-center')}>Marks</Text>
					</View>
					<View style={tw('w-[15%] border-r border-black p-0.5')}>
						<Text style={tw('font-bold text-center')}>Grade</Text>
					</View>
					<View style={tw('w-[20%] border-r border-black p-0.5')}>
						<Text style={tw('font-bold text-center')}>GPA & CGPA</Text>
					</View>
					<View style={tw('w-[40%] p-0.5')}>
						<Text style={tw('font-bold text-center')}>Description</Text>
					</View>
				</View>

				{descriptionGroups.map((group, gIndex) => (
					<View
						key={group.description}
						style={tw(
							`flex flex-row ${gIndex < descriptionGroups.length - 1 ? 'border-b border-black' : ''}`
						)}
					>
						<View style={tw('w-[60%]')}>
							{group.items.map((item, idx) => (
								<View
									key={`${item.marks}-${item.grade}`}
									style={tw(
										`${idx < group.items.length - 1 ? 'border-b border-black' : ''} flex flex-row`
									)}
								>
									<View
										style={tw(
											'w-[41.6667%] border-r border-black p-0.5 flex justify-center'
										)}
									>
										<Text style={tw('text-center')}>{item.marks}</Text>
									</View>
									<View
										style={tw(
											'w-[25%] border-r border-black p-0.5 flex justify-center'
										)}
									>
										<Text style={tw('text-center font-bold')}>
											{item.grade}
										</Text>
									</View>
									<View
										style={tw(
											'w-[33.3333%] border-r border-black p-0.5 flex justify-center'
										)}
									>
										<Text style={tw('text-center')}>{item.gpa}</Text>
									</View>
								</View>
							))}
						</View>

						{/* Single description cell for the whole group */}
						<View style={tw('w-[40%] p-0.5 flex justify-center')}>
							<Text style={tw('text-center')}>{group.description}</Text>
						</View>
					</View>
				))}
			</View>
		</Page>
	);
}
