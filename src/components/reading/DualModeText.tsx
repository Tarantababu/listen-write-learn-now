
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Volume2 } from 'lucide-react'
import { ReadingModeText } from './ReadingModeText'
import { AudioSyncModeText } from './AudioSyncModeText'
import { Language } from '@/types'

interface DualModeTextProps {
  text: string
  highlightedWordIndex: number
  onWordClick?: (wordIndex: number, word: string) => void
  enableWordHighlighting?: boolean
  highlightColor?: string
  className?: string
  // Text selection props
  onCreateDictation: (selectedText: string) => void
  onCreateBidirectional: (selectedText: string) => void
  exerciseId?: string
  exerciseLanguage?: Language
  enableVocabulary?: boolean
  enhancedHighlighting?: boolean
  vocabularyIntegration?: boolean
  enableContextMenu?: boolean
}

type TextMode = 'reading' | 'audio-sync'

export const DualModeText: React.FC<DualModeTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = '',
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  enhancedHighlighting = false,
  vocabularyIntegration = false,
  enableContextMenu = true
}) => {
  const [mode, setMode] = useState<TextMode>('reading')

  console.log('DualModeText props:', {
    mode,
    highlightedWordIndex,
    enableWordHighlighting,
    textLength: text.length
  })

  const handleModeSwitch = (newMode: TextMode) => {
    setMode(newMode)
    console.log('Switching text mode to:', newMode)
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle Controls */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Text Mode:</span>
          <div className="flex items-center gap-1">
            <Button
              variant={mode === 'reading' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeSwitch('reading')}
              className="flex items-center gap-2 h-8"
            >
              <BookOpen className="h-3 w-3" />
              Reading
            </Button>
            <Button
              variant={mode === 'audio-sync' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeSwitch('audio-sync')}
              className="flex items-center gap-2 h-8"
            >
              <Volume2 className="h-3 w-3" />
              Audio Sync
            </Button>
          </div>
        </div>
        
        {/* Mode Description */}
        <div className="flex items-center gap-2">
          {mode === 'reading' ? (
            <Badge variant="secondary" className="text-xs">
              Optimized for text selection
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Word-by-word audio sync
            </Badge>
          )}
        </div>
      </div>

      {/* Mode-specific Text Component */}
      <div className={`transition-all duration-200 ${className}`}>
        {mode === 'reading' ? (
          <ReadingModeText
            text={text}
            onCreateDictation={onCreateDictation}
            onCreateBidirectional={onCreateBidirectional}
            exerciseId={exerciseId}
            exerciseLanguage={exerciseLanguage}
            enableVocabulary={enableVocabulary}
            enhancedHighlighting={enhancedHighlighting}
            vocabularyIntegration={vocabularyIntegration}
            enableContextMenu={enableContextMenu}
            className={className}
          />
        ) : (
          <AudioSyncModeText
            text={text}
            highlightedWordIndex={highlightedWordIndex}
            onWordClick={onWordClick}
            enableWordHighlighting={enableWordHighlighting}
            highlightColor={highlightColor}
            onCreateDictation={onCreateDictation}
            onCreateBidirectional={onCreateBidirectional}
            exerciseId={exerciseId}
            exerciseLanguage={exerciseLanguage}
            enableVocabulary={enableVocabulary}
            enhancedHighlighting={enhancedHighlighting}
            vocabularyIntegration={vocabularyIntegration}
            enableContextMenu={enableContextMenu}
            className={className}
          />
        )}
      </div>

      {/* Mode Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        {mode === 'reading' ? (
          <span>💡 <strong>Reading Mode:</strong> Perfect for selecting text. Words flow naturally for easy highlighting and selection.</span>
        ) : (
          <span>💡 <strong>Audio Sync Mode:</strong> Individual words are highlighted as audio plays. Great for pronunciation practice.</span>
        )}
      </div>
    </div>
  )
}
