const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are","aren't","as","at",
  "be","because","been","before","being","below","between","both","but","by",
  "can't","cannot","could","couldn't",
  "did","didn't","do","does","doesn't","doing","don't","down","during",
  "each","few","for","from","further",
  "had","hadn't","has","hasn't","have","haven't","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's",
  "i","i'd","i'll","i'm","i've","if","in","into","is","isn't","it","it's","its","itself",
  "let's","me","more","most","mustn't","my","myself",
  "no","nor","not","of","off","on","once","only","or","other","ought","our","ours","ourselves","out","over","own",
  "same","shan't","she","she'd","she'll","she's","should","shouldn't","so","some","such",
  "than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to",
  "too","under","until","up","very",
  "was","wasn't","we","we'd","we'll","we're","we've","were","weren't","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","won't","would","wouldn't","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves"
]);

function normalizeText(text) {
  return text
    .toString()
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
  const vocabulary = Array.from(new Set(tokenizedDocuments.flat())).sort();

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

const ROLE_CATALOG = [
  {
    title: "Backend Developer",
    requiredSkills: ["Node.js", "Java", "Python", "APIs", "Databases"],
    recommendedSkills: ["Docker", "Kubernetes", "REST", "SQL", "Microservices"],
    experience: 2,
    experienceIndicators: ["backend architecture", "server-side logic", "API design", "distributed systems"],
  },
  {
    title: "Frontend Developer",
    requiredSkills: ["JavaScript", "React", "HTML", "CSS", "UI"],
    recommendedSkills: ["TypeScript", "Next.js", "UX", "Responsive Design", "Accessibility"],
    experience: 1,
    experienceIndicators: ["user interfaces", "interactive design", "browser compatibility", "frontend performance"],
  },
  {
    title: "Full Stack Developer",
    requiredSkills: ["JavaScript", "Node.js", "React", "APIs", "Databases"],
    recommendedSkills: ["TypeScript", "Docker", "GraphQL", "CI/CD", "Cloud"],
    experience: 2,
    experienceIndicators: ["end-to-end development", "frontend and backend", "deployment", "full stack"],
  },
  {
    title: "DevOps Engineer",
    requiredSkills: ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
    recommendedSkills: ["Terraform", "Monitoring", "Scripting", "Automation", "Cloud"],
    experience: 3,
    experienceIndicators: ["infrastructure automation", "deployment pipelines", "container orchestration", "system reliability"],
  },
  {
    title: "Data Analyst",
    requiredSkills: ["SQL", "Excel", "Data Visualization", "Python", "Analytics"],
    recommendedSkills: ["Tableau", "Power BI", "Statistics", "ETL", "Reporting"],
    experience: 1,
    experienceIndicators: ["data analysis", "dashboards", "business insights", "data storytelling"],
  },
  {
    title: "Software Engineer",
    requiredSkills: ["Programming", "Data Structures", "Algorithms", "Testing", "Version Control"],
    recommendedSkills: ["Object-Oriented Design", "CI/CD", "Cloud", "Problem Solving", "Debugging"],
    experience: 2,
    experienceIndicators: ["software development", "system design", "code quality", "collaboration"],
  },
  {
    title: "Platform Engineer",
    requiredSkills: ["Cloud", "Infrastructure", "Kubernetes", "Monitoring", "Automation"],
    recommendedSkills: ["Terraform", "CI/CD", "Linux", "Networking", "Observability"],
    experience: 3,
    experienceIndicators: ["platform reliability", "scalable infrastructure", "service delivery", "platform engineering"],
  },
];

function buildRoleProfileText(role) {
  return [
    role.requiredSkills.join(" "),
    role.recommendedSkills.join(" "),
    role.experienceIndicators.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeSkill(skill) {
  return normalizeText(skill).replace(/\s+/g, " ");
}

function normalizeSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((skill) => normalizeSkill(skill))
    .filter(Boolean);
}

function getUserText(resumeContent, skills, profile, experience) {
  return [
    resumeContent || "",
    Array.isArray(skills) ? skills.join(" ") : "",
    profile || "",
    experience != null ? `experience ${experience} years` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getRoleRecommendations({ resumeContent, skills = [], experience = 0, profile = "" }) {
  const normalizedSkills = normalizeSkillList(skills);
  const userText = getUserText(resumeContent, normalizedSkills, profile, experience);

  const scoredRoles = ROLE_CATALOG.map((role) => {
    const normalizedRequired = normalizeSkillList(role.requiredSkills);
    const normalizedRecommended = normalizeSkillList(role.recommendedSkills);
    const allRoleSkills = [...new Set([...normalizedRequired, ...normalizedRecommended])];

    const matchedSkills = allRoleSkills.filter((roleSkill) =>
      normalizedSkills.includes(roleSkill)
    );

    const missingSkills = normalizedRequired.filter(
      (roleSkill) => !normalizedSkills.includes(roleSkill)
    );

    const profileText = buildRoleProfileText(role);
    const [userVector, roleVector] = buildDocumentVectors([userText, profileText]);
    const textSimilarity = cosineSimilarity(userVector, roleVector);

    const skillMatchRatio = normalizedRequired.length
      ? matchedSkills.filter((skill) => normalizedRequired.includes(skill)).length / normalizedRequired.length
      : 0;

    const experienceScore = role.experience
      ? Math.min(Number(experience) / role.experience, 1)
      : 0;

    const score = Number(
      (
        textSimilarity * 100 * 0.55 +
        skillMatchRatio * 100 * 0.3 +
        experienceScore * 100 * 0.15
      ).toFixed(2)
    );

    return {
      title: role.title,
      score,
      matchedSkills,
      missingSkills,
    };
  });

  return scoredRoles
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
