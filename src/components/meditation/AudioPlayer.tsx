
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioSrc: string;
  trackId: string; // To ensure unique state for multiple players on a page
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function AudioPlayerComponent({ audioSrc, trackId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75); // Default volume 75%
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
        setIsLoaded(true);
      };

      const setAudioTime = () => setCurrentTime(audio.currentTime);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false)); // Reset play state on end

      // Load initial volume from localStorage or default
      const savedVolume = localStorage.getItem(`grindset_volume_${trackId}`);
      if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        setVolume(vol);
        audio.volume = vol;
      } else {
         audio.volume = volume;
      }
      const savedMute = localStorage.getItem(`grindset_mute_${trackId}`);
      if (savedMute === 'true') {
        setIsMuted(true);
        audio.muted = true;
      }


      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
        audio.pause(); // Ensure audio stops when component unmounts
      };
    }
  }, [audioSrc, trackId, volume]); // Add volume to dependencies to re-set if it changes externally

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.error("Error playing audio:", error));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeSeek = (values: number[]) => {
    if (audioRef.current) {
      const newTime = values[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    if (audioRef.current) {
      const newVolume = values[0];
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
      localStorage.setItem(`grindset_volume_${trackId}`, newVolume.toString());
      if (newVolume > 0 && audioRef.current.muted) audioRef.current.muted = false; // Unmute if volume > 0
    }
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
    localStorage.setItem(`grindset_mute_${trackId}`, newMutedState.toString());
    if (!newMutedState && volume === 0) { // If unmuting and volume is 0, set to a default
        setVolume(0.5);
        audioRef.current.volume = 0.5;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) { // If paused, start playing from beginning
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
        setIsPlaying(true);
      }
    }
  };


  return (
    <div className="p-4 bg-card rounded-lg shadow-md w-full">
      <div className="flex items-center space-x-3 mb-3">
        <Button onClick={togglePlayPause} variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90" disabled={!isLoaded} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
         <Button onClick={handleRestart} variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground" disabled={!isLoaded} aria-label="Restart Track">
          <RotateCcw className="w-5 h-5" />
        </Button>
        <div className="flex-grow">
          <Slider
            value={[currentTime]}
            max={duration || 100} // Provide a default max if duration is 0
            step={1}
            onValueChange={handleTimeSeek}
            disabled={!isLoaded || duration === 0}
            aria-label="Audio progress"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{isLoaded ? formatTime(currentTime) : '0:00'}</span>
            <span>{isLoaded ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button onClick={toggleMute} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={!isLoaded} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.05}
          onValueChange={handleVolumeChange}
          disabled={!isLoaded}
          className="w-24"
          aria-label="Volume"
        />
      </div>
      {!isLoaded && <p className="text-xs text-center text-muted-foreground mt-2">Loading audio...</p>}
    </div>
  );
}

