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
      const zip = new JSZip();
      
      // Create the collection.anki2 SQLite database file
      const dbArrayBuffer = await this.createAnkiDatabase(vocabulary, options);
      zip.file('collection.anki2', dbArrayBuffer);
      
      // Create media files if audio is included
      const media: Record<string, string> = {};
      if (options.includeAudio) {
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
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('APKG export error:', error);
      return this.createErrorResult('Failed to create APKG file: ' + (error as Error).message);
    }
  }

  private async createAnkiDatabase(vocabulary: VocabularyItem[], options: ExportOptions): Promise<Uint8Array> {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    const db = new SQL.Database();
    
    // Create the essential Anki database structure
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

    db.run(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      )
    `);

    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);
    const deckId = 1;
    const modelId = Math.floor(now / 1000);

    // Create proper Anki deck configuration
    const decks = {
      "1": {
        "id": 1,
        "name": options.deckName,
        "extendRev": 50,
        "usn": 0,
        "collapsed": false,
        "newToday": [0, 0],
        "revToday": [0, 0],
        "lrnToday": [0, 0],
        "timeToday": [0, 0],
        "conf": 1,
        "desc": "",
        "dyn": 0,
        "extendNew": 10
      }
    };

    // Create proper Anki note type (model) configuration
    const models = {
      [modelId]: {
        "id": modelId,
        "name": "Basic",
        "type": 0,
        "mod": nowSeconds,
        "usn": 0,
        "sortf": 0,
        "did": 1,
        "tmpls": [
          {
            "name": "Card 1",
            "ord": 0,
            "qfmt": "{{Front}}",
            "afmt": "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
            "did": null,
            "bqfmt": "",
            "bafmt": ""
          }
        ],
        "flds": [
          {
            "name": "Front",
            "ord": 0,
            "sticky": false,
            "rtl": false,
            "font": "Arial",
            "size": 20
          },
          {
            "name": "Back",
            "ord": 1,
            "sticky": false,
            "rtl": false,
            "font": "Arial",
            "size": 20
          }
        ],
        "css": ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
        "latexPre": "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
        "latexPost": "\\end{document}",
        "req": [[0, "any", [0]]]
      }
    };

    // Create deck configuration
    const dconf = {
      "1": {
        "id": 1,
        "name": "Default",
        "replayq": true,
        "lapse": {
          "delays": [10],
          "mult": 0,
          "minInt": 1,
          "leechFails": 8,
          "leechAction": 0
        },
        "rev": {
          "perDay": 200,
          "ease4": 1.3,
          "fuzz": 0.05,
          "minSpace": 1,
          "ivlFct": 1,
          "maxIvl": 36500,
          "bury": true,
          "hardFactor": 1.2
        },
        "new": {
          "perDay": 20,
          "delays": [1, 10],
          "separate": true,
          "ints": [1, 4, 7],
          "initialFactor": 2500,
          "bury": true,
          "order": 1
        },
        "timer": 0,
        "maxTaken": 60,
        "usn": 0,
        "mod": nowSeconds,
        "autoplay": true
      }
    };

    // Create collection configuration
    const conf = {
      "nextPos": 1,
      "estTimes": true,
      "activeDecks": [1],
      "sortType": "noteFld",
      "timeLim": 0,
      "sortBackwards": false,
      "addToCur": true,
      "curDeck": 1,
      "newBury": true,
      "newSpread": 0,
      "dueCounts": true,
      "curModel": modelId,
      "collapseTime": 1200
    };

    // Insert collection data
    db.run(
      `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        nowSeconds,
        now,
        now,
        11,
        0,
        0,
        0,
        JSON.stringify(conf),
        JSON.stringify(models),
        JSON.stringify(decks),
        JSON.stringify(dconf),
        JSON.stringify({})
      ]
    );

    // Insert notes and cards
    vocabulary.forEach((item, index) => {
      const noteId = now + index + 100;
      const cardId = now + index + 1000;
      
      // Prepare fields - Front and Back
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
      
      // Insert note
      db.run(
        `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          this.generateGuid(),
          modelId,
          now,
          -1,
          item.language,
          fields,
          front,
          this.fieldChecksum(front),
          0,
          ""
        ]
      );

      // Insert card
      db.run(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardId,
          noteId,
          deckId,
          0,
          now,
          -1,
          0,
          0,
          index + 1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          ""
        ]
      );
    });

    const data = db.export();
    db.close();
    
    return data;
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private fieldChecksum(text: string): number {
    let csum = 0;
    for (let i = 0; i < text.length; i++) {
      csum = (csum * 31 + text.charCodeAt(i)) & 0xffffffff;
    }
    return csum;
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
