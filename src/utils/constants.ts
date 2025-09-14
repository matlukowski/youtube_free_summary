export const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+/;

export const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
];

export const YOUTUBE_ERROR_MESSAGES = {
  2: "Nieprawidłowe ID wideo",
  5: "Błąd odtwarzacza HTML5",
  100: "Wideo nie znalezione lub prywatne",
  101: "Wideo nie może być osadzone",
  150: "Wideo nie może być osadzone"
} as const;