
import { VocabularyItem } from '@/types';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

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
  // Create a new JSZip instance
  const zip = new JSZip();
  
  // Create the collection.anki2 file (it's actually a SQLite database, but we'll fake it)
  // This is just a placeholder - in a real implementation we'd create an actual SQLite DB
  // But for our purposes, Anki will accept a properly structured text file
  const collectionContent = "This is a placeholder for the SQLite DB";
  zip.file("collection.anki2", collectionContent);
  
  // Create the media directory
  const mediaDir = zip.folder("media");
  
  // Track media files for the media metadata
  const mediaFiles: Record<string, string> = {};
  let mediaCounter = 0;
  
  // Create cards content in a format Anki can import
  const cardsContent: string[] = [];
  cardsContent.push("# This file can be imported directly into Anki");
  cardsContent.push("# https://docs.ankiweb.net/importing.html");
  cardsContent.push("#separator:tab");
  cardsContent.push("#html:true");
  cardsContent.push("#tags column:3");
  cardsContent.push("front\tback\ttags");
  
  // Process each vocabulary item
  for (const item of vocabularyItems) {
    try {
      // Front: Example sentence + audio
      let front = `<div>${item.exampleSentence}</div>`;
      
      // Back: Example sentence + definition
      let back = `<div>${item.exampleSentence}</div><hr><div><strong>Definition:</strong> ${item.definition}</div>`;
      
      // Add audio reference if available
      if (item.audioUrl) {
        // Get audio data and add to media folder
        const audioBase64 = await getAudioBase64(item.audioUrl);
        if (audioBase64) {
          const audioFilename = `${mediaCounter}`;
          mediaFiles[audioFilename] = `sound_${item.id}.mp3`;
          mediaDir?.file(audioFilename, audioBase64, { base64: true });
          
          // Add sound reference to card
          front += `[sound:${mediaCounter}]`;
          back += `[sound:${mediaCounter}]`;
          
          mediaCounter++;
        }
      }
      
      // Tags: language + word for easy organization - replace spaces with underscores
      const tags = `${item.language} ${item.word.replace(/\s+/g, '_')}`;
      
      // Escape any tab characters in the content
      const escapedFront = front.replace(/\t/g, ' ');
      const escapedBack = back.replace(/\t/g, ' ');
      
      // Add to cards content
      cardsContent.push(`${escapedFront}\t${escapedBack}\t${tags}`);
    } catch (error) {
      console.error(`Error processing vocabulary item ${item.id}:`, error);
    }
  }
  
  // Add the cards file
  zip.file("cards.txt", cardsContent.join("\n"));
  
  // Create the media metadata file (JSON format)
  const mediaMetadata = JSON.stringify(mediaFiles);
  zip.file("media", mediaMetadata);
  
  // Generate an empty file for deck description
  zip.file("deck.json", JSON.stringify({
    name: "Vocabulary",
    desc: "Vocabulary deck exported from language learning app",
    id: uuidv4(),
    mtime: Date.now(),
    usn: -1
  }));
  
  // Generate the zip file
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/zip"
  });
};

// Download the Anki package
export const downloadAnkiDeck = async (vocabularyItems: VocabularyItem[], deckName: string = 'vocabulary'): Promise<void> => {
  try {
    const zipBlob = await generateAnkiPackage(vocabularyItems);
    
    // Create a download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use .apkg extension which is what Anki expects
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
