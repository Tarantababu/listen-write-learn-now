
import { VocabularyItem } from '@/types';
import JSZip from 'jszip';

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
export const generateAnkiImportFile = async (vocabularyItems: VocabularyItem[]): Promise<{ content: string, mediaFiles: { name: string, data: string }[] }> => {
  // Create cards content in a format Anki can import
  const cardsContent: string[] = [];
  const mediaFiles: { name: string, data: string }[] = [];
  
  // Add header for Anki import
  cardsContent.push("#separator:tab");
  cardsContent.push("#html:true");
  cardsContent.push("#columns:Word\tDefinition\tExample Sentence\tAudio\tTags");
  
  // Process each vocabulary item
  for (const item of vocabularyItems) {
    try {
      // Prepare the fields
      const word = item.word.replace(/\t/g, ' ');
      const definition = item.definition.replace(/\t/g, ' ');
      const example = item.exampleSentence.replace(/\t/g, ' ');
      
      // Handle audio if available
      let audioField = "";
      if (item.audioUrl) {
        const audioBase64 = await getAudioBase64(item.audioUrl);
        if (audioBase64) {
          const audioFileName = `sound_${item.id}.mp3`;
          mediaFiles.push({
            name: audioFileName,
            data: audioBase64
          });
          audioField = `[sound:${audioFileName}]`;
        }
      }
      
      // Tags: language + word for organization - replace spaces with underscores
      const tags = `${item.language} ${item.word.replace(/\s+/g, '_')}`;
      
      // Add to cards content
      cardsContent.push(`${word}\t${definition}\t${example}\t${audioField}\t${tags}`);
    } catch (error) {
      console.error(`Error processing vocabulary item ${item.id}:`, error);
    }
  }
  
  return {
    content: cardsContent.join("\n"),
    mediaFiles
  };
};

// Create a ZIP package with the import file and media files
export const createAnkiPackage = async (vocabularyItems: VocabularyItem[]): Promise<Blob> => {
  const importData = await generateAnkiImportFile(vocabularyItems);
  
  // Create a ZIP archive
  const zip = new JSZip();
  
  // Add the import file
  zip.file("vocabulary_import.txt", importData.content);
  
  // Add all media files
  if (importData.mediaFiles.length > 0) {
    const mediaFolder = zip.folder("media");
    importData.mediaFiles.forEach(file => {
      mediaFolder?.file(file.name, file.data, { base64: true });
    });
  }
  
  // Generate readme with instructions
  const instructions = `
# Anki Import Instructions

1. Extract this ZIP file
2. Open Anki
3. Click "Import File" from the File menu
4. Select the "vocabulary_import.txt" file
5. Make sure "Fields separated by: Tab" is selected
6. If you have audio files, copy them from the "media" folder to your Anki media collection folder
   (usually located at [Anki profile folder]/collection.media/)
7. Click Import

For more information on importing into Anki, see: https://docs.ankiweb.net/importing.html
`;
  zip.file("README.txt", instructions);
  
  // Generate the ZIP file
  return zip.generateAsync({
    type: "blob"
  });
};

// Download the Anki import package
export const downloadAnkiImport = async (vocabularyItems: VocabularyItem[], deckName: string = 'vocabulary'): Promise<void> => {
  try {
    const zipBlob = await createAnkiPackage(vocabularyItems);
    
    // Create a download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use .zip extension for the import package
    link.setAttribute('download', `${deckName}_anki_import.zip`);
    
    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating Anki import package:', error);
    return Promise.reject(error);
  }
};

// Add the exportToAnki function that was missing
export const exportToAnki = async (vocabularyItems: VocabularyItem[], language: string): Promise<void> => {
  try {
    await downloadAnkiImport(vocabularyItems, `${language}_vocabulary`);
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting to Anki:', error);
    return Promise.reject(error);
  }
};
