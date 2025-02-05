'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMediaQuery } from '@/utils/use-media-query';
import { CalendarIcon } from 'lucide-react';
import { getTranscript } from './actions';

const passGrades = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'PC',
  'PX',
] as const;

type Props = {
  program: Awaited<ReturnType<typeof getTranscript>>[number];
};
type Semester = NonNullable<Props['program']>['semesters'][number];
type Module = NonNullable<Semester['modules']>[number];

export function TranscriptDisplay({ program }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <>
      {program.semesters.map((semester) => (
        <div key={semester.id}>
          {isDesktop ? renderDesktopView(semester) : renderMobileView(semester)}
        </div>
      ))}
    </>
  );
}

const renderDesktopView = (semester: Semester) => (
  <div className='rounded-md border my-4'>
    <div className='bg-muted p-4 flex justify-between items-center'>
      <div className='flex items-center space-x-2'>
        <CalendarIcon className='h-4 w-4' />
        <span>{semester.term}</span>
      </div>
      <Badge variant={semester.status === 'Active' ? 'default' : 'destructive'}>
        {semester.status}
      </Badge>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Module Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Marks</TableHead>
          <TableHead>Grade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {semester.modules.map((module) => (
          <TableRow key={module.id}>
            <TableCell className='font-mono'>{module.code}</TableCell>
            <TableCell>{module.name}</TableCell>
            <TableCell>{module.type}</TableCell>
            <TableCell>{module.credits}</TableCell>
            <TableCell>{module.marks}</TableCell>
            <TableCell>
              <Badge
                variant={
                  passGrades.includes(module.grade)
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {module.grade}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const renderModuleDrawer = (module: Module) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Card className='p-4 space-y-2 cursor-pointer hover:bg-accent'>
        <div className='flex justify-between items-center'>
          <div>
            <p className='font-medium'>{module.name}</p>
            <p className='text-sm text-muted-foreground font-mono'>
              {module.code}
            </p>
          </div>
          <Badge variant={module.grade === 'F' ? 'destructive' : 'default'}>
            {module.grade}
          </Badge>
        </div>
      </Card>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{module.name}</DrawerTitle>
        <DrawerDescription>{module.code}</DrawerDescription>
      </DrawerHeader>
      <div className='p-4 space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Type</p>
            <Badge variant='outline'>{module.type}</Badge>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Credits</p>
            <Badge variant='secondary'>{module.credits}</Badge>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Status</p>
            <Badge>{module.status}</Badge>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Grade</p>
            <Badge variant={module.grade === 'F' ? 'destructive' : 'default'}>
              {module.grade}
            </Badge>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Marks</p>
            <p className='font-medium'>{module.marks}</p>
          </div>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);

const renderMobileView = (semester: Semester) => (
  <div className='space-y-4 my-4'>
    <div className='flex justify-between items-center bg-muted p-4 rounded-md'>
      <div className='flex items-center space-x-2'>
        <CalendarIcon className='h-4 w-4' />
        <span>{semester.term}</span>
      </div>
      <Badge variant={semester.status === 'Active' ? 'default' : 'destructive'}>
        {semester.status}
      </Badge>
    </div>
    <div className='space-y-2'>
      {semester.modules.map((module) => renderModuleDrawer(module))}
    </div>
  </div>
);
