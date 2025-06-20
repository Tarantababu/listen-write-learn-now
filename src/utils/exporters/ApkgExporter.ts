import JSZip from "jszip"
import initSqlJs from "sql.js"
import type { VocabularyItem } from "@/types"
import type { ExportFormat, ExportOptions, ExportResult } from "@/types/export"
import { BaseVocabularyExporter } from "./BaseVocabularyExporter"
import { EXPORT_FORMATS } from "@/types/export"

export class ApkgExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find((f) => f.id === "apkg")!

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      console.log("Starting APKG export for", vocabulary.length, "items")

      const zip = new JSZip()

      // First, create the database WITHOUT any media references
      const dbArrayBuffer = await this.createAnkiDatabase(vocabulary, options)
      zip.file("collection.anki2", dbArrayBuffer)

      // Create an empty media mapping file (no media files for now)
      zip.file("media", JSON.stringify({}))

      console.log("Created basic APKG structure without media")

      const blob = await zip.generateAsync({ type: "blob" })
      const filename = this.generateFilename(options.deckName, this.format.fileExtension)

      console.log("APKG export completed successfully")
      return this.createSuccessResult(blob, filename)
    } catch (error) {
      console.error("APKG export error:", error)
      return this.createErrorResult("Failed to create APKG file: " + (error as Error).message)
    }
  }

  private async createAnkiDatabase(vocabulary: VocabularyItem[], options: ExportOptions): Promise<Uint8Array> {
    console.log("Creating Anki database...")

    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    const db = new SQL.Database()

    try {
      // Create all required Anki tables
      this.createTables(db)

      // Use completely safe, fixed values
      const safeTimestamp = 1700000000 // Fixed timestamp from 2023
      const deckId = 1000001
      const modelId = 1000002

      console.log("Using safe timestamp:", safeTimestamp)

      // Insert collection configuration
      this.insertCollectionData(db, safeTimestamp, modelId, deckId, options.deckName)

      // Insert notes and cards WITHOUT any media references
      this.insertNotesAndCards(db, vocabulary, safeTimestamp, modelId, deckId)

      const data = db.export()
      db.close()

      console.log("Database created successfully, size:", data.length, "bytes")
      return data
    } catch (error) {
      db.close()
      throw error
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
    `)

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
    `)

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
    `)

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
    `)

    // Graves table (for deletions)
    db.run(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      )
    `)
  }

  private insertCollectionData(
    db: any,
    safeTimestamp: number,
    modelId: number,
    deckId: number,
    deckName: string,
  ): void {
    // Deck configuration
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
        mod: safeTimestamp,
      },
    }

    // Note type (model) configuration
    const models = {
      [modelId]: {
        id: modelId,
        name: "Basic",
        type: 0,
        mod: safeTimestamp,
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
            bafmt: "",
          },
        ],
        flds: [
          {
            name: "Front",
            ord: 0,
            sticky: false,
            rtl: false,
            font: "Arial",
            size: 20,
          },
          {
            name: "Back",
            ord: 1,
            sticky: false,
            rtl: false,
            font: "Arial",
            size: 20,
          },
        ],
        css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
        latexPre:
          "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
        latexPost: "\\end{document}",
        req: [[0, "any", [0]]],
      },
    }

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
          leechAction: 0,
        },
        rev: {
          perDay: 200,
          ease4: 1.3,
          fuzz: 0.05,
          minSpace: 1,
          ivlFct: 1,
          maxIvl: 36500,
          bury: true,
          hardFactor: 1.2,
        },
        new: {
          perDay: 20,
          delays: [1, 10],
          separate: true,
          ints: [1, 4, 7],
          initialFactor: 2500,
          bury: true,
          order: 1,
        },
        timer: 0,
        maxTaken: 60,
        usn: 0,
        mod: safeTimestamp,
        autoplay: true,
      },
    }

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
      collapseTime: 1200,
    }

    // Insert collection data
    db.run(
      `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // id
        safeTimestamp, // crt (creation time in seconds)
        safeTimestamp, // mod (modification time in seconds)
        safeTimestamp, // scm (schema modification time in seconds)
        11, // ver (version)
        0, // dty (dirty)
        0, // usn (update sequence number)
        0, // ls (last sync)
        JSON.stringify(conf), // conf
        JSON.stringify(models), // models
        JSON.stringify(decks), // decks
        JSON.stringify(dconf), // dconf
        JSON.stringify({}), // tags
      ],
    )
  }

  private insertNotesAndCards(
    db: any,
    vocabulary: VocabularyItem[],
    safeTimestamp: number,
    modelId: number,
    deckId: number,
  ): void {
    console.log("Inserting", vocabulary.length, "notes and cards (without media)...")

    vocabulary.forEach((item, index) => {
      // Use very simple, safe IDs
      const noteId = 1000 + index
      const cardId = 2000 + index

      // Prepare fields with proper sanitization - NO MEDIA REFERENCES
      const front = this.sanitizeText(item.word || "")
      let back = this.sanitizeText(item.definition || "")

      if (item.exampleSentence) {
        back += `<br><br><i>${this.sanitizeText(item.exampleSentence)}</i>`
      }

      // Add a note about audio if URL exists, but don't reference any media files
      if (item.audioUrl) {
        back += `<br><small>(Audio available)</small>`
      }

      const fields = `${front}\x1f${back}`
      const guid = this.generateGuid()
      const csum = this.calculateSimpleChecksum(front)

      // Insert note
      db.run(
        `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId, // id
          guid, // guid
          modelId, // mid (model id)
          safeTimestamp, // mod
          -1, // usn (update sequence number)
          item.language || "", // tags
          fields, // flds (fields)
          front, // sfld (sort field)
          csum, // csum (checksum)
          0, // flags
          "", // data
        ],
      )

      // Insert card
      db.run(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardId, // id
          noteId, // nid (note id)
          deckId, // did (deck id)
          0, // ord (ordinal)
          safeTimestamp, // mod
          -1, // usn (update sequence number)
          0, // type (0 = new)
          0, // queue (0 = new)
          1, // due (due date)
          0, // ivl (interval)
          2500, // factor (ease factor, 2500 = 250%)
          0, // reps (repetitions)
          0, // lapses
          0, // left
          0, // odue (original due)
          0, // odid (original deck id)
          0, // flags
          "", // data
        ],
      )
    })

    console.log("Successfully inserted all notes and cards without media references")
  }

  private generateGuid(): string {
    // Generate a simple 10-character GUID
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  }

  private calculateSimpleChecksum(text: string): number {
    // Very simple checksum that cannot overflow
    let sum = 0
    for (let i = 0; i < Math.min(text.length, 50); i++) {
      sum += text.charCodeAt(i)
    }
    return sum % 100000 // Keep it small
  }
}
