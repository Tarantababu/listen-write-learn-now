
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive word frequency lists for all 10 supported languages
const WORD_FREQUENCIES = {
  english: {
    beginner: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'],
    intermediate: ['important', 'understand', 'example', 'between', 'different', 'experience', 'development', 'company', 'government', 'system', 'program', 'question', 'service', 'management', 'available', 'technology', 'economy', 'community', 'university', 'education', 'research', 'business', 'organization', 'individual', 'relationship', 'environment', 'communication', 'opportunity', 'responsibility', 'particularly', 'necessary', 'information', 'situation', 'material', 'financial', 'commercial', 'industrial', 'professional', 'international', 'traditional', 'significant', 'successful', 'political', 'economic', 'social', 'cultural', 'natural', 'personal', 'national', 'regional'],
    advanced: ['phenomenon', 'contemporary', 'fundamental', 'comprehensive', 'sophisticated', 'substantial', 'intellectual', 'philosophical', 'psychological', 'technological', 'theoretical', 'methodological', 'systematically', 'consequently', 'nevertheless', 'furthermore', 'predominantly', 'simultaneously', 'approximately', 'specifically', 'particularly', 'significantly', 'essentially', 'potentially', 'ultimately', 'primarily', 'subsequently', 'accordingly', 'alternatively', 'exclusively', 'extensively', 'respectively', 'presumably', 'supposedly', 'apparently', 'definitely', 'absolutely', 'relatively', 'effectively', 'efficiently', 'genuinely', 'literally', 'virtually', 'actually', 'basically', 'typically', 'generally', 'normally', 'usually', 'certainly']
  },
  spanish: {
    beginner: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'ha', 'me', 'si', 'sin', 'sobre', 'este', 'ya', 'entre', 'cuando', 'todo', 'esta', 'ser', 'muy', 'años', 'hasta', 'desde', 'está', 'mi', 'porque', 'qué', 'sólo', 'han', 'yo', 'hay', 'vez', 'puede', 'todos', 'así', 'nos', 'ni', 'parte', 'tiene', 'él', 'uno', 'donde', 'bien', 'tiempo', 'mismo', 'ese', 'ahora', 'cada', 'vida', 'otro', 'después', 'otros', 'aunque', 'esa', 'eso', 'hace', 'otra', 'gobierno', 'tan', 'durante', 'siempre', 'día', 'tanto', 'ella', 'tres', 'sí', 'dijo', 'sido', 'gran', 'país', 'según', 'menos', 'mundo', 'año', 'antes', 'estado', 'quiero', 'mientras', 'manera', 'lugar', 'caso', 'ellos', 'derecho', 'entonces', 'primera'],
    intermediate: ['importante', 'ejemplo', 'diferentes', 'experiencia', 'desarrollo', 'empresa', 'gobierno', 'sistema', 'programa', 'pregunta', 'servicio', 'administración', 'disponible', 'tecnología', 'economía', 'comunidad', 'universidad', 'educación', 'investigación', 'negocio', 'organización', 'individual', 'relación', 'ambiente', 'comunicación', 'oportunidad', 'responsabilidad', 'particularmente', 'necesario', 'información', 'situación', 'material', 'financiero', 'comercial', 'industrial', 'profesional', 'internacional', 'tradicional', 'significativo', 'exitoso', 'político', 'económico', 'social', 'cultural', 'natural', 'personal', 'nacional', 'regional'],
    advanced: ['fenómeno', 'contemporáneo', 'fundamental', 'comprensivo', 'sofisticado', 'sustancial', 'intelectual', 'filosófico', 'psicológico', 'tecnológico', 'teórico', 'metodológico', 'sistemáticamente', 'consecuentemente', 'sin embargo', 'además', 'predominantemente', 'simultáneamente', 'aproximadamente', 'específicamente', 'particularmente', 'significativamente', 'esencialmente', 'potencialmente', 'finalmente', 'principalmente', 'posteriormente', 'en consecuencia', 'alternativamente', 'exclusivamente', 'extensivamente', 'respectivamente', 'presumiblemente', 'supuestamente', 'aparentemente', 'definitivamente', 'absolutamente', 'relativamente', 'efectivamente', 'eficientemente', 'genuinamente', 'literalmente', 'virtualmente', 'realmente', 'básicamente', 'típicamente', 'generalmente', 'normalmente', 'usualmente', 'ciertamente']
  },
  german: {
    beginner: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur', 'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'seit', 'gegen', 'vom', 'kann', 'schon', 'wenn', 'habe', 'seine', 'Mark', 'ihre', 'dann', 'unter', 'wir', 'soll', 'ich', 'eines', 'Jahr', 'zwei', 'Jahren', 'diese', 'dieser', 'wieder', 'keine', 'Uhr', 'seiner', 'worden', 'und', 'ihr', 'ihm', 'sehr', 'ohne', 'Zeit', 'sagt', 'hier', 'alle', 'beim', 'muss', 'waren', 'will', 'zwischen', 'Leben', 'Land', 'gut', 'Tag', 'drei', 'neue', 'Prozent', 'Mann', 'Frau', 'hätte', 'alten', 'Stadt', 'Welt', 'steht', 'heute', 'Deutschland', 'Haus', 'nichts', 'Geld', 'Menschen', 'macht', 'ersten', 'Teil', 'zunächst', 'Regierung', 'Wasser', 'damit', 'allem', 'Staat', 'anderen', 'Unternehmen', 'Weg', 'Arbeit', 'Platz', 'Gruppe', 'Rolle', 'dürfen', 'Leute', 'Ende', 'dazu', 'Europa', 'große', 'ganze', 'gehen', 'gleich', 'Kinder', 'trotz', 'Hand', 'Seite', 'Wochen', 'während', 'Fall', 'zehn', 'Eltern', 'Kopf', 'Stunden', 'aufgrund', 'weniger', 'Buch', 'amerikanische', 'Beispiel', 'Frage', 'Politik', 'Meter', 'Familie', 'besonders', 'sowie', 'geben', 'Millionen', 'Gesellschaft', 'Woche', 'Art', 'Markt', 'Entwicklung', 'Raum', 'Bereich', 'Wert', 'Rede', 'früh', 'Herr', 'Minuten', 'Tage', 'Name', 'nehmen', 'Wirtschaft', 'Erfolg', 'Zukunft', 'Europa', 'Film', 'zeigen', 'Zusammenhang', 'Stelle', 'einfach', 'Hilfe', 'Grund', 'Interesse', 'Nummer', 'Mutter', 'Vater', 'Augen', 'Situation', 'System', 'gewesen', 'Problem', 'Polizei', 'Thema', 'Projekt', 'sollte', 'Anfang', 'Monate', 'Mitarbeiter', 'Punkt', 'stehen', 'Partei', 'Mehrheit', 'Bild', 'richtig', 'Worten', 'Woche', 'finden', 'Angaben', 'sogar', 'Firmen', 'Spieler', 'Meinung', 'Zahl', 'daher', 'darauf', 'Straße', 'Minute', 'führen', 'Gericht', 'eigentlich', 'Mal', 'Idee', 'Gespräch', 'Weise', 'Grund', 'eigenen', 'Kampf', 'Krieg', 'Ereignis', 'Schule', 'Bürger', 'Folge', 'Woche'],
    intermediate: ['wichtig', 'verstehen', 'Beispiel', 'zwischen', 'verschieden', 'Erfahrung', 'Entwicklung', 'Unternehmen', 'Regierung', 'System', 'Programm', 'Frage', 'Service', 'Management', 'verfügbar', 'Technologie', 'Wirtschaft', 'Gemeinschaft', 'Universität', 'Bildung', 'Forschung', 'Geschäft', 'Organisation', 'individuell', 'Beziehung', 'Umwelt', 'Kommunikation', 'Gelegenheit', 'Verantwortung', 'besonders', 'notwendig', 'Information', 'Situation', 'Material', 'finanziell', 'kommerziell', 'industriell', 'professionell', 'international', 'traditionell', 'bedeutend', 'erfolgreich', 'politisch', 'wirtschaftlich', 'sozial', 'kulturell', 'natürlich', 'persönlich', 'national', 'regional'],
    advanced: ['Phänomen', 'zeitgenössisch', 'fundamental', 'umfassend', 'sophisticated', 'wesentlich', 'intellektuell', 'philosophisch', 'psychologisch', 'technologisch', 'theoretisch', 'methodologisch', 'systematisch', 'folglich', 'dennoch', 'außerdem', 'vorwiegend', 'gleichzeitig', 'ungefähr', 'spezifisch', 'besonders', 'bedeutend', 'wesentlich', 'potentiell', 'letztendlich', 'hauptsächlich', 'anschließend', 'dementsprechend', 'alternativ', 'ausschließlich', 'umfangreich', 'beziehungsweise', 'vermutlich', 'angeblich', 'offensichtlich', 'definitiv', 'absolut', 'relativ', 'effektiv', 'effizient', 'aufrichtig', 'buchstäblich', 'praktisch', 'tatsächlich', 'grundsätzlich', 'typisch', 'allgemein', 'normalerweise', 'gewöhnlich', 'sicherlich']
  },
  french: {
    beginner: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'comme', 'mais', 'faire', 'son', 'mettre', 'nom', 'laisser', 'bien', 'savoir', 'falloir', 'voir', 'en', 'avoir', 'temps', 'petit', 'que', 'être', 'sous', 'venir', 'devoir', 'alors', 'sans', 'très', 'là', 'vouloir', 'dire', 'moi', 'aller', 'lui', 'faire', 'vous', 'du', 'bien', 'être', 'savoir', 'autre', 'après', 'nommer', 'tout', 'donner', 'rien', 'être', 'chose', 'vouloir', 'nous', 'grand', 'prendre', 'mot', 'où', 'même', 'qui', 'homme', 'jour', 'tête', 'avoir', 'si', 'pied', 'rester', 'faire', 'parler', 'juste', 'avant', 'enfant', 'laisser', 'suivre', 'croire', 'demander', 'beau', 'droit', 'rendre', 'ici', 'cela', 'eau', 'temps', 'année', 'main', 'maintenant', 'nouveau', 'an', 'travail', 'toujours', 'mot', 'où', 'même', 'qui', 'homme', 'jour', 'tête', 'avoir', 'si', 'pied', 'rester', 'faire', 'parler', 'juste', 'avant', 'enfant', 'laisser', 'suivre', 'croire', 'demander', 'beau', 'droit', 'rendre', 'ici', 'cela', 'eau', 'temps', 'année', 'main', 'maintenant', 'nouveau', 'an', 'travail', 'toujours'],
    intermediate: ['important', 'comprendre', 'exemple', 'entre', 'différent', 'expérience', 'développement', 'entreprise', 'gouvernement', 'système', 'programme', 'question', 'service', 'gestion', 'disponible', 'technologie', 'économie', 'communauté', 'université', 'éducation', 'recherche', 'affaires', 'organisation', 'individuel', 'relation', 'environnement', 'communication', 'opportunité', 'responsabilité', 'particulièrement', 'nécessaire', 'information', 'situation', 'matériel', 'financier', 'commercial', 'industriel', 'professionnel', 'international', 'traditionnel', 'significatif', 'réussi', 'politique', 'économique', 'social', 'culturel', 'naturel', 'personnel', 'national', 'régional'],
    advanced: ['phénomène', 'contemporain', 'fundamental', 'compréhensif', 'sophistiqué', 'substantiel', 'intellectuel', 'philosophique', 'psychologique', 'technologique', 'théorique', 'méthodologique', 'systématiquement', 'conséquemment', 'néanmoins', 'en outre', 'principalement', 'simultanément', 'approximativement', 'spécifiquement', 'particulièrement', 'significativement', 'essentiellement', 'potentiellement', 'ultimement', 'principalement', 'subséquemment', 'en conséquence', 'alternativement', 'exclusivement', 'extensivement', 'respectivement', 'probablement', 'supposément', 'apparemment', 'définitivement', 'absolument', 'relativement', 'efficacement', 'efficacement', 'véritablement', 'littéralement', 'virtuellement', 'réellement', 'fondamentalement', 'typiquement', 'généralement', 'normalement', 'habituellement', 'certainement']
  },
  italian: {
    beginner: ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'essere', 'avere', 'fare', 'dire', 'andare', 'sapere', 'vedere', 'dare', 'stare', 'venire', 'dovere', 'potere', 'volere', 'grande', 'nuovo', 'primo', 'ultimo', 'buono', 'stesso', 'molto', 'tutto', 'altro', 'questo', 'quello', 'bello', 'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'che', 'chi', 'come', 'dove', 'quando', 'perché', 'cosa', 'quale', 'quanto', 'e', 'o', 'ma', 'però', 'se', 'anche', 'già', 'ancora', 'sempre', 'mai', 'più', 'meno', 'molto', 'poco', 'tanto', 'troppo', 'bene', 'male', 'meglio', 'peggio', 'prima', 'dopo', 'oggi', 'ieri', 'domani', 'qui', 'qua', 'là', 'lì', 'sopra', 'sotto', 'dentro', 'fuori', 'davanti', 'dietro', 'casa', 'scuola', 'lavoro', 'tempo', 'anno', 'giorno', 'ora', 'minuto', 'uomo', 'donna', 'bambino', 'bambina', 'vita', 'mondo', 'paese', 'città', 'strada', 'macchina', 'treno', 'aereo', 'libro', 'giornale', 'telefono', 'computer', 'televisione', 'musica', 'film', 'gioco', 'sport', 'cibo', 'acqua', 'vino', 'caffè', 'pane', 'carne', 'pesce', 'verdura', 'frutta', 'dolce', 'colore', 'bianco', 'nero', 'rosso', 'verde', 'blu', 'giallo', 'numero', 'zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'],
    intermediate: ['importante', 'capire', 'esempio', 'tra', 'diverso', 'esperienza', 'sviluppo', 'azienda', 'governo', 'sistema', 'programma', 'domanda', 'servizio', 'gestione', 'disponibile', 'tecnologia', 'economia', 'comunità', 'università', 'educazione', 'ricerca', 'business', 'organizzazione', 'individuale', 'relazione', 'ambiente', 'comunicazione', 'opportunità', 'responsabilità', 'particolarmente', 'necessario', 'informazione', 'situazione', 'materiale', 'finanziario', 'commerciale', 'industriale', 'professionale', 'internazionale', 'tradizionale', 'significativo', 'riuscito', 'politico', 'economico', 'sociale', 'culturale', 'naturale', 'personale', 'nazionale', 'regionale'],
    advanced: ['fenomeno', 'contemporaneo', 'fondamentale', 'comprensivo', 'sofisticato', 'sostanziale', 'intellettuale', 'filosofico', 'psicologico', 'tecnologico', 'teorico', 'metodologico', 'sistematicamente', 'conseguentemente', 'tuttavia', 'inoltre', 'prevalentemente', 'simultaneamente', 'approssimativamente', 'specificamente', 'particolarmente', 'significativamente', 'essenzialmente', 'potenzialmente', 'ultimamente', 'principalmente', 'successivamente', 'di conseguenza', 'alternativamente', 'esclusivamente', 'estensivamente', 'rispettivamente', 'presumibilmente', 'presumibilmente', 'apparentemente', 'definitivamente', 'assolutamente', 'relativamente', 'efficacemente', 'efficientemente', 'genuinamente', 'letteralmente', 'virtualmente', 'effettivamente', 'fondamentalmente', 'tipicamente', 'generalmente', 'normalmente', 'solitamente', 'certamente']
  },
  portuguese: {
    beginner: ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'vir', 'dar', 'ver', 'saber', 'poder', 'querer', 'dizer', 'falar', 'ficar', 'muito', 'todo', 'outro', 'grande', 'novo', 'primeiro', 'último', 'bom', 'mesmo', 'bem', 'ainda', 'mais', 'também', 'só', 'já', 'aqui', 'ali', 'onde', 'quando', 'como', 'porque', 'que', 'qual', 'quem', 'quanto', 'e', 'ou', 'mas', 'se', 'não', 'sim', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'meu', 'teu', 'seu', 'nosso', 'vosso', 'este', 'esse', 'aquele', 'casa', 'escola', 'trabalho', 'tempo', 'ano', 'dia', 'hora', 'minuto', 'homem', 'mulher', 'criança', 'vida', 'mundo', 'país', 'cidade', 'rua', 'carro', 'trem', 'avião', 'livro', 'jornal', 'telefone', 'computador', 'televisão', 'música', 'filme', 'jogo', 'esporte', 'comida', 'água', 'vinho', 'café', 'pão', 'carne', 'peixe', 'verdura', 'fruta', 'doce', 'cor', 'branco', 'preto', 'vermelho', 'verde', 'azul', 'amarelo', 'número', 'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'],
    intermediate: ['importante', 'entender', 'exemplo', 'entre', 'diferente', 'experiência', 'desenvolvimento', 'empresa', 'governo', 'sistema', 'programa', 'pergunta', 'serviço', 'gestão', 'disponível', 'tecnologia', 'economia', 'comunidade', 'universidade', 'educação', 'pesquisa', 'negócio', 'organização', 'individual', 'relação', 'ambiente', 'comunicação', 'oportunidade', 'responsabilidade', 'particularmente', 'necessário', 'informação', 'situação', 'material', 'financeiro', 'comercial', 'industrial', 'profissional', 'internacional', 'tradicional', 'significativo', 'bem-sucedido', 'político', 'econômico', 'social', 'cultural', 'natural', 'pessoal', 'nacional', 'regional'],
    advanced: ['fenômeno', 'contemporâneo', 'fundamental', 'abrangente', 'sofisticado', 'substancial', 'intelectual', 'filosófico', 'psicológico', 'tecnológico', 'teórico', 'metodológico', 'sistematicamente', 'consequentemente', 'no entanto', 'além disso', 'predominantemente', 'simultaneamente', 'aproximadamente', 'especificamente', 'particularmente', 'significativamente', 'essencialmente', 'potencialmente', 'finalmente', 'principalmente', 'subsequentemente', 'consequentemente', 'alternativamente', 'exclusivamente', 'extensivamente', 'respectivamente', 'presumivelmente', 'supostamente', 'aparentemente', 'definitivamente', 'absolutamente', 'relativamente', 'efetivamente', 'eficientemente', 'genuinamente', 'literalmente', 'virtualmente', 'realmente', 'basicamente', 'tipicamente', 'geralmente', 'normalmente', 'usualmente', 'certamente']
  },
  dutch: {
    beginner: ['de', 'het', 'een', 'is', 'zijn', 'was', 'waren', 'hebben', 'heeft', 'had', 'hadden', 'zal', 'zullen', 'zou', 'zouden', 'kan', 'kunnen', 'kon', 'konden', 'moet', 'moeten', 'moest', 'moesten', 'wil', 'willen', 'wilde', 'wilden', 'mag', 'mogen', 'mocht', 'mochten', 'doe', 'doen', 'deed', 'deden', 'ga', 'gaan', 'ging', 'gingen', 'kom', 'komen', 'kwam', 'kwamen', 'zie', 'zien', 'zag', 'zagen', 'geef', 'geven', 'gaf', 'gaven', 'neem', 'nemen', 'nam', 'namen', 'ik', 'jij', 'hij', 'zij', 'wij', 'jullie', 'zij', 'mij', 'jou', 'hem', 'haar', 'ons', 'hun', 'dit', 'dat', 'deze', 'die', 'hier', 'daar', 'waar', 'wanneer', 'hoe', 'waarom', 'wat', 'wie', 'welke', 'hoeveel', 'en', 'of', 'maar', 'want', 'omdat', 'als', 'toen', 'nu', 'dan', 'ook', 'nog', 'niet', 'wel', 'ja', 'nee', 'misschien', 'altijd', 'nooit', 'vaak', 'soms', 'veel', 'weinig', 'meer', 'minder', 'heel', 'erg', 'zeer', 'goed', 'slecht', 'mooi', 'lelijk', 'groot', 'klein', 'lang', 'kort', 'hoog', 'laag', 'breed', 'smal', 'dik', 'dun', 'zwaar', 'licht', 'hard', 'zacht', 'warm', 'koud', 'heet', 'koel', 'droog', 'nat', 'schoon', 'vies', 'nieuw', 'oud', 'jong', 'eerste', 'laatste', 'volgende', 'vorige', 'thuis', 'huis', 'school', 'werk', 'tijd', 'jaar', 'dag', 'uur', 'minuut', 'man', 'vrouw', 'kind', 'leven', 'wereld', 'land', 'stad', 'straat', 'auto', 'trein', 'vliegtuig', 'boek', 'krant', 'telefoon', 'computer', 'televisie', 'muziek', 'film', 'spel', 'sport', 'eten', 'water', 'wijn', 'koffie', 'brood', 'vlees', 'vis', 'groente', 'fruit', 'snoep', 'kleur', 'wit', 'zwart', 'rood', 'groen', 'blauw', 'geel', 'nummer', 'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'],
    intermediate: ['belangrijk', 'begrijpen', 'voorbeeld', 'tussen', 'verschillend', 'ervaring', 'ontwikkeling', 'bedrijf', 'regering', 'systeem', 'programma', 'vraag', 'dienst', 'beheer', 'beschikbaar', 'technologie', 'economie', 'gemeenschap', 'universiteit', 'onderwijs', 'onderzoek', 'zaken', 'organisatie', 'individueel', 'relatie', 'omgeving', 'communicatie', 'kans', 'verantwoordelijkheid', 'vooral', 'noodzakelijk', 'informatie', 'situatie', 'materiaal', 'financieel', 'commercieel', 'industrieel', 'professioneel', 'internationaal', 'traditioneel', 'betekenisvol', 'succesvol', 'politiek', 'economisch', 'sociaal', 'cultureel', 'natuurlijk', 'persoonlijk', 'nationaal', 'regionaal'],
    advanced: ['fenomeen', 'hedendaags', 'fundamenteel', 'uitgebreid', 'geavanceerd', 'substantieel', 'intellectueel', 'filosofisch', 'psychologisch', 'technologisch', 'theoretisch', 'methodologisch', 'systematisch', 'bijgevolg', 'niettemin', 'bovendien', 'overwegend', 'gelijktijdig', 'ongeveer', 'specifiek', 'vooral', 'significant', 'essentieel', 'potentieel', 'uiteindelijk', 'hoofdzakelijk', 'vervolgens', 'dienovereenkomstig', 'alternatief', 'uitsluitend', 'uitgebreid', 'respectievelijk', 'vermoedelijk', 'naar verluidt', 'blijkbaar', 'definitief', 'absoluut', 'relatief', 'effectief', 'efficiënt', 'oprecht', 'letterlijk', 'virtueel', 'werkelijk', 'in wezen', 'typisch', 'algemeen', 'normaal', 'gewoonlijk', 'zeker']
  },
  norwegian: {
    beginner: ['og', 'i', 'å', 'det', 'som', 'en', 'på', 'til', 'av', 'er', 'for', 'de', 'med', 'han', 'har', 'ikke', 'jeg', 'men', 'om', 'var', 'hun', 'så', 'da', 'fra', 'eller', 'seg', 'ved', 'bli', 'kunne', 'vil', 'skulle', 'kan', 'må', 'få', 'si', 'gjøre', 'komme', 'ta', 'være', 'ha', 'se', 'gå', 'denne', 'dette', 'den', 'over', 'under', 'etter', 'før', 'her', 'der', 'hvor', 'når', 'hvordan', 'hvorfor', 'hva', 'hvem', 'hvilken', 'hvor mange', 'ja', 'nei', 'kanskje', 'alltid', 'aldri', 'ofte', 'noen ganger', 'mye', 'lite', 'mer', 'mindre', 'veldig', 'ganske', 'god', 'dårlig', 'pen', 'stygg', 'stor', 'liten', 'lang', 'kort', 'høy', 'lav', 'bred', 'smal', 'tykk', 'tynn', 'tung', 'lett', 'hard', 'myk', 'varm', 'kald', 'het', 'kjølig', 'tørr', 'våt', 'ren', 'skitten', 'ny', 'gammel', 'ung', 'første', 'siste', 'neste', 'forrige', 'hjemme', 'hus', 'skole', 'arbeid', 'tid', 'år', 'dag', 'time', 'minutt', 'mann', 'kvinne', 'barn', 'liv', 'verden', 'land', 'by', 'gate', 'bil', 'tog', 'fly', 'bok', 'avis', 'telefon', 'datamaskin', 'fjernsyn', 'musikk', 'film', 'spill', 'sport', 'mat', 'vann', 'vin', 'kaffe', 'brød', 'kjøtt', 'fisk', 'grønnsaker', 'frukt', 'godteri', 'farge', 'hvit', 'svart', 'rød', 'grønn', 'blå', 'gul', 'nummer', 'null', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'åtte', 'ni', 'ti'],
    intermediate: ['viktig', 'forstå', 'eksempel', 'mellom', 'forskjellig', 'erfaring', 'utvikling', 'selskap', 'regjering', 'system', 'program', 'spørsmål', 'tjeneste', 'ledelse', 'tilgjengelig', 'teknologi', 'økonomi', 'samfunn', 'universitet', 'utdanning', 'forskning', 'virksomhet', 'organisasjon', 'individuell', 'forhold', 'miljø', 'kommunikasjon', 'mulighet', 'ansvar', 'særlig', 'nødvendig', 'informasjon', 'situasjon', 'materiale', 'finansiell', 'kommersiell', 'industriell', 'profesjonell', 'internasjonal', 'tradisjonell', 'betydningsfull', 'vellykket', 'politisk', 'økonomisk', 'sosial', 'kulturell', 'naturlig', 'personlig', 'nasjonal', 'regional'],
    advanced: ['fenomen', 'samtidige', 'grunnleggende', 'omfattende', 'sofistikert', 'betydelig', 'intellektuell', 'filosofisk', 'psykologisk', 'teknologisk', 'teoretisk', 'metodologisk', 'systematisk', 'følgelig', 'likevel', 'dessuten', 'hovedsakelig', 'samtidig', 'omtrent', 'spesifikt', 'særlig', 'betydelig', 'vesentlig', 'potensielt', 'til slutt', 'hovedsakelig', 'deretter', 'følgelig', 'alternativt', 'utelukkende', 'omfattende', 'henholdsvis', 'antagelig', 'angivelig', 'tilsynelatende', 'definitivt', 'absolutt', 'relativt', 'effektivt', 'effektivt', 'ekte', 'bokstavelig', 'virtuelt', 'faktisk', 'i bunn og grunn', 'typisk', 'generelt', 'normalt', 'vanligvis', 'sikkert']
  },
  swedish: {
    beginner: ['och', 'i', 'att', 'det', 'som', 'en', 'på', 'till', 'av', 'är', 'för', 'de', 'med', 'han', 'har', 'inte', 'jag', 'men', 'om', 'var', 'hon', 'så', 'då', 'från', 'eller', 'sig', 'vid', 'bli', 'kunde', 'vill', 'skulle', 'kan', 'måste', 'få', 'säga', 'göra', 'komma', 'ta', 'vara', 'ha', 'se', 'gå', 'denna', 'detta', 'den', 'över', 'under', 'efter', 'före', 'här', 'där', 'var', 'när', 'hur', 'varför', 'vad', 'vem', 'vilken', 'hur många', 'ja', 'nej', 'kanske', 'alltid', 'aldrig', 'ofta', 'ibland', 'mycket', 'lite', 'mer', 'mindre', 'mycket', 'ganska', 'bra', 'dålig', 'vacker', 'ful', 'stor', 'liten', 'lång', 'kort', 'hög', 'låg', 'bred', 'smal', 'tjock', 'tunn', 'tung', 'lätt', 'hård', 'mjuk', 'varm', 'kall', 'het', 'sval', 'torr', 'våt', 'ren', 'smutsig', 'ny', 'gammal', 'ung', 'första', 'sista', 'nästa', 'föregående', 'hemma', 'hus', 'skola', 'arbete', 'tid', 'år', 'dag', 'timme', 'minut', 'man', 'kvinna', 'barn', 'liv', 'värld', 'land', 'stad', 'gata', 'bil', 'tåg', 'flygplan', 'bok', 'tidning', 'telefon', 'dator', 'tv', 'musik', 'film', 'spel', 'sport', 'mat', 'vatten', 'vin', 'kaffe', 'bröd', 'kött', 'fisk', 'grönsaker', 'frukt', 'godis', 'färg', 'vit', 'svart', 'röd', 'grön', 'blå', 'gul', 'nummer', 'noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio'],
    intermediate: ['viktig', 'förstå', 'exempel', 'mellan', 'olika', 'erfarenhet', 'utveckling', 'företag', 'regering', 'system', 'program', 'fråga', 'tjänst', 'ledning', 'tillgänglig', 'teknik', 'ekonomi', 'samhälle', 'universitet', 'utbildning', 'forskning', 'affärer', 'organisation', 'individuell', 'relation', 'miljö', 'kommunikation', 'möjlighet', 'ansvar', 'särskilt', 'nödvändig', 'information', 'situation', 'material', 'finansiell', 'kommersiell', 'industriell', 'professionell', 'internationell', 'traditionell', 'betydelsefull', 'framgångsrik', 'politisk', 'ekonomisk', 'social', 'kulturell', 'naturlig', 'personlig', 'nationell', 'regional'],
    advanced: ['fenomen', 'samtida', 'grundläggande', 'omfattande', 'sofistikerad', 'betydande', 'intellektuell', 'filosofisk', 'psykologisk', 'teknologisk', 'teoretisk', 'metodologisk', 'systematiskt', 'följaktligen', 'ändå', 'dessutom', 'övervägande', 'samtidigt', 'ungefär', 'specifikt', 'särskilt', 'betydligt', 'väsentligen', 'potentiellt', 'slutligen', 'främst', 'därefter', 'följaktligen', 'alternativt', 'uteslutande', 'omfattande', 'respektive', 'förmodligen', 'påstås', 'uppenbarligen', 'definitivt', 'absolut', 'relativt', 'effektivt', 'effektivt', 'genuint', 'bokstavligen', 'virtuellt', 'faktiskt', 'i grund och botten', 'typiskt', 'generellt', 'normalt', 'vanligtvis', 'säkert']
  },
  turkish: {
    beginner: ['ve', 'bir', 'bu', 'da', 'de', 'için', 'ile', 'o', 'var', 'ben', 'sen', 'biz', 'siz', 'onlar', 'şu', 'her', 'daha', 'çok', 'en', 'gibi', 'kadar', 'sonra', 'önce', 'şimdi', 'bugün', 'dün', 'yarın', 'burada', 'şurada', 'orada', 'nerede', 'ne', 'kim', 'nasıl', 'neden', 'niçin', 'hangi', 'kaç', 'evet', 'hayır', 'belki', 'hep', 'hiç', 'bazen', 'sık', 'az', 'çok', 'daha', 'en', 'çok', 'pek', 'iyi', 'kötü', 'güzel', 'çirkin', 'büyük', 'küçük', 'uzun', 'kısa', 'yüksek', 'alçak', 'geniş', 'dar', 'kalın', 'ince', 'ağır', 'hafif', 'sert', 'yumuşak', 'sıcak', 'soğuk', 'sıcak', 'serinlemek', 'kuru', 'ıslak', 'temiz', 'kirli', 'yeni', 'eski', 'genç', 'ilk', 'son', 'gelecek', 'önceki', 'ev', 'okul', 'iş', 'zaman', 'yıl', 'gün', 'saat', 'dakika', 'adam', 'kadın', 'çocuk', 'hayat', 'dünya', 'ülke', 'şehir', 'sokak', 'araba', 'tren', 'uçak', 'kitap', 'gazete', 'telefon', 'bilgisayar', 'televizyon', 'müzik', 'film', 'oyun', 'spor', 'yemek', 'su', 'şarap', 'kahve', 'ekmek', 'et', 'balık', 'sebze', 'meyve', 'şeker', 'renk', 'beyaz', 'siyah', 'kırmızı', 'yeşil', 'mavi', 'sarı', 'numara', 'sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on'],
    intermediate: ['önemli', 'anlamak', 'örnek', 'arasında', 'farklı', 'deneyim', 'gelişim', 'şirket', 'hükümet', 'sistem', 'program', 'soru', 'hizmet', 'yönetim', 'mevcut', 'teknoloji', 'ekonomi', 'toplum', 'üniversite', 'eğitim', 'araştırma', 'iş', 'organizasyon', 'bireysel', 'ilişki', 'çevre', 'iletişim', 'fırsat', 'sorumluluk', 'özellikle', 'gerekli', 'bilgi', 'durum', 'malzeme', 'finansal', 'ticari', 'endüstriyel', 'profesyonel', 'uluslararası', 'geleneksel', 'anlamlı', 'başarılı', 'politik', 'ekonomik', 'sosyal', 'kültürel', 'doğal', 'kişisel', 'ulusal', 'bölgesel'],
    advanced: ['fenomen', 'çağdaş', 'temel', 'kapsamlı', 'sofistike', 'önemli', 'entelektüel', 'felsefi', 'psikolojik', 'teknolojik', 'teorik', 'metodolojik', 'sistematik', 'sonuç olarak', 'yine de', 'ayrıca', 'ağırlıklı olarak', 'eş zamanlı', 'yaklaşık', 'özellikle', 'özellikle', 'önemli ölçüde', 'esasen', 'potansiyel', 'sonuçta', 'esas olarak', 'daha sonra', 'buna göre', 'alternatif', 'sadece', 'kapsamlı', 'sırasıyla', 'muhtemelen', 'sözde', 'görünüşe göre', 'kesinlikle', 'mutlak', 'göreceli', 'etkili', 'verimli', 'gerçek', 'kelimenin tam anlamıyla', 'sanal', 'aslında', 'temelde', 'tipik', 'genel olarak', 'normal', 'genellikle', 'kesinlikle']
  }
};

function getRandomWord(language: string, difficulty: string): string {
  const words = WORD_FREQUENCIES[language as keyof typeof WORD_FREQUENCIES]?.[difficulty as keyof typeof WORD_FREQUENCIES['english']];
  if (!words || words.length === 0) {
    // Fallback to English if language not supported
    return WORD_FREQUENCIES.english[difficulty as keyof typeof WORD_FREQUENCIES['english']][Math.floor(Math.random() * WORD_FREQUENCIES.english[difficulty as keyof typeof WORD_FREQUENCIES['english']].length)];
  }
  return words[Math.floor(Math.random() * words.length)];
}

function createPrompt(language: string, difficulty: string, targetWord: string): string {
  const difficultyDescriptions = {
    beginner: 'simple, common vocabulary and basic sentence structures',
    intermediate: 'moderate vocabulary and varied sentence patterns',
    advanced: 'complex vocabulary and sophisticated sentence structures'
  };

  const languageInstructions = {
    german: 'Make sure to use proper German grammar including correct article usage (der/die/das), verb conjugations, and word order.',
    french: 'Use proper French grammar including correct article usage (le/la/les), verb conjugations, and accents.',
    spanish: 'Use proper Spanish grammar including correct article usage (el/la/los/las), verb conjugations, and accents.',
    italian: 'Use proper Italian grammar including correct article usage (il/lo/la/gli/le), verb conjugations, and accents.',
    portuguese: 'Use proper Portuguese grammar including correct article usage (o/a/os/as), verb conjugations, and accents.',
    dutch: 'Use proper Dutch grammar including correct article usage (de/het), verb conjugations, and word order.',
    norwegian: 'Use proper Norwegian grammar including correct article usage, verb conjugations, and word order.',
    swedish: 'Use proper Swedish grammar including correct article usage, verb conjugations, and word order.',
    turkish: 'Use proper Turkish grammar including correct suffix usage, verb conjugations, and agglutination rules.',
    english: 'Use proper English grammar and natural sentence structure.'
  };

  return `Create a ${difficulty} level sentence in ${language} that naturally includes the word "${targetWord}". 

Requirements:
- The sentence should be ${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions]}
- The word "${targetWord}" should fit naturally in the context and be ESSENTIAL to the sentence meaning
- ${languageInstructions[language as keyof typeof languageInstructions] || 'Use proper grammar and natural sentence structure.'}
- The sentence should be educational and meaningful
- Length: ${difficulty === 'beginner' ? '8-12' : difficulty === 'intermediate' ? '12-18' : '15-25'} words
- The target word MUST be a complete word that can be removed to create a proper cloze exercise

CRITICAL: The target word "${targetWord}" must appear exactly as provided in the sentence, and when removed, should create a meaningful gap that tests comprehension.

Provide your response in the following JSON format:
{
  "sentence": "The complete sentence with the target word",
  "context": "Brief explanation of the context or situation",
  "targetWord": "${targetWord}"
}

Example for reference:
If targetWord is "important" and difficulty is "intermediate":
{
  "sentence": "It is important to understand different perspectives before making a decision.",
  "context": "This sentence emphasizes the value of considering multiple viewpoints in decision-making.",
  "targetWord": "important"
}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { language, difficulty, knownWords } = await req.json();
    
    if (!language || !difficulty) {
      throw new Error('Language and difficulty are required');
    }

    console.log(`Generating sentence for ${language} at ${difficulty} level`);

    // Get a random word for the given difficulty
    const targetWord = getRandomWord(language, difficulty);
    console.log(`Selected target word: ${targetWord}`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate sentence using OpenAI
    const prompt = createPrompt(language, difficulty, targetWord);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a language learning expert. Create educational sentences that help students learn vocabulary in context. You must ensure that the target word appears exactly as specified and can be properly removed to create a cloze deletion exercise. Always respond with valid JSON format. Pay special attention to grammar rules for the target language.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Generated content:', content);

    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response
    if (!parsedContent.sentence || !parsedContent.targetWord) {
      throw new Error('Invalid response structure from AI');
    }

    // Verify that the target word actually appears in the sentence
    const sentenceLower = parsedContent.sentence.toLowerCase();
    const targetWordLower = parsedContent.targetWord.toLowerCase();
    
    if (!sentenceLower.includes(targetWordLower)) {
      console.error('Target word not found in sentence:', { sentence: parsedContent.sentence, targetWord: parsedContent.targetWord });
      throw new Error('Generated sentence does not contain the target word');
    }

    // Create the cloze sentence by replacing the target word with a blank
    // Use a more precise regex that matches word boundaries
    const wordRegex = new RegExp(`\\b${parsedContent.targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const clozeSentence = parsedContent.sentence.replace(wordRegex, '___');

    // Verify that the cloze sentence actually has blanks
    if (!clozeSentence.includes('___')) {
      console.error('Failed to create cloze sentence:', { original: parsedContent.sentence, target: parsedContent.targetWord, result: clozeSentence });
      throw new Error('Failed to create proper cloze deletion - target word may not be properly detectable');
    }

    const result = {
      sentence: parsedContent.sentence,
      targetWord: parsedContent.targetWord,
      clozeSentence: clozeSentence,
      context: parsedContent.context || '',
      difficulty: difficulty,
      language: language
    };

    console.log('Final result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sentence-mining function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate sentence mining exercise' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
