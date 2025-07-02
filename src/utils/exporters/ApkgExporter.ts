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
      
      // Create the collection.anki2 SQLite database file
      const dbArrayBuffer = await this.createAnkiDatabase(vocabulary, options);
      zip.file('collection.anki2', dbArrayBuffer);
      
      // Always create an empty media file since we're using URLs
      zip.file('media', JSON.stringify({}));
      console.log('Created empty media file (using URLs instead of embedded files)');
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      console.log('APKG export completed successfully');
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('APKG export error:', error);
      return this.createErrorResult('Failed to create APKG file: ' + (error as Error).message);
    }
  }

  private async createAnkiDatabase(
    vocabulary: VocabularyItem[], 
    options: ExportOptions
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
      const baseTime = Math.floor(Date.now() / 1000);
      const deckId = 1;
      const modelId = 1000;
      
      console.log('Base timestamp:', baseTime, 'Model ID:', modelId);
      
      // Insert collection configuration
      this.insertCollectionData(db, baseTime, modelId, deckId, options.deckName);
      
      // Insert notes and cards
      this.insertNotesAndCards(db, vocabulary, options, baseTime, modelId, deckId);
      
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
              qfmt: `<div class="card-container">
  <div class="header">
    <div class="branding">lwlnow.com</div>
  </div>
  <div class="word-section">
    <div class="word">{{Word}}</div>
  </div>
  <div class="example-section">
    <div class="example-label">Example:</div>
    <div class="example">{{Example}}</div>
  </div>
  {{#Audio}}
  <div class="audio-section">
    <audio controls class="audio-player">
      <source src="{{Audio}}" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
  {{/Audio}}
</div>`,
              afmt: `<div class="card-container">
  <div class="header">
    <div class="branding">lwlnow.com</div>
  </div>
  <div class="word-section">
    <div class="word">{{Word}}</div>
  </div>
  <div class="example-section">
    <div class="example-label">Example:</div>
    <div class="example">{{Example}}</div>
  </div>
  {{#Audio}}
  <div class="audio-section">
    <audio controls class="audio-player">
      <source src="{{Audio}}" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
  {{/Audio}}
  <hr class="divider">
  <div class="definition-section">
    <div class="definition-label">Definition:</div>
    <div class="definition">{{Definition}}</div>
  </div>
</div>`,
              did: null,
              bqfmt: "",
              bafmt: ""
            }
          ],
          flds: [
            {
              name: "Word",
              ord: 0,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            },
            {
              name: "Definition",
              ord: 1,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            },
            {
              name: "Example",
              ord: 2,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            },
            {
              name: "Audio",
              ord: 3,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            }
          ],
          css: `
/* Main card container */
.card-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  color: white;
  text-align: center;
}

/* Header with branding */
.header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}

.branding {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  font-weight: 300;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Word section */
.word-section {
  margin: 25px 0;
}

.word {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 1px;
}

/* Example section */
.example-section {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.example-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.example {
  font-size: 18px;
  line-height: 1.4;
  font-style: italic;
  color: rgba(255,255,255,0.95);
}

/* Audio section */
.audio-section {
  margin: 20px 0;
}

.audio-player {
  width: 100%;
  max-width: 300px;
  border-radius: 25px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
}

.audio-player::-webkit-media-controls-panel {
  background: rgba(255,255,255,0.2);
  border-radius: 25px;
}

/* Divider */
.divider {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  margin: 25px 0;
}

/* Definition section */
.definition-section {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.definition-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.definition {
  font-size: 20px;
  line-height: 1.5;
  color: rgba(255,255,255,0.95);
  font-weight: 400;
}

/* Responsive design */
@media (max-width: 480px) {
  .card-container {
    padding: 15px;
    margin: 10px;
  }
  
  .word {
    font-size: 28px;
  }
  
  .example, .definition {
    font-size: 16px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .card-container {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  }
}
`,
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
    deckId: number
  ): void {
    console.log('Inserting', vocabulary.length, 'notes and cards...');
    
    try {
      vocabulary.forEach((item, index) => {
        // Use very simple, safe ID generation
        const noteId = 1000 + index;  // Start from 1000
        const cardId = 2000 + index;  // Start from 2000
        
        // Prepare fields with proper sanitization
        const word = this.sanitizeText(item.word);
        const definition = this.sanitizeText(item.definition);
        const example = item.exampleSentence ? this.sanitizeText(item.exampleSentence) : '';
        const audio = item.audioUrl && options.includeAudio ? item.audioUrl : '';
        
        // Create fields in the correct order: Word, Definition, Example, Audio
        const fields = `${word}\x1f${definition}\x1f${example}\x1f${audio}`;
        
        const guid = this.generateAnkiGuid();
        const csum = this.calculateChecksum(word);
        
        console.log(`Processing item ${index}: noteId=${noteId}, cardId=${cardId}, word="${item.word}"`);
        if (audio) {
          console.log(`Added audio URL for item ${index} (${item.word}): ${audio}`);
        }
        
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
            word,                          // sfld (sort field)
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
      console.log('Audio handling: Using clickable URLs instead of embedded files');
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
    // Anki-compatible checksum calculation
    if (!text || text.length === 0) return 0;
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff; // Use bitwise AND to ensure 32-bit
    }
    
    // Convert to positive integer and keep within reasonable range
    const result = Math.abs(hash) % 2147483647;
    return result;
  }
}