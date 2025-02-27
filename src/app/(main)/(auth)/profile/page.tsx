import { auth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { formatDate } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { redirect } from 'next/navigation';
import StudentSponsorshipCard from './SponsorshipCard';
import { getCurrentTerm } from '@/server/terms/actions';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const term = await getCurrentTerm();
  const student = await getStudentByUserId(session.user.id);

  return (
    <Container width='lg' className='py-4 sm:py-10'>
      <div className='mx-auto mt-10 max-w-2xl space-y-6'>
        <Card>
          <CardContent>
            <div className='flex flex-col items-center space-y-4'>
              <Avatar className='-m-10 size-32'>
                <AvatarImage src={largeImage(session.user.image)} />
                <AvatarFallback>
                  {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className='pt-10 text-center'>
                <h3 className='text-2xl font-semibold'>{session.user.name}</h3>
                <p className='text-sm text-muted-foreground'>
                  {session.user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {student && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl font-bold'>
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Student No
                    </dt>
                    <dd className='text-sm font-semibold'>{student.stdNo}</dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      National ID
                    </dt>
                    <dd className='text-sm font-semibold'>
                      {student.nationalId}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Gender
                    </dt>
                    <dd className='text-sm font-semibold'>{student.gender}</dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Date of Birth
                    </dt>
                    <dd className='text-sm font-semibold'>
                      {formatDate(student.dateOfBirth)}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Phone Numbers
                    </dt>
                    <dd className='space-y-1 text-sm font-semibold'>
                      <div>{student.phone1 ?? 'Not provided'}</div>
                      {student.phone2 && <div>{student.phone2}</div>}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Marital Status
                    </dt>
                    <dd className='text-sm font-semibold'>
                      {student.maritalStatus ?? 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Religion
                    </dt>
                    <dd className='text-sm font-semibold'>
                      {student.religion ?? 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-muted-foreground'>
                      Current Semester
                    </dt>
                    <dd className='text-sm font-semibold'>0{student.sem}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <StudentSponsorshipCard stdNo={student.stdNo} term={term} />
          </>
        )}
      </div>
    </Container>
  );
}

function largeImage(url: string | null | undefined) {
  if (!url) return undefined;
  return url.includes('google') ? url.replace('=s96-c', '') : url;
}
