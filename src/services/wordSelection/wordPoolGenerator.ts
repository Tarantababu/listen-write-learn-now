
import { DifficultyLevel } from '@/types/sentence-mining';

export class WordPoolGenerator {
  static generateWordPool(language: string, difficulty: DifficultyLevel): string[] {
    const pools = {
      german: {
        beginner: ['der', 'die', 'das', 'und', 'ich', 'bin', 'haben', 'sein', 'gehen', 'gut', 'neu', 'groß', 'klein', 'Zeit', 'Jahr', 'Tag', 'Haus', 'Mann', 'Frau', 'Kind'],
        intermediate: ['jedoch', 'während', 'dadurch', 'trotzdem', 'beispielsweise', 'möglich', 'wichtig', 'schwierig', 'einfach', 'bekannt', 'verschieden', 'besonders', 'natürlich', 'wahrscheinlich', 'eigentlich'],
        advanced: ['nichtsdestotrotz', 'diesbezüglich', 'hinsichtlich', 'entsprechend', 'ausschließlich', 'gegebenenfalls', 'möglicherweise', 'ausnahmsweise', 'selbstverständlich', 'unverzüglich']
      },
      english: {
        beginner: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'],
        intermediate: ['however', 'therefore', 'although', 'because', 'through', 'during', 'without', 'between', 'among', 'within', 'toward', 'upon', 'beneath', 'beyond', 'throughout'],
        advanced: ['nevertheless', 'consequently', 'furthermore', 'moreover', 'notwithstanding', 'inadvertently', 'substantiate', 'corroborate', 'exemplify', 'elucidate']
      },
      spanish: {
        beginner: ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al'],
        intermediate: ['aunque', 'mientras', 'durante', 'través', 'además', 'entonces', 'después', 'antes', 'siempre', 'nunca', 'todavía', 'también', 'solamente', 'especialmente'],
        advanced: ['consecuentemente', 'principalmente', 'generalmente', 'particularmente', 'específicamente', 'constantemente', 'frecuentemente', 'simultáneamente', 'excepcionalmente']
      },
      french: {
        beginner: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'],
        intermediate: ['cependant', 'néanmoins', 'toutefois', 'pourtant', 'alors', 'ensuite', 'puis', 'maintenant', 'toujours', 'jamais', 'souvent', 'parfois', 'quelquefois'],
        advanced: ['néanmoins', 'conséquemment', 'particulièrement', 'spécifiquement', 'généralement', 'habituellement', 'exceptionnellement', 'simultanément', 'consécutivement']
      }
    };

    return pools[language as keyof typeof pools]?.[difficulty] || pools.english[difficulty] || pools.english.beginner;
  }

  static getEmergencyWordPool(language: string): string[] {
    const emergency = {
      german: ['der', 'die', 'das', 'ich', 'und'],
      english: ['the', 'a', 'an', 'this', 'that'],
      spanish: ['el', 'la', 'un', 'una', 'y'],
      french: ['le', 'la', 'un', 'une', 'et']
    };
    
    return emergency[language as keyof typeof emergency] || emergency.english;
  }
}
