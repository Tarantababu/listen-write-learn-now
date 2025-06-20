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
      
      // Create media files if audio is included
      const media: Record<string, string> = {};
      if (options.includeAudio) {
        console.log('Processing audio files...');
        const mediaFiles = await this.processMediaFiles(vocabulary);
        
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          if (file.data) {
            const filename = `${i}.mp3`;
            zip.file(filename, file.data, { base64: true });
            media[filename] = filename;
          }
        }
      }
      
      // Create media mapping file
      zip.file('media', JSON.stringify(media));
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      console.log('APKG export completed successfully');
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('APKG export error:', error);
      return this.createErrorResult('Failed to create APKG file: ' + (error as Error).message);
    }
  }

  private async createAnkiDatabase(vocabulary: VocabularyItem[], options: ExportOptions): Promise<Uint8Array> {
    console.log('Creating Anki database...');
    
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    const db = new SQL.Database();
    
    // Create all required Anki tables
    this.createTables(db);
    
    // Use current timestamp in seconds (Anki standard)
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Use safe ID ranges - avoid conflicts with existing Anki data
    const deckId = 1;
    const modelId = Math.floor(Date.now() / 1000); // Use timestamp as model ID
    
    console.log('Current time (seconds):', currentTime);
    console.log('Model ID:', modelId);
    
    // Insert collection configuration
    this.insertCollectionData(db, currentTime, modelId, deckId, options.deckName);
    
    // Insert notes and cards
    this.insertNotesAndCards(db, vocabulary, options, currentTime, modelId, deckId);
    
    const data = db.export();
    db.close();
    
    console.log('Database created successfully, size:', data.length, 'bytes');
    return data;
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

    // Review log table (can be empty for new decks)
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

    // Graves table (can be empty for new decks)
    db.run(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      )
    `);
  }

  private insertCollectionData(db: any, currentTime: number, modelId: number, deckId: number, deckName: string): void {
    // Deck configuration - use minimal required fields
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
        mod: currentTime
      }
    };

    // Note type (model) configuration - minimal Basic model
    const models = {
      [modelId]: {
        id: modelId,
        name: "Basic",
        type: 0,
        mod: currentTime,
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

    // Deck configuration
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
        mod: currentTime,
        autoplay: true
      }
    };

    // Collection configuration
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

    // Insert collection data - all timestamps in seconds for consistency
    db.run(
      `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,                              // id
        currentTime,                    // crt (creation time)
        currentTime,                    // mod (modification time) 
        currentTime,                    // scm (schema modification time)
        11,                            // ver (version)
        0,                             // dty (dirty)
        0,                             // usn (update sequence number)
        0,                             // ls (last sync)
        JSON.stringify(conf),          // conf
        JSON.stringify(models),        // models
        JSON.stringify(decks),         // decks
        JSON.stringify(dconf),         // dconf
        JSON.stringify({})             // tags
      ]
    );
  }

  private insertNotesAndCards(db: any, vocabulary: VocabularyItem[], options: ExportOptions, currentTime: number, modelId: number, deckId: number): void {
    console.log('Inserting', vocabulary.length, 'notes and cards...');
    
    vocabulary.forEach((item, index) => {
      // Generate safe sequential IDs starting from a reasonable base
      const noteId = currentTime * 1000 + index + 1; // Multiply by 1000 to avoid conflicts
      const cardId = currentTime * 1000 + index + 100000; // Ensure cards don't conflict with notes
      
      // Prepare fields - sanitize and escape properly
      const front = this.sanitizeText(item.word);
      let back = this.sanitizeText(item.definition);
      
      if (item.exampleSentence) {
        back += `<br><br><i>${this.sanitizeText(item.exampleSentence)}</i>`;
      }
      
      // Add audio if available
      if (item.audioUrl && options.includeAudio) {
        back += `<br>[sound:${index}.mp3]`;
      }
      
      const fields = `${front}\x1f${back}`;
      const guid = this.generateGuid();
      const csum = this.calculateChecksum(front);
      
      // Insert note
      db.run(
        `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,                        // id
          guid,                          // guid
          modelId,                       // mid (model id)
          currentTime,                   // mod (modification time)
          -1,                           // usn (update sequence number)
          item.language || '',          // tags
          fields,                       // flds (fields separated by \x1f)
          front,                        // sfld (sort field)  
          csum,                         // csum (checksum)
          0,                            // flags
          ""                            // data
        ]
      );

      // Insert card with proper defaults for new cards
      db.run(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardId,                       // id
          noteId,                       // nid (note id)
          deckId,                       // did (deck id)
          0,                            // ord (ordinal/template index)
          currentTime,                  // mod (modification time)
          -1,                           // usn (update sequence number)
          0,                            // type (0 = new, 1 = learning, 2 = review)
          0,                            // queue (0 = new, 1 = learning, 2 = review)
          index + 1,                    // due (due date for new cards, just use index)
          0,                            // ivl (interval)
          2500,                         // factor (ease factor 2500 = 250%)
          0,                            // reps (repetitions)
          0,                            // lapses
          0,                            // left (steps left)
          0,                            // odue (original due) 
          0,                            // odid (original deck id)
          0,                            // flags
          ""                            // data
        ]
      );
    });
  }

  private generateGuid(): string {
    // Generate a simple 8-character alphanumeric GUID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 8 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private calculateChecksum(text: string): number {
    // Simple checksum that ensures positive 32-bit integer
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0x7fffffff;
    }
    return Math.abs(hash);
  }

  private async processMediaFiles(vocabulary: VocabularyItem[]): Promise<Array<{ data: string | null, url?: string }>> {
    const mediaFiles: Array<{ data: string | null, url?: string }> = [];
    
    for (const item of vocabulary) {
      if (item.audioUrl) {
        try {
          const response = await fetch(item.audioUrl);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          mediaFiles.push({ data: base64.split(',')[1], url: item.audioUrl });
        } catch (error) {
          console.error('Failed to fetch audio:', error);
          mediaFiles.push({ data: null, url: item.audioUrl });
        }
      }
    }
    
    return mediaFiles;
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