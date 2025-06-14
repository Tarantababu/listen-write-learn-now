
export const SUPPORTED_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'mandarin chinese', label: 'Mandarin Chinese' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'german', label: 'German' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'russian', label: 'Russian' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'korean', label: 'Korean' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'greek', label: 'Greek' },
  { value: 'polish', label: 'Polish' },
  { value: 'swedish', label: 'Swedish' },
  { value: 'norwegian', label: 'Norwegian' },
  { value: 'czech', label: 'Czech' },
  { value: 'danish', label: 'Danish' },
  { value: 'hungarian', label: 'Hungarian' },
  { value: 'finnish', label: 'Finnish' },
  { value: 'ukrainian', label: 'Ukrainian' },
  { value: 'romanian', label: 'Romanian' },
  { value: 'hebrew', label: 'Hebrew' }
];

export const getLanguageLabel = (languageValue: string) => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.value === languageValue);
  return lang ? lang.label : languageValue;
};
