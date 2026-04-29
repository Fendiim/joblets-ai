const statusLabelMap = {
  "Application Confirmation": "Applied",
  "Interview Invitation": "Interview",
  Rejection: "Rejected",
  Offer: "Offer"
};

const focusGroups = [
  {
    label: "Software Engineering",
    keywords: ["engineer", "developer", "full stack", "frontend", "backend", "platform", "architect"]
  },
  {
    label: "Design",
    keywords: ["designer", "design", "ux", "ui", "brand"]
  },
  {
    label: "Product",
    keywords: ["product manager", "product operations", "product marketing", "program manager"]
  },
  {
    label: "Data & Analytics",
    keywords: ["data", "analyst", "analytics", "machine learning", "ai researcher", "ml"]
  },
  {
    label: "Marketing & Growth",
    keywords: ["marketing", "growth", "brand", "communications"]
  },
  {
    label: "Operations",
    keywords: ["operations", "strategy", "business", "program", "customer success"]
  }
];

const companyTypeMap = {
  Google: "established tech companies",
  Microsoft: "established tech companies",
  Netflix: "consumer tech companies",
  OpenAI: "AI labs",
  Anthropic: "AI labs",
  Stripe: "fintech companies",
  Ramp: "fintech companies",
  Plaid: "fintech companies",
  Brex: "fintech companies",
  Coinbase: "fintech companies",
  Figma: "product design companies",
  Canva: "product design companies",
  Notion: "collaboration software companies",
  Slack: "collaboration software companies",
  Asana: "collaboration software companies",
  Loom: "collaboration software companies",
  Vercel: "developer platform companies",
  Datadog: "developer platform companies",
  Snowflake: "data infrastructure companies",
  Airtable: "workflow software companies",
  Dropbox: "workflow software companies",
  Atlassian: "enterprise software companies",
  Linear: "productivity software companies",
  Duolingo: "consumer app companies"
};

const slideToneMap = {
  total: "violet",
  company: "iris",
  focus: "plum",
  status: "indigo",
  response: "royal",
  activity: "orchid",
  timeline: "cosmic",
  insight: "amethyst",
  persona: "mulberry",
  final: "nightfall"
};

const companyLogoPresets = {
  Google: { short: "G", start: "#2563eb", end: "#ea4335" },
  Amazon: { short: "a", start: "#111827", end: "#f59e0b" },
  Microsoft: { short: "M", start: "#2563eb", end: "#10b981" },
  Meta: { short: "∞", start: "#0f172a", end: "#6366f1" },
  OpenAI: { short: "O", start: "#0f172a", end: "#14b8a6" },
  Stripe: { short: "S", start: "#4338ca", end: "#8b5cf6" },
  Anthropic: { short: "A", start: "#111827", end: "#f97316" },
  Figma: { short: "F", start: "#111827", end: "#ec4899" },
  Notion: { short: "N", start: "#111827", end: "#374151" },
  Vercel: { short: "V", start: "#111827", end: "#475569" },
  Canva: { short: "C", start: "#0f766e", end: "#8b5cf6" },
  Netflix: { short: "N", start: "#111827", end: "#dc2626" },
  Coinbase: { short: "C", start: "#1d4ed8", end: "#60a5fa" },
  Snowflake: { short: "S", start: "#0f172a", end: "#38bdf8" },
  Plaid: { short: "P", start: "#0f172a", end: "#10b981" },
  Slack: { short: "S", start: "#4c1d95", end: "#ec4899" },
  Atlassian: { short: "A", start: "#1d4ed8", end: "#38bdf8" },
  Brex: { short: "B", start: "#111827", end: "#8b5cf6" }
};

function formatDate(dateValue, options = {}) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  }).format(new Date(dateValue));
}

function getMonthLabel(dateValue) {
  return new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(dateValue));
}

function getWeekdayLabel(dateValue) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(dateValue));
}

function getWeekKey(dateValue) {
  const date = new Date(dateValue);
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  const diff = target - firstThursday;
  const week = 1 + Math.round(diff / 604800000);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getTopEntry(counts, fallbackLabel) {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return { label: fallbackLabel, count: 0 };
  }

  entries.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return { label: entries[0][0], count: entries[0][1] };
}

function getTopEntries(counts, limit = 4) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count], index) => ({
      rank: index + 1,
      label,
      count
    }));
}

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildCompanyLogo(company = "") {
  const preset = companyLogoPresets[company] || {
    short: company.slice(0, 1).toUpperCase() || "?",
    start: "#4c1d95",
    end: "#8b5cf6"
  };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${company}">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${preset.start}" />
          <stop offset="100%" stop-color="${preset.end}" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="116" fill="url(#g)" />
      <circle cx="120" cy="120" r="115" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
      <circle cx="178" cy="62" r="22" fill="rgba(255,255,255,0.16)" />
      <text x="120" y="140" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="108" font-weight="700" fill="white">${preset.short}</text>
    </svg>
  `;

  return {
    src: encodeSvg(svg),
    alt: `${company} logo`,
    short: preset.short
  };
}

function inferFocusFromRole(role = "") {
  const lower = role.toLowerCase();

  for (const group of focusGroups) {
    if (group.keywords.some((keyword) => lower.includes(keyword))) {
      return group.label;
    }
  }

  return "Generalist Search";
}

function inferCompanyType(company = "") {
  return companyTypeMap[company] || "technology companies";
}

function formatResponseMomentum(responseRate) {
  if (responseRate >= 0.4) {
    return "strong recruiter traction";
  }

  if (responseRate >= 0.22) {
    return "steady recruiter interest";
  }

  return "early-stage momentum that still has room to grow";
}

function buildPersonalInsight({ focusLabel, companyTypeLabel, responseRatePercent, responseRate }) {
  const industryPhrase =
    focusLabel === "Generalist Search" ? "a broad mix of roles" : `${focusLabel.toLowerCase()} roles`;
  const momentumPhrase = formatResponseMomentum(responseRate);

  return {
    emphasis:
      focusLabel === "Generalist Search"
        ? "Your search stayed intentionally broad"
        : `${focusLabel} shaped your search`,
    body: `You focused heavily on ${industryPhrase} and kept returning to ${companyTypeLabel}. With a ${responseRatePercent}% response rate, your search showed ${momentumPhrase}.`
  };
}

function buildPersonaSummary({ focusLabel, companyTypeLabel, responseRate, responseLine, persona }) {
  const focusPhrase =
    focusLabel === "Generalist Search" ? "a broad mix of roles" : `${focusLabel.toLowerCase()} roles`;
  const companyPhrase = companyTypeLabel === "technology companies" ? "tech roles" : companyTypeLabel;
  const momentumPhrase =
    responseRate >= 0.35 ? "strong recruiter traction" : responseRate >= 0.22 ? "steady momentum" : "early momentum";

  if (persona === "The Weekend Grinder") {
    return `You kept returning to ${focusPhrase} and built ${momentumPhrase} while targeting ${companyPhrase}. ${responseLine}.`;
  }

  if (persona === "The Consistent Applier") {
    return `You stayed steady with ${focusPhrase} and kept your search moving across ${companyPhrase}. ${responseLine}.`;
  }

  if (persona === "The Momentum Builder") {
    return `You focused on ${focusPhrase} and turned that into ${momentumPhrase} with employers in ${companyPhrase}. ${responseLine}.`;
  }

  if (persona === "The Curious Explorer") {
    return `You explored a broad mix of roles across ${companyPhrase} while building clarity on where you fit best. ${responseLine}.`;
  }

  return `You were selective about ${focusPhrase}, with the strongest pull toward ${companyPhrase}. ${responseLine}.`;
}

function getEffortLevel(totalApplications, distinctWeeks) {
  if (totalApplications >= 20 || distinctWeeks >= 8) {
    return "Top effort level";
  }

  if (totalApplications >= 12 || distinctWeeks >= 5) {
    return "Highly active";
  }

  if (totalApplications >= 6) {
    return "Steady momentum";
  }

  return "Early momentum";
}

function getResponseLabel(responseRate) {
  if (responseRate >= 0.4) {
    return "Strong signal";
  }

  if (responseRate >= 0.22) {
    return "Meaningful traction";
  }

  return "Building traction";
}

function getTimelineLabel(spanDays) {
  if (spanDays >= 90) {
    return "Long-game energy";
  }

  if (spanDays >= 45) {
    return "Consistent streak";
  }

  return "Focused sprint";
}

function buildPersona({ totalApplications, weekendShare, distinctWeeks, responseRate, focusLabel }) {
  if (weekendShare >= 0.35) {
    return "The Weekend Grinder";
  }

  if (distinctWeeks >= 4 && totalApplications >= 6) {
    return "The Consistent Applier";
  }

  if (responseRate >= 0.35 && totalApplications >= 5) {
    return "The Momentum Builder";
  }

  if (focusLabel === "Generalist Search") {
    return "The Curious Explorer";
  }

  return "The Selective Strategist";
}

function buildAiInsight({
  focusLabel,
  distinctWeeks,
  responseRate,
  topCompany,
  totalApplications,
  peakMonth,
  topWeekday
}) {
  const cadence =
    distinctWeeks >= 4
      ? "showed strong consistency in applying week after week"
      : `clustered most of your momentum around ${peakMonth}`;
  const responseText =
    responseRate >= 0.35
      ? "You also built encouraging response momentum from recruiters."
      : "There is room to keep iterating and improve your reply rate.";
  const companyText =
    topCompany.count > 1
      ? `You returned to ${topCompany.label} more than any other company, signaling a clear target.`
      : `You spread your energy across ${totalApplications} applications with a broad target list.`;

  return `You focused heavily on ${focusLabel.toLowerCase()} roles and ${cadence}. ${companyText} Most of your activity landed on ${topWeekday}s. ${responseText}`;
}

function getExportGradient(tone) {
  const gradients = {
    violet: ["#5b21b6", "#7c3aed", "#c084fc"],
    iris: ["#4c1d95", "#6d28d9", "#a78bfa"],
    plum: ["#581c87", "#7e22ce", "#c084fc"],
    indigo: ["#312e81", "#6d28d9", "#a5b4fc"],
    royal: ["#3b0764", "#7c3aed", "#93c5fd"],
    orchid: ["#4a044e", "#8b5cf6", "#f0abfc"],
    cosmic: ["#2e1065", "#7c3aed", "#f5d0fe"],
    amethyst: ["#3b0764", "#9333ea", "#ddd6fe"],
    mulberry: ["#4c0519", "#7c3aed", "#f0abfc"],
    nightfall: ["#1e1b4b", "#581c87", "#a78bfa"]
  };

  return gradients[tone] || gradients.violet;
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForWrappedAssets(cardElement) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_error) {
      // If the font promise fails, keep the export moving with system fallbacks.
    }
  }

  const images = Array.from(cardElement.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })
    )
  );

  await waitForNextPaint();
  await waitForNextPaint();
}

function getWrappedExportBackgroundColor(cardElement, slideTone) {
  const computedStyles = window.getComputedStyle(cardElement);
  const exportBackground = computedStyles.getPropertyValue("--wrapped-export-bg").trim();
  const cardBackgroundColor = computedStyles.backgroundColor;
  const fallbackColor = getExportGradient(slideTone)[0];

  if (exportBackground) {
    return exportBackground;
  }

  if (
    cardBackgroundColor &&
    cardBackgroundColor !== "transparent" &&
    cardBackgroundColor !== "rgba(0, 0, 0, 0)"
  ) {
    return cardBackgroundColor;
  }

  return fallbackColor;
}

function triggerCanvasDownload(canvas, fileName) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

function buildExportFileName(slide, slideIndex, totalSlides) {
  if (slide.id === "final" || slideIndex === totalSlides - 1) {
    return "joblets-wrapped-summary.png";
  }

  return `joblets-wrapped-card-${slideIndex + 1}.png`;
}

function buildShareMetrics(wrapped) {
  return {
    likes: Math.max(18, wrapped.totalApplications * 4 + wrapped.statusCounts.Interview * 5 + wrapped.statusCounts.Offer * 8),
    comments: Math.max(3, wrapped.statusCounts.Interview + wrapped.statusCounts.Offer + Math.round(wrapped.totalApplications / 8))
  };
}

export function computeWrappedData(applications = []) {
  const sorted = [...applications].sort(
    (left, right) => new Date(left.dateApplied) - new Date(right.dateApplied)
  );
  const totalApplications = sorted.length;

  if (totalApplications === 0) {
    return {
      empty: true
    };
  }

  const companyCounts = {};
  const companyTypeCounts = {};
  const focusCounts = {};
  const monthCounts = {};
  const weekdayCounts = {};
  const weekCounts = {};
  const statusCounts = {
    Applied: 0,
    Interview: 0,
    Rejected: 0,
    Offer: 0
  };
  let weekendCount = 0;

  sorted.forEach((application) => {
    companyCounts[application.company] = (companyCounts[application.company] || 0) + 1;
    const companyTypeLabel = inferCompanyType(application.company);
    companyTypeCounts[companyTypeLabel] = (companyTypeCounts[companyTypeLabel] || 0) + 1;
    const focusLabel = inferFocusFromRole(application.role);
    focusCounts[focusLabel] = (focusCounts[focusLabel] || 0) + 1;
    const monthLabel = getMonthLabel(application.dateApplied);
    monthCounts[monthLabel] = (monthCounts[monthLabel] || 0) + 1;
    const weekdayLabel = getWeekdayLabel(application.dateApplied);
    weekdayCounts[weekdayLabel] = (weekdayCounts[weekdayLabel] || 0) + 1;
    const weekKey = getWeekKey(application.dateApplied);
    weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    const statusLabel = statusLabelMap[application.status] || "Applied";
    statusCounts[statusLabel] += 1;

    const date = new Date(application.dateApplied);
    if (date.getDay() === 0 || date.getDay() === 6) {
      weekendCount += 1;
    }
  });

  const topCompany = getTopEntry(companyCounts, "Your target list");
  const topCompanies = getTopEntries(companyCounts, 4).map((entry) => ({
    ...entry,
    logo: buildCompanyLogo(entry.label)
  }));
  const topCompanyType = getTopEntry(companyTypeCounts, "technology companies");
  const topFocus = getTopEntry(focusCounts, "Generalist Search");
  const topMonth = getTopEntry(monthCounts, getMonthLabel(sorted[0].dateApplied));
  const topWeekday = getTopEntry(weekdayCounts, getWeekdayLabel(sorted[0].dateApplied));
  const distinctWeeks = Object.keys(weekCounts).length;
  const distinctCompanyCount = Object.keys(companyCounts).length;
  const interviewsAndOffers = statusCounts.Interview + statusCounts.Offer;
  const responseRate = interviewsAndOffers / totalApplications;
  const responseRatePercent = Math.round(responseRate * 100);
  const firstApplicationDate = sorted[0].dateApplied;
  const latestApplicationDate = sorted[sorted.length - 1].dateApplied;
  const spanDays = Math.max(
    1,
    Math.ceil((new Date(latestApplicationDate) - new Date(firstApplicationDate)) / 86400000) + 1
  );
  const persona = buildPersona({
    totalApplications,
    weekendShare: weekendCount / totalApplications,
    distinctWeeks,
    responseRate,
    focusLabel: topFocus.label
  });
  const aiSummary = buildAiInsight({
    focusLabel: topFocus.label,
    distinctWeeks,
    responseRate,
    topCompany,
    totalApplications,
    peakMonth: topMonth.label,
    topWeekday: topWeekday.label
  });
  const personalInsight = buildPersonalInsight({
    focusLabel: topFocus.label,
    companyTypeLabel: topCompanyType.label,
    responseRatePercent,
    responseRate
  });
  const responseLine =
    interviewsAndOffers === 0
      ? "No recruiter responses yet"
      : `You heard back from 1 in ${Math.max(1, Math.round(totalApplications / interviewsAndOffers))} applications`;
  const personaSummary = buildPersonaSummary({
    focusLabel: topFocus.label,
    companyTypeLabel: topCompanyType.label,
    responseRate,
    responseLine,
    persona
  });

  return {
    empty: false,
    totalApplications,
    distinctCompanyCount,
    topCompany,
    topCompanies,
    topCompanyLogo: buildCompanyLogo(topCompany.label),
    topCompanyType,
    topFocus,
    statusCounts,
    responseRate,
    responseRatePercent,
    responseLine,
    mostActiveMonth: topMonth.label,
    mostActiveWeekday: topWeekday.label,
    mostActiveWeek: getTopEntry(weekCounts, "Your busiest week"),
    firstApplicationDate,
    latestApplicationDate,
    timeRangeLabel: `${formatDate(firstApplicationDate)} to ${formatDate(latestApplicationDate)}`,
    spanDays,
    personalInsight,
    aiSummary,
    persona,
    personaSummary
  };
}

export function buildWrappedSlides(wrapped) {
  if (!wrapped || wrapped.empty) {
    return [];
  }

  return [
    {
      id: "total",
      kind: "hero",
      tone: slideToneMap.total,
      eyebrow: "Applications",
      title: "You applied to",
      emphasis: `${wrapped.totalApplications} jobs`,
      context: getEffortLevel(wrapped.totalApplications, wrapped.distinctWeeks),
      body: `You applied to ${wrapped.distinctCompanyCount} companies, staying consistent in your search from ${formatDate(
        wrapped.firstApplicationDate
      )} through ${formatDate(wrapped.latestApplicationDate)}.`
    },
    {
      id: "company",
      kind: "company-rank",
      tone: slideToneMap.company,
      eyebrow: "Top Company",
      title: "You applied most to",
      emphasis: wrapped.topCompany.label,
      body:
        wrapped.topCompany.count > 1
          ? `${wrapped.topCompany.count} applications landed with ${wrapped.topCompany.label}.`
          : "Your applications were spread across a wide target list.",
      logo: wrapped.topCompanyLogo,
      rankings: wrapped.topCompanies.slice(1, 4)
    },
    {
      id: "focus",
      kind: "hero",
      tone: slideToneMap.focus,
      eyebrow: "Focus",
      title: "Your job hunt centered on",
      emphasis: wrapped.topFocus.label,
      body: "Your role titles point to the lane where you spent the most energy this cycle."
    },
    {
      id: "status",
      kind: "status-grid",
      tone: slideToneMap.status,
      eyebrow: "Status Breakdown",
      title: "Here's how your pipeline unfolded",
      body: "From first-touch applications to offers, this is how the search stacked up.",
      stats: wrapped.statusCounts
    },
    {
      id: "response",
      kind: "hero",
      tone: slideToneMap.response,
      eyebrow: "Response Rate",
      title: "Recruiter momentum",
      emphasis: `${wrapped.responseRatePercent}%`,
      context: getResponseLabel(wrapped.responseRate),
      body: `${wrapped.responseLine}. That gave your search a more meaningful story than raw application count alone.`
    },
    {
      id: "funnel",
      kind: "pipeline",
      tone: slideToneMap.activity,
      eyebrow: "Job Funnel",
      title: "How your pipeline flowed",
      body: "Applications moved into interviews, offers, and rejections at different rates across your search.",
      funnel: {
        applied: wrapped.totalApplications,
        interview: wrapped.statusCounts.Interview,
        offer: wrapped.statusCounts.Offer,
        rejected: wrapped.statusCounts.Rejected
      }
    },
    {
      id: "timeline",
      kind: "timeline",
      tone: slideToneMap.timeline,
      eyebrow: "Timeline",
      title: "Your job hunt spanned",
      emphasis: `${wrapped.spanDays} days`,
      context: getTimelineLabel(wrapped.spanDays),
      body: `${formatDate(wrapped.firstApplicationDate)} to ${formatDate(wrapped.latestApplicationDate)}. You kept your search moving across that full stretch.`
    },
    {
      id: "persona",
      kind: "hero",
      tone: slideToneMap.persona,
      eyebrow: "Persona",
      title: "Your Job Search Persona",
      emphasis: wrapped.persona,
      body: wrapped.personaSummary
    },
    {
      id: "final",
      kind: "social-share",
      tone: slideToneMap.final,
      eyebrow: "Share It",
      title: "Share your Joblets Wrapped",
      body: "#JobletsWrapped",
      post: {
        profileName: "You",
        likes: buildShareMetrics(wrapped).likes,
        comments: buildShareMetrics(wrapped).comments,
        previewEyebrow: "Joblets Wrapped",
        previewTitle: `${wrapped.totalApplications} applications`,
        previewSubtitle: wrapped.topFocus.label,
        previewAccent: wrapped.persona,
        caption: "Just used Joblets Wrapped to analyze my job search \u{1F447}",
        hashtag: "#JobletsWrapped"
      }
    }
  ];
}

export async function downloadWrappedSlide(cardElement, slide, slideIndex, totalSlides) {
  if (!cardElement) {
    throw new Error("Wrapped card is not ready to download.");
  }

  await waitForWrappedAssets(cardElement);

  const exportScale = Math.max(2, window.devicePixelRatio || 1);
  const exportBackgroundColor = getWrappedExportBackgroundColor(cardElement, slide.tone);
  const renderedCard = await html2canvas(cardElement, {
    backgroundColor: exportBackgroundColor,
    scale: exportScale,
    useCORS: true,
    logging: false,
    onclone: (clonedDocument) => {
      clonedDocument.querySelectorAll("[data-export-hidden='true']").forEach((element) => {
        element.style.display = "none";
      });

      const clonedCard = clonedDocument.querySelector("[data-export-root='true']");
      if (clonedCard) {
        clonedCard.setAttribute("data-exporting", "true");
        clonedCard.style.backgroundColor = exportBackgroundColor;
        clonedCard.style.opacity = "1";
        clonedCard.style.filter = "none";
        clonedCard.style.backdropFilter = "none";
      }
    }
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to prepare the export canvas.");
  }

  const [start, mid, end] = getExportGradient(slide.tone);
  const linear = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  linear.addColorStop(0, start);
  linear.addColorStop(0.52, mid);
  linear.addColorStop(1, end);
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orbOne = ctx.createRadialGradient(canvas.width * 0.16, canvas.height * 0.14, 30, canvas.width * 0.16, canvas.height * 0.14, 240);
  orbOne.addColorStop(0, "rgba(255,255,255,0.24)");
  orbOne.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = orbOne;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orbTwo = ctx.createRadialGradient(canvas.width * 0.84, canvas.height * 0.82, 40, canvas.width * 0.84, canvas.height * 0.82, 260);
  orbTwo.addColorStop(0, "rgba(245,243,255,0.18)");
  orbTwo.addColorStop(1, "rgba(245,243,255,0)");
  ctx.fillStyle = orbTwo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const horizontalPadding = 84;
  const verticalPadding = 110;
  const availableWidth = canvas.width - horizontalPadding * 2;
  const availableHeight = canvas.height - verticalPadding * 2;
  const fitScale = Math.min(availableWidth / renderedCard.width, availableHeight / renderedCard.height);
  const drawWidth = renderedCard.width * fitScale;
  const drawHeight = renderedCard.height * fitScale;
  const drawX = (canvas.width - drawWidth) / 2;
  const drawY = (canvas.height - drawHeight) / 2;

  ctx.drawImage(renderedCard, drawX, drawY, drawWidth, drawHeight);

  triggerCanvasDownload(canvas, buildExportFileName(slide, slideIndex, totalSlides));
}
import html2canvas from "html2canvas";

