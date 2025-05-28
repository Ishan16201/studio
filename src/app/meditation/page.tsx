
'use client'; // Required for ProtectedRoute

import AudioPlayerComponent from '@/components/meditation/AudioPlayer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Headphones, Waves } from 'lucide-react';
import Image from 'next/image';
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Import ProtectedRoute

// export const metadata = { // Metadata should be static for server components
// title: 'Guided Meditation - Grindset',
// description: 'Find calm and clarity with guided meditation tracks.',
// };

function MeditationPageContent() {
  const meditationTracks = [
    {
      id: '1',
      title: '5-Min Mindful Breathing',
      description: 'A short practice to center yourself and find calm.',
      duration: '5 min',
      audioSrc: '/sounds/sample_meditation_5min.mp3',
      coverArt: 'https://placehold.co/400x400.png',
      aiHint: 'calm nature'
    },
    {
      id: '2',
      title: '10-Min Body Scan',
      description: 'Release tension and connect with your body.',
      duration: '10 min',
      audioSrc: '/sounds/sample_meditation_10min.mp3',
      coverArt: 'https://placehold.co/400x400.png',
      aiHint: 'serene landscape'
    },
  ];

  return (
    <div className="container mx-auto max-w-xl p-4 md:p-8">
      <header className="text-center mb-6 sm:mb-8">
         <div className="mx-auto bg-primary/10 text-primary p-3 sm:p-4 rounded-full w-fit mb-3 sm:mb-4 inline-flex">
            <Waves className="w-10 h-10 sm:w-12 sm:h-12" />
         </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Guided Meditation</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">
          Relax your mind, find your focus.
        </p>
      </header>

      <div className="space-y-6 sm:space-y-8">
        {meditationTracks.map((track) => (
          <Card key={track.id} className="shadow-xl rounded-xl overflow-hidden">
            <div className="sm:flex">
              <div className="sm:flex-shrink-0">
                <div className="relative h-40 sm:h-48 w-full sm:w-40 md:w-48">
                  <Image 
                    src={track.coverArt} 
                    alt={track.title} 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint={track.aiHint}
                  />
                </div>
              </div>
              <div className="p-4 sm:p-6 flex flex-col justify-between flex-grow">
                <div>
                  <div className="uppercase tracking-wide text-xs sm:text-sm text-accent font-semibold">{track.duration}</div>
                  <CardTitle className="mt-1 text-lg sm:text-xl md:text-2xl font-semibold text-primary">{track.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm text-muted-foreground">{track.description}</CardDescription>
                </div>
                <div className="mt-4">
                   <AudioPlayerComponent audioSrc={track.audioSrc} trackId={track.id} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
       <p className="text-center text-sm text-muted-foreground mt-10 sm:mt-12 px-2">
        Take a few moments for yourself. You deserve it.
      </p>
    </div>
  );
}

export default function MeditationPage() {
  return (
    <ProtectedRoute>
      <MeditationPageContent />
    </ProtectedRoute>
  );
}
