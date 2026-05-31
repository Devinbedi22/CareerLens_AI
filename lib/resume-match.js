const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further",
  "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
  "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
  "too", "under", "until", "up", "very",
  "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeText(text) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token && !STOPWORDS.has(token));
}

function getTermFrequencies(tokens) {
  return tokens.reduce((frequency, token) => {
    frequency[token] = (frequency[token] || 0) + 1;
    return frequency;
  }, {});
}

function buildDocumentVectors(documents) {
  const tokenizedDocuments = documents.map((text) => tokenizeText(text));
  const vocabulary = Array.from(
    new Set(tokenizedDocuments.flat())
  ).sort();

  const documentFrequencies = vocabulary.reduce((df, term) => {
    df[term] = tokenizedDocuments.reduce(
      (count, tokens) => count + (tokens.includes(term) ? 1 : 0),
      0
    );
    return df;
  }, {});

  const idf = vocabulary.reduce((acc, term) => {
    acc[term] = Math.log((documents.length + 1) / (documentFrequencies[term] + 1)) + 1;
    return acc;
  }, {});

  return tokenizedDocuments.map((tokens) => {
    const termFrequencies = getTermFrequencies(tokens);
    return vocabulary.reduce((vector, term) => {
      const tf = termFrequencies[term] ? termFrequencies[term] / tokens.length : 0;
      vector[term] = tf * idf[term];
      return vector;
    }, {});
  });
}

export function cosineSimilarity(vectorA, vectorB) {
  const terms = Object.keys({ ...vectorA, ...vectorB });
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of terms) {
    const a = vectorA[term] || 0;
    const b = vectorB[term] || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function getTopKeywords(text, limit = 20) {
  const tokens = tokenizeText(text);
  const frequencies = getTermFrequencies(tokens);

  return Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([term]) => term);
}

export function getResumeMatchAnalysis(resumeText, jobDescription) {
  if (!resumeText || typeof resumeText !== "string") {
    throw new Error("Resume text is required for match analysis.");
  }

  if (!jobDescription || typeof jobDescription !== "string") {
    throw new Error("Job description is required for match analysis.");
  }

  const [resumeVector, jobVector] = buildDocumentVectors([
    resumeText,
    jobDescription,
  ]);

  const matchScore = Number(
    (cosineSimilarity(resumeVector, jobVector) * 100).toFixed(2)
  );

  const jobKeywords = getTopKeywords(jobDescription, 20);
  const resumeTerms = new Set(tokenizeText(resumeText));
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeTerms.has(keyword)
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeTerms.has(keyword)
  );

  const keywordCoverage = jobKeywords.length
    ? Number(((matchedKeywords.length / jobKeywords.length) * 100).toFixed(2))
    : 0;

  return {
    matchScore,
    matchedKeywords,
    missingKeywords,
    keywordCoverage,
  };
}
