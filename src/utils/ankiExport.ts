
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
  // Create a more compatible CSV format for Anki
  const csvRows: string[] = [];
  
  // Add header row for Anki - use tab as separator for better compatibility
  csvRows.push('front\tback\ttags');
  
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
      
      // Tags: language + word for easy organization - replace spaces with underscores
      const tags = `${item.language} ${item.word.replace(/\s+/g, '_')}`;
      
      // Escape any tab characters in the content
      const escapedFront = front.replace(/\t/g, ' ');
      const escapedBack = back.replace(/\t/g, ' ');
      
      // Add to CSV using tabs as separators for better Anki compatibility
      csvRows.push(`${escapedFront}\t${escapedBack}\t${tags}`);
    } catch (error) {
      console.error(`Error processing vocabulary item ${item.id}:`, error);
    }
  }
  
  // Create the CSV blob with proper encoding
  const csvContent = csvRows.join('\n');
  return new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8' });
};

// Download the Anki package
export const downloadAnkiDeck = async (vocabularyItems: VocabularyItem[], deckName: string = 'vocabulary'): Promise<void> => {
  try {
    const csvBlob = await generateAnkiPackage(vocabularyItems);
    
    // Create a download link
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use .txt extension instead of .apkg to avoid confusion
    // This is a tab-separated values file that Anki can import
    link.setAttribute('download', `${deckName}.txt`);
    
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
