import JSZip from "jszip"
import initSqlJs from "sql.js"
import type { VocabularyItem } from "@/types"
import type { ExportFormat, ExportOptions, ExportResult } from "@/types/export"
import { BaseVocabularyExporter } from "./BaseVocabularyExporter"
import { EXPORT_FORMATS } from "@/types/export"

interface ProcessedCard {
  index: number
  front: string
  back: string
  example: string
  tags: string
  audioUrl: string | null
  hasSuccessfulAudio: boolean
  audioFilename: string | null
  audioData?: string
  mediaIndex?: number
}

interface ValidatedMediaFile {
  mediaIndex: number
  filename: string
  data: string
  cardIndex: number
}

export class ApkgExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find((f) => f.id === "apkg")!

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      console.log("🚀 Starting APKG export for", vocabulary.length, "items")

      // Step 1: Process all cards and download audio
      const processedCards = await this.processAllCards(vocabulary, options)

      // Step 2: Validate and prepare media files with proper indexing
      const validatedMediaFiles = await this.validateAndPrepareMediaFiles(processedCards)

      // Step 3: Update card references to match validated media
      const finalCards = this.updateCardMediaReferences(processedCards, validatedMediaFiles)

      // Step 4: Create ZIP with validated media files
      const zip = new JSZip()
      const mediaMap = await this.addValidatedMediaToZip(zip, validatedMediaFiles)

      // Step 5: Create database with validated media references
      const dbBuffer = await this.createDatabase(finalCards, options, validatedMediaFiles)
      zip.file("collection.anki2", dbBuffer)

      // Step 6: Final validation before export
      await this.performFinalValidation(zip, finalCards, validatedMediaFiles)

      // Step 7: Generate final APKG
      const blob = await zip.generateAsync({ type: "blob" })
      const filename = this.generateFilename(options.deckName, this.format.fileExtension)

      console.log("🎉 APKG export completed successfully!")
      console.log(`📊 Final stats: ${vocabulary.length} cards, ${validatedMediaFiles.length} validated audio files`)
      console.log("📋 Final media map:", mediaMap)

      return this.createSuccessResult(blob, filename)
    } catch (error) {
      console.error("❌ APKG export failed:", error)
      return this.createErrorResult("Failed to create APKG file: " + (error as Error).message)
    }
  }

  private async processAllCards(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ProcessedCard[]> {
    console.log("📋 Processing all cards...")

    const processedCards: ProcessedCard[] = []

    for (let i = 0; i < vocabulary.length; i++) {
      const item = vocabulary[i] as any

      // Extract data from your table structure
      const front = this.extractField(item, ["Front", "front", "word"]) || ""
      const back = this.extractField(item, ["Back", "back", "definition"]) || ""
      const example = this.extractField(item, ["Example", "example", "exampleSentence"]) || ""
      const language = this.extractField(item, ["Language", "language"]) || ""
      const tags = this.extractField(item, ["Tags", "tags"]) || language
      const audioUrl = this.extractField(item, ["Audio URL", "audioUrl", "audio"]) || null

      console.log(`Processing card ${i}: "${front}" - Audio: ${audioUrl ? "Yes" : "No"}`)

      let hasSuccessfulAudio = false
      let audioData: string | undefined = undefined

      // Download audio if available and audio is enabled
      if (audioUrl && options.includeAudio) {
        try {
          console.log(`⬇️ Downloading audio for card ${i}: ${audioUrl}`)
          const response = await fetch(audioUrl)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const blob = await response.blob()
          
          // Validate that we have actual audio data
          if (blob.size === 0) {
            throw new Error("Empty audio file")
          }

          audioData = await this.convertBlobToBase64(blob)
          
          // Validate base64 data
          if (!audioData || audioData.length === 0) {
            throw new Error("Failed to convert audio to base64")
          }

          hasSuccessfulAudio = true
          console.log(`✅ Successfully downloaded audio for card ${i} (${blob.size} bytes)`)
        } catch (error) {
          console.error(`❌ Failed to download audio for card ${i}:`, error)
          hasSuccessfulAudio = false
          audioData = undefined
        }
      }

      processedCards.push({
        index: i,
        front: this.sanitizeText(front),
        back: this.sanitizeText(back),
        example: this.sanitizeText(example),
        tags: this.processTags(tags),
        audioUrl,
        hasSuccessfulAudio,
        audioFilename: null, // Will be set later
        audioData,
      })
    }

    const audioCount = processedCards.filter((card) => card.hasSuccessfulAudio).length
    console.log(`📋 Processed ${processedCards.length} cards, ${audioCount} with successful audio`)

    return processedCards
  }

  private async validateAndPrepareMediaFiles(processedCards: ProcessedCard[]): Promise<ValidatedMediaFile[]> {
    console.log("🔍 Validating and preparing media files...")

    const validatedFiles: ValidatedMediaFile[] = []
    let mediaIndex = 0

    for (const card of processedCards) {
      if (card.hasSuccessfulAudio && card.audioData) {
        // Double-check that we have valid audio data
        try {
          // Validate base64 data format
          if (!card.audioData.match(/^[A-Za-z0-9+/]+=?$/)) {
            throw new Error("Invalid base64 format")
          }

          // Create validated media file entry
          const validatedFile: ValidatedMediaFile = {
            mediaIndex,
            filename: `${mediaIndex}.mp3`,
            data: card.audioData,
            cardIndex: card.index
          }

          validatedFiles.push(validatedFile)
          console.log(`✅ Validated audio file ${mediaIndex} for card ${card.index}`)
          mediaIndex++
        } catch (error) {
          console.error(`❌ Failed to validate audio for card ${card.index}:`, error)
          // Don't include this file in the validated list
        }
      }
    }

    console.log(`🔍 Validated ${validatedFiles.length} media files out of ${processedCards.filter(c => c.hasSuccessfulAudio).length} potential files`)
    return validatedFiles
  }

  private updateCardMediaReferences(processedCards: ProcessedCard[], validatedMediaFiles: ValidatedMediaFile[]): ProcessedCard[] {
    console.log("🔄 Updating card media references...")

    // Create a lookup map for validated media files by card index
    const mediaLookup = new Map<number, ValidatedMediaFile>()
    for (const mediaFile of validatedMediaFiles) {
      mediaLookup.set(mediaFile.cardIndex, mediaFile)
    }

    // Update card references
    for (const card of processedCards) {
      const validatedMedia = mediaLookup.get(card.index)
      if (validatedMedia) {
        card.mediaIndex = validatedMedia.mediaIndex
        card.audioFilename = validatedMedia.filename
        console.log(`🔄 Updated card ${card.index} → media ${validatedMedia.mediaIndex} (${validatedMedia.filename})`)
      } else {
        // Clear invalid references
        card.mediaIndex = undefined
        card.audioFilename = null
        card.hasSuccessfulAudio = false
        if (card.audioData) {
          console.log(`⚠️ Clearing invalid audio reference for card ${card.index}`)
        }
      }
    }

    return processedCards
  }

  private async addValidatedMediaToZip(zip: JSZip, validatedMediaFiles: ValidatedMediaFile[]): Promise<Record<string, string>> {
    console.log("📁 Adding validated media files to ZIP...")

    const mediaMap: Record<string, string> = {}

    for (const mediaFile of validatedMediaFiles) {
      try {
        // Add file to ZIP
        zip.file(mediaFile.filename, mediaFile.data, { base64: true })

        // Create media map entry: mediaIndex → filename
        mediaMap[mediaFile.mediaIndex.toString()] = mediaFile.filename

        console.log(`✅ Added to ZIP: ${mediaFile.filename} (card ${mediaFile.cardIndex} → media ${mediaFile.mediaIndex})`)
      } catch (error) {
        console.error(`❌ Error adding media file ${mediaFile.filename} to ZIP:`, error)
        throw new Error(`Failed to add media file ${mediaFile.filename} to archive`)
      }
    }

    // Create media mapping file
    const mediaMapJson = JSON.stringify(mediaMap)
    zip.file("media", mediaMapJson)
    console.log("📋 Media map created:", mediaMapJson)

    return mediaMap
  }

  private async createDatabase(
    processedCards: ProcessedCard[], 
    options: ExportOptions, 
    validatedMediaFiles: ValidatedMediaFile[]
  ): Promise<Uint8Array> {
    console.log("🗄️ Creating Anki database...")

    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    const db = new SQL.Database()

    try {
      this.setupTables(db)

      const timestamp = Math.floor(Date.now() / 1000)
      const deckId = 1
      const modelId = 1

      this.insertCollection(db, timestamp, deckId, modelId, options.deckName)
      this.insertCards(db, processedCards, timestamp, deckId, modelId, options, validatedMediaFiles)

      const buffer = db.export()
      console.log("✅ Database created successfully, size:", buffer.length, "bytes")
      return buffer
    } finally {
      db.close()
    }
  }

  private insertCards(
    db: any,
    processedCards: ProcessedCard[],
    timestamp: number,
    deckId: number,
    modelId: number,
    options: ExportOptions,
    validatedMediaFiles: ValidatedMediaFile[]
  ) {
    console.log("📝 Inserting notes and cards...")

    // Create lookup for validated media files
    const validatedMediaLookup = new Set(validatedMediaFiles.map(f => f.mediaIndex))

    for (let i = 0; i < processedCards.length; i++) {
      const card = processedCards[i]
      const noteId = 1000 + i
      const cardId = 2000 + i

      // Build back field with example
      let backContent = card.back
      if (card.example) {
        backContent += `<br><br><i>${card.example}</i>`
      }

      // Add audio reference ONLY if we have validated media
      if (
        options.includeAudio && 
        card.hasSuccessfulAudio && 
        card.audioFilename && 
        card.mediaIndex !== undefined &&
        validatedMediaLookup.has(card.mediaIndex)
      ) {
        backContent += `<br><br>[sound:${card.audioFilename}]`
        console.log(`🎵 Added validated audio reference for card ${i}: [sound:${card.audioFilename}] (media ${card.mediaIndex})`)
      }

      const fields = `${card.front}\x1f${backContent}`
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

      console.log(`✅ Created card ${i}: "${card.front}"`)
    }

    console.log("✅ All notes and cards inserted successfully")
  }

  private async performFinalValidation(
    zip: JSZip, 
    finalCards: ProcessedCard[], 
    validatedMediaFiles: ValidatedMediaFile[]
  ): Promise<void> {
    console.log("🔍 Performing final validation...")

    // Check that all media references in cards have corresponding files in ZIP
    const zipFiles = Object.keys(zip.files)
    const cardsWithAudio = finalCards.filter(card => 
      card.hasSuccessfulAudio && card.audioFilename && card.mediaIndex !== undefined
    )

    for (const card of cardsWithAudio) {
      if (card.audioFilename && !zipFiles.includes(card.audioFilename)) {
        throw new Error(`Missing media file in archive: ${card.audioFilename} for card ${card.index}`)
      }
    }

    // Check that all validated media files are in ZIP
    for (const mediaFile of validatedMediaFiles) {
      if (!zipFiles.includes(mediaFile.filename)) {
        throw new Error(`Missing validated media file in archive: ${mediaFile.filename}`)
      }
    }

    // Validate media map consistency
    const mediaMapFile = zip.files["media"]
    if (mediaMapFile) {
      const mediaMapContent = await mediaMapFile.async("string")
      const mediaMap = JSON.parse(mediaMapContent)
      
      for (const mediaFile of validatedMediaFiles) {
        const expectedFilename = mediaMap[mediaFile.mediaIndex.toString()]
        if (expectedFilename !== mediaFile.filename) {
          throw new Error(`Media map mismatch: index ${mediaFile.mediaIndex} maps to ${expectedFilename} but expected ${mediaFile.filename}`)
        }
      }
    }

    console.log("✅ Final validation passed - all media references are consistent")
  }

  private extractField(item: any, fieldNames: string[]): any {
    for (const fieldName of fieldNames) {
      if (item[fieldName] !== undefined && item[fieldName] !== null && item[fieldName] !== "") {
        return item[fieldName]
      }
    }
    return null
  }

  private processTags(tags: any): string {
    if (typeof tags === "string") {
      return tags.replace(/;/g, " ")
    }
    if (Array.isArray(tags)) {
      return tags.join(" ")
    }
    return String(tags || "")
  }

  private setupTables(db: any) {
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
