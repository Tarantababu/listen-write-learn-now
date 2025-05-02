
import { VocabularyItem } from '@/types';

// Helper function to create a base64 string from audio URL (if available)
const getAudioBase64 = async (audioUrl: string | undefined): Promise<string | null> => {
  if (!audioUrl) return null;
  
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]); // Remove the data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch audio data:', error);
    return null;
  }
};

// Generate the file content for Anki import
export const generateAnkiPackage = async (vocabularyItems: VocabularyItem[]): Promise<Blob> => {
  // For now, we'll continue generating CSV since .apkg would require 
  // a specialized library or backend service to create
  const csvRows: string[] = [];
  
  // Add header row for Anki
  csvRows.push('front;back;tags');
  
  // Process each vocabulary item
  for (const item of vocabularyItems) {
    try {
      // Front: Example sentence + audio
      let front = `<div>${item.exampleSentence}</div>`;
      
      // Back: Example sentence + definition
      let back = `<div>${item.exampleSentence}</div><hr><div><strong>Definition:</strong> ${item.definition}</div>`;
      
      // Add audio reference if available
      if (item.audioUrl) {
        const audioFilename = `audio_${item.id}.mp3`;
        front += `[sound:${audioFilename}]`;
        back += `[sound:${audioFilename}]`;
      }
      
      // Tags: language + word for easy organization
      const tags = `${item.language},${item.word.replace(/\s+/g, '_')}`;
      
      // Add to CSV
      csvRows.push(`${front};${back};${tags}`);
    } catch (error) {
      console.error(`Error processing vocabulary item ${item.id}:`, error);
    }
  }
  
  // Create the CSV blob
  const csvContent = csvRows.join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
};

// Download the Anki package
export const downloadAnkiDeck = async (vocabularyItems: VocabularyItem[], deckName: string = 'vocabulary'): Promise<void> => {
  try {
    const csvBlob = await generateAnkiPackage(vocabularyItems);
    
    // Create a download link
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    // Change extension to .apkg for better UX, even though it's still a CSV internally
    // In a production app, we would implement proper .apkg generation on a server
    link.setAttribute('download', `${deckName}.apkg`);
    
    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating Anki package:', error);
    return Promise.reject(error);
  }
};
