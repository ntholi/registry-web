import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCapIcon } from 'lucide-react';
import { getTranscript } from './actions';
import { TranscriptDisplay } from './transcript-display';

export default async function TranscriptsPage() {
  const session = await auth();
  if (!session?.user?.stdNo) return null;

  const programs = await getTranscript(session.user.stdNo);

  return (
    <div className='container mx-auto py-8 px-4 space-y-8'>
      {programs.map((program) => (
        <Card key={program.id}>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <GraduationCapIcon className='h-6 w-6' />
              <span>{program.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptDisplay program={program} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
