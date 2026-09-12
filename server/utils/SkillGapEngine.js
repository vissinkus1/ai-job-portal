/**
 * SkillGapEngine.js
 * 
 * AI-powered Skill Gap Analysis & Learning Path Engine.
 * Analyzes user skills vs. market demand, identifies gaps,
 * and generates personalized learning roadmaps.
 */

const { SKILLS_DICTIONARY } = require("./resumeParser");

// ─── Skill Taxonomy Graph ────────────────────────────────────────
// Weighted adjacency list: skill → [{ skill, weight, relationship }]
// - weight: 0-1 (higher = stronger connection/prerequisite)
// - relationship: "prerequisite" | "complementary" | "progression" | "alternative"

const SKILL_GRAPH = {
    // Frontend progression chains
    "html": [
        { skill: "CSS", weight: 0.95, relationship: "prerequisite" },
        { skill: "JavaScript", weight: 0.9, relationship: "prerequisite" },
    ],
    "css": [
        { skill: "Sass", weight: 0.6, relationship: "progression" },
        { skill: "Tailwind CSS", weight: 0.5, relationship: "alternative" },
        { skill: "Bootstrap", weight: 0.5, relationship: "alternative" },
    ],
    "javascript": [
        { skill: "TypeScript", weight: 0.8, relationship: "progression" },
        { skill: "React", weight: 0.75, relationship: "progression" },
        { skill: "Vue", weight: 0.6, relationship: "alternative" },
        { skill: "Angular", weight: 0.6, relationship: "alternative" },
        { skill: "Node.js", weight: 0.7, relationship: "progression" },
        { skill: "jQuery", weight: 0.3, relationship: "complementary" },
    ],
    "typescript": [
        { skill: "React", weight: 0.7, relationship: "complementary" },
        { skill: "Angular", weight: 0.7, relationship: "complementary" },
        { skill: "Next.js", weight: 0.6, relationship: "progression" },
        { skill: "NestJS", weight: 0.5, relationship: "progression" },
    ],
    "react": [
        { skill: "Redux", weight: 0.7, relationship: "progression" },
        { skill: "Next.js", weight: 0.8, relationship: "progression" },
        { skill: "React Native", weight: 0.6, relationship: "progression" },
        { skill: "Zustand", weight: 0.4, relationship: "alternative" },
        { skill: "Material UI", weight: 0.4, relationship: "complementary" },
        { skill: "Storybook", weight: 0.3, relationship: "complementary" },
        { skill: "Jest", weight: 0.5, relationship: "complementary" },
    ],
    "vue": [
        { skill: "Nuxt.js", weight: 0.8, relationship: "progression" },
        { skill: "Vuex", weight: 0.6, relationship: "progression" },
    ],
    "angular": [
        { skill: "TypeScript", weight: 0.9, relationship: "prerequisite" },
        { skill: "RxJS", weight: 0.7, relationship: "complementary" },
    ],

    // Backend progression chains
    "node.js": [
        { skill: "Express", weight: 0.85, relationship: "progression" },
        { skill: "NestJS", weight: 0.6, relationship: "progression" },
        { skill: "MongoDB", weight: 0.6, relationship: "complementary" },
        { skill: "PostgreSQL", weight: 0.5, relationship: "complementary" },
        { skill: "Redis", weight: 0.4, relationship: "complementary" },
        { skill: "GraphQL", weight: 0.4, relationship: "complementary" },
    ],
    "express": [
        { skill: "MongoDB", weight: 0.7, relationship: "complementary" },
        { skill: "REST API", weight: 0.8, relationship: "complementary" },
        { skill: "JWT", weight: 0.6, relationship: "complementary" },
        { skill: "Microservices", weight: 0.4, relationship: "progression" },
    ],
    "python": [
        { skill: "Django", weight: 0.6, relationship: "progression" },
        { skill: "Flask", weight: 0.5, relationship: "progression" },
        { skill: "FastAPI", weight: 0.5, relationship: "progression" },
        { skill: "Pandas", weight: 0.5, relationship: "progression" },
        { skill: "NumPy", weight: 0.4, relationship: "progression" },
        { skill: "Machine Learning", weight: 0.5, relationship: "progression" },
    ],
    "java": [
        { skill: "Spring Boot", weight: 0.8, relationship: "progression" },
        { skill: "Spring", weight: 0.7, relationship: "progression" },
        { skill: "Kotlin", weight: 0.4, relationship: "complementary" },
        { skill: "Microservices", weight: 0.5, relationship: "progression" },
    ],

    // Database progression
    "mongodb": [
        { skill: "Redis", weight: 0.4, relationship: "complementary" },
        { skill: "Elasticsearch", weight: 0.3, relationship: "complementary" },
    ],
    "postgresql": [
        { skill: "Redis", weight: 0.4, relationship: "complementary" },
        { skill: "SQL", weight: 0.9, relationship: "prerequisite" },
    ],
    "sql": [
        { skill: "PostgreSQL", weight: 0.6, relationship: "progression" },
        { skill: "MySQL", weight: 0.6, relationship: "progression" },
        { skill: "SQL Server", weight: 0.4, relationship: "alternative" },
    ],

    // DevOps progression
    "git": [
        { skill: "GitHub", weight: 0.8, relationship: "progression" },
        { skill: "GitLab", weight: 0.5, relationship: "alternative" },
        { skill: "GitHub Actions", weight: 0.5, relationship: "progression" },
    ],
    "docker": [
        { skill: "Kubernetes", weight: 0.8, relationship: "progression" },
        { skill: "CI/CD", weight: 0.6, relationship: "complementary" },
    ],
    "aws": [
        { skill: "Docker", weight: 0.5, relationship: "complementary" },
        { skill: "Kubernetes", weight: 0.4, relationship: "complementary" },
        { skill: "Terraform", weight: 0.5, relationship: "complementary" },
        { skill: "Serverless", weight: 0.4, relationship: "progression" },
    ],
    "linux": [
        { skill: "Docker", weight: 0.6, relationship: "progression" },
        { skill: "Bash", weight: 0.7, relationship: "complementary" },
        { skill: "Nginx", weight: 0.4, relationship: "complementary" },
    ],

    // AI/ML progression
    "machine learning": [
        { skill: "Deep Learning", weight: 0.8, relationship: "progression" },
        { skill: "TensorFlow", weight: 0.6, relationship: "complementary" },
        { skill: "PyTorch", weight: 0.6, relationship: "complementary" },
        { skill: "Scikit-learn", weight: 0.7, relationship: "complementary" },
        { skill: "NLP", weight: 0.5, relationship: "progression" },
        { skill: "Computer Vision", weight: 0.5, relationship: "progression" },
    ],
    "deep learning": [
        { skill: "TensorFlow", weight: 0.7, relationship: "complementary" },
        { skill: "PyTorch", weight: 0.7, relationship: "complementary" },
        { skill: "Transformers", weight: 0.6, relationship: "progression" },
        { skill: "LLM", weight: 0.5, relationship: "progression" },
    ],
    "data science": [
        { skill: "Python", weight: 0.9, relationship: "prerequisite" },
        { skill: "Pandas", weight: 0.8, relationship: "prerequisite" },
        { skill: "NumPy", weight: 0.7, relationship: "prerequisite" },
        { skill: "Machine Learning", weight: 0.6, relationship: "progression" },
        { skill: "Power BI", weight: 0.4, relationship: "complementary" },
        { skill: "Tableau", weight: 0.4, relationship: "complementary" },
    ],

    // Mobile
    "react native": [
        { skill: "React", weight: 0.9, relationship: "prerequisite" },
        { skill: "Expo", weight: 0.6, relationship: "complementary" },
    ],
    "flutter": [
        { skill: "Dart", weight: 0.9, relationship: "prerequisite" },
        { skill: "Firebase", weight: 0.5, relationship: "complementary" },
    ],

    // Testing
    "jest": [
        { skill: "Unit Testing", weight: 0.8, relationship: "complementary" },
        { skill: "TDD", weight: 0.5, relationship: "progression" },
    ],
    "cypress": [
        { skill: "Selenium", weight: 0.4, relationship: "alternative" },
        { skill: "Playwright", weight: 0.5, relationship: "alternative" },
    ],
};

// ─── Skill Category Mapping ──────────────────────────────────────
// Maps each skill to its category for grouping in analysis
const SKILL_CATEGORIES = {};
for (const [category, skills] of Object.entries(SKILLS_DICTIONARY)) {
    for (const skill of skills) {
        SKILL_CATEGORIES[skill.toLowerCase()] = category;
    }
}

// ─── Role-Based Skill Templates ──────────────────────────────────
// What skills are typically expected for common roles
const ROLE_TEMPLATES = {
    "Frontend Developer": {
        core: ["HTML", "CSS", "JavaScript", "React"],
        recommended: ["TypeScript", "Next.js", "Redux", "Jest", "Git"],
        bonus: ["Tailwind CSS", "Storybook", "Webpack", "Figma", "Cypress"],
    },
    "Backend Developer": {
        core: ["Node.js", "Express", "MongoDB", "REST API"],
        recommended: ["PostgreSQL", "Redis", "Docker", "Git", "JWT"],
        bonus: ["GraphQL", "Microservices", "Kubernetes", "AWS", "CI/CD"],
    },
    "Full Stack Developer": {
        core: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB"],
        recommended: ["TypeScript", "Next.js", "PostgreSQL", "Git", "Docker"],
        bonus: ["Redis", "AWS", "GraphQL", "Jest", "CI/CD"],
    },
    "Data Scientist": {
        core: ["Python", "Pandas", "NumPy", "Machine Learning", "SQL"],
        recommended: ["Scikit-learn", "TensorFlow", "Data Analysis", "Jupyter"],
        bonus: ["Deep Learning", "NLP", "PyTorch", "Apache Spark", "Power BI"],
    },
    "DevOps Engineer": {
        core: ["Linux", "Docker", "Git", "CI/CD", "AWS"],
        recommended: ["Kubernetes", "Terraform", "Jenkins", "Bash", "Nginx"],
        bonus: ["Ansible", "GitHub Actions", "GCP", "Azure", "Prometheus"],
    },
    "Mobile Developer": {
        core: ["JavaScript", "React Native", "React"],
        recommended: ["TypeScript", "Expo", "Firebase", "Git", "REST API"],
        bonus: ["Flutter", "iOS", "Android", "Redux", "Jest"],
    },
    "AI/ML Engineer": {
        core: ["Python", "Machine Learning", "Deep Learning", "TensorFlow"],
        recommended: ["PyTorch", "NLP", "Computer Vision", "Docker", "Git"],
        bonus: ["LLM", "Transformers", "Hugging Face", "Kubernetes", "AWS"],
    },
};

/**
 * Analyze skill gaps for a user against market demand.
 * 
 * @param {string[]} userSkills - User's current skills
 * @param {Object[]} marketJobs - Array of job objects with skills arrays
 * @param {Object} options - Analysis options
 * @returns {Object} Complete gap analysis
 */
function analyzeSkillGaps(userSkills, marketJobs, options = {}) {
    const {
        targetRole = null,
        topN = 15,
    } = options;

    const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
    const userSkillSet = new Set(userSkillsLower);

    // 1. Calculate market demand frequency for each skill
    const skillDemand = {};
    for (const job of marketJobs) {
        const jobSkills = (job.skills || []).map(s => s.toLowerCase().trim());
        for (const skill of jobSkills) {
            skillDemand[skill] = (skillDemand[skill] || 0) + 1;
        }
    }

    // 2. Identify gap skills (in demand but user doesn't have)
    const gapSkills = [];
    for (const [skill, demand] of Object.entries(skillDemand)) {
        if (!userSkillSet.has(skill)) {
            // Check if any user skill is a variant/substring
            const hasVariant = userSkillsLower.some(us =>
                us.includes(skill) || skill.includes(us)
            );
            if (!hasVariant) {
                gapSkills.push({
                    skill: capitalize(skill),
                    demand,
                    demandPercentage: Math.round((demand / marketJobs.length) * 100),
                    category: SKILL_CATEGORIES[skill] || "other",
                    priority: calculateGapPriority(skill, demand, marketJobs.length, userSkillsLower),
                });
            }
        }
    }

    // Sort by priority (composite of demand + graph proximity)
    gapSkills.sort((a, b) => b.priority - a.priority);
    const topGaps = gapSkills.slice(0, topN);

    // 3. Analyze user's existing skills — market value
    const ownedSkillValues = userSkillsLower.map(skill => ({
        skill: capitalize(skill),
        demand: skillDemand[skill] || 0,
        demandPercentage: Math.round(((skillDemand[skill] || 0) / Math.max(marketJobs.length, 1)) * 100),
        category: SKILL_CATEGORIES[skill] || "other",
    })).sort((a, b) => b.demand - a.demand);

    // 4. Role-based gap analysis (if target role provided)
    let roleAnalysis = null;
    if (targetRole && ROLE_TEMPLATES[targetRole]) {
        roleAnalysis = analyzeRoleGap(userSkillsLower, ROLE_TEMPLATES[targetRole], targetRole);
    }

    // 5. Auto-detect best matching roles
    const roleMatches = detectBestRoles(userSkillsLower);

    // 6. Market readiness score
    const readinessScore = calculateReadinessScore(userSkillsLower, skillDemand, marketJobs.length);

    // 7. Generate learning paths
    const learningPaths = generateLearningPaths(userSkillsLower, topGaps);

    // 8. Category breakdown
    const categoryBreakdown = getCategoryBreakdown(userSkillsLower, gapSkills);

    return {
        readinessScore,
        ownedSkills: ownedSkillValues,
        gapSkills: topGaps,
        learningPaths,
        roleMatches,
        roleAnalysis,
        categoryBreakdown,
        totalJobsAnalyzed: marketJobs.length,
        totalUniqueSkillsInMarket: Object.keys(skillDemand).length,
    };
}

/**
 * Calculate gap priority — how urgently should the user learn this skill?
 * Factors: market demand, proximity to existing skills, growth potential
 */
function calculateGapPriority(gapSkill, demand, totalJobs, userSkills) {
    let priority = 0;

    // Factor 1: Market demand (0-40 points)
    const demandRatio = demand / Math.max(totalJobs, 1);
    priority += Math.min(demandRatio * 200, 40);

    // Factor 2: Graph proximity to user's existing skills (0-35 points)
    let maxProximity = 0;
    for (const userSkill of userSkills) {
        const edges = SKILL_GRAPH[userSkill] || [];
        for (const edge of edges) {
            if (edge.skill.toLowerCase() === gapSkill) {
                maxProximity = Math.max(maxProximity, edge.weight);
            }
        }
    }
    priority += maxProximity * 35;

    // Factor 3: Skill has many connections in graph (versatile skill) (0-15 points)
    const outEdges = SKILL_GRAPH[gapSkill] || [];
    priority += Math.min(outEdges.length * 2.5, 15);

    // Factor 4: Category diversity bonus (0-10 points)
    const gapCategory = SKILL_CATEGORIES[gapSkill] || "other";
    const userCategories = new Set(userSkills.map(s => SKILL_CATEGORIES[s] || "other"));
    if (!userCategories.has(gapCategory)) {
        priority += 10; // Bonus for diversifying skill categories
    }

    return Math.round(priority);
}

/**
 * Calculate overall market readiness score (0-100).
 */
function calculateReadinessScore(userSkills, skillDemand, totalJobs) {
    if (userSkills.length === 0 || totalJobs === 0) return 0;

    // Get top 20 most demanded skills
    const topDemanded = Object.entries(skillDemand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    if (topDemanded.length === 0) return 0;

    // How many of the top-demanded skills does the user have?
    let matchCount = 0;
    let weightedMatch = 0;
    const userSet = new Set(userSkills);

    for (let i = 0; i < topDemanded.length; i++) {
        const [skill, demand] = topDemanded[i];
        const weight = (topDemanded.length - i) / topDemanded.length; // Higher weight for more in-demand
        if (userSet.has(skill)) {
            matchCount++;
            weightedMatch += weight;
        }
    }

    // Coverage score (0-50): What % of jobs could the user's skills match?
    const totalDemandHits = userSkills.reduce((sum, s) => sum + (skillDemand[s] || 0), 0);
    const coverageScore = Math.min((totalDemandHits / (totalJobs * 3)) * 50, 50); // Normalized

    // Match score (0-35): How many top-demanded skills does user have?
    const matchScore = (weightedMatch / topDemanded.length) * 70;

    // Diversity score (0-15): How many skill categories does user cover?
    const categories = new Set(userSkills.map(s => SKILL_CATEGORIES[s] || "other"));
    const diversityScore = Math.min(categories.size * 3, 15);

    return Math.min(Math.round(coverageScore + matchScore + diversityScore), 100);
}

/**
 * Analyze gaps against a specific role template.
 */
function analyzeRoleGap(userSkills, template, roleName) {
    const userSet = new Set(userSkills);

    const check = (skills) => skills.map(s => ({
        skill: s,
        has: userSet.has(s.toLowerCase()) || userSkills.some(us =>
            us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)
        ),
    }));

    const coreSkills = check(template.core);
    const recommendedSkills = check(template.recommended);
    const bonusSkills = check(template.bonus);

    const coreMatched = coreSkills.filter(s => s.has).length;
    const recMatched = recommendedSkills.filter(s => s.has).length;
    const bonusMatched = bonusSkills.filter(s => s.has).length;

    // Weighted role readiness: core=50%, recommended=35%, bonus=15%
    const roleReadiness = Math.round(
        (coreMatched / template.core.length) * 50 +
        (recMatched / template.recommended.length) * 35 +
        (bonusMatched / template.bonus.length) * 15
    );

    return {
        role: roleName,
        readiness: roleReadiness,
        core: { skills: coreSkills, matched: coreMatched, total: template.core.length },
        recommended: { skills: recommendedSkills, matched: recMatched, total: template.recommended.length },
        bonus: { skills: bonusSkills, matched: bonusMatched, total: template.bonus.length },
        nextSteps: coreSkills
            .filter(s => !s.has)
            .map(s => s.skill)
            .concat(recommendedSkills.filter(s => !s.has).map(s => s.skill))
            .slice(0, 5),
    };
}

/**
 * Detect which roles best match the user's current skills.
 */
function detectBestRoles(userSkills) {
    const results = [];
    const userSet = new Set(userSkills);

    for (const [role, template] of Object.entries(ROLE_TEMPLATES)) {
        const allSkills = [...template.core, ...template.recommended, ...template.bonus];
        let matchCount = 0;
        let weightedScore = 0;

        for (const skill of template.core) {
            if (userSet.has(skill.toLowerCase()) || userSkills.some(us =>
                us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
            )) {
                matchCount++;
                weightedScore += 3; // Core skills weighted 3x
            }
        }
        for (const skill of template.recommended) {
            if (userSet.has(skill.toLowerCase()) || userSkills.some(us =>
                us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
            )) {
                matchCount++;
                weightedScore += 2;
            }
        }
        for (const skill of template.bonus) {
            if (userSet.has(skill.toLowerCase()) || userSkills.some(us =>
                us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
            )) {
                matchCount++;
                weightedScore += 1;
            }
        }

        const maxWeighted = template.core.length * 3 + template.recommended.length * 2 + template.bonus.length;
        const matchPercentage = Math.round((weightedScore / maxWeighted) * 100);

        if (matchPercentage > 10) {
            results.push({
                role,
                matchPercentage,
                matchedCount: matchCount,
                totalSkills: allSkills.length,
                missingCore: template.core.filter(s =>
                    !userSet.has(s.toLowerCase()) && !userSkills.some(us =>
                        us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)
                    )
                ),
            });
        }
    }

    return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Generate learning paths based on skill graph traversal.
 * Creates ordered sequences of skills to learn.
 */
function generateLearningPaths(userSkills, gapSkills) {
    const userSet = new Set(userSkills);
    const paths = [];
    const visited = new Set();

    // For each high-priority gap skill, trace back prerequisites
    for (const gap of gapSkills.slice(0, 8)) {
        if (visited.has(gap.skill.toLowerCase())) continue;

        const path = buildPath(gap.skill.toLowerCase(), userSet, visited);
        if (path.length > 0) {
            paths.push({
                target: gap.skill,
                targetDemand: gap.demand,
                targetCategory: gap.category,
                steps: path,
                estimatedWeeks: Math.max(path.length * 2, 2), // Rough estimate: 2 weeks per skill
                difficulty: path.length <= 2 ? "beginner" : path.length <= 4 ? "intermediate" : "advanced",
            });
        }
    }

    return paths.slice(0, 5); // Top 5 learning paths
}

/**
 * Build a learning path from user's existing skills to a target skill.
 */
function buildPath(targetSkill, userSet, visited) {
    const steps = [];

    // Check if the target has prerequisites the user is missing
    // Walk backwards through the graph
    const queue = [targetSkill];
    const prerequisites = [];

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current) || userSet.has(current)) continue;
        visited.add(current);

        // Find what leads TO this skill (reverse graph lookup)
        for (const [source, edges] of Object.entries(SKILL_GRAPH)) {
            for (const edge of edges) {
                if (edge.skill.toLowerCase() === current && edge.relationship === "prerequisite") {
                    if (!userSet.has(source)) {
                        queue.push(source);
                        prerequisites.push({
                            skill: capitalize(source),
                            reason: `Prerequisite for ${capitalize(current)}`,
                            relationship: "prerequisite",
                        });
                    }
                }
            }
        }

        if (current !== targetSkill) {
            steps.unshift({
                skill: capitalize(current),
                reason: `Builds foundation for ${capitalize(targetSkill)}`,
                relationship: "stepping-stone",
            });
        }
    }

    // Add prerequisites first, then the target
    const orderedSteps = [...prerequisites.reverse(), ...steps];
    orderedSteps.push({
        skill: capitalize(targetSkill),
        reason: `Target skill — ${SKILL_CATEGORIES[targetSkill] || "general"} category`,
        relationship: "target",
    });

    // Find complementary skills that pair well with the target
    const targetEdges = SKILL_GRAPH[targetSkill] || [];
    const complementary = targetEdges
        .filter(e => e.relationship === "complementary" && !userSet.has(e.skill.toLowerCase()))
        .slice(0, 2)
        .map(e => ({
            skill: e.skill,
            reason: `Pairs well with ${capitalize(targetSkill)}`,
            relationship: "complementary",
        }));

    return [...orderedSteps, ...complementary];
}

/**
 * Get category-level breakdown of user skills vs. gaps.
 */
function getCategoryBreakdown(userSkills, allGapSkills) {
    const categories = {};

    // Count user skills per category
    for (const skill of userSkills) {
        const cat = SKILL_CATEGORIES[skill] || "other";
        if (!categories[cat]) categories[cat] = { owned: 0, gaps: 0, topGaps: [] };
        categories[cat].owned++;
    }

    // Count gap skills per category
    for (const gap of allGapSkills) {
        const cat = gap.category || "other";
        if (!categories[cat]) categories[cat] = { owned: 0, gaps: 0, topGaps: [] };
        categories[cat].gaps++;
        if (categories[cat].topGaps.length < 3) {
            categories[cat].topGaps.push(gap.skill);
        }
    }

    // Format nicely
    const CATEGORY_LABELS = {
        languages: "Programming Languages",
        frontend: "Frontend Development",
        backend: "Backend Development",
        databases: "Databases",
        devops: "Cloud & DevOps",
        ai_ml: "AI / Machine Learning",
        mobile: "Mobile Development",
        tools: "Tools & Practices",
        business: "Business & Soft Skills",
        security: "Security",
        blockchain: "Blockchain",
        other: "Other",
    };

    return Object.entries(categories).map(([key, data]) => ({
        category: CATEGORY_LABELS[key] || key,
        categoryKey: key,
        owned: data.owned,
        gaps: data.gaps,
        topGaps: data.topGaps,
        strength: data.owned > 3 ? "strong" : data.owned > 1 ? "moderate" : "weak",
    })).sort((a, b) => b.owned - a.owned);
}

/**
 * Get available role templates.
 */
function getAvailableRoles() {
    return Object.keys(ROLE_TEMPLATES);
}

/**
 * Get trending skill progression paths in the market.
 * Based on co-occurrence analysis of skills in recent jobs.
 */
function getTrendingPaths(jobs) {
    // Find skill co-occurrences
    const coOccurrence = {};

    for (const job of jobs) {
        const skills = (job.skills || []).map(s => s.toLowerCase().trim());
        for (let i = 0; i < skills.length; i++) {
            for (let j = i + 1; j < skills.length; j++) {
                const pair = [skills[i], skills[j]].sort().join("|||");
                coOccurrence[pair] = (coOccurrence[pair] || 0) + 1;
            }
        }
    }

    // Get top co-occurring pairs
    const topPairs = Object.entries(coOccurrence)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([pair, count]) => {
            const [skill1, skill2] = pair.split("|||");
            return {
                skills: [capitalize(skill1), capitalize(skill2)],
                coOccurrences: count,
                percentage: Math.round((count / jobs.length) * 100),
            };
        });

    // Build popular stacks (clusters of frequently co-occurring skills)
    const popularStacks = identifyPopularStacks(jobs);

    return { topPairs, popularStacks };
}

/**
 * Identify popular technology stacks from job data.
 */
function identifyPopularStacks(jobs) {
    const stackPatterns = [
        { name: "MERN Stack", skills: ["mongodb", "express", "react", "node.js"] },
        { name: "MEAN Stack", skills: ["mongodb", "express", "angular", "node.js"] },
        { name: "Python ML Stack", skills: ["python", "tensorflow", "pandas", "numpy"] },
        { name: "Django Stack", skills: ["python", "django", "postgresql"] },
        { name: "Next.js Full Stack", skills: ["react", "next.js", "typescript"] },
        { name: "AWS Cloud Stack", skills: ["aws", "docker", "kubernetes"] },
        { name: "Java Enterprise", skills: ["java", "spring boot", "postgresql"] },
    ];

    return stackPatterns.map(stack => {
        let count = 0;
        for (const job of jobs) {
            const jobSkillsLower = (job.skills || []).map(s => s.toLowerCase());
            const matched = stack.skills.filter(s => jobSkillsLower.includes(s));
            if (matched.length >= Math.ceil(stack.skills.length * 0.6)) {
                count++;
            }
        }
        return {
            name: stack.name,
            skills: stack.skills.map(capitalize),
            jobCount: count,
            percentage: Math.round((count / Math.max(jobs.length, 1)) * 100),
        };
    }).filter(s => s.jobCount > 0).sort((a, b) => b.jobCount - a.jobCount);
}

// Helper
function capitalize(str) {
    if (!str) return str;
    // Handle special cases
    const specials = {
        "html": "HTML", "css": "CSS", "sql": "SQL", "aws": "AWS",
        "gcp": "GCP", "jwt": "JWT", "api": "API", "ci/cd": "CI/CD",
        "rest api": "REST API", "ui": "UI", "ux": "UX",
        "node.js": "Node.js", "react.js": "React.js", "vue.js": "Vue.js",
        "next.js": "Next.js", "nuxt.js": "Nuxt.js", "express.js": "Express.js",
        "d3.js": "D3.js", "three.js": "Three.js",
        "mongodb": "MongoDB", "postgresql": "PostgreSQL", "mysql": "MySQL",
        "graphql": "GraphQL", "typescript": "TypeScript", "javascript": "JavaScript",
        "nestjs": "NestJS", "rxjs": "RxJS", "nosql": "NoSQL",
        "tensorflow": "TensorFlow", "pytorch": "PyTorch", "opencv": "OpenCV",
        "nlp": "NLP", "llm": "LLM", "gpt": "GPT",
    };
    if (specials[str.toLowerCase()]) return specials[str.toLowerCase()];
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
    analyzeSkillGaps,
    calculateReadinessScore,
    detectBestRoles,
    generateLearningPaths,
    getTrendingPaths,
    getAvailableRoles,
    ROLE_TEMPLATES,
    SKILL_GRAPH,
};
