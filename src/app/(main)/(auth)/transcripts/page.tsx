import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCapIcon } from 'lucide-react';
import { getTranscript } from './actions';
import { TranscriptDisplay } from './transcript-display';
import { Container } from '@/components/ui/container';

export default async function TranscriptsPage() {
  const session = await auth();
  if (!session?.user?.stdNo) return null;

  const programs = await getTranscript(session.user.stdNo);

  return (
    <Container width='md' className='pt-4 sm:pt-10'>
      <h1 className='text-2xl sm:text-3xl font-bold text-center sm:mb-8 mb-6'>
        Transcript
      </h1>
      {programs.map((program) => (
        <Card key={program.code}>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center space-x-2 '>
              <GraduationCapIcon className='h-6 w-6' />
              <span>{program.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptDisplay program={program} />
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}
