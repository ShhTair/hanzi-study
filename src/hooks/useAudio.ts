import { useState, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const play = async (word: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      setIsPlaying(true);
      const dummyUrl = 'http://example.com/dummy.mp3';
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: dummyUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      await newSound.playAsync();
    } catch (error) {
      console.warn(`Failed to play audio for ${word}`, error);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return { play, isPlaying };
};
