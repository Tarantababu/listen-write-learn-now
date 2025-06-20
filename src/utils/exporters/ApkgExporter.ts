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
    
    // Use simple, safe values
    const timestamp = 1640995200; // Fixed timestamp: 2022-01-01 00:00:00 UTC
    const deckId = 1;
    const modelId = 1640995200;
    
    // Create tables
    this.createAnkiTables(db);
    
    // Insert collection
    this.insertCollection(db, timestamp, deckId, modelId, options.deckName);
    
    // Insert vocabulary as notes and cards
    this.insertVocabulary(db, vocabulary, options, timestamp, deckId, modelId);
    
    const data = db.export();
    db.close();
    
    console.log('Database created, size:', data.length, 'bytes');
    return data;
  }

  private createAnkiTables(db: any): void {
    // Collection table - core Anki metadata
    db.run(`CREATE TABLE col (
      id integer primary key,
      crt integer not null,
      mod integer not null,
      scm integer not null,
      ver integer not null,
      dty integer not null,
      usn integer not null,
      ls integer not null,
      conf text not null,
      models text not null,
      decks text not null,
      dconf text not null,
      tags text not null
    )`);

    // Notes table - contains the actual content
    db.run(`CREATE TABLE notes (
      id integer primary key,
      guid text not null,
      mid integer not null,
      mod integer not null,
      usn integer not null,
      tags text not null,
      flds text not null,
      sfld text not null,
      csum integer not null,
      flags integer not null,
      data text not null
    )`);

    // Cards table - individual cards generated from notes
    db.run(`CREATE TABLE cards (
      id integer primary key,
      nid integer not null,
      did integer not null,
      ord integer not null,
      mod integer not null,
      usn integer not null,
      type integer not null,
      queue integer not null,
      due integer not null,
      ivl integer not null,
      factor integer not null,
      reps integer not null,
      lapses integer not null,
      left integer not null,
      odue integer not null,
      odid integer not null,
      flags integer not null,
      data text not null
    )`);

    // Review log - can be empty for new decks
    db.run(`CREATE TABLE revlog (
      id integer primary key,
      cid integer not null,
      usn integer not null,
      ease integer not null,
      ivl integer not null,
      lastIvl integer not null,
      factor integer not null,
      time integer not null,
      type integer not null
    )`);

    // Graves - tracks deletions, can be empty
    db.run(`CREATE TABLE graves (
      usn integer not null,
      type integer not null,
      oid integer not null
    )`);
  }

  private insertCollection(db: any, timestamp: number, deckId: number, modelId: number, deckName: string): void {
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
        mod: timestamp
      }
    };

    // Basic note type with Front/Back fields
    const models = {
      [modelId]: {
        id: modelId,
        name: "Basic",
        type: 0,
        mod: timestamp,
        usn: 0,
        sortf: 0,
        did: deckId,
        tmpls: [{
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
          did: null,
          bqfmt: "",
          bafmt: ""
        }],
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
        css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
        latexPre: "",
        latexPost: "",
        req: [[0, "any", [0]]]
      }
    };

    // Default deck configuration
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
        mod: timestamp,
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

    // Insert collection row
    db.run(`INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      1,                          // id
      timestamp,                  // crt
      timestamp,                  // mod  
      timestamp,                  // scm
      11,                         // ver
      0,                          // dty
      0,                          // usn
      0,                          // ls
      JSON.stringify(conf),       // conf
      JSON.stringify(models),     // models
      JSON.stringify(decks),      // decks
      JSON.stringify(dconf),      // dconf
      "{}"                        // tags
    ]);
  }

  private insertVocabulary(db: any, vocabulary: VocabularyItem[], options: ExportOptions, timestamp: number, deckId: number, modelId: number): void {
    vocabulary.forEach((item, index) => {
      // Use simple incremental IDs
      const noteId = index + 1;
      const cardId = index + 1000;
      
      // Prepare content
      const front = this.escapeHtml(item.word || '');
      let back = this.escapeHtml(item.definition || '');
      
      if (item.exampleSentence) {
        back += '<br><br><i>' + this.escapeHtml(item.exampleSentence) + '</i>';
      }
      
      if (item.audioUrl && options.includeAudio) {
        back += `<br>[sound:${index}.mp3]`;
      }
      
      // Combine fields with Anki field separator
      const fields = front + '\x1f' + back;
      const guid = this.generateSimpleGuid();
      const checksum = this.simpleChecksum(front);
      
      // Insert note
      db.run(`INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        noteId,                     // id
        guid,                       // guid
        modelId,                    // mid
        timestamp,                  // mod
        0,                          // usn
        item.language || '',        // tags
        fields,                     // flds
        front,                      // sfld
        checksum,                   // csum
        0,                          // flags
        ''                          // data
      ]);

      // Insert card
      db.run(`INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        cardId,                     // id
        noteId,                     // nid
        deckId,                     // did
        0,                          // ord
        timestamp,                  // mod
        0,                          // usn
        0,                          // type
        0,                          // queue
        noteId,                     // due
        0,                          // ivl
        2500,                       // factor
        0,                          // reps
        0,                          // lapses
        0,                          // left
        0,                          // odue
        0,                          // odid
        0,                          // flags
        ''                          // data
      ]);
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private generateSimpleGuid(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private simpleChecksum(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
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