const classificationMap = {
  confirmation: "Application Confirmation",
  rejection: "Rejection",
  interview: "Interview Invitation",
  offer: "Offer",
  irrelevant: "Not Relevant"
};

const companyHints = {
  google: "Google",
  figma: "Figma",
  anthropic: "Anthropic",
  stripe: "Stripe",
  openai: "OpenAI",
  notion: "Notion",
  vercel: "Vercel",
  ramp: "Ramp",
  datadog: "Datadog",
  airtable: "Airtable",
  microsoft: "Microsoft",
  coinbase: "Coinbase",
  dropbox: "Dropbox",
  netflix: "Netflix",
  canva: "Canva",
  plaid: "Plaid",
  slack: "Slack",
  snowflake: "Snowflake",
  linear: "Linear",
  atlassian: "Atlassian",
  brex: "Brex",
  loom: "Loom",
  asana: "Asana",
  duolingo: "Duolingo"
};

const acronymTokens = new Set(["ai", "ml", "ui", "ux"]);

const extractionPatterns = [
  /applying to (?<role>.+?) at (?<company>[^.,\n]+)/i,
  /application for (?<role>.+?) at (?<company>[^.,\n]+)/i,
  /invite you to an interview for the (?<role>.+?) role at (?<company>[^.,\n]+)/i,
  /invite you to an interview for (?<role>.+?) at (?<company>[^.,\n]+)/i,
  /offer for (?<role>.+?) at (?<company>[^.,\n]+)/i,
  /application for (?<role>.+?) with (?<company>[^.,\n]+)/i,
  /for the (?<role>.+?) role at (?<company>[^.,\n]+)/i
];

const portalLinkPattern = /https?:\/\/[^\s)]+/gi;

function normalizeKey(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(value = "") {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      const lowered = part.toLowerCase();
      if (acronymTokens.has(lowered)) {
        return lowered.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeCompanyName(value = "") {
  const normalized = normalizeKey(value);
  return companyHints[normalized] || titleCase(value);
}

function detectClassification(text) {
  const lower = text.toLowerCase();

  if (lower.includes("offer")) {
    return classificationMap.offer;
  }

  if (
    lower.includes("regret to inform you") ||
    lower.includes("moving ahead with other candidates") ||
    lower.includes("will not be moving forward")
  ) {
    return classificationMap.rejection;
  }

  if (lower.includes("invite you to an interview") || lower.includes("interview for")) {
    return classificationMap.interview;
  }

  if (lower.includes("thank you for applying") || lower.includes("application received")) {
    return classificationMap.confirmation;
  }

  return classificationMap.irrelevant;
}

function inferCompanyFromSender(from = "") {
  const lower = from.toLowerCase();

  for (const [hint, company] of Object.entries(companyHints)) {
    if (lower.includes(hint)) {
      return company;
    }
  }

  return "";
}

function extractStructuredData(email) {
  const combined = `${email.subject}\n${email.body}`;

  for (const pattern of extractionPatterns) {
    const match = combined.match(pattern);
    if (match?.groups?.company && match?.groups?.role) {
      return {
        company: normalizeCompanyName(match.groups.company),
        role: titleCase(match.groups.role),
        date: email.date
      };
    }
  }

  const company = inferCompanyFromSender(email.from);

  if (company) {
    const subjectRoleMatch = email.subject.match(/for (.+?)(?: at|$)/i);
    const role = subjectRoleMatch?.[1] ? titleCase(subjectRoleMatch[1]) : "Unknown Role";

    return {
      company,
      role,
      date: email.date
    };
  }

  return {
    company: "",
    role: "",
    date: email.date
  };
}

function extractPortalLink(email) {
  const links = email.body.match(portalLinkPattern) || [];
  const portalFromBody = links.find((link) => {
    const lower = link.toLowerCase();
    return lower.includes("career") || lower.includes("candidate") || lower.includes("application");
  });

  if (portalFromBody) {
    return portalFromBody;
  }

  if (email.portalLink) {
    return email.portalLink;
  }

  const inferredCompany = inferCompanyFromSender(email.from).toLowerCase();
  const canGeneratePortal = ["google", "stripe", "openai"].includes(inferredCompany);

  if (!canGeneratePortal) {
    return null;
  }

  return `https://jobs.${inferredCompany}.com/candidate/${email.id.replace(/^email-/, "")}`;
}

function buildEmailLink(email) {
  return email.emailLink || `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
}

export function analyzeEmail(email) {
  const classification = detectClassification(`${email.subject}\n${email.body}`);

  if (classification === classificationMap.irrelevant) {
    return {
      classification,
      structuredData: null
    };
  }

  const extracted = extractStructuredData(email);

  return {
    classification,
    structuredData: {
      company: extracted.company,
      role: extracted.role,
      date: extracted.date,
      status: classification,
      portalLink: extractPortalLink(email),
      emailLink: buildEmailLink(email)
    }
  };
}
