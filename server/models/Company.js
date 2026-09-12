const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    logo: {
        filename: String,
        originalName: String,
        uploadedAt: Date,
    },
    description: { type: String, default: "" },
    industry: { type: String, default: "" },
    size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", ""],
        default: "",
    },
    founded: { type: String, default: "" },
    website: { type: String, default: "" },
    locations: [{ type: String }],
    benefits: [{ type: String }],
    culture: { type: String, default: "" },
    socialLinks: {
        linkedin: { type: String, default: "" },
        twitter: { type: String, default: "" },
        github: { type: String, default: "" },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

companySchema.index({ owner: 1 });
companySchema.index({ name: "text" });

companySchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Company", companySchema);
