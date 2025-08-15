
export class WordMeaningService {
  static getWordMeaning(language: string, word: string): string {
    const meanings: Record<string, Record<string, string>> = {
      german: {
        'der': 'the (masculine)',
        'die': 'the (feminine)',
        'das': 'the (neuter)',
        'ich': 'I',
        'und': 'and'
      },
      english: {
        'the': 'definite article',
        'a': 'indefinite article',
        'an': 'indefinite article',
        'this': 'demonstrative pronoun',
        'that': 'demonstrative pronoun'
      }
    };

    return meanings[language]?.[word.toLowerCase()] || word;
  }
}
