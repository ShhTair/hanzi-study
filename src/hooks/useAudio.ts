export const useAudio = () => {
 const play = async (word: string) => {
 // Audio disabled in Expo Go — requires custom dev build
 console.log('Audio stub: would play', word);
 };
 return { play, isPlaying: false };
};
