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

      // Step 1: Process ALL media files first and get the final list
      const mediaFiles = await this.downloadAndProcessAllMedia(vocabulary, options)
      console.log(`📁 Media processing complete: ${mediaFiles.length} files ready for archive`)

      // Step 2: Create ZIP and add media files
      const zip = new JSZip()
      const mediaMap: Record<string, string> = {}

      // Add each media file to ZIP and build media map
      for (const mediaFile of mediaFiles) {
        zip.file(mediaFile.filename, mediaFile.base64Data, { base64: true })
        mediaMap[mediaFile.mediaIndex.toString()] = mediaFile.filename
        console.log(`✅ Added to ZIP: ${mediaFile.filename} (media index: ${mediaFile.mediaIndex})`)
      }

      // Add media map file
      const mediaMapJson = JSON.stringify(mediaMap)
      zip.file("media", mediaMapJson)
      console.log("📋 Media map:", mediaMapJson)

      // Step 3: Create database with ONLY the media files we actually added to ZIP
      const dbArrayBuffer = await this.createAnkiDatabase(vocabulary, options, mediaFiles)
      zip.file("collection.anki2", dbArrayBuffer)

      // Step 4: Generate final APKG file
      const blob = await zip.generateAsync({ type: "blob" })
      const filename = this.generateFilename(options.deckName, this.format.fileExtension)

      console.log("🎉 APKG export completed successfully!")
      console.log(`📊 Final stats: ${vocabulary.length} cards, ${mediaFiles.length} media files, ${blob.size} bytes`)

      return this.createSuccessResult(blob, filename)
    } catch (error) {
      console.error("❌ APKG export failed:", error)
      return this.createErrorResult("Failed to create APKG file: " + (error as Error).message)
    }
  }

  private async downloadAndProcessAllMedia(vocabulary: VocabularyItem[], options: ExportOptions): Promise<MediaFile[]> {
    const mediaFiles: MediaFile[] = []

    if (!options.includeAudio) {
      console.log("🔇 Audio disabled in export options")
      return mediaFiles
    }

    console.log("🎵 Processing audio files...")
    let mediaIndex = 0

    for (let itemIndex = 0; itemIndex < vocabulary.length; itemIndex++) {
      const item = vocabulary[itemIndex]
      const audioUrl = this.getAudioUrl(item)
      const itemId = this.getItemId(item)

      if (!audioUrl) {
        console.log(`⏭️  Item ${itemIndex} (${itemId}): No audio URL`)
        continue
      }

      try {
        console.log(`⬇️  Downloading audio for item ${itemIndex} (${itemId}): ${audioUrl}`)

        const response = await fetch(audioUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const blob = await response.blob()
        const base64 = await this.blobToBase64(blob)
        const base64Data = base64.includes(",") ? base64.split(",")[1] : base64

        if (!base64Data) {
          throw new Error("Failed to extract base64 data")
        }

        const filename = `${mediaIndex}.mp3`

        const mediaFile: MediaFile = {
          itemIndex,
          mediaIndex,
          filename,
          base64Data,
          itemId,
          audioUrl,
        }

        mediaFiles.push(mediaFile)
        console.log(`✅ Successfully processed: ${filename} for item ${itemIndex} (${itemId})`)
        mediaIndex++
      } catch (error) {
        console.error(`❌ Failed to download audio for item ${itemIndex} (${itemId}):`, error)
        // Continue without adding this file - no broken references will be created
      }
    }

    console.log(`🎵 Media processing summary: ${mediaFiles.length} files successfully processed`)
    return mediaFiles
  }

  private async createAnkiDatabase(
    vocabulary: VocabularyItem[],
    options: ExportOptions,
    mediaFiles: MediaFile[],
  ): Promise<Uint8Array> {
    console.log("🗄️  Creating Anki database...")

    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    const db = new SQL.Database()

    try {
      // Create lookup map for quick media file access
      const itemToMediaMap = new Map<number, MediaFile>()
      for (const mediaFile of mediaFiles) {
        itemToMediaMap.set(mediaFile.itemIndex, mediaFile)
      }

      this.createTables(db)

      const baseTime = Math.floor(Date.now() / 1000)
      const deckId = 1
      const modelId = 1000

      this.insertCollectionData(db, baseTime, modelId, deckId, options.deckName)
      this.insertNotesAndCards(db, vocabulary, options, baseTime, modelId, deckId, itemToMediaMap)

      const data = db.export()
      console.log("✅ Database created successfully, size:", data.length, "bytes")
      return data
    } catch (error) {
      console.error("❌ Database creation error:", error)
      throw error
    } finally {
      db.close()
    }
  }

  private insertNotesAndCards(
    db: any,
    vocabulary: VocabularyItem[],
    options: ExportOptions,
    baseTime: number,
    modelId: number,
    deckId: number,
    itemToMediaMap: Map<number, MediaFile>,
  ): void {
    console.log("📝 Inserting notes and cards...")

    try {
      for (let index = 0; index < vocabulary.length; index++) {
        const item = vocabulary[index]
        const noteId = 1000 + index
        const cardId = 2000 + index
        const itemId = this.getItemId(item)

        // Get card content
        const front = this.sanitizeText(this.getFrontText(item))
        let back = this.getBackText(item)

        // Add audio reference ONLY if we have the media file in our map
        // This guarantees the file exists in the ZIP archive
        if (options.includeAudio && itemToMediaMap.has(index)) {
          const mediaFile = itemToMediaMap.get(index)!
          back += `<br><br>[sound:${mediaFile.filename}]`
          console.log(`🎵 Added audio reference for item ${index} (${itemId}): [sound:${mediaFile.filename}]`)
        } else if (this.getAudioUrl(item) && options.includeAudio) {
          console.log(
            `⚠️  Item ${index} (${itemId}) has audio URL but no processed media file - skipping audio reference`,
          )
        }

        const fields = `${front}\x1f${back}`
        const guid = this.generateAnkiGuid()
        const csum = this.calculateChecksum(front)

        // Insert note
        db.run(
          `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [noteId, guid, modelId, baseTime, -1, this.getItemTags(item), fields, front, csum, 0, ""],
        )

        // Insert card
        db.run(
          `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cardId, noteId, deckId, 0, baseTime, -1, 0, 0, index + 1, 0, 0, 0, 0, 0, 0, 0, 0, ""],
        )

        console.log(`✅ Created card ${index}: ${itemId}`)
      }

      console.log("✅ All notes and cards inserted successfully")
    } catch (error) {
      console.error("❌ Error inserting notes and cards:", error)
      throw error
    }
  }

  // Helper methods for handling different JSON structures
  private getItemId(item: any): string {
    return item.id || item.word || item.front || `item_${Math.random()}`
  }

  private getFrontText(item: any): string {
    return item.front || item.word || ""
  }

  private getBackText(item: any): string {
    if (item.back) {
      return item.back
    }

    let back = this.sanitizeText(item.definition || "")
    if (item.exampleSentence || item.example) {
      const example = item.exampleSentence || item.example
      back += `<br><br><i>${this.sanitizeText(example)}</i>`
    }
    return back
  }

  private getAudioUrl(item: any): string | null {
    return item.audio || item.audioUrl || null
  }

  private getItemTags(item: any): string {
    if (Array.isArray(item.tags)) {
      return item.tags.join(" ")
    }
    return item.language || item.tags || ""
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

    // Graves table
    db.run(`
      CREATE TABLE graves (
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        oid INTEGER NOT NULL
      )
    `)
  }

  private insertCollectionData(db: any, baseTime: number, modelId: number, deckId: number, deckName: string): void {
    console.log("📚 Inserting collection data...")

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
        mod: baseTime,
      },
    }

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
        mod: baseTime,
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
        baseTime,
        baseTime,
        baseTime,
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

  private generateAnkiGuid(): string {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    let result = ""

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(10)
      crypto.getRandomValues(array)
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(array[i] % chars.length)
      }
    } else {
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
    }

    return result
  }

  private calculateChecksum(text: string): number {
    if (!text || text.length === 0) return 0

    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash + char) & 0xffffffff
    }

    return Math.abs(hash) % 2147483647
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string)
        } else {
          reject(new Error("Failed to convert blob to base64"))
        }
      }
      reader.onerror = () => reject(new Error("FileReader error"))
      reader.readAsDataURL(blob)
    })
  }
}
