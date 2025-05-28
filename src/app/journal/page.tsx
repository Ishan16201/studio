import JournalEditor from '@/components/journal/JournalEditor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookOpenText } from 'lucide-react';

export const metadata = {
  title: 'No-BS Journal - Grindset',
  description: 'Record your thoughts and track your progress.',
};

export default function JournalPage() {
  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <BookOpenText className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold">No-BS Journal</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-xs sm:text-sm">
                Your private space for thoughts, reflections, and progress. Autosaved securely.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <JournalEditor />
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-6">
        All entries are automatically saved. Write freely.
      </p>
    </div>
  );
}
