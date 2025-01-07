import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Container width='md' className='mt-10'>
        <Card>
          <CardHeader className='border-b border-border/10 pb-8 pt-6'>
            <CardTitle className='text-3xl font-bold tracking-tight sm:text-4xl'>
              Welcome back, John!
            </CardTitle>
            <div className='mt-3 flex flex-col space-y-1 items-start'>
              <Badge
                variant='secondary'
                className='flex items-center gap-2 rounded-full'
              >
                <GraduationCap className='size-5' />
                Bachelor of Computer Science
              </Badge>
              <div className='pl-2 pt-2 flex gap-2 items-center text-sm text-muted-foreground/80'>
                Year 3 • Semester 2
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 grid-cols-2'>
              <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  CGPA
                </h3>
                <div className='mt-3 flex items-baseline'>
                  <span className='text-4xl font-bold tracking-tight'>3.8</span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    {' '}
                    / 4.0
                  </span>
                </div>
              </div>
              <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  Total Credits
                </h3>
                <div className='mt-3 flex items-baseline'>
                  <span className='text-4xl font-bold tracking-tight'>85</span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    {' '}
                    / 120
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
