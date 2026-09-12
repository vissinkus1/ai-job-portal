const fs = require("fs");
const path = require("path");

// Curated skills dictionary — organized by category
const SKILLS_DICTIONARY = {
  // Programming Languages
  languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C",
    "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R",
    "Perl", "Lua", "Dart", "Haskell", "Elixir", "Clojure", "MATLAB",
    "Shell", "Bash", "PowerShell", "SQL", "HTML", "CSS", "Sass", "LESS",
  ],
  // Frontend
  frontend: [
    "React", "React.js", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js",
    "Svelte", "jQuery", "Bootstrap", "Tailwind CSS", "Material UI",
    "Redux", "Zustand", "MobX", "Webpack", "Vite", "Babel",
    "Three.js", "D3.js", "Chart.js", "Storybook", "Figma",
  ],
  // Backend
  backend: [
    "Node.js", "Express", "Express.js", "Django", "Flask", "FastAPI",
    "Spring Boot", "Spring", "ASP.NET", "Ruby on Rails", "Laravel",
    "NestJS", "Koa", "Hapi", "GraphQL", "REST API", "gRPC",
    "Microservices", "Serverless",
  ],
  // Databases
  databases: [
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch",
    "DynamoDB", "Cassandra", "Firebase", "Supabase", "Neo4j",
    "Oracle", "SQL Server", "MariaDB", "CouchDB",
  ],
  // Cloud & DevOps
  devops: [
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes",
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Terraform",
    "Ansible", "Nginx", "Apache", "Linux", "CI/CD",
    "Vercel", "Netlify", "Heroku", "Render", "DigitalOcean",
  ],
  // AI/ML/Data
  ai_ml: [
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras",
    "Scikit-learn", "Pandas", "NumPy", "OpenCV", "NLP",
    "Natural Language Processing", "Computer Vision", "LLM",
    "GPT", "BERT", "Transformers", "Hugging Face",
    "Data Science", "Data Analysis", "Data Engineering",
    "Power BI", "Tableau", "Apache Spark", "Hadoop",
  ],
  // Mobile
  mobile: [
    "React Native", "Flutter", "SwiftUI", "Android", "iOS",
    "Xamarin", "Ionic", "Cordova", "Expo",
  ],
  // Tools & Practices
  tools: [
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "Slack", "VS Code", "IntelliJ", "Postman", "Swagger",
    "Agile", "Scrum", "Kanban", "TDD", "Unit Testing",
    "Jest", "Mocha", "Cypress", "Selenium", "Playwright",
  ],
  // Soft Skills & Business
  business: [
    "Project Management", "Team Leadership", "Communication",
    "Problem Solving", "Critical Thinking", "Time Management",
    "Stakeholder Management", "Product Management", "UX Design",
    "UI Design", "Technical Writing", "Public Speaking",
    "Sales", "Marketing", "SEO", "Content Strategy",
    "Business Analysis", "Financial Analysis", "Accounting",
  ],
  // Security
  security: [
    "Cybersecurity", "Penetration Testing", "OWASP", "OAuth",
    "JWT", "SSL/TLS", "Encryption", "Security Auditing",
  ],
  // Blockchain
  blockchain: [
    "Blockchain", "Solidity", "Ethereum", "Web3", "Smart Contracts",
    "DeFi", "NFT",
  ],
};

// Flatten all skills into a single lookup-friendly list
const ALL_SKILLS = [];
for (const category of Object.values(SKILLS_DICTIONARY)) {
  for (const skill of category) {
    ALL_SKILLS.push(skill);
  }
}

// Experience level keywords
const EXPERIENCE_PATTERNS = [
  { regex: /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/gi, extract: (m) => parseInt(m[1]) },
  { regex: /(?:experience|exp)\s*(?:of|:)?\s*(\d+)\+?\s*(?:years?|yrs?)/gi, extract: (m) => parseInt(m[1]) },
];

// Education keywords
const EDUCATION_KEYWORDS = [
  "B.Tech", "B.E.", "B.Sc", "B.S.", "B.A.", "BCA", "BBA",
  "M.Tech", "M.E.", "M.Sc", "M.S.", "M.A.", "MCA", "MBA",
  "Ph.D", "PhD", "Doctorate",
  "Bachelor", "Master", "Diploma",
  "Computer Science", "Information Technology", "Engineering",
  "Electronics", "Mechanical", "Civil", "Electrical",
  "Data Science", "Artificial Intelligence",
];

/**
 * Parse resume text and extract structured data.
 * @param {string} text - Raw text content from the resume
 * @returns {{ extractedSkills: string[], experienceYears: number|null, education: string[], summary: string }}
 */
function extractFromText(text) {
  const normalizedText = text.replace(/\s+/g, " ");

  // 1. Extract skills — case-insensitive word-boundary matching
  const foundSkills = new Set();
  for (const skill of ALL_SKILLS) {
    // Escape regex special chars in skill name
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Use word boundary for short skills, more flexible for multi-word
    const pattern = skill.length <= 3
      ? new RegExp(`\\b${escaped}\\b`, "i")
      : new RegExp(`(?:^|[\\s,;|•\\-/])${escaped}(?:[\\s,;|•\\-/]|$)`, "i");

    if (pattern.test(normalizedText)) {
      foundSkills.add(skill);
    }
  }

  // 2. Extract experience years
  let experienceYears = null;
  for (const pattern of EXPERIENCE_PATTERNS) {
    const matches = [...normalizedText.matchAll(pattern.regex)];
    for (const match of matches) {
      const years = pattern.extract(match);
      if (years > 0 && years < 50) {
        experienceYears = experienceYears === null
          ? years
          : Math.max(experienceYears, years);
      }
    }
  }

  // 3. Extract education
  const foundEducation = new Set();
  for (const keyword of EDUCATION_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(escaped, "i").test(normalizedText)) {
      foundEducation.add(keyword);
    }
  }

  // 4. Generate summary (first ~300 chars of meaningful text)
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 10);
  const summary = lines.slice(0, 5).join(" ").substring(0, 300).trim();

  return {
    extractedSkills: [...foundSkills],
    experienceYears,
    education: [...foundEducation],
    summary: summary || "Resume parsed successfully",
  };
}

/**
 * Parse a resume file (PDF) and extract structured data.
 * @param {string} filePath - Absolute path to the resume file
 * @returns {Promise<{ extractedSkills: string[], experienceYears: number|null, education: string[], summary: string }>}
 */
async function parseResume(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return extractFromText(data.text);
  }

  if (ext === ".txt") {
    const text = fs.readFileSync(filePath, "utf-8");
    return extractFromText(text);
  }

  // For .doc/.docx — extract whatever text we can (basic fallback)
  // In production, you'd use a proper library like mammoth
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    return extractFromText(text);
  } catch {
    return {
      extractedSkills: [],
      experienceYears: null,
      education: [],
      summary: "Could not parse this file format. Supported: PDF, TXT",
    };
  }
}

module.exports = { parseResume, extractFromText, ALL_SKILLS, SKILLS_DICTIONARY };
