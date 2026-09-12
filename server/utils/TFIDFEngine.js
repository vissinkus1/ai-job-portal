/**
 * TFIDFEngine.js
 * 
 * TF-IDF (Term Frequency–Inverse Document Frequency) engine for
 * semantic job matching. Converts job descriptions and user profiles
 * into numerical vectors and computes cosine similarity.
 * 
 * Also includes skill synonym resolution and collaborative filtering.
 */

// ─── Skill Synonym Map ──────────────────────────────────────────
// Normalizes different names for the same skill
const SKILL_SYNONYMS = {
    "reactjs": "react",
    "react.js": "react",
    "react js": "react",
    "vuejs": "vue",
    "vue.js": "vue",
    "vue js": "vue",
    "angularjs": "angular",
    "angular.js": "angular",
    "nodejs": "node.js",
    "node": "node.js",
    "node js": "node.js",
    "expressjs": "express",
    "express.js": "express",
    "nextjs": "next.js",
    "next": "next.js",
    "nuxtjs": "nuxt.js",
    "nestjs": "nestjs",
    "typescript": "typescript",
    "ts": "typescript",
    "javascript": "javascript",
    "js": "javascript",
    "es6": "javascript",
    "es2015": "javascript",
    "ecmascript": "javascript",
    "python3": "python",
    "py": "python",
    "golang": "go",
    "c#": "c#",
    "csharp": "c#",
    "c sharp": "c#",
    "c++": "c++",
    "cpp": "c++",
    "postgres": "postgresql",
    "pg": "postgresql",
    "mongo": "mongodb",
    "mysql": "mysql",
    "mssql": "sql server",
    "dynamodb": "dynamodb",
    "amazon web services": "aws",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "microsoft azure": "azure",
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "tf": "terraform",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",
    "continuous deployment": "ci/cd",
    "ml": "machine learning",
    "dl": "deep learning",
    "ai": "artificial intelligence",
    "natural language processing": "nlp",
    "cv": "computer vision",
    "large language models": "llm",
    "large language model": "llm",
    "restful": "rest api",
    "restful api": "rest api",
    "rest": "rest api",
    "graphql": "graphql",
    "gql": "graphql",
    "sass": "sass",
    "scss": "sass",
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",
    "materialui": "material ui",
    "mui": "material ui",
    "jwt": "jwt",
    "json web token": "jwt",
    "json web tokens": "jwt",
    "github actions": "github actions",
    "gha": "github actions",
    "gitlab ci": "gitlab ci",
    "react native": "react native",
    "rn": "react native",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "huggingface": "hugging face",
    "hf": "hugging face",
    "powerbi": "power bi",
    "scrum": "scrum",
    "agile methodology": "agile",
    "test driven development": "tdd",
    "unit test": "unit testing",
    "unit tests": "unit testing",
    "figma": "figma",
    "sketch": "sketch",
    "ux design": "ux design",
    "ui design": "ui design",
    "ui/ux": "ux design",
    "user experience": "ux design",
};

/**
 * Normalize a skill name using the synonym map.
 */
function normalizeSkill(skill) {
    const lower = skill.toLowerCase().trim();
    return SKILL_SYNONYMS[lower] || lower;
}

/**
 * Normalize all skills in a list, deduplicating after normalization.
 */
function normalizeSkills(skills) {
    const seen = new Set();
    const result = [];
    for (const skill of skills) {
        const normalized = normalizeSkill(skill);
        if (!seen.has(normalized)) {
            seen.add(normalized);
            result.push(normalized);
        }
    }
    return result;
}

// ─── TF-IDF Engine ───────────────────────────────────────────────

/**
 * Tokenize text into normalized terms.
 * Handles multi-word skills and technical terms.
 */
function tokenize(text) {
    if (!text) return [];

    // Normalize the text
    const normalized = text
        .toLowerCase()
        .replace(/[^\w\s.+#\-/]/g, " ") // Keep dots, plus, hash, dash, slash for tech terms
        .replace(/\s+/g, " ")
        .trim();

    // Split into tokens
    const rawTokens = normalized.split(" ").filter(t => t.length > 1);

    // Also check for known multi-word terms
    const multiWordTerms = [];
    for (const [synonym] of Object.entries(SKILL_SYNONYMS)) {
        if (synonym.includes(" ") && normalized.includes(synonym)) {
            multiWordTerms.push(normalizeSkill(synonym));
        }
    }

    // Normalize single tokens too
    const singleTokens = rawTokens.map(t => normalizeSkill(t));

    return [...new Set([...singleTokens, ...multiWordTerms])];
}

/**
 * Compute TF (Term Frequency) for a document.
 * TF(t, d) = count(t in d) / |d|
 */
function computeTF(tokens) {
    const tf = {};
    for (const token of tokens) {
        tf[token] = (tf[token] || 0) + 1;
    }
    // Normalize by document length
    const len = tokens.length || 1;
    for (const token in tf) {
        tf[token] = tf[token] / len;
    }
    return tf;
}

/**
 * Compute IDF (Inverse Document Frequency) across a corpus.
 * IDF(t) = log(N / (1 + df(t)))
 * where N = total documents, df(t) = documents containing term t
 */
function computeIDF(corpus) {
    const N = corpus.length;
    const df = {}; // Document frequency

    for (const doc of corpus) {
        const uniqueTokens = new Set(doc);
        for (const token of uniqueTokens) {
            df[token] = (df[token] || 0) + 1;
        }
    }

    const idf = {};
    for (const [term, freq] of Object.entries(df)) {
        idf[term] = Math.log(N / (1 + freq)) + 1; // Add 1 to prevent log(0)
    }

    return idf;
}

/**
 * Compute TF-IDF vector for a document given pre-computed IDF values.
 */
function computeTFIDF(tokens, idf) {
    const tf = computeTF(tokens);
    const tfidf = {};

    for (const [term, tfVal] of Object.entries(tf)) {
        tfidf[term] = tfVal * (idf[term] || 1);
    }

    return tfidf;
}

/**
 * Compute cosine similarity between two TF-IDF vectors.
 * Returns a value between 0 and 1.
 */
function cosineSimilarity(vecA, vecB) {
    // Get all unique terms
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const term of allTerms) {
        const a = vecA[term] || 0;
        const b = vecB[term] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
}

/**
 * Build a TF-IDF model from a corpus of job documents.
 * 
 * @param {Object[]} jobs - Array of job objects
 * @returns {Object} Model with IDF values and job vectors
 */
function buildJobCorpus(jobs) {
    // Create document representation for each job
    const documents = jobs.map(job => {
        const parts = [
            job.title || "",
            job.description || "",
            (job.skills || []).join(" "),
            job.company || "",
            job.experienceLevel || "",
            job.type || "",
        ];
        return tokenize(parts.join(" "));
    });

    // Compute IDF across the corpus
    const idf = computeIDF(documents);

    // Compute TF-IDF vector for each job
    const jobVectors = documents.map(doc => computeTFIDF(doc, idf));

    return { idf, jobVectors, documents };
}

/**
 * Build a user profile vector from their skills, bio, and resume data.
 */
function buildUserVector(user, idf) {
    const parts = [
        (user.skills || []).join(" "),
        user.bio || "",
        (user.parsedResume?.extractedSkills || []).join(" "),
        user.parsedResume?.summary || "",
    ];

    // Repeat skills 3x to boost their weight in the vector
    const skillsText = (user.skills || []).join(" ");
    const fullText = `${skillsText} ${skillsText} ${skillsText} ${parts.join(" ")}`;

    const tokens = tokenize(fullText);
    return computeTFIDF(tokens, idf);
}

/**
 * Score all jobs against a user profile using TF-IDF + cosine similarity.
 * 
 * @param {Object} user - User object with skills, bio, parsedResume
 * @param {Object[]} jobs - Array of job objects
 * @returns {Object[]} Jobs with similarity scores, sorted descending
 */
function scoreJobsWithTFIDF(user, jobs) {
    if (!jobs.length) return [];

    // Build corpus and IDF
    const { idf, jobVectors } = buildJobCorpus(jobs);

    // Build user vector
    const userVector = buildUserVector(user, idf);

    // Score each job
    const scored = jobs.map((job, index) => {
        const similarity = cosineSimilarity(userVector, jobVectors[index]);
        return {
            job,
            tfidfScore: Math.round(similarity * 100),
        };
    });

    return scored.sort((a, b) => b.tfidfScore - a.tfidfScore);
}

// ─── Collaborative Filtering ────────────────────────────────────

/**
 * Simple collaborative filtering: "Users with similar profiles also applied to..."
 * Based on application co-occurrence patterns.
 * 
 * @param {string} userId - Current user's ID
 * @param {Object[]} allApplications - All applications with populated job data
 * @param {Object[]} allUsers - All users with skills
 * @returns {string[]} Recommended job IDs
 */
function collaborativeFilter(userId, allApplications, allUsers) {
    const currentUser = allUsers.find(u => u._id.toString() === userId);
    if (!currentUser || !currentUser.skills?.length) return [];

    const currentSkills = normalizeSkills(currentUser.skills);
    const currentSkillSet = new Set(currentSkills);

    // Find similar users (Jaccard similarity on skills)
    const similarUsers = [];
    for (const user of allUsers) {
        if (user._id.toString() === userId) continue;
        if (!user.skills?.length) continue;

        const otherSkills = normalizeSkills(user.skills);
        const otherSet = new Set(otherSkills);

        // Jaccard similarity = |intersection| / |union|
        const intersection = currentSkills.filter(s => otherSet.has(s)).length;
        const union = new Set([...currentSkills, ...otherSkills]).size;
        const similarity = union > 0 ? intersection / union : 0;

        if (similarity >= 0.3) { // At least 30% skill overlap
            similarUsers.push({ userId: user._id.toString(), similarity });
        }
    }

    // Get jobs that similar users applied to
    const currentUserApps = new Set(
        allApplications
            .filter(a => a.applicant?.toString() === userId)
            .map(a => a.job?.toString())
    );

    const recommendedJobs = {};
    for (const similar of similarUsers) {
        const theirApps = allApplications.filter(
            a => a.applicant?.toString() === similar.userId
        );
        for (const app of theirApps) {
            const jobId = app.job?.toString();
            if (!jobId || currentUserApps.has(jobId)) continue;
            if (!recommendedJobs[jobId]) {
                recommendedJobs[jobId] = { score: 0, count: 0 };
            }
            recommendedJobs[jobId].score += similar.similarity;
            recommendedJobs[jobId].count += 1;
        }
    }

    // Sort by aggregate similarity score
    return Object.entries(recommendedJobs)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 20)
        .map(([jobId, data]) => ({
            jobId,
            collaborativeScore: Math.round(data.score * 100),
            similarUserCount: data.count,
        }));
}

module.exports = {
    normalizeSkill,
    normalizeSkills,
    tokenize,
    computeTF,
    computeIDF,
    computeTFIDF,
    cosineSimilarity,
    buildJobCorpus,
    buildUserVector,
    scoreJobsWithTFIDF,
    collaborativeFilter,
    SKILL_SYNONYMS,
};
