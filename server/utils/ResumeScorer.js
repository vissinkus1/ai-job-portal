/**
 * ResumeScorer.js
 * 
 * AI-powered Resume Scoring Engine.
 * Analyzes resume quality across multiple dimensions:
 * - Completeness (key sections present)
 * - ATS Compatibility (format, keywords, structure)
 * - Competitive Benchmarking (vs. other applicants)
 * - Actionable Improvement Suggestions
 */

const { ALL_SKILLS, SKILLS_DICTIONARY } = require("./resumeParser");

// ─── Resume Section Patterns ─────────────────────────────────────
const RESUME_SECTIONS = {
    contact: {
        label: "Contact Information",
        weight: 10,
        patterns: [
            /(?:email|e-mail)\s*[:.]?\s*[\w.-]+@[\w.-]+/i,
            /(?:phone|tel|mobile|cell)\s*[:.]?\s*[\+\d\s\(\)\-]{7,}/i,
            /linkedin\.com\/in\//i,
            /github\.com\//i,
        ],
        minMatches: 2,
        suggestions: {
            missing: "Add your email, phone number, LinkedIn, and GitHub profile links",
            partial: "Include at least email and phone. LinkedIn and GitHub profiles are highly recommended",
        },
    },
    summary: {
        label: "Professional Summary",
        weight: 12,
        patterns: [
            /(?:summary|objective|about\s*me|professional\s*summary|career\s*summary|profile)/i,
        ],
        contentCheck: (text) => {
            // Check if there's a block of 2-5 sentences near the top
            const lines = text.split("\n").slice(0, 15);
            const longLines = lines.filter(l => l.trim().length > 80);
            return longLines.length >= 1;
        },
        minMatches: 0, // Use contentCheck instead
        suggestions: {
            missing: "Add a 2-3 sentence professional summary at the top highlighting your key strengths and career goals",
            partial: "Your summary exists but could be more impactful. Include years of experience, key skills, and your career objective",
        },
    },
    experience: {
        label: "Work Experience",
        weight: 25,
        patterns: [
            /(?:work\s*experience|experience|employment|work\s*history|professional\s*experience)/i,
            /(?:20\d{2})\s*[-–—to]+\s*(?:20\d{2}|present|current)/i,
            /(?:intern|developer|engineer|analyst|manager|designer|consultant|associate)/i,
        ],
        minMatches: 1,
        suggestions: {
            missing: "Add a work experience section with job titles, companies, dates, and bullet-point achievements",
            partial: "Include specific achievements with quantifiable results (e.g., 'Improved load time by 40%')",
        },
    },
    education: {
        label: "Education",
        weight: 12,
        patterns: [
            /(?:education|academic|qualification|degree|university|college|institute)/i,
            /(?:b\.?tech|b\.?e\.?|b\.?sc|b\.?s\.?|m\.?tech|m\.?s\.?|mba|mca|bca|ph\.?d|bachelor|master|diploma)/i,
        ],
        minMatches: 1,
        suggestions: {
            missing: "Add your education details: degree, institution, graduation year, and relevant coursework",
            partial: "Include your GPA (if above 3.0/7.0) and relevant coursework or academic achievements",
        },
    },
    skills: {
        label: "Technical Skills",
        weight: 20,
        patterns: [
            /(?:skills|technical\s*skills|technologies|tech\s*stack|competencies|proficiencies)/i,
        ],
        contentCheck: (text) => {
            // Count recognized skills
            let found = 0;
            for (const skill of ALL_SKILLS) {
                const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) found++;
            }
            return found >= 3;
        },
        minMatches: 0,
        suggestions: {
            missing: "Add a dedicated skills section listing your technical skills, tools, and technologies",
            partial: "Organize skills by category (Languages, Frameworks, Databases, Tools) for better readability",
        },
    },
    projects: {
        label: "Projects",
        weight: 15,
        patterns: [
            /(?:projects|personal\s*projects|key\s*projects|notable\s*projects|portfolio)/i,
            /(?:github\.com|deployed|built|developed|created|implemented)\s/i,
        ],
        minMatches: 1,
        suggestions: {
            missing: "Add 2-3 notable projects with descriptions, tech stack used, and links (GitHub/live demo)",
            partial: "For each project, mention the problem solved, technologies used, and measurable outcomes",
        },
    },
    certifications: {
        label: "Certifications",
        weight: 6,
        patterns: [
            /(?:certification|certified|certificate|credential|accreditation)/i,
            /(?:aws\s*certified|google\s*certified|microsoft\s*certified|oracle\s*certified)/i,
            /(?:coursera|udemy|edx|linkedin\s*learning|hackerrank)/i,
        ],
        minMatches: 1,
        suggestions: {
            missing: "Add relevant certifications (AWS, Google Cloud, Coursera, etc.) to strengthen your profile",
            partial: "Include the certification name, issuing organization, and date obtained",
        },
    },
};

// ─── ATS Compatibility Checks ────────────────────────────────────
const ATS_CHECKS = [
    {
        id: "file_format",
        label: "File Format",
        description: "Resume should be in PDF format for maximum ATS compatibility",
        check: (_, meta) => meta?.fileFormat === ".pdf",
        weight: 8,
        suggestion: "Use PDF format. Avoid .docx, images, or complex layouts",
    },
    {
        id: "length",
        label: "Resume Length",
        description: "Resume should be 1-2 pages (400-1200 words)",
        check: (text) => {
            const words = text.split(/\s+/).filter(w => w.length > 0).length;
            return words >= 300 && words <= 1500;
        },
        weight: 8,
        suggestion: "Keep your resume between 1-2 pages. Currently it may be too short or too long",
    },
    {
        id: "bullet_points",
        label: "Bullet Points",
        description: "Use bullet points for experience and achievements",
        check: (text) => {
            const bulletPatterns = /^[\s]*[•\-\*\u2022\u2023\u25E6\u2043]\s/gm;
            const matches = text.match(bulletPatterns);
            return matches && matches.length >= 3;
        },
        weight: 7,
        suggestion: "Use bullet points to list achievements and responsibilities. Start each with an action verb",
    },
    {
        id: "action_verbs",
        label: "Action Verbs",
        description: "Start bullet points with strong action verbs",
        check: (text) => {
            const actionVerbs = [
                "developed", "built", "designed", "implemented", "created",
                "managed", "led", "improved", "optimized", "automated",
                "deployed", "architected", "maintained", "reduced", "increased",
                "launched", "delivered", "integrated", "collaborated", "mentored",
                "analyzed", "resolved", "streamlined", "engineered", "refactored",
            ];
            let found = 0;
            for (const verb of actionVerbs) {
                if (new RegExp(`\\b${verb}\\b`, "i").test(text)) found++;
            }
            return found >= 3;
        },
        weight: 7,
        suggestion: "Start experience bullets with action verbs: Built, Developed, Implemented, Optimized, Led",
    },
    {
        id: "quantifiable_achievements",
        label: "Quantifiable Results",
        description: "Include numbers and metrics in achievements",
        check: (text) => {
            const quantPatterns = [
                /\d+\s*%/g,              // percentages
                /\d+\s*(?:users|customers|clients|teams?)/gi,
                /\$\s*[\d,.]+/g,          // dollar amounts
                /(?:reduced|improved|increased|grew|saved)\s.*?\d/gi,
                /\d+x\s/gi,              // multipliers
            ];
            let found = 0;
            for (const pattern of quantPatterns) {
                const matches = text.match(pattern);
                if (matches) found += matches.length;
            }
            return found >= 2;
        },
        weight: 10,
        suggestion: "Add quantifiable metrics: 'Improved performance by 40%', 'Served 10K+ users', 'Reduced costs by $50K'",
    },
    {
        id: "keyword_density",
        label: "Keyword Optimization",
        description: "Resume contains relevant technical keywords",
        check: (text) => {
            let skillCount = 0;
            for (const skill of ALL_SKILLS) {
                const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                if (new RegExp(escaped, "i").test(text)) skillCount++;
            }
            return skillCount >= 5;
        },
        weight: 10,
        suggestion: "Include more relevant technical keywords that match job descriptions in your target field",
    },
    {
        id: "no_personal_pronouns",
        label: "Professional Tone",
        description: "Avoid first-person pronouns (I, me, my) in experience section",
        check: (text) => {
            const pronounCount = (text.match(/\b(?:I|me|my|myself)\b/g) || []).length;
            const words = text.split(/\s+/).length;
            return pronounCount / words < 0.01; // Less than 1% pronouns
        },
        weight: 5,
        suggestion: "Remove first-person pronouns (I, me, my). Use action verbs instead: 'Developed...' not 'I developed...'",
    },
    {
        id: "no_graphics",
        label: "ATS-Safe Formatting",
        description: "Avoid tables, graphics, headers/footers that confuse ATS",
        check: (text) => {
            // If text was parsed successfully, it's likely ATS-readable
            const words = text.split(/\s+/).filter(w => w.length > 0).length;
            return words > 100; // If we got enough text, formatting is likely OK
        },
        weight: 5,
        suggestion: "Use a clean, single-column layout. Avoid tables, text boxes, images, and complex formatting",
    },
    {
        id: "consistent_dates",
        label: "Consistent Date Format",
        description: "Use consistent date formatting throughout",
        check: (text) => {
            const datePatterns = [
                /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+20\d{2}/gi,
                /20\d{2}\s*[-–—]\s*(?:20\d{2}|present)/gi,
                /\d{1,2}\/20\d{2}/g,
            ];
            let found = 0;
            for (const pattern of datePatterns) {
                const matches = text.match(pattern);
                if (matches) found += matches.length;
            }
            return found >= 2;
        },
        weight: 5,
        suggestion: "Use consistent date format throughout (e.g., 'Jan 2023 - Present' or '2023 - Present')",
    },
];

/**
 * Score a resume text across all dimensions.
 * 
 * @param {string} text - Raw resume text
 * @param {Object} meta - Metadata (fileFormat, etc.)
 * @param {Object} options - Scoring options
 * @returns {Object} Complete score breakdown
 */
function scoreResume(text, meta = {}, options = {}) {
    const normalizedText = text || "";
    const wordCount = normalizedText.split(/\s+/).filter(w => w.length > 0).length;

    // 1. Section completeness scoring
    const sectionResults = analyzeSections(normalizedText);

    // 2. ATS compatibility scoring
    const atsResults = analyzeATS(normalizedText, meta);

    // 3. Skill coverage analysis
    const skillAnalysis = analyzeSkillCoverage(normalizedText);

    // 4. Content quality indicators
    const qualityIndicators = analyzeContentQuality(normalizedText);

    // 5. Calculate composite scores
    const sectionScore = sectionResults.reduce((sum, s) => sum + s.earnedPoints, 0);
    const maxSectionScore = sectionResults.reduce((sum, s) => sum + s.maxPoints, 0);
    const sectionPercentage = Math.round((sectionScore / Math.max(maxSectionScore, 1)) * 100);

    const atsScore = atsResults.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
    const maxAtsScore = atsResults.reduce((sum, c) => sum + c.weight, 0);
    const atsPercentage = Math.round((atsScore / Math.max(maxAtsScore, 1)) * 100);

    // Overall score (weighted: sections 40%, ATS 35%, skills 15%, quality 10%)
    const overallScore = Math.round(
        sectionPercentage * 0.40 +
        atsPercentage * 0.35 +
        skillAnalysis.coverageScore * 0.15 +
        qualityIndicators.qualityScore * 0.10
    );

    // Generate prioritized improvement suggestions
    const improvements = generateImprovements(sectionResults, atsResults, skillAnalysis, qualityIndicators);

    // Letter grade
    const grade = overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" :
        overallScore >= 70 ? "B+" : overallScore >= 60 ? "B" :
        overallScore >= 50 ? "C+" : overallScore >= 40 ? "C" :
        overallScore >= 30 ? "D" : "F";

    return {
        overallScore,
        grade,
        wordCount,
        breakdown: {
            sections: {
                score: sectionPercentage,
                weight: "40%",
                results: sectionResults,
            },
            atsCompatibility: {
                score: atsPercentage,
                weight: "35%",
                results: atsResults,
            },
            skillCoverage: {
                score: skillAnalysis.coverageScore,
                weight: "15%",
                ...skillAnalysis,
            },
            contentQuality: {
                score: qualityIndicators.qualityScore,
                weight: "10%",
                ...qualityIndicators,
            },
        },
        improvements,
        summary: generateSummary(overallScore, sectionResults, atsResults),
    };
}

/**
 * Analyze presence and quality of resume sections.
 */
function analyzeSections(text) {
    return Object.entries(RESUME_SECTIONS).map(([key, section]) => {
        let matchCount = 0;
        for (const pattern of section.patterns) {
            if (pattern.test(text)) matchCount++;
        }

        let contentOk = true;
        if (section.contentCheck) {
            contentOk = section.contentCheck(text);
        }

        const hasSection = matchCount >= section.minMatches || (section.contentCheck && contentOk);
        const isPartial = matchCount > 0 && matchCount < section.minMatches;
        const status = hasSection ? "present" : isPartial ? "partial" : "missing";

        let earnedPoints = 0;
        if (hasSection) earnedPoints = section.weight;
        else if (isPartial) earnedPoints = Math.round(section.weight * 0.4);

        return {
            section: key,
            label: section.label,
            status,
            maxPoints: section.weight,
            earnedPoints,
            suggestion: hasSection ? null : isPartial ? section.suggestions.partial : section.suggestions.missing,
        };
    });
}

/**
 * Run ATS compatibility checks.
 */
function analyzeATS(text, meta) {
    return ATS_CHECKS.map(check => {
        const passed = check.check(text, meta);
        return {
            id: check.id,
            label: check.label,
            description: check.description,
            passed,
            weight: check.weight,
            suggestion: passed ? null : check.suggestion,
        };
    });
}

/**
 * Analyze technical skill coverage and density.
 */
function analyzeSkillCoverage(text) {
    const foundSkills = [];
    const categoryHits = {};

    for (const [category, skills] of Object.entries(SKILLS_DICTIONARY)) {
        for (const skill of skills) {
            const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = skill.length <= 3
                ? new RegExp(`\\b${escaped}\\b`, "i")
                : new RegExp(escaped, "i");

            if (pattern.test(text)) {
                foundSkills.push({ skill, category });
                categoryHits[category] = (categoryHits[category] || 0) + 1;
            }
        }
    }

    const categoriesPresent = Object.keys(categoryHits).length;
    const totalCategories = Object.keys(SKILLS_DICTIONARY).length;

    // Coverage score based on skill count and category diversity
    let coverageScore = 0;
    if (foundSkills.length >= 15) coverageScore = 100;
    else if (foundSkills.length >= 10) coverageScore = 80;
    else if (foundSkills.length >= 7) coverageScore = 65;
    else if (foundSkills.length >= 5) coverageScore = 50;
    else if (foundSkills.length >= 3) coverageScore = 35;
    else coverageScore = Math.round((foundSkills.length / 3) * 20);

    // Diversity bonus
    if (categoriesPresent >= 4) coverageScore = Math.min(coverageScore + 10, 100);

    return {
        coverageScore,
        skillCount: foundSkills.length,
        skills: foundSkills,
        categoryHits,
        categoriesPresent,
        totalCategories,
    };
}

/**
 * Analyze content quality indicators.
 */
function analyzeContentQuality(text) {
    const indicators = [];
    let qualityScore = 50; // Start at neutral

    // 1. Word count check
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    if (words >= 400 && words <= 1200) {
        indicators.push({ label: "Optimal Length", status: "good", detail: `${words} words` });
        qualityScore += 15;
    } else if (words < 200) {
        indicators.push({ label: "Too Short", status: "bad", detail: `Only ${words} words — aim for 400-800` });
        qualityScore -= 20;
    } else if (words > 1500) {
        indicators.push({ label: "Too Long", status: "warning", detail: `${words} words — consider trimming to under 1200` });
        qualityScore -= 5;
    } else {
        indicators.push({ label: "Acceptable Length", status: "ok", detail: `${words} words` });
        qualityScore += 5;
    }

    // 2. Action verb density
    const actionVerbs = [
        "developed", "built", "designed", "implemented", "created", "managed",
        "led", "improved", "optimized", "automated", "deployed", "architected",
        "maintained", "reduced", "increased", "launched", "delivered", "integrated",
    ];
    let verbCount = 0;
    for (const verb of actionVerbs) {
        const matches = text.match(new RegExp(`\\b${verb}\\b`, "gi"));
        if (matches) verbCount += matches.length;
    }
    if (verbCount >= 8) {
        indicators.push({ label: "Strong Action Verbs", status: "good", detail: `${verbCount} action verbs found` });
        qualityScore += 15;
    } else if (verbCount >= 4) {
        indicators.push({ label: "Some Action Verbs", status: "ok", detail: `${verbCount} found — aim for 8+` });
        qualityScore += 5;
    } else {
        indicators.push({ label: "Weak Action Verbs", status: "bad", detail: "Use more action verbs like Built, Designed, Implemented" });
        qualityScore -= 10;
    }

    // 3. Quantifiable achievements
    const numbers = text.match(/\d+\s*%|\$\s*[\d,.]+|\d+\s*(?:users|clients|projects?|team)/gi);
    const numCount = numbers ? numbers.length : 0;
    if (numCount >= 5) {
        indicators.push({ label: "Well Quantified", status: "good", detail: `${numCount} quantifiable metrics found` });
        qualityScore += 15;
    } else if (numCount >= 2) {
        indicators.push({ label: "Some Metrics", status: "ok", detail: `${numCount} metrics — add more numbers to stand out` });
        qualityScore += 5;
    } else {
        indicators.push({ label: "Needs Metrics", status: "bad", detail: "Add quantifiable achievements (%, $, numbers)" });
        qualityScore -= 10;
    }

    // 4. URLs/links present (GitHub, portfolio, LinkedIn)
    const links = text.match(/(?:https?:\/\/|www\.)\S+/gi);
    if (links && links.length >= 2) {
        indicators.push({ label: "Portfolio Links", status: "good", detail: `${links.length} links found` });
        qualityScore += 5;
    } else if (links && links.length >= 1) {
        indicators.push({ label: "Some Links", status: "ok", detail: "Add GitHub and LinkedIn links" });
    } else {
        indicators.push({ label: "No Links", status: "warning", detail: "Add your GitHub, LinkedIn, and portfolio links" });
        qualityScore -= 5;
    }

    return {
        qualityScore: Math.max(0, Math.min(100, qualityScore)),
        indicators,
    };
}

/**
 * Generate prioritized improvement suggestions.
 */
function generateImprovements(sectionResults, atsResults, skillAnalysis, qualityIndicators) {
    const improvements = [];

    // From missing/partial sections
    for (const section of sectionResults) {
        if (section.suggestion) {
            improvements.push({
                priority: section.status === "missing" ? "high" : "medium",
                category: "section",
                label: section.label,
                suggestion: section.suggestion,
                impact: section.maxPoints,
            });
        }
    }

    // From failed ATS checks
    for (const check of atsResults) {
        if (!check.passed) {
            improvements.push({
                priority: check.weight >= 8 ? "high" : "medium",
                category: "ats",
                label: check.label,
                suggestion: check.suggestion,
                impact: check.weight,
            });
        }
    }

    // From quality indicators
    for (const indicator of qualityIndicators.indicators) {
        if (indicator.status === "bad") {
            improvements.push({
                priority: "high",
                category: "quality",
                label: indicator.label,
                suggestion: indicator.detail,
                impact: 10,
            });
        } else if (indicator.status === "warning") {
            improvements.push({
                priority: "low",
                category: "quality",
                label: indicator.label,
                suggestion: indicator.detail,
                impact: 5,
            });
        }
    }

    // Sort by impact (high priority first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    improvements.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.impact - a.impact;
    });

    return improvements;
}

/**
 * Generate a human-readable summary of the resume analysis.
 */
function generateSummary(score, sectionResults, atsResults) {
    const missing = sectionResults.filter(s => s.status === "missing").map(s => s.label);
    const atsFailures = atsResults.filter(c => !c.passed).length;

    let summary = "";

    if (score >= 80) {
        summary = "Excellent resume! Your resume is well-structured and ATS-friendly. ";
    } else if (score >= 60) {
        summary = "Good foundation, but there's room for improvement. ";
    } else if (score >= 40) {
        summary = "Your resume needs significant improvements to be competitive. ";
    } else {
        summary = "Your resume needs major work before submitting to employers. ";
    }

    if (missing.length > 0) {
        summary += `Missing key sections: ${missing.join(", ")}. `;
    }

    if (atsFailures > 3) {
        summary += `${atsFailures} ATS compatibility issues detected. `;
    }

    return summary.trim();
}

/**
 * Compare a user's resume score against aggregated applicant data.
 * 
 * @param {number} userScore - User's resume score
 * @param {number[]} allScores - Array of scores from other applicants
 * @returns {Object} Percentile and comparison data
 */
function benchmarkResume(userScore, allScores) {
    if (!allScores.length) {
        return {
            percentile: 50,
            rank: "average",
            betterThan: 50,
            totalCompared: 0,
        };
    }

    const sorted = [...allScores].sort((a, b) => a - b);
    const below = sorted.filter(s => s < userScore).length;
    const percentile = Math.round((below / sorted.length) * 100);

    let rank;
    if (percentile >= 90) rank = "exceptional";
    else if (percentile >= 75) rank = "strong";
    else if (percentile >= 50) rank = "above-average";
    else if (percentile >= 25) rank = "average";
    else rank = "needs-improvement";

    return {
        percentile,
        rank,
        betterThan: percentile,
        totalCompared: sorted.length,
        avgScore: Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length),
        topScore: sorted[sorted.length - 1],
    };
}

module.exports = {
    scoreResume,
    analyzeSections,
    analyzeATS,
    analyzeSkillCoverage,
    benchmarkResume,
};
