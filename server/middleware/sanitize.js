const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Allowed tags for rich-text content (from job descriptions, etc.)
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "strike",
  "a", "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div", "sub", "sup",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

/**
 * Recursively sanitize all string values in an object.
 * Strips <script>, <iframe>, event handlers, etc.
 */
function sanitizeValue(value) {
  if (typeof value === "string") {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body before it reaches route handlers.
 */
module.exports = function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
