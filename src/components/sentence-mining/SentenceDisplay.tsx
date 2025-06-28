import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

interface SentenceDisplayProps {
  exercise: SentenceMiningExercise;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  userResponse?: string;
  onResponseChange?: (response: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  exercise,
  onPlayAudio,
  audioLoading = false,
  userResponse = '',
  onResponseChange,
  showResult = false,
  isCorrect = false,
}) => {
  const { settings } = useUserSettingsContext();

  const renderSentenceWithBlank = (sentence: string, targetWord: string) => {
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        const englishTranslation = getEnglishMeaning(targetWord, settings.selectedLanguage);
        result.push(
          <div key={index} className="inline-block relative mx-1 my-2">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange?.(e.target.value)}
              disabled={showResult}
              className={`inline-block w-32 md:w-40 text-center border-b-2 border-dashed border-primary bg-transparent text-base ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'focus:ring-2 focus:ring-primary/20'
              }`}
              placeholder="___"
            />
            {/* Always show hint, positioned below the input */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded-lg shadow-md z-50 whitespace-nowrap">
              <div className="text-center font-medium text-blue-800 dark:text-blue-200">
                {englishTranslation || 'translation not available'}
              </div>
              {/* Arrow pointing up */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-100 dark:bg-blue-900/30 border-l border-t border-blue-300 dark:border-blue-600 rotate-45"></div>
            </div>
          </div>
        );
      }
    });
    
    return result;
  };

  const getEnglishMeaning = (word: string, language: string) => {
    // Enhanced word meanings with more comprehensive coverage
    const meanings: Record<string, Record<string, string>> = {
      'spanish': {
        'mundo': 'world',
        'el': 'the',
        'perro': 'dog',
        'gato': 'cat',
        'casa': 'house',
        'agua': 'water',
        'tiempo': 'time',
        'persona': 'person',
        'año': 'year',
        'vez': 'time/occasion',
        'día': 'day',
        'hombre': 'man',
        'cosa': 'thing',
        'vida': 'life',
        'tanto': 'so much',
        'este': 'this',
        'ese': 'that',
        'todo': 'all/everything',
        'otro': 'other/another',
        'mismo': 'same',
        'gran': 'great/big',
        'nuevo': 'new',
        'primero': 'first',
        'último': 'last',
        'bueno': 'good',
        'mejor': 'better',
        'mayor': 'older/bigger',
        'español': 'Spanish',
        'estar': 'to be',
        'ser': 'to be',
        'tener': 'to have',
        'hacer': 'to do/make',
        'poder': 'to be able',
        'ir': 'to go',
        'ver': 'to see',
        'dar': 'to give',
        'saber': 'to know',
        'querer': 'to want',
        'llegar': 'to arrive',
        'pasar': 'to pass',
        'deber': 'to must/owe',
        'poner': 'to put',
        'parecer': 'to seem',
        'quedar': 'to stay',
        'creer': 'to believe',
        'hablar': 'to speak',
        'llevar': 'to carry',
        'dejar': 'to leave',
        'seguir': 'to follow',
        'encontrar': 'to find',
        'llamar': 'to call',
        'venir': 'to come',
        'pensar': 'to think',
        'salir': 'to go out',
        'volver': 'to return',
        'tomar': 'to take',
        'conocer': 'to know',
        'vivir': 'to live',
        'sentir': 'to feel',
        'tratar': 'to try',
        'mirar': 'to look',
        'contar': 'to count/tell',
        'empezar': 'to begin',
        'esperar': 'to wait/hope',
        'buscar': 'to search',
        'existir': 'to exist',
        'entrar': 'to enter',
        'trabajar': 'to work',
        'escribir': 'to write',
        'perder': 'to lose',
        'producir': 'to produce',
        'ocurrir': 'to happen',
        'entender': 'to understand',
        'pedir': 'to ask for',
        'recibir': 'to receive',
        'recordar': 'to remember',
        'terminar': 'to finish',
        'permitir': 'to allow',
        'aparecer': 'to appear',
        'conseguir': 'to get',
        'comenzar': 'to begin',
        'servir': 'to serve',
        'sacar': 'to take out',
        'necesitar': 'to need',
        'mantener': 'to maintain',
        'resultar': 'to result',
        'leer': 'to read',
        'caer': 'to fall',
        'cambiar': 'to change',
        'presentar': 'to present',
        'crear': 'to create',
        'abrir': 'to open',
        'considerar': 'to consider',
        'oír': 'to hear',
        'acabar': 'to finish',
        'convertir': 'to convert',
        'ganar': 'to win/earn',
        'traer': 'to bring',
        'realizar': 'to realize',
        'cerrar': 'to close',
        'morir': 'to die',
        'ofrecer': 'to offer',
        'descubrir': 'to discover',
        'levantar': 'to lift',
        'acercar': 'to approach'
      },
      'german': {
        'der': 'the',
        'die': 'the',
        'das': 'the',
        'und': 'and',
        'ich': 'I',
        'du': 'you',
        'er': 'he',  
        'sie': 'she/they',
        'es': 'it',
        'wir': 'we',
        'ihr': 'you (plural)',
        'partei': 'party',
        'organisation': 'organization',
        'gruppe': 'group',
        'regierung': 'government',
        'verwaltung': 'administration',
        'behörde': 'authority',
        'abteilung': 'department',
        'firma': 'company',
        'unternehmen': 'company/enterprise',
        'gesellschaft': 'society/company',
        'darauf': 'on it/thereupon',
        'damit': 'with it/so that',
        'dafür': 'for it/instead',
        'davon': 'of it/from it',
        'dabei': 'in doing so/at the same time',
        'danach': 'after that/afterwards',
        'daran': 'on it/at it',
        'darum': 'therefore/around it',
        'dadurch': 'through it/thereby',
        'dagegen': 'against it/however',
        'dahin': 'there/to that place',
        'davor': 'before it/in front of it',
        'dazu': 'to it/in addition',
        'sein': 'to be',
        'haben': 'to have',
        'werden': 'to become',
        'können': 'can/to be able',
        'müssen': 'must/to have to',
        'sagen': 'to say',
        'machen': 'to make/do',
        'geben': 'to give',
        'kommen': 'to come',
        'sollen': 'should/to be supposed to',
        'wollen': 'to want',
        'gehen': 'to go',
        'wissen': 'to know',
        'sehen': 'to see',
        'lassen': 'to let',
        'stehen': 'to stand',
        'finden': 'to find',
        'bleiben': 'to stay',
        'liegen': 'to lie',
        'heißen': 'to be called',
        'denken': 'to think',
        'nehmen': 'to take',
        'tun': 'to do',
        'dürfen': 'may/to be allowed',
        'glauben': 'to believe',
        'halten': 'to hold',
        'nennen': 'to name',
        'mögen': 'to like',
        'zeigen': 'to show',
        'führen': 'to lead',
        'sprechen': 'to speak',
        'bringen': 'to bring',
        'leben': 'to live',
        'fahren': 'to drive',
        'meinen': 'to mean',
        'fragen': 'to ask',
        'kennen': 'to know',
        'gelten': 'to be valid',
        'stellen': 'to put',
        'spielen': 'to play',
        'arbeiten': 'to work',
        'brauchen': 'to need',
        'folgen': 'to follow',
        'lernen': 'to learn',
        'bestehen': 'to exist',
        'verstehen': 'to understand',
        'setzen': 'to set',
        'bekommen': 'to get',
        'beginnen': 'to begin',
        'erzählen': 'to tell',
        'versuchen': 'to try',
        'schreiben': 'to write',
        'laufen': 'to run',
        'erklären': 'to explain',
        'entsprechen': 'to correspond',
        'sitzen': 'to sit',
        'ziehen': 'to pull',
        'scheinen': 'to seem',
        'fallen': 'to fall',
        'gehören': 'to belong',
        'entstehen': 'to arise',
        'erhalten': 'to receive',
        'treffen': 'to meet',
        'suchen': 'to search',
        'legen': 'to lay',
        'vorstellen': 'to introduce',
        'handeln': 'to act',
        'erreichen': 'to reach',
        'tragen': 'to carry',
        'schaffen': 'to create',
        'lesen': 'to read',
        'verlieren': 'to lose',
        'darstellen': 'to represent',
        'erkennen': 'to recognize',
        'entwickeln': 'to develop',
        'reden': 'to talk',
        'aussehen': 'to look like',
        'erscheinen': 'to appear',
        'bilden': 'to form',
        'anfangen': 'to start',
        'erwarten': 'to expect',
        'wohnen': 'to live',
        'betreffen': 'to concern',
        'warten': 'to wait',
        'vergessen': 'to forget',
        'hören': 'to hear',
        'aufhören': 'to stop',
        'funktionieren': 'to function',
        'erfinden': 'to invent',
        'Haus': 'house',
        'Mann': 'man',
        'Frau': 'woman',
        'Kind': 'child',
        'Jahr': 'year',
        'Tag': 'day',
        'Zeit': 'time',
        'Welt': 'world',
        'Leben': 'life',
        'Hand': 'hand',
        'Auge': 'eye',
        'Mensch': 'human',
        'Arbeit': 'work',
        'Teil': 'part',
        'Land': 'country',
        'Stelle': 'place',
        'Fall': 'case',
        'Recht': 'right',
        'Problem': 'problem',
        'Frage': 'question',
        'Grund': 'reason',
        'Ende': 'end',
        'Anfang': 'beginning',
        'Weg': 'way',
        'Raum': 'room/space',
        'Wasser': 'water',
        'Stadt': 'city',
        'Auto': 'car',
        'Buch': 'book',
        'Geld': 'money',
        'Hilfe': 'help',
        'Politik': 'politics',
        'Idee': 'idea',
        'Stunden': 'hours',
        'groß': 'big',
        'klein': 'small',
        'gut': 'good',
        'schlecht': 'bad',
        'neu': 'new',
        'alt': 'old',
        'lang': 'long',
        'kurz': 'short',
        'hoch': 'high',
        'niedrig': 'low',
        'schnell': 'fast',
        'langsam': 'slow',
        'stark': 'strong',
        'schwach': 'weak',
        'hell': 'bright',
        'dunkel': 'dark',
        'warm': 'warm',
        'kalt': 'cold',
        'jung': 'young',
        'wichtig': 'important',
        'möglich': 'possible',
        'richtig': 'correct',
        'falsch': 'wrong',
        'schwer': 'heavy/difficult',
        'leicht': 'light/easy',
        'frei': 'free',
        'voll': 'full',
        'leer': 'empty',
        'sicher': 'safe',
        'gefährlich': 'dangerous',
        'schön': 'beautiful',
        'hässlich': 'ugly',
        'interessant': 'interesting',
        'langweilig': 'boring',
        'freundlich': 'friendly',
        'unfreundlich': 'unfriendly',
        'beleuchtet': 'lit/illuminated',
        'dieser': 'this',
        'jener': 'that',
        'alle': 'all',
        'viele': 'many',
        'wenige': 'few',
        'andere': 'other',
        'einige': 'some',
        'mehrere': 'several',
        'verschiedene': 'different',
        'gleiche': 'same'
      },
      'french': {
        'le': 'the',
        'de': 'of',
        'et': 'and',
        'être': 'to be',
        'avoir': 'to have',
        'faire': 'to do/make',
        'dire': 'to say',
        'aller': 'to go',
        'voir': 'to see',
        'savoir': 'to know',
        'prendre': 'to take',
        'venir': 'to come',
        'pouvoir': 'can/to be able',
        'vouloir': 'to want',
        'donner': 'to give',
        'falloir': 'to be necessary',
        'devoir': 'must/to have to',
        'croire': 'to believe',
        'trouver': 'to find',
        'laisser': 'to leave',
        'porter': 'to carry',
        'parler': 'to speak',
        'montrer': 'to show',
        'demander': 'to ask',
        'passer': 'to pass',
        'suivre': 'to follow',
        'comprendre': 'to understand',
        'compter': 'to count',
        'entendre': 'to hear',
        'rendre': 'to give back',
        'tenir': 'to hold',
        'mener': 'to lead',
        'écrire': 'to write',
        'connaître': 'to know',
        'paraître': 'to appear',
        'aimer': 'to love',
        'appeler': 'to call',
        'apprendre': 'to learn',
        'regarder': 'to look',
        'sortir': 'to go out',
        'mettre': 'to put',
        'arriver': 'to arrive',
        'sentir': 'to feel',
        'partir': 'to leave',
        'vivre': 'to live',
        'finir': 'to finish',
        'servir': 'to serve',
        'mourir': 'to die',
        'ouvrir': 'to open',
        'perdre': 'to lose',
        'recevoir': 'to receive',
        'revenir': 'to come back',
        'lire': 'to read',
        'attendre': 'to wait',
        'jouer': 'to play',
        'acheter': 'to buy',
        'essayer': 'to try',
        'commencer': 'to begin',
        'continuer': 'to continue',
        'chercher': 'to search',
        'rappeler': 'to remind',
        'amener': 'to bring',
        'répondre': 'to answer',
        'présenter': 'to present',
        'accepter': 'to accept',
        'gagner': 'to win',
        'changer': 'to change',
        'expliquer': 'to explain',
        'décider': 'to decide',
        'retourner': 'to return',
        'tomber': 'to fall',
        'rester': 'to stay',
        'entrer': 'to enter',
        'marcher': 'to walk',
        'aider': 'to help',
        'maison': 'house',
        'homme': 'man',
        'femme': 'woman',
        'enfant': 'child',
        'année': 'year',
        'jour': 'day',
        'temps': 'time',
        'monde': 'world',
        'vie': 'life',
        'main': 'hand',
        'œil': 'eye',
        'personne': 'person',
        'travail': 'work',
        'partie': 'part',
        'pays': 'country',
        'place': 'place',
        'cas': 'case',
        'droit': 'right',
        'problème': 'problem',
        'question': 'question',
        'raison': 'reason',
        'fin': 'end',
        'début': 'beginning',
        'chemin': 'way',
        'chambre': 'room',
        'eau': 'water',
        'ville': 'city',
        'voiture': 'car',
        'livre': 'book',
        'argent': 'money',
        'aide': 'help',
        'politique': 'politics',
        'idée': 'idea',
        'heures': 'hours',
        'grand': 'big',
        'petit': 'small',
        'bon': 'good',
        'mauvais': 'bad',
        'nouveau': 'new',
        'vieux': 'old',
        'long': 'long',
        'court': 'short',
        'haut': 'high',
        'bas': 'low',
        'rapide': 'fast',
        'lent': 'slow',
        'fort': 'strong',
        'faible': 'weak',
        'clair': 'bright',
        'sombre': 'dark',
        'chaud': 'warm',
        'froid': 'cold',
        'jeune': 'young',
        'important': 'important',
        'possible': 'possible',
        'vrai': 'true',
        'faux': 'false',
        'difficile': 'difficult',
        'facile': 'easy',
        'libre': 'free',
        'plein': 'full',
        'vide': 'empty',
        'sûr': 'safe',
        'dangereux': 'dangerous',
        'beau': 'beautiful',
        'laid': 'ugly',
        'intéressant': 'interesting',
        'ennuyeux': 'boring',
        'gentil': 'kind',
        'méchant': 'mean',
        'ce': 'this',
        'celui': 'that one',
        'tout': 'all',
        'beaucoup': 'many',
        'peu': 'few',
        'autre': 'other',
        'quelques': 'some',
        'plusieurs': 'several',
        'différent': 'different',
        'même': 'same'
      }
    };
    
    const languageMeanings = meanings[language.toLowerCase()] || {};
    return languageMeanings[word.toLowerCase()] || null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Complete the Sentence</CardTitle>
          <div className="flex items-center gap-2 justify-start md:justify-end">
            <Badge variant="outline" className="capitalize">
              {exercise.difficulty}
            </Badge>
            {onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayAudio}
                disabled={audioLoading}
                className="flex items-center gap-1 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Volume2 className="h-4 w-4" />
                {audioLoading ? 'Loading...' : 'Listen'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
            </p>
          </div>
          
          {exercise.context && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Context:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.context}
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Fill in the blank with the missing word. The hint shows the English translation.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
