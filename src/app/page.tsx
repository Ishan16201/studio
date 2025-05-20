import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenText, Timer, ListChecks, Headphones, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  imageSrc?: string;
  imageAlt?: string;
  aiHint?: string;
}

function FeatureCard({ title, description, href, icon: Icon, imageSrc, imageAlt, aiHint }: FeatureCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      {imageSrc && (
        <div className="relative h-40 w-full">
          <Image src={imageSrc} alt={imageAlt || title} layout="fill" objectFit="cover" data-ai-hint={aiHint} />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center mb-2">
          <Icon className="w-6 h-6 mr-3 text-primary" />
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="default" className="w-full rounded-lg group">
          <Link href={href}>
            Go to {title}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8 md:mb-12 pt-8">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-3 rounded-full mb-4 shadow-md">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
          Grindset
        </h1>
        <p className="mt-3 text-lg text-foreground max-w-xl mx-auto">
          Your personal dashboard for unlocking peak focus, building lasting habits, and achieving mindful productivity.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <FeatureCard
          title="No-BS Journal"
          description="Record your thoughts, track progress, and reflect. Autosaves to the cloud."
          href="/journal"
          icon={BookOpenText}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt="Journaling"
          aiHint="journal notebook"
        />
        <FeatureCard
          title="Pomodoro Timer"
          description="Boost focus with 25/5 minute cycles. Start, stop, and reset with ease."
          href="/pomodoro"
          icon={Timer}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt="Timer"
          aiHint="hourglass clock"
        />
        <FeatureCard
          title="Habit Tracker"
          description="Build good habits, break bad ones. Track daily completion and stay consistent."
          href="/habits"
          icon={ListChecks}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt="Habit Tracker"
          aiHint="checklist calendar"
        />
        <FeatureCard
          title="Guided Meditation"
          description="Find calm and clarity with simple guided meditation tracks. Press play and relax."
          href="/meditation"
          icon={Headphones}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt="Meditation"
          aiHint="meditation nature"
        />
      </div>
      <footer className="text-center mt-12 py-6 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Grindset. Stay focused.</p>
      </footer>
    </div>
  );
}
