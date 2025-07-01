import JSZip from "jszip"
import initSqlJs from "sql.js"
import type { VocabularyItem } from "@/types"
import type { ExportFormat, ExportOptions, ExportResult } from "@/types/export"
import { BaseVocabularyExporter } from "./BaseVocabularyExporter"
import { EXPORT_FORMATS } from "@/types/export"

interface MediaFile {
  itemIndex: number
  mediaIndex: number
  filename: string
  base64Data: string
  itemId: string
  audioUrl: string
}

export class ApkgExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find((f) => f.id === "apkg")!

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      console.log("🚀 Starting APKG export for", vocabulary.length, "items")

      const zip = new JSZip()

      // Strategy: Create cards first WITHOUT any media references
      // Then add media files and update references only for successful downloads
      const cardsData = this.prepareCardsData(vocabulary)
      console.log("Prepared", cardsData.length, "cards")

      // Download media files and track which ones succeed
      const mediaResults = await this.downloadMediaFiles(vocabulary, options)
      console.log("Media download results:", mediaResults)

      // Create database with cards, adding audio references only for successful media
      const dbBuffer = await this.createDatabase(cardsData, mediaResults, options)
      zip.file("collection.anki2", dbBuffer)

      // Add successful media files to ZIP
      this.addMediaToZip(zip, mediaResults)

      // Generate final file
      const blob = await zip.generateAsync({ type: "blob" })
      const filename = this.generateFilename(options.deckName, this.format.fileExtension)

      console.log("🎉 APKG export completed successfully!")
      console.log(
        `📊 Final stats: ${vocabulary.length} cards, ${mediaResults.successful.length} media files, ${blob.size} bytes`,
      )

      return this.createSuccessResult(blob, filename)
    } catch (error) {
      console.error("❌ APKG export failed:", error)
      return this.createErrorResult("Failed to create APKG file: " + (error as Error).message)
    }
  }

  private prepareCardsData(vocabulary: VocabularyItem[]) {
    return vocabulary.map((item, index) => ({
      index,
      id: item.id || `card_${index}`,
      front: item.front || item.word || "",
      back: item.back || item.definition || "",
      tags: Array.isArray(item.tags) ? item.tags.join(" ") : item.language || item.tags || "",
      audioUrl: item.audio || item.audioUrl || null,
      hasAudio: Boolean(item.audio || item.audioUrl),
    }))
  }

  private async downloadMediaFiles(vocabulary: VocabularyItem[], options: ExportOptions) {
    const results = {
      successful: [] as Array<{ cardIndex: number; filename: string; data: string }>,
      failed: [] as Array<{ cardIndex: number; error: string }>,
      mediaMap: {} as Record<string, string>,
    }

    if (!options.includeAudio) {
      console.log("Audio disabled - skipping media download")
      return results
    }

    console.log("🎵 Processing audio files...")
    for (let i = 0; i < vocabulary.length; i++) {
      const item = vocabulary[i]
      const audioUrl = item.audio || item.audioUrl

      if (!audioUrl) continue

      try {
        console.log(`⬇️  Downloading audio for item ${i}: ${audioUrl}`)
        const response = await fetch(audioUrl)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()
        const base64 = await this.convertBlobToBase64(blob)

        // Use a simple filename pattern
        const filename = `audio_${i}.mp3`

        results.successful.push({
          cardIndex: i,
          filename,
          data: base64,
        })

        // Add to media map using the array index as key
        results.mediaMap[results.successful.length - 1] = filename

        console.log(`✅ Successfully processed: ${filename} for item ${i}`)
      } catch (error) {
        console.error(`❌ Failed to download audio for item ${i}:`, error)
        results.failed.push({
          cardIndex: i,
          error: String(error),
        })
      }
    }

    console.log(`🎵 Media processing summary: ${results.successful.length} files successfully processed`)
    return results
  }

  private addMediaToZip(zip: JSZip, mediaResults: any) {
    // Add media files to ZIP
    for (const media of mediaResults.successful) {
      zip.file(media.filename, media.data, { base64: true })
      console.log(`✅ Added to ZIP: ${media.filename} (card index: ${media.cardIndex})`)
    }

    // Create media mapping file
    const mediaMapJson = JSON.stringify(mediaResults.mediaMap)
    zip.file("media", mediaMapJson)
    console.log("📋 Media map:", mediaMapJson)
  }

  private async createDatabase(cardsData: any[], mediaResults: any, options: ExportOptions) {
    console.log("🗄️  Creating Anki database...")

    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    const db = new SQL.Database()

    try {
      // Create tables
      this.setupTables(db)

      const timestamp = Math.floor(Date.now() / 1000)
      const deckId = 1
      const modelId = 1

      // Insert collection metadata
      this.insertCollection(db, timestamp, deckId, modelId, options.deckName)

      // Insert cards with proper media references
      this.insertCards(db, cardsData, mediaResults, timestamp, deckId, modelId, options)

      const buffer = db.export()
      console.log("✅ Database created successfully, size:", buffer.length, "bytes")
      return buffer
    } finally {
      db.close()
    }
  }

  private setupTables(db: any) {
    // Collection table
    db.exec(`
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
      );
    `)

    // Notes table
    db.exec(`
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
      );
    `)

    // Cards table
    db.exec(`
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
      );
    `)

    // Review log table
    db.exec(`
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
      );
    `)

    // Graves table
    db.exec(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      );
    `)

    console.log("✅ Database tables created")
  }

  private insertCollection(db: any, timestamp: number, deckId: number, modelId: number, deckName: string) {
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
        mod: timestamp,
      },
    }

    const models = {
      [modelId]: {
        id: modelId,
        name: "Basic",
        type: 0,
        mod: timestamp,
        usn: 0,
        sortf: 0,
        did: deckId,
        tmpls: [
          {
            name: "Card 1",
            ord: 0,
            qfmt: "{{Front}}",
            afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
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
        css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
        latexPre:
          "\\documentclass[12pt]{article}\\special{papersize=3in,5in}\\usepackage[utf8]{inputenc}\\usepackage{amssymb,amsmath}\\pagestyle{empty}\\setlength{\\parindent}{0in}\\begin{document}",
        latexPost: "\\end{document}",
        req: [[0, "any", [0]]],
      },
    }

    const dconf = {
      1: {
        id: 1,
        name: "Default",
        replayq: true,
        lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
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
        mod: timestamp,
        autoplay: true,
      },
    }

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

    db.run(
      `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        timestamp,
        timestamp,
        timestamp,
        11,
        0,
        0,
        0,
        JSON.stringify(conf),
        JSON.stringify(models),
        JSON.stringify(decks),
        JSON.stringify(dconf),
        JSON.stringify({}),
      ],
    )

    console.log("✅ Collection data inserted successfully")
  }

  private insertCards(
    db: any,
    cardsData: any[],
    mediaResults: any,
    timestamp: number,
    deckId: number,
    modelId: number,
    options: ExportOptions,
  ) {
    console.log("📝 Inserting notes and cards...")

    // Create a lookup for successful media files by card index
    const mediaByCardIndex = new Map()
    for (let i = 0; i < mediaResults.successful.length; i++) {
      const media = mediaResults.successful[i]
      mediaByCardIndex.set(media.cardIndex, {
        filename: media.filename,
        mediaIndex: i, // Use the position in successful array as media index
      })
    }

    for (let i = 0; i < cardsData.length; i++) {
      const card = cardsData[i]
      const noteId = 1000 + i
      const cardId = 2000 + i

      let back = card.back

      // Add audio reference ONLY if we have a successful media file for this card
      if (options.includeAudio && mediaByCardIndex.has(i)) {
        const media = mediaByCardIndex.get(i)
        back += `<br><br>[sound:${media.filename}]`
        console.log(`🎵 Added audio reference for card ${i}: ${media.filename}`)
      }

      const fields = `${card.front}\x1f${back}`
      const guid = this.generateGuid()
      const checksum = this.calculateChecksum(card.front)

      // Insert note
      db.run(
        `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [noteId, guid, modelId, timestamp, -1, card.tags, fields, card.front, checksum, 0, ""],
      )

      // Insert card
      db.run(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cardId, noteId, deckId, 0, timestamp, -1, 0, 0, i + 1, 0, 0, 0, 0, 0, 0, 0, 0, ""],
      )
    }

    console.log("✅ All notes and cards inserted successfully")
  }

  private generateGuid(): string {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    let result = ""
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private calculateChecksum(text: string): number {
    if (!text) return 0
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash + char) & 0xffffffff
    }
    return Math.abs(hash) % 2147483647
  }

  private async convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          const base64 = reader.result as string
          // Extract just the base64 data part
          const data = base64.includes(",") ? base64.split(",")[1] : base64
          resolve(data)
        } else {
          reject(new Error("Failed to convert blob to base64"))
        }
      }
      reader.onerror = () => reject(new Error("FileReader error"))
      reader.readAsDataURL(blob)
    })
  }
}
