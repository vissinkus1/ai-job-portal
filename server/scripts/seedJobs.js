require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Job = require("../models/Job");
const Company = require("../models/Company");

const JOBS_DATA = [
  // ─── BENGALURU (Bangalore) ───────────────────────────────────────
  {
    title: "Senior Full Stack Engineer (MERN)",
    company: "Google",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Google Cloud", "Microservices"],
    salary: "₹38,00,000 - ₹55,00,000",
    description: `<h3>About the Role</h3>
<p>Google Bengaluru is looking for a Senior Full Stack Engineer to architect high-throughput internal developer productivity tooling and customer-facing cloud dashboards.</p>
<h4>Responsibilities:</h4>
<ul>
  <li>Architect and build scalable web applications using React, Node.js, and TypeScript.</li>
  <li>Optimize backend microservices with MongoDB, Redis caching, and Google Cloud Platform.</li>
  <li>Collaborate with cross-functional product, UX, and AI research teams to deliver intuitive interfaces.</li>
  <li>Mentor junior engineers and advocate for code excellence, CI/CD, and robust test suites.</li>
</ul>
<h4>Requirements:</h4>
<ul>
  <li>5+ years of production experience in full-stack web development (MERN/TypeScript).</li>
  <li>Deep understanding of distributed systems, RESTful APIs, and database indexing.</li>
  <li>Experience with cloud native services (GCP/AWS) and Docker/Kubernetes.</li>
</ul>`,
  },
  {
    title: "Software Development Engineer II (Backend)",
    company: "Amazon",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Node.js", "Java", "AWS", "DynamoDB", "Kafka", "Distributed Systems", "Docker"],
    salary: "₹28,00,000 - ₹42,00,000",
    description: `<h3>Role Overview</h3>
<p>Join Amazon's Retail & Fulfillment Technology organization in Bengaluru. You will design, build, and support mission-critical distributed services processing millions of orders daily.</p>
<h4>Key Responsibilities:</h4>
<ul>
  <li>Design low-latency microservices with automated failover and zero downtime.</li>
  <li>Build event-driven pipelines using Apache Kafka, AWS SQS, and Lambda.</li>
  <li>Work closely with product managers to deliver scalable customer experiences for Amazon.in.</li>
</ul>
<h4>Qualifications:</h4>
<ul>
  <li>3-6 years of experience building scalable backend platforms.</li>
  <li>Strong algorithmic foundation, concurrency knowledge, and system design skills.</li>
</ul>`,
  },
  {
    title: "SDE-1 Frontend Developer",
    company: "Flipkart",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Entry",
    skills: ["React", "JavaScript", "HTML5", "CSS3", "Redux", "Web Performance", "Vite"],
    salary: "₹14,00,000 - ₹20,00,000",
    description: `<h3>Position Overview</h3>
<p>Flipkart is hiring an energetic SDE-1 Frontend Developer to craft lightning-fast web experiences for India's largest e-commerce festivals including Big Billion Days.</p>
<h4>What You Will Do:</h4>
<ul>
  <li>Develop accessible, responsive, and cross-browser web interfaces using React.</li>
  <li>Optimize Core Web Vitals (LCP, FID, CLS) to maximize customer conversion rates.</li>
  <li>Integrate REST and GraphQL APIs with optimistic UI updates.</li>
</ul>
<h4>Candidate Profile:</h4>
<ul>
  <li>1-3 years of modern React and JavaScript experience.</li>
  <li>Firm grasp of DOM lifecycle, bundle size optimization, and responsive layouts.</li>
</ul>`,
  },
  {
    title: "Senior Backend Engineer (Payments)",
    company: "Razorpay",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Node.js", "Go", "PostgreSQL", "Redis", "Kafka", "Microservices", "Fintech"],
    salary: "₹35,00,000 - ₹50,00,000",
    description: `<h3>About Razorpay Payments</h3>
<p>Power India's financial ecosystem. At Razorpay, our payment infrastructure processes billions in transactions every month for over 8 million businesses.</p>
<h4>What You'll Do:</h4>
<ul>
  <li>Build fault-tolerant payment gateway integrations with 99.999% availability.</li>
  <li>Prevent fraud and anomalies in real-time using distributed stream processing.</li>
  <li>Scale idempotent API architectures with strict PCI-DSS compliance.</li>
</ul>`,
  },
  {
    title: "Frontend Architect",
    company: "CRED",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["React", "TypeScript", "Next.js", "Design Systems", "Figma", "Microfrontends", "Performance"],
    salary: "₹65,00,000 - ₹90,00,000",
    description: `<h3>Shape CRED's Visual & Engineering Frontier</h3>
<p>CRED is renowned for world-class design and buttery-smooth user experiences. We are seeking a Lead Frontend Architect to establish engineering standards across our web ecosystem.</p>
<h4>Expectations:</h4>
<ul>
  <li>Drive the technical roadmap for web design systems and microfrontend architecture.</li>
  <li>Partner with visionary product designers to create fluid animations and frictionless interactions.</li>
  <li>Champion extreme frontend performance, sub-second load times, and state hydration techniques.</li>
</ul>`,
  },
  {
    title: "Senior Staff Engineer (Core Platform)",
    company: "PhonePe",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["Java", "Distributed Systems", "MongoDB", "Kafka", "Kubernetes", "High Throughput"],
    salary: "₹70,00,000 - ₹1,05,00,000",
    description: `<h3>Lead at PhonePe Scale</h3>
<p>Help power over 50% of all UPI transactions in India. We are hiring a Staff/Principal Engineer for our Core Platform team in Bengaluru.</p>
<h4>Key Objectives:</h4>
<ul>
  <li>Architect ultra-reliable transaction processing pipelines managing 100M+ daily events.</li>
  <li>Define distributed caching, consensus, and data replication strategies.</li>
  <li>Guide engineering squads through large-scale migrations and high-concurrency challenges.</li>
</ul>`,
  },
  {
    title: "AI/ML Recommendation Engineer",
    company: "Swiggy",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "PyTorch", "Recommendation Systems", "TF-IDF", "NLP", "Kafka", "AWS"],
    salary: "₹36,00,000 - ₹52,00,000",
    description: `<h3>Swiggy AI Labs</h3>
<p>Swiggy delivers millions of meals and groceries across 500+ Indian cities. Join our Data Science & AI engineering team to craft personalized discovery engines.</p>
<h4>Responsibilities:</h4>
<ul>
  <li>Develop hybrid recommendation algorithms combining collaborative filtering and TF-IDF content features.</li>
  <li>Deploy low-latency deep learning models for personalized home feed generation.</li>
  <li>Run online A/B tests to measure impact on order frequency, CTR, and search relevance.</li>
</ul>`,
  },
  {
    title: "Developer Relations & Platform Engineer",
    company: "Postman",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Node.js", "APIs", "REST", "GraphQL", "Developer Experience", "JavaScript", "Docker"],
    salary: "₹24,00,000 - ₹36,00,000",
    description: `<h3>Build the Future of APIs with Postman</h3>
<p>Over 30 million developers trust Postman. Help us build developer-first CLI tools, API mock engines, and open-source SDK integrations.</p>`,
  },
  {
    title: "SDE-2 Full Stack Developer",
    company: "Zepto",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React", "Node.js", "Express", "MongoDB", "Redis", "TypeScript", "AWS"],
    salary: "₹26,00,000 - ₹38,00,000",
    description: `<h3>10-Minute Grocery Revolution</h3>
<p>Zepto is scaling rapid delivery across metro cities. We need a proactive SDE-2 to work on dark store warehouse automation and delivery partner apps.</p>`,
  },
  {
    title: "Senior Backend Engineer (High Frequency)",
    company: "Zerodha",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Go", "PostgreSQL", "Redis", "Linux", "WebSockets", "Distributed Systems"],
    salary: "₹40,00,000 - ₹60,00,000",
    description: `<h3>Engineering at Zerodha</h3>
<p>Zerodha operates India's largest stock brokerage with a tiny, elite tech team that builds everything with clean, robust, and open architectures.</p>
<h4>Responsibilities:</h4>
<ul>
  <li>Write blistering-fast Go services handling millions of market ticks per second.</li>
  <li>Scale WebSocket pipelines pushing real-time order updates with microsecond latency.</li>
  <li>Uphold minimalist architecture: simple code, minimal dependencies, maximum reliability.</li>
</ul>`,
  },
  {
    title: "Staff Software Engineer (Cloud Platform)",
    company: "Atlassian",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["React", "Java", "AWS", "GraphQL", "Microservices", "Kubernetes"],
    salary: "₹60,00,000 - ₹85,00,000",
    description: `<h3>Unleash the Potential of Every Team</h3>
<p>Atlassian Bengaluru builds core cloud capabilities for Jira, Confluence, and Bitbucket used by millions of global software engineers.</p>`,
  },
  {
    title: "SDE-2 Mobile Engineer (iOS & React Native)",
    company: "Uber",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React Native", "iOS", "Swift", "TypeScript", "Mobile Architecture"],
    salary: "₹32,00,000 - ₹48,00,000",
    description: `<h3>Move the World Forward</h3>
<p>Uber's Bengaluru tech hub engineers mobility and high-capacity transit features for emerging global markets.</p>`,
  },
  {
    title: "Associate Software Engineer",
    company: "Infosys",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Entry",
    skills: ["Java", "React", "SQL", "Spring Boot", "Git", "REST APIs"],
    salary: "₹8,00,000 - ₹12,00,000",
    description: `<h3>Launch Your IT Career at Infosys</h3>
<p>Join the digital transformation powerhouse in Bengaluru. You will be trained in cutting-edge enterprise platforms and deployed to global banking and retail projects.</p>`,
  },

  // ─── HYDERABAD ───────────────────────────────────────────────────
  {
    title: "Principal Software Engineer (Azure Core)",
    company: "Microsoft",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["C#", "C++", "Azure", "Distributed Systems", "Cloud Infrastructure", "Kubernetes"],
    salary: "₹65,00,000 - ₹95,00,000",
    description: `<h3>Microsoft India Development Center (IDC)</h3>
<p>IDC Hyderabad is Microsoft's largest engineering hub outside Redmond. Join Azure Core Infrastructure to design the bedrock of planetary computing.</p>`,
  },
  {
    title: "Senior Cloud Solutions Architect",
    company: "Google",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Google Cloud", "Kubernetes", "Terraform", "Python", "Go", "Enterprise Architecture"],
    salary: "₹45,00,000 - ₹65,00,000",
    description: `<h3>Scale with Google Cloud Hyderabad</h3>
<p>Help top enterprises migrate mission-critical applications to GCP using modern containerization, infrastructure as code, and site reliability engineering.</p>`,
  },
  {
    title: "SDE-2 Backend Engineer (Commerce Cloud)",
    company: "Salesforce",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Node.js", "Java", "Salesforce Cloud", "Microservices", "REST APIs", "AWS"],
    salary: "₹26,00,000 - ₹38,00,000",
    description: `<h3>Trailblaze at Salesforce</h3>
<p>Join Salesforce's Center of Excellence in Hyderabad to build hyper-scalable e-commerce APIs that power billions of dollars in global digital transactions.</p>`,
  },
  {
    title: "Full Stack Engineer (Enterprise SaaS)",
    company: "ServiceNow",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React", "JavaScript", "Java", "REST APIs", "SQL", "HTML5/CSS3"],
    salary: "₹22,0,000 - ₹34,00,000",
    description: `<h3>ServiceNow Hyderabad</h3>
<p>Help make the world of work, work better for people. Build highly configurable React workflows on our Now Platform.</p>`,
  },
  {
    title: "Cloud DevOps & Platform Engineer",
    company: "Oracle",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Oracle Cloud", "Docker", "Kubernetes", "Terraform", "Python", "Linux", "CI/CD"],
    salary: "₹30,00,000 - ₹45,00,000",
    description: `<h3>Oracle Cloud Infrastructure (OCI)</h3>
<p>Build next-generation bare-metal cloud infrastructure and automation toolchains at Oracle Hyderabad.</p>`,
  },
  {
    title: "AI Firmware & Systems Engineer",
    company: "Qualcomm",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["C++", "Python", "Embedded Systems", "Edge AI", "Neural Processing Units", "Linux"],
    salary: "₹24,00,000 - ₹36,00,000",
    description: `<h3>On-Device Generative AI at Qualcomm</h3>
<p>Qualcomm Hyderabad engineers the NPU hardware and firmware running state-of-the-art LLMs and diffusion models directly on mobile devices.</p>`,
  },
  {
    title: "Senior Full Stack Developer",
    company: "TCS",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["React", "Node.js", "MongoDB", "Express", "Docker", "Agile"],
    salary: "₹18,00,000 - ₹28,00,000",
    description: `<h3>Tata Consultancy Services</h3>
<p>Deliver enterprise-grade cloud modernization projects for global Fortune 500 clients using the MERN stack.</p>`,
  },

  // ─── PUNE ────────────────────────────────────────────────────────
  {
    title: "Deep Learning Solutions Architect",
    company: "Nvidia",
    location: "Pune, Maharashtra",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "CUDA", "PyTorch", "TensorRT", "LLMs", "C++", "Deep Learning"],
    salary: "₹45,00,000 - ₹70,00,000",
    description: `<h3>Accelerate the AI Era with Nvidia</h3>
<p>Nvidia Pune is an elite R&D hub for accelerated computing. You will optimize inference models for enterprise generative AI deployments using TensorRT and Triton Server.</p>`,
  },
  {
    title: "MERN Stack Developer",
    company: "Persistent Systems",
    location: "Pune, Maharashtra",
    type: "Full-time",
    experienceLevel: "Entry",
    skills: ["MongoDB", "Express", "React", "Node.js", "JavaScript", "Git"],
    salary: "₹10,00,000 - ₹16,00,000",
    description: `<h3>Join Persistent Systems Pune</h3>
<p>Exciting opportunity for budding full-stack engineers to build modern cloud applications using React and Node.js with strong mentor guidance.</p>`,
  },
  {
    title: "Industrial IoT & Cloud Developer",
    company: "Siemens",
    location: "Pune, Maharashtra",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Node.js", "TypeScript", "MQTT", "AWS", "Docker", "Microservices", "React"],
    salary: "₹18,00,000 - ₹28,00,000",
    description: `<h3>Smart Manufacturing at Siemens</h3>
<p>Connect factory automation equipment with cloud intelligence. Build resilient IoT telemetry pipelines at Siemens Pune.</p>`,
  },
  {
    title: "Senior Quantitative Developer",
    company: "Barclays",
    location: "Pune, Maharashtra",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "C++", "Machine Learning", "Risk Analytics", "SQL", "Financial Modeling"],
    salary: "₹34,00,000 - ₹48,00,000",
    description: `<h3>Barclays Global Service Centre Pune</h3>
<p>Develop high-performance quantitative risk and pricing models for Barclays investment banking trading desks.</p>`,
  },
  {
    title: "Cloud Storage Systems Engineer",
    company: "Veritas",
    location: "Pune, Maharashtra",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Go", "Linux", "Distributed Storage", "Kubernetes", "Python"],
    salary: "₹22,00,000 - ₹32,00,000",
    description: `<h3>Data Protection at Enterprise Scale</h3>
<p>Veritas Pune engineers multi-cloud cyber resiliency, ransomware protection, and data governance software.</p>`,
  },

  // ─── GURUGRAM / DELHI NCR ────────────────────────────────────────
  {
    title: "Lead AI/ML Recommendation Engineer",
    company: "Zomato",
    location: "Gurugram, Haryana",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["Python", "PyTorch", "TF-IDF", "Recommendation Systems", "Collaborative Filtering", "Kafka"],
    salary: "₹55,00,000 - ₹80,00,000",
    description: `<h3>AI at Zomato</h3>
<p>Head up recommendation and personalization algorithms helping 18+ million monthly active users discover culinary treasures in seconds.</p>
<h4>Responsibilities:</h4>
<ul>
  <li>Lead a squad of ML scientists improving search rankings, dish recommendations, and delivery dispatching.</li>
  <li>Deploy embedding-based recommendation models combining user dining history and contextual signals.</li>
</ul>`,
  },
  {
    title: "Full Stack Engineer (Quick Commerce)",
    company: "Blinkit",
    location: "Gurugram, Haryana",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React", "Node.js", "Express", "MongoDB", "Redis", "TypeScript"],
    salary: "₹24,00,000 - ₹36,00,000",
    description: `<h3>Instant Delivery Innovation</h3>
<p>Blinkit is pioneering lightning quick commerce. We're hiring full-stack builders who thrive in rapid-cycle product development.</p>`,
  },
  {
    title: "Data Platform Architect",
    company: "MakeMyTrip",
    location: "Gurugram, Haryana",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["Apache Spark", "Kafka", "Hadoop", "Python", "BigQuery", "Snowflake", "GCP"],
    salary: "₹50,0,000 - ₹75,00,000",
    description: `<h3>India's #1 Travel Super-App</h3>
<p>Architect data ingestion pipelines processing petabytes of flight, hotel, and holiday bookings at MakeMyTrip Gurugram.</p>`,
  },
  {
    title: "Principal AI & Speech Scientist",
    company: "Airtel Digital",
    location: "Gurugram, Haryana",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["NLP", "Speech Recognition", "PyTorch", "LLMs", "Python", "Hugging Face"],
    salary: "₹45,00,000 - ₹65,00,000",
    description: `<h3>Powering 350M+ Connected Indians</h3>
<p>Airtel Digital Labs is crafting vernacular voice AI agents that understand multi-lingual Indian speech accents seamlessly.</p>`,
  },
  {
    title: "SDE-2 Full Stack Developer",
    company: "PolicyBazaar",
    location: "Gurugram, Haryana",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React", "Node.js", "Express", "MongoDB", "MySQL", "AWS"],
    salary: "₹20,00,000 - ₹30,00,000",
    description: `<h3>Fintech & Insurtech Leader</h3>
<p>Build seamless insurance comparison and instant policy issuance journeys at PolicyBazaar's Gurugram headquarters.</p>`,
  },

  // ─── NOIDA ───────────────────────────────────────────────────────
  {
    title: "Computer Vision & Generative AI Engineer",
    company: "Adobe",
    location: "Noida, Uttar Pradesh",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "PyTorch", "Computer Vision", "Generative AI", "C++", "Diffusion Models"],
    salary: "₹42,00,000 - ₹62,00,000",
    description: `<h3>Adobe India Big Data & AI Experience</h3>
<p>Adobe Noida houses premier imaging and AI researchers behind Adobe Firefly, Photoshop, and Creative Cloud innovations.</p>`,
  },
  {
    title: "Senior Full Stack Developer (MERN)",
    company: "Paytm",
    location: "Noida, Uttar Pradesh",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["MongoDB", "Express", "React", "Node.js", "Kafka", "Redis", "TypeScript"],
    salary: "₹28,00,000 - ₹42,00,000",
    description: `<h3>Paytm Super App Ecosystem</h3>
<p>Join Paytm's Noida headquarters to engineer merchant payment terminals, soundboxes, and digital wallet services.</p>`,
  },
  {
    title: "AI & Multimedia Research Scientist",
    company: "Samsung R&D",
    location: "Noida, Uttar Pradesh",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "TensorFlow", "NLP", "Audio Processing", "On-Device AI"],
    salary: "₹35,00,000 - ₹50,00,000",
    description: `<h3>Samsung R&D Institute India - Noida (SRI-N)</h3>
<p>Research and deploy novel visual intelligence and Galaxy AI capabilities for smartphones and smart appliances.</p>`,
  },
  {
    title: "DevOps & Cloud Automation Engineer",
    company: "HCLTech",
    location: "Noida, Uttar Pradesh",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins", "Ansible", "Linux"],
    salary: "₹16,00,000 - ₹24,00,000",
    description: `<h3>Global IT Transformation</h3>
<p>Build automated infrastructure deployment pipelines and Kubernetes clusters for international financial clients at HCLTech Noida.</p>`,
  },

  // ─── MUMBAI ──────────────────────────────────────────────────────
  {
    title: "Senior Machine Learning Engineer (Recommender AI)",
    company: "Jio Platforms",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Python", "PyTorch", "Recommendation Systems", "TF-IDF", "Kafka", "Kubernetes", "Spark"],
    salary: "₹38,00,000 - ₹55,00,000",
    description: `<h3>Jio AI & Cloud Labs (Navi Mumbai)</h3>
<p>Build AI personalization models serving over 450 million digital consumers across JioCinema, JioSaavn, and JioMart.</p>`,
  },
  {
    title: "Lead Frontend Engineer (Consumer Tech)",
    company: "Tata Digital",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["React", "Next.js", "TypeScript", "Performance", "Microfrontends", "Redux"],
    salary: "₹50,00,000 - ₹75,00,000",
    description: `<h3>Tata Neu Super-App</h3>
<p>Lead the frontend architecture of Tata Neu, integrating aviation, hospitality, electronics, and fashion into one unified interface.</p>`,
  },
  {
    title: "SDE-2 Backend Engineer (High Throughput)",
    company: "BookMyShow",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Node.js", "Express", "Redis", "MongoDB", "Kafka", "AWS"],
    salary: "₹22,00,000 - ₹34,00,000",
    description: `<h3>Entertainment Ticketing at Scale</h3>
<p>Handle massive ticketing surges for major concert tours and cricket matches with resilient distributed booking services.</p>`,
  },
  {
    title: "Vice President - Algorithmic Trading Systems",
    company: "Morgan Stanley",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["C++", "Python", "Linux", "Low Latency", "Distributed Systems", "SQL"],
    salary: "₹75,00,000 - ₹1,20,00,000",
    description: `<h3>Morgan Stanley Global Technology (Powai)</h3>
<p>Build sub-millisecond execution engines and real-time electronic market making platforms in Mumbai.</p>`,
  },
  {
    title: "Senior Product Designer (UI/UX)",
    company: "Nykaa",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Figma", "UI/UX", "Design Systems", "User Research", "Prototyping"],
    salary: "₹25,00,000 - ₹38,00,000",
    description: `<h3>Fashion & Beauty E-Commerce Design</h3>
<p>Create delightful beauty shopping experiences and intuitive seller portals at Nykaa's Mumbai creative studio.</p>`,
  },
  {
    title: "Staff Data Platform Engineer",
    company: "CleverTap",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["ClickHouse", "Kafka", "Java", "Go", "Distributed Systems", "AWS"],
    salary: "₹55,00,000 - ₹80,00,000",
    description: `<h3>Customer Engagement & Analytics</h3>
<p>CleverTap powers real-time user retention for 10,000+ mobile apps. Scale analytical storage clusters indexing trillions of data points.</p>`,
  },
  {
    title: "Staff Cloud Infrastructure Engineer",
    company: "BrowserStack",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["Docker", "Kubernetes", "Linux", "Go", "AWS", "Infrastructure as Code"],
    salary: "₹50,00,000 - ₹75,00,000",
    description: `<h3>Testing Platform for the World</h3>
<p>Manage BrowserStack's vast cloud fleet of real mobile devices and browsers executing millions of automated tests daily.</p>`,
  },

  // ─── CHENNAI ─────────────────────────────────────────────────────
  {
    title: "Product Engineer (SaaS Applications)",
    company: "Zoho",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["JavaScript", "React", "Node.js", "Java", "SQL", "REST APIs"],
    salary: "₹15,00,000 - ₹24,00,000",
    description: `<h3>Bootstrapped SaaS Giant</h3>
<p>Zoho Chennai is the heart of 55+ business applications serving 100+ million users globally. Write clean code with extreme autonomy.</p>`,
  },
  {
    title: "Senior Frontend Engineer (Design Systems)",
    company: "Freshworks",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["React", "TypeScript", "Next.js", "Design Systems", "Web Accessibility", "Testing"],
    salary: "₹28,00,000 - ₹40,00,000",
    description: `<h3>Delight Your Customers</h3>
<p>Freshworks is Chennai's NASDAQ-listed SaaS icon. Build polished UI components and microfrontends for customer service suites.</p>`,
  },
  {
    title: "Senior Backend Engineer (Fraud & Identity)",
    company: "PayPal",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    experienceLevel: "Senior",
    skills: ["Node.js", "Java", "Distributed Caching", "Kafka", "MongoDB", "Fintech"],
    salary: "₹32,00,000 - ₹46,00,000",
    description: `<h3>PayPal India Tech Center</h3>
<p>Protect global commerce by designing real-time risk evaluation services at PayPal Chennai.</p>`,
  },
  {
    title: "DevSecOps Cloud Architect",
    company: "Cognizant",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    experienceLevel: "Lead",
    skills: ["AWS", "Azure", "Kubernetes", "Security", "Terraform", "CI/CD"],
    salary: "₹30,00,000 - ₹44,00,000",
    description: `<h3>Enterprise Cloud Modernization</h3>
<p>Design multi-cloud zero-trust architectures for Fortune 500 healthcare and insurance enterprises at Cognizant Chennai.</p>`,
  },
  {
    title: "IoT Systems & Analytics Engineer",
    company: "Caterpillar",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["Python", "AWS", "IoT", "SQL", "Docker", "Data Analysis"],
    salary: "₹18,00,000 - ₹28,00,000",
    description: `<h3>Heavy Machinery Telematics</h3>
<p>Analyze connected construction machinery sensor data to predict maintenance and optimize operational fleet efficiency.</p>`,
  },

  // ─── REMOTE (INDIA) ──────────────────────────────────────────────
  {
    title: "Senior React Engineer (Full-Time Remote)",
    company: "Automattic",
    location: "Remote",
    type: "Remote",
    experienceLevel: "Senior",
    skills: ["React", "JavaScript", "TypeScript", "CSS3", "Gutenberg", "Open Source"],
    salary: "₹45,00,000 - ₹65,00,000",
    description: `<h3>Work from Anywhere for WordPress.com</h3>
<p>Automattic is 100% distributed across 90+ countries. Help shape the open web with WordPress, WooCommerce, and modern React blocks.</p>`,
  },
  {
    title: "Senior Backend Engineer (Distributed Systems)",
    company: "GitLab",
    location: "Remote",
    type: "Remote",
    experienceLevel: "Senior",
    skills: ["Go", "Ruby", "PostgreSQL", "Redis", "DevOps", "CI/CD", "Git"],
    salary: "₹50,00,000 - ₹75,00,000",
    description: `<h3>All-Remote DevSecOps Platform</h3>
<p>Join GitLab's all-remote engineering org. Optimize repository management, merge request pipelines, and Git storage protocols.</p>`,
  },
  {
    title: "Web3 & Full Stack Engineer",
    company: "Polygon Labs",
    location: "Remote",
    type: "Remote",
    experienceLevel: "Mid",
    skills: ["Solidity", "Node.js", "React", "TypeScript", "Ethereum", "Web3.js"],
    salary: "₹30,00,000 - ₹48,00,000",
    description: `<h3>Build the Value Layer of the Internet</h3>
<p>Polygon is scaling Ethereum to billions of users. Build decentralized app portals, bridge monitors, and zero-knowledge developer tooling.</p>`,
  },
  {
    title: "Cloud Infrastructure Specialist",
    company: "HashiCorp",
    location: "Remote",
    type: "Remote",
    experienceLevel: "Senior",
    skills: ["Terraform", "Consul", "Vault", "Go", "AWS", "Kubernetes"],
    salary: "₹48,00,000 - ₹70,00,000",
    description: `<h3>Automate Cloud Infrastructure</h3>
<p>Empower millions of infrastructure teams using Terraform and Vault. 100% remote within India.</p>`,
  },
  {
    title: "AI Integration & Full Stack Developer",
    company: "JobMatrix Labs",
    location: "Bengaluru, Karnataka",
    type: "Full-time",
    experienceLevel: "Mid",
    skills: ["React 19", "Node.js", "Express", "MongoDB", "TF-IDF", "NLP", "Socket.io"],
    salary: "₹20,00,000 - ₹32,00,000",
    description: `<h3>Build Next-Gen Career Intelligence</h3>
<p>JobMatrix is hiring an AI/Full-Stack engineer to refine our TF-IDF matching engine, real-time Socket.io chat, and automated ATS resume scorer.</p>`,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // Find or create an official employer account to associate jobs with
    let employer = await User.findOne({ role: "employer" });
    if (!employer) {
      console.log("Creating default verified employer account (recruiter@jobmatrix.ai)...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("RecruiterPass2026!", salt);
      employer = await User.create({
        name: "JobMatrix Talent Acquisition",
        email: "recruiter@jobmatrix.ai",
        password: hashedPassword,
        role: "employer",
        emailVerified: true,
        bio: "Official talent acquisition and engineering recruiter for verified companies on JobMatrix AI.",
      });
      console.log("Created employer account with ID:", employer._id);
    } else {
      console.log("Using existing employer account:", employer.email, `(${employer._id})`);
    }

    // Clear existing jobs to ensure a fresh, consistent dataset
    const deleted = await Job.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing jobs.`);

    // Map jobs with postedBy and random view/application counts
    const jobsToInsert = JOBS_DATA.map((job, idx) => ({
      ...job,
      postedBy: employer._id,
      views: Math.floor(40 + Math.random() * 250),
      applicationCount: Math.floor(5 + Math.random() * 45),
      createdAt: new Date(Date.now() - (idx * 6 * 60 * 60 * 1000)), // spread across the last couple weeks
      deadline: new Date(Date.now() + (30 + (idx % 20)) * 24 * 60 * 60 * 1000), // 30-50 days from now
    }));

    const inserted = await Job.insertMany(jobsToInsert);
    console.log(`\n🎉 Successfully seeded ${inserted.length} tech jobs across prime locations in India!`);

    // Location breakdown summary
    const locations = {};
    inserted.forEach((j) => {
      const loc = j.location;
      locations[loc] = (locations[loc] || 0) + 1;
    });

    console.log("\n📍 Location Breakdown:");
    Object.entries(locations).forEach(([loc, count]) => {
      console.log(`  • ${loc}: ${count} jobs`);
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB. Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
