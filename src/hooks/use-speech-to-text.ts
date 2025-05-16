
// Stub implementation for use-speech-to-text hook

export const useSpeechToText = () => {
  return {
    transcript: '',
    listening: false,
    startListening: () => {},
    stopListening: () => {},
    error: null,
    isSupported: true,
  };
};

export default useSpeechToText;
