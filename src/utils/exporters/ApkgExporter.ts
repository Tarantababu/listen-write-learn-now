import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { VocabularyItem } from '@/types';
import { ExportFormat, ExportOptions, ExportResult } from '@/types/export';
import { BaseVocabularyExporter } from './BaseVocabularyExporter';
import { EXPORT_FORMATS } from '@/types/export';

export class ApkgExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find(f => f.id === 'apkg')!;

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('Starting APKG export for', vocabulary.length, 'items');
      
      const zip = new JSZip();
      
      // Create media mapping first to get correct indices
      const mediaMapping = await this.createMediaMapping(vocabulary, options);
      
      // Create the collection.anki2 SQLite database file
      const dbArrayBuffer = await this.createAnkiDatabase(vocabulary, options, mediaMapping);
      zip.file('collection.anki2', dbArrayBuffer);
      
      // Add media files to zip with correct filenames
      if (options.includeAudio && mediaMapping.files.length > 0) {
        console.log('Adding media files to archive...');
        for (const mediaFile of mediaMapping.files) {
          if (mediaFile.data) {
            zip.file(`${mediaFile.index}.mp3`, mediaFile.data, { base64: true });
          }
        }
      }
      
      // Create media mapping file
      zip.file('media', JSON.stringify(mediaMapping.map));
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      console.log('APKG export completed successfully');
      console.log('Media map:', mediaMapping.map);
      console.log('Media files in archive:', mediaMapping.files.length);
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('APKG export error:', error);
      return this.createErrorResult('Failed to create APKG file: ' + (error as Error).message);
    }
  }

  private async createMediaMapping(vocabulary: VocabularyItem[], options: ExportOptions): Promise<{
    map: Record<string, string>;
    files: Array<{ index: number; data: string | null; originalIndex: number }>;
    itemToMediaIndex: Map<number, number>;
  }> {
    const mediaMap: Record<string, string> = {};
    const mediaFiles: Array<{ index: number; data: string | null; originalIndex: number }> = [];
    const itemToMediaIndex = new Map<number, number>();
    
    if (!options.includeAudio) {
      return { map: mediaMap, files: mediaFiles, itemToMediaIndex };
    }
    
    let mediaIndex = 0;
    
    for (let i = 0; i < vocabulary.length; i++) {
      const item = vocabulary[i];
      
      if (item.audioUrl) {
        try {
          console.log(`Processing audio for item ${i}: ${item.word}`);
          const response = await fetch(item.audioUrl);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          
          const filename = `${mediaIndex}.mp3`;
          mediaMap[mediaIndex.toString()] = filename;
          mediaFiles.push({
            index: mediaIndex,
            data: base64.split(',')[1],
            originalIndex: i
          });
          itemToMediaIndex.set(i, mediaIndex);
          
          console.log(`Media file ${mediaIndex} mapped for item ${i}`);
          mediaIndex++;
        } catch (error) {
          console.error(`Failed to fetch audio for item ${i}:`, error);
          // Don't add to media map if fetch failed
        }
      }
    }
    
    console.log(`Created media mapping: ${mediaFiles.length} files, indices 0-${mediaIndex - 1}`);
    return { map: mediaMap, files: mediaFiles, itemToMediaIndex };
  }

  private async createAnkiDatabase(
    vocabulary: VocabularyItem[], 
    options: ExportOptions, 
    mediaMapping: { map: Record<string, string>; itemToMediaIndex: Map<number, number> }
  ): Promise<Uint8Array> {
    console.log('Creating Anki database...');
    
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    const db = new SQL.Database();
    
    try {
      // Create all required Anki tables
      this.createTables(db);
      
      // Use minimal, safe values
      const baseTime = 1640995200; // Fixed timestamp: 2022-01-01 00:00:00 UTC
      const deckId = 1;
      const modelId = 1000; // Much smaller model ID
      
      console.log('Base timestamp:', baseTime, 'Model ID:', modelId);
      
      // Insert collection configuration
      this.insertCollectionData(db, baseTime, modelId, deckId, options.deckName);
      
      // Insert notes and cards
      this.insertNotesAndCards(db, vocabulary, options, baseTime, modelId, deckId, mediaMapping.itemToMediaIndex);
      
      const data = db.export();
      console.log('Database created successfully, size:', data.length, 'bytes');
      return data;
    } catch (error) {
      console.error('Database creation error:', error);
      throw error;
    } finally {
      db.close();
    }
  }

  private createTables(db: any): void {
    // Collection table
    db.run(`
      CREATE TABLE col (
        id INTEGER PRIMARY KEY,
        crt INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        scm INTEGER NOT NULL,
        ver INTEGER NOT NULL,
        dty INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        ls INTEGER NOT NULL,
        conf TEXT NOT NULL,
        models TEXT NOT NULL,
        decks TEXT NOT NULL,
        dconf TEXT NOT NULL,
        tags TEXT NOT NULL
      )
    `);

    // Notes table
    db.run(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY,
        guid TEXT NOT NULL,
        mid INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        tags TEXT NOT NULL,
        flds TEXT NOT NULL,
        sfld TEXT NOT NULL,
        csum INTEGER NOT NULL,
        flags INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `);

    // Cards table
    db.run(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        nid INTEGER NOT NULL,
        did INTEGER NOT NULL,
        ord INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        queue INTEGER NOT NULL,
        due INTEGER NOT NULL,
        ivl INTEGER NOT NULL,
        factor INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        left INTEGER NOT NULL,
        odue INTEGER NOT NULL,
        odid INTEGER NOT NULL,
        flags INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `);

    // Review log table
    db.run(`
      CREATE TABLE revlog (
        id INTEGER PRIMARY KEY,
        cid INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        ease INTEGER NOT NULL,
        ivl INTEGER NOT NULL,
        lastIvl INTEGER NOT NULL,
        factor INTEGER NOT NULL,
        time INTEGER NOT NULL,
        type INTEGER NOT NULL
      )
    `);

    // Graves table (for deletions)
    db.run(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      )
    `);
  }

  private insertCollectionData(db: any, baseTime: number, modelId: number, deckId: number, deckName: string): void {
    console.log('Inserting collection data...');
    
    try {
      // Minimal deck configuration
      const decks = {
        [deckId]: {
          id: deckId,
          name: deckName,
          extendRev: 50,
          usn: 0,
          collapsed: false,
          newToday: [0, 0],
          revToday: [0, 0],
          lrnToday: [0, 0],
          timeToday: [0, 0],
          conf: 1,
          desc: "",
          dyn: 0,
          extendNew: 10,
          mod: baseTime
        }
      };

      // Simplified note type (model) configuration
      const models = {
        [modelId]: {
          id: modelId,
          name: "Basic",
          type: 0,
          mod: baseTime,
          usn: 0,
          sortf: 0,
          did: deckId,
          tmpls: [
            {
              name: "Card 1",
              ord: 0,
              qfmt: "{{Front}}",
              afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
              did: null,
              bqfmt: "",
              bafmt: ""
            }
          ],
          flds: [
            {
              name: "Front",
              ord: 0,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            },
            {
              name: "Back",
              ord: 1,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            }
          ],
          css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
          latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
          latexPost: "\\end{document}",
          req: [[0, "any", [0]]]
        }
      };

      // Minimal deck configuration
      const dconf = {
        1: {
          id: 1,
          name: "Default",
          replayq: true,
          lapse: {
            delays: [10],
            mult: 0,
            minInt: 1,
            leechFails: 8,
            leechAction: 0
          },
          rev: {
            perDay: 200,
            ease4: 1.3,
            fuzz: 0.05,
            minSpace: 1,
            ivlFct: 1,
            maxIvl: 36500,
            bury: true,
            hardFactor: 1.2
          },
          new: {
            perDay: 20,
            delays: [1, 10],
            separate: true,
            ints: [1, 4, 7],
            initialFactor: 2500,
            bury: true,
            order: 1
          },
          timer: 0,
          maxTaken: 60,
          usn: 0,
          mod: baseTime,
          autoplay: true
        }
      };

      // Minimal collection configuration
      const conf = {
        nextPos: 1,
        estTimes: true,
        activeDecks: [deckId],
        sortType: "noteFld",
        timeLim: 0,
        sortBackwards: false,
        addToCur: true,
        curDeck: deckId,
        newBury: true,
        newSpread: 0,
        dueCounts: true,
        curModel: modelId,
        collapseTime: 1200
      };

      // Insert collection data with safe values
      db.run(
        `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1,                              // id
          baseTime,                       // crt (creation time)
          baseTime,                       // mod (modification time)
          baseTime,                       // scm (schema modification time)
          11,                             // ver (version)
          0,                              // dty (dirty)
          0,                              // usn (update sequence number)
          0,                              // ls (last sync)
          JSON.stringify(conf),           // conf
          JSON.stringify(models),         // models
          JSON.stringify(decks),          // decks
          JSON.stringify(dconf),          // dconf
          JSON.stringify({})              // tags
        ]
      );
      
      console.log('Collection data inserted successfully');
    } catch (error) {
      console.error('Error inserting collection data:', error);
      throw error;
    }
  }

  private insertNotesAndCards(
    db: any, 
    vocabulary: VocabularyItem[], 
    options: ExportOptions, 
    baseTime: number, 
    modelId: number, 
    deckId: number,
    itemToMediaIndex: Map<number, number>
  ): void {
    console.log('Inserting', vocabulary.length, 'notes and cards...');
    
    try {
      vocabulary.forEach((item, index) => {
        // Use very simple, safe ID generation
        const noteId = 1000 + index;  // Start from 1000
        const cardId = 2000 + index;  // Start from 2000
        
        // Prepare fields with proper sanitization
        const front = this.sanitizeText(item.word);
        let back = this.sanitizeText(item.definition);
        
        if (item.exampleSentence) {
          back += `<br><br><i>${this.sanitizeText(item.exampleSentence)}</i>`;
        }
        
        // Add audio reference only if this item has a corresponding media file
        if (item.audioUrl && options.includeAudio && itemToMediaIndex.has(index)) {
          const mediaIndex = itemToMediaIndex.get(index)!;
          back += `<br>[sound:${mediaIndex}.mp3]`;
          console.log(`Added audio reference for item ${index}: ${mediaIndex}.mp3`);
        }
        
        const fields = `${front}\x1f${back}`;
        const guid = this.generateAnkiGuid();
        const csum = this.calculateChecksum(front);
        
        console.log(`Processing item ${index}: noteId=${noteId}, cardId=${cardId}, csum=${csum}`);
        
        // Insert note with validated values
        db.run(
          `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            noteId,                        // id
            guid,                          // guid
            modelId,                       // mid (model id)
            baseTime,                      // mod (modification time)
            -1,                            // usn (update sequence number)
            item.language || '',           // tags
            fields,                        // flds (fields)
            front,                         // sfld (sort field)
            csum,                          // csum (checksum)
            0,                             // flags
            ""                             // data
          ]
        );

        // Insert card with minimal safe values for new cards
        db.run(
          `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cardId,                        // id
            noteId,                        // nid (note id)
            deckId,                        // did (deck id)
            0,                             // ord (ordinal)
            baseTime,                      // mod (modification time)
            -1,                            // usn (update sequence number)
            0,                             // type (0 = new)
            0,                             // queue (0 = new)
            index + 1,                     // due (simple sequential number)
            0,                             // ivl (interval in days)
            0,                             // factor (0 for new cards)
            0,                             // reps (repetitions)
            0,                             // lapses
            0,                             // left (0 for new cards)
            0,                             // odue (original due)
            0,                             // odid (original deck id)
            0,                             // flags
            ""                             // data
          ]
        );
      });
      
      console.log('All notes and cards inserted successfully');
    } catch (error) {
      console.error('Error inserting notes and cards:', error);
      throw error;
    }
  }

  private generateAnkiGuid(): string {
    // Generate a proper 10-character base62 GUID as expected by Anki
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    
    // Use crypto.getRandomValues for better randomness if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(10);
      crypto.getRandomValues(array);
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(array[i] % chars.length);
      }
    } else {
      // Fallback to Math.random
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  private calculateChecksum(text: string): number {
    // Very simple checksum that stays within tiny range
    if (!text || text.length === 0) return 0;
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash + char) % 65536; // Keep within 16-bit range
    }
    
    // Ensure positive result within very safe range
    const result = Math.abs(hash) % 10000; // Keep it very small
    console.log(`Checksum for "${text.substring(0, 20)}...": ${result}`);
    return result;
  }
  
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
