import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { buildWrappedSlides, computeWrappedData, downloadWrappedSlide } from "./wrapped";

const STORAGE_KEY = "ai-job-tracker-user";
const DASHBOARD_ROUTE = "/";
const WRAPPED_ROUTE = "/wrapped";

const STATUS_OPTIONS = [
  "All",
  "Application Confirmation",
  "Interview Invitation",
  "Rejection",
  "Offer"
];

const EDITABLE_STATUSES = STATUS_OPTIONS.slice(1);
const REFRESH_STEPS = ["Scanning inbox...", "Analyzing emails...", "Extracting job data..."];
const WRAPPED_GENERATION_STEPS = [
  "Analyzing your applications...",
  "Detecting patterns...",
  "Calculating insights...",
  "Designing your wrapped..."
];
const WRAPPED_AUTOPLAY_MS = 3600;
const WRAPPED_HOLD_NAV_GUARD_MS = 180;

const defaultInsights = {
  totalApplications: 0,
  interviews: 0,
  rejections: 0,
  offers: 0,
  responseRate: 0
};

function getStoredUser() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function persistUser(user) {
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function getInitialRoute() {
  return window.location.pathname === WRAPPED_ROUTE ? WRAPPED_ROUTE : DASHBOARD_ROUTE;
}

function getStatusTone(status) {
  switch (status) {
    case "Offer":
      return "offer";
    case "Interview Invitation":
      return "interview";
    case "Rejection":
      return "rejected";
    default:
      return "applied";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "Interview Invitation":
      return "Interview";
    case "Rejection":
      return "Rejected";
    case "Offer":
      return "Offer";
    default:
      return "Applied";
  }
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTimestamp(dateValue) {
  return new Date(dateValue).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getActivityTone(type) {
  return type === "status_updated" ? "updated" : "added";
}

function getWrappedPipelineStages(funnel = {}) {
  const stages = [
    { key: "applied", label: "Applied", value: Math.max(funnel.applied || 0, 0) },
    { key: "interview", label: "Interview", value: Math.max(funnel.interview || 0, 0) },
    { key: "offer", label: "Offer", value: Math.max(funnel.offer || 0, 0) },
    { key: "rejected", label: "Rejected", value: Math.max(funnel.rejected || 0, 0) }
  ];
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return stages.map((stage) => {
    const ratio = stage.value / maxValue;

    return {
      ...stage,
      width: `${58 + ratio * 42}%`,
      minHeight: `${54 + ratio * 28}px`
    };
  });
}

function AuthView({ authMode, authForm, loading, feedback, onAuthModeChange, onAuthFormChange, onSubmit }) {
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const [bannerExiting, setBannerExiting] = useState(false);

  useEffect(() => {
    if (!showDemoBanner) {
      return undefined;
    }

    const exitTimer = window.setTimeout(() => {
      setBannerExiting(true);
    }, 4500);

    const hideTimer = window.setTimeout(() => {
      setShowDemoBanner(false);
    }, 4820);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showDemoBanner]);

  function dismissDemoBanner() {
    setBannerExiting(true);
    window.setTimeout(() => setShowDemoBanner(false), 320);
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <h1>Joblets</h1>
        <p className="hero-copy">
          Track your job applications automatically {"\u2014"} no spreadsheets required.
        </p>
        <p className="hero-support">
          Connect your email, scan your inbox, and instantly organize applications by company, role, and status.
          Then turn your job search into insights with Joblets Wrapped.
        </p>
        <div className="auth-hero-actions">
          <button className="primary-button" type="button" onClick={() => onAuthModeChange("signup")}>
            Get Started
          </button>
          <button className="secondary-button auth-hero-secondary" type="button" onClick={() => onAuthModeChange("login")}>
            View Demo
          </button>
        </div>
      </div>

      <div className="auth-panel">
        {showDemoBanner && (
          <div className={`demo-helper-banner ${bannerExiting ? "is-exiting" : ""}`} role="status">
            <div className="demo-helper-progress" aria-hidden="true" />
            <div className="demo-helper-icon" aria-hidden="true">
              {"\u2139"}
            </div>
            <div className="demo-helper-copy">
              <strong>Quick tip</strong>
              <p>This is a demo {"\u2014"} use any email and password to get started.</p>
            </div>
            <button
              className="demo-helper-dismiss"
              type="button"
              aria-label="Dismiss demo mode banner"
              onClick={dismissDemoBanner}
            >
              {"\u00D7"}
            </button>
          </div>
        )}

        <form className="auth-card" onSubmit={onSubmit}>
          <div className="auth-toggle">
            <button
              type="button"
              className={authMode === "signup" ? "active" : ""}
              onClick={() => onAuthModeChange("signup")}
            >
              Sign up
            </button>
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => onAuthModeChange("login")}
            >
              Log in
            </button>
          </div>

          {authMode === "signup" && (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) => onAuthFormChange({ ...authForm, name: event.target.value })}
                placeholder="Avery Johnson"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => onAuthFormChange({ ...authForm, email: event.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => onAuthFormChange({ ...authForm, password: event.target.value })}
              placeholder="demo-password"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Working..." : authMode === "signup" ? "Create account" : "Log in"}
          </button>

          {feedback && <div className="feedback">{feedback}</div>}
        </form>
      </div>
    </div>
  );
}
function WrappedSlide({
  slide,
  slideIndex,
  totalSlides,
  wrappedData,
  autoplayProgress,
  cardRef,
  downloadLabel,
  onDownload,
  onPrevious,
  onNext,
  onHoldStart,
  onHoldEnd
}) {
  const showDownloaded = downloadLabel === "Downloaded!";
  const showDownloading = downloadLabel === "Downloading...";

  return (
    <section
      className={`wrapped-stage wrapped-tone-${slide.tone}`}
    >
      <div className="wrapped-tap-zones" aria-hidden="true">
        <button
          className="wrapped-tap-zone wrapped-tap-zone-left"
          type="button"
          onClick={onPrevious}
          tabIndex={-1}
        />
        <button
          className="wrapped-tap-zone wrapped-tap-zone-right"
          type="button"
          onClick={onNext}
          tabIndex={-1}
        />
      </div>
      <div className="wrapped-motion wrapped-motion-one" aria-hidden="true" />
      <div className="wrapped-motion wrapped-motion-two" aria-hidden="true" />

      <div className="wrapped-stage-inner">
        <div className="wrapped-progress-bars" aria-label="Story progress">
          {Array.from({ length: totalSlides }, (_, index) => {
            const progressValue = index < slideIndex ? 1 : index === slideIndex ? autoplayProgress : 0;

            return (
              <span key={`wrapped-progress-${index}`} className="wrapped-progress-segment">
                <span
                  className="wrapped-progress-fill"
                  style={{ transform: `scaleX(${progressValue})` }}
                />
              </span>
            );
          })}
        </div>

        <div className="wrapped-stage-meta">
          <span className="wrapped-overline">{slide.eyebrow}</span>
          <span className="wrapped-step">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>

        <div className="wrapped-card-shell">
          <article
            key={slide.id}
            ref={cardRef}
            className={`wrapped-card wrapped-card-${slide.kind}`}
            data-export-root="true"
            onMouseDown={onHoldStart}
            onMouseUp={onHoldEnd}
            onTouchStart={onHoldStart}
            onTouchEnd={onHoldEnd}
            onTouchCancel={onHoldEnd}
          >
            <div className="wrapped-card-copy">
              {slide.kind !== "social-share" && <p className="wrapped-card-title">{slide.title}</p>}
              {slide.kind !== "social-share" && slide.emphasis && <h2 className="wrapped-card-emphasis">{slide.emphasis}</h2>}

              {slide.kind === "company-rank" ? (
                <>
                  <div className="wrapped-company-spotlight">
                    <div className="wrapped-company-logo-shell">
                      <img className="wrapped-company-logo" src={slide.logo.src} alt={slide.logo.alt} />
                    </div>
                    <div className="wrapped-company-name-block">
                      <p className="wrapped-company-name">{slide.emphasis}</p>
                      <p className="wrapped-company-subtitle">{slide.body}</p>
                    </div>
                  </div>

                  {slide.rankings?.length > 0 && (
                    <div className="wrapped-company-rankings">
                      {slide.rankings.map((entry) => (
                        <div key={entry.label} className="wrapped-company-rank-row">
                          <span>{entry.rank}.</span>
                          <strong>{entry.label}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : slide.kind === "status-grid" ? (
                <div className="wrapped-status-grid">
                  {Object.entries(slide.stats).map(([label, value]) => (
                    <div key={label} className={`wrapped-status-pill ${label.toLowerCase()}`}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ) : slide.kind === "pipeline" ? (
                (() => {
                  const stages = getWrappedPipelineStages(slide.funnel);

                  return (
                    <>
                      <div className="wrapped-pipeline-card" role="img" aria-label="Job application funnel showing applied, interview, offer, and rejected counts">
                        <div className="wrapped-pipeline-heading-row" aria-hidden="true">
                          <span>Applied</span>
                          <span>Interview</span>
                          <span>Outcome</span>
                        </div>
                        <div className="wrapped-pipeline-list">
                          {stages.map((stage, index) => (
                            <div key={stage.key} className="wrapped-pipeline-stage-group">
                              <div
                                className={`wrapped-pipeline-stage ${stage.key}`}
                                style={{ width: stage.width, minHeight: stage.minHeight }}
                              >
                                <span className="wrapped-pipeline-stage-label">{stage.label}</span>
                                <strong className="wrapped-pipeline-stage-value">{stage.value}</strong>
                              </div>
                              {index < stages.length - 1 && <div className="wrapped-pipeline-connector" aria-hidden="true" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="wrapped-card-body wrapped-card-body-funnel">{slide.body}</p>
                    </>
                  );
                })()
              ) : slide.kind === "timeline" ? (
                <>
                  <p className="wrapped-card-body">{slide.body}</p>
                  <div className="wrapped-timeline">
                    <div className="wrapped-timeline-node">
                      <span>First</span>
                      <strong>{formatDate(wrappedData.firstApplicationDate)}</strong>
                    </div>
                    <div className="wrapped-timeline-line" aria-hidden="true" />
                    <div className="wrapped-timeline-node">
                      <span>Latest</span>
                    <strong>{formatDate(wrappedData.latestApplicationDate)}</strong>
                  </div>
                </div>
              </>
              ) : slide.kind === "social-share" ? (
                <div className="wrapped-social-post">
                  <div className="wrapped-social-post-shell">
                    <div className="wrapped-social-post-header">
                      <div className="wrapped-social-avatar" aria-hidden="true">
                        {slide.post.profileName.slice(0, 1)}
                      </div>
                      <div className="wrapped-social-meta">
                        <strong>{slide.post.profileName}</strong>
                        <span>LinkedIn mock post</span>
                      </div>
                    </div>

                    <p className="wrapped-social-caption">{slide.body}</p>

                    <div className="wrapped-social-preview">
                      <div className="wrapped-social-preview-gradient" aria-hidden="true" />
                      <div className="wrapped-social-preview-content">
                        <p>{slide.post.previewEyebrow}</p>
                        <strong>{slide.post.previewTitle}</strong>
                        <span>{slide.post.previewSubtitle}</span>
                        <small>{slide.post.previewAccent}</small>
                      </div>
                    </div>

                    <div className="wrapped-social-engagement">
                      <span>{slide.post.likes} likes</span>
                      <span>{slide.post.comments} comments</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`wrapped-card-body ${slide.kind === "insight" ? "wrapped-card-body-insight" : ""}`}>
                  {slide.body}
                </p>
              )}
            </div>

            <div className="wrapped-card-footer">
              <div className="wrapped-nav-buttons">
                <button className="wrapped-nav-button" type="button" onClick={onPrevious} disabled={slideIndex === 0}>
                  Previous
                </button>
                <button
                  className="wrapped-nav-button"
                  type="button"
                  onClick={onNext}
                  disabled={slideIndex === totalSlides - 1}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="wrapped-download-control" data-export-hidden="true">
              <button
                className={`wrapped-icon-action ${showDownloaded ? "is-confirmed" : ""}`}
                type="button"
                onClick={onDownload}
                aria-label={showDownloading ? "Downloading" : "Download"}
                title="Download"
              >
                {showDownloading ? (
                  <span className="wrapped-icon-spinner" aria-hidden="true" />
                ) : showDownloaded ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20 7L9 18l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="wrapped-icon-tooltip" role="tooltip">
                Download
              </span>
              <span className={`wrapped-download-toast ${showDownloaded ? "is-visible" : ""}`} aria-live="polite">
                Downloaded!
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function WrappedExperience({ wrappedData, slides, onNavigateDashboard }) {
  const [phase, setPhase] = useState("landing");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [autoplayProgress, setAutoplayProgress] = useState(0);
  const [isHoldPaused, setIsHoldPaused] = useState(false);
  const [downloadedSlideId, setDownloadedSlideId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);
  const downloadTimerRef = useRef(null);
  const holdStartedAtRef = useRef(0);
  const holdResumeTimerRef = useRef(null);
  const holdActiveRef = useRef(false);
  const isAutoplayPaused = isHoldPaused || isDownloading;

  useEffect(() => {
    setPhase("landing");
    setLoadingStepIndex(0);
    setActiveSlideIndex(0);
    setAutoplayProgress(0);
    setIsHoldPaused(false);
    setDownloadedSlideId("");
    setIsDownloading(false);
    holdActiveRef.current = false;
  }, [wrappedData?.totalApplications]);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) {
        window.clearTimeout(downloadTimerRef.current);
      }

      if (holdResumeTimerRef.current) {
        window.clearTimeout(holdResumeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") {
      setLoadingStepIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((current) =>
        current === WRAPPED_GENERATION_STEPS.length - 1 ? current : current + 1
      );
    }, 1100);

    const completion = window.setTimeout(() => {
      setPhase("slides");
      setActiveSlideIndex(0);
    }, WRAPPED_GENERATION_STEPS.length * 1100 + 650);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(completion);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "slides") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        setActiveSlideIndex((current) => Math.min(current + 1, slides.length - 1));
      }

      if (event.key === "ArrowLeft") {
        setActiveSlideIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, slides.length]);

  useEffect(() => {
    if (phase !== "slides") {
      setAutoplayProgress(0);
      return undefined;
    }

    setAutoplayProgress(0);
    return undefined;
  }, [phase, activeSlideIndex]);

  useEffect(() => {
    if (phase !== "slides" || isAutoplayPaused || slides.length === 0) {
      return undefined;
    }

    const tickMs = 40;
    const progressStep = tickMs / WRAPPED_AUTOPLAY_MS;
    const interval = window.setInterval(() => {
      setAutoplayProgress((current) => {
        if (current + progressStep >= 1) {
          if (activeSlideIndex >= slides.length - 1) {
            return 1;
          }

          window.setTimeout(() => {
            setActiveSlideIndex((slidePosition) => Math.min(slidePosition + 1, slides.length - 1));
          }, 0);
          return 0;
        }

        return current + progressStep;
      });
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [phase, isAutoplayPaused, activeSlideIndex, slides.length]);

  useEffect(() => {
    if (!holdActiveRef.current) {
      return undefined;
    }

    const handleRelease = () => {
      releaseHoldPause();
    };

    window.addEventListener("mouseup", handleRelease);
    window.addEventListener("touchend", handleRelease);
    window.addEventListener("touchcancel", handleRelease);

    return () => {
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("touchend", handleRelease);
      window.removeEventListener("touchcancel", handleRelease);
    };
  }, [isHoldPaused]);

  function navigateSlide(direction) {
    setActiveSlideIndex((current) => {
      const next =
        direction === "next"
          ? Math.min(current + 1, slides.length - 1)
          : Math.max(current - 1, 0);

      return next;
    });
    setAutoplayProgress(0);
  }

  function beginHoldPause() {
    if (phase !== "slides" || isDownloading) {
      return;
    }

    if (holdResumeTimerRef.current) {
      window.clearTimeout(holdResumeTimerRef.current);
    }

    holdStartedAtRef.current = Date.now();
    holdActiveRef.current = true;
    setIsHoldPaused(true);
  }

  function releaseHoldPause() {
    if (!holdActiveRef.current) {
      return;
    }

    const heldForMs = Date.now() - holdStartedAtRef.current;
    holdActiveRef.current = false;

    if (heldForMs < WRAPPED_HOLD_NAV_GUARD_MS) {
      holdResumeTimerRef.current = window.setTimeout(() => {
        setIsHoldPaused(false);
      }, 0);
      return;
    }

    setIsHoldPaused(false);
  }

  async function handleDownloadCurrentSlide() {
    if (!currentSlide || !cardRef.current || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      await downloadWrappedSlide(cardRef.current, currentSlide, activeSlideIndex, slides.length);
      setDownloadedSlideId(currentSlide.id);
      if (downloadTimerRef.current) {
        window.clearTimeout(downloadTimerRef.current);
      }
      downloadTimerRef.current = window.setTimeout(() => setDownloadedSlideId(""), 1800);
    } catch (_error) {
      setDownloadedSlideId("");
    } finally {
      setIsDownloading(false);
      setAutoplayProgress(0);
    }
  }

  if (!wrappedData || wrappedData.empty) {
    return (
      <section className="wrapped-empty">
        <div className="wrapped-empty-card">
          <p className="eyebrow">Joblets Wrapped</p>
          <h2>Not enough data yet.</h2>
          <p>Start applying to jobs to generate your Wrapped.</p>
          <button className="primary-button" type="button" onClick={onNavigateDashboard}>
            Back to dashboard
          </button>
        </div>
      </section>
    );
  }

  const currentSlide = slides[activeSlideIndex];
  const generationProgress = ((loadingStepIndex + 1) / WRAPPED_GENERATION_STEPS.length) * 100;

  return (
    <section className="wrapped-page">
      {phase === "landing" && (
        <div className="wrapped-landing">
          <div className="wrapped-landing-card">
            <p className="eyebrow">Joblets Wrapped</p>
            <h2>Your Job Hunt, Wrapped</h2>
            <p className="wrapped-landing-subtitle">
              A personalized summary of your job search powered by AI
            </p>
            <p className="wrapped-landing-description">
              Turn your job applications into insights, trends, and shareable moments.
            </p>
            <button className="primary-button wrapped-generate-button" type="button" onClick={() => setPhase("loading")}>
              Generate My Wrapped
            </button>
          </div>
        </div>
      )}

      {phase === "loading" && (
        <div className="wrapped-loading-screen" aria-live="polite">
          <div className="wrapped-loading-card">
            <div className="wrapped-loading-spinner" aria-hidden="true" />
            <p className="wrapped-loading-label">Building your story</p>
            <h2>{WRAPPED_GENERATION_STEPS[loadingStepIndex]}</h2>
            <p>Weâ€™re turning your job search history into a polished shareable recap.</p>
            <div className="wrapped-progress">
              <div className="wrapped-progress-bar" style={{ width: `${generationProgress}%` }} />
            </div>
            <div className="wrapped-progress-steps">
              {WRAPPED_GENERATION_STEPS.map((step, index) => (
                <span key={step} className={index <= loadingStepIndex ? "active" : ""}>
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "slides" && currentSlide && (
        <WrappedSlide
          slide={currentSlide}
          slideIndex={activeSlideIndex}
          totalSlides={slides.length}
          wrappedData={wrappedData}
          autoplayProgress={autoplayProgress}
          cardRef={cardRef}
          downloadLabel={
            isDownloading ? "Downloading..." : downloadedSlideId === currentSlide.id ? "Downloaded!" : "Download"
          }
          onDownload={handleDownloadCurrentSlide}
          onPrevious={() => navigateSlide("previous")}
          onNext={() => navigateSlide("next")}
          onHoldStart={beginHoldPause}
          onHoldEnd={releaseHoldPause}
        />
      )}
    </section>
  );
}

function DashboardView({
  user,
  feedback,
  hasMoreEmails,
  loading,
  refreshing,
  demoLoading,
  refreshStepIndex,
  newEntryIds,
  applications,
  recentActivity,
  insights,
  filters,
  editingId,
  editDraft,
  filteredApplications,
  onConnectEmail,
  onRefreshInbox,
  onLoadDemo,
  onViewWrapped,
  onFilterChange,
  onEditDraftChange,
  onBeginEdit,
  onSaveEdit,
  onCancelEdit
}) {
  const isProcessingInbox = refreshing || demoLoading;
  const inboxFullyScanned = !hasMoreEmails || user?.inboxFullyScanned;
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [showEmailOnboarding, setShowEmailOnboarding] = useState(!user.emailConnected);
  const [emailOnboardingExiting, setEmailOnboardingExiting] = useState(false);
  const visibleActivity = activityExpanded ? recentActivity : recentActivity.slice(0, 2);
  const canExpandActivity = recentActivity.length > 2;

  useEffect(() => {
    if (!user.emailConnected) {
      setShowEmailOnboarding(true);
      setEmailOnboardingExiting(false);
      return undefined;
    }

    if (!showEmailOnboarding) {
      return undefined;
    }

    setEmailOnboardingExiting(true);
    const timer = window.setTimeout(() => {
      setShowEmailOnboarding(false);
      setEmailOnboardingExiting(false);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [user.emailConnected, showEmailOnboarding]);

  return (
    <>
      {feedback && <div className="feedback banner">{feedback}</div>}

      {showEmailOnboarding && (
        <section className={`email-onboarding-card ${emailOnboardingExiting ? "is-exiting" : ""}`}>
          <div>
            <h3>No email connected</h3>
            <p>Connect your email to automatically track job applications from your inbox.</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={onConnectEmail}
            disabled={loading || isProcessingInbox}
          >
            Connect Email
          </button>
        </section>
      )}

      <section className="insights-grid">
        <article className="stat-card">
          <span>Total applications</span>
          <strong>{insights.totalApplications}</strong>
        </article>
        <article className="stat-card">
          <span>Interviews</span>
          <strong>{insights.interviews}</strong>
        </article>
        <article className="stat-card">
          <span>Rejections</span>
          <strong>{insights.rejections}</strong>
        </article>
        <article className="stat-card">
          <span>Response rate</span>
          <strong>{insights.responseRate}%</strong>
        </article>
      </section>

      <section className="control-panel">
        <div className="control-group">
          <label>
            Status
            <select value={filters.status} onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => onFilterChange({ ...filters, startDate: event.target.value })}
            />
          </label>

          <label>
            End date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => onFilterChange({ ...filters, endDate: event.target.value })}
            />
          </label>

          <label>
            Sort by
            <select value={filters.sortBy} onChange={(event) => onFilterChange({ ...filters, sortBy: event.target.value })}>
              <option value="date-desc">Date newest first</option>
              <option value="date-asc">Date oldest first</option>
              <option value="company-asc">Company A-Z</option>
              <option value="company-desc">Company Z-A</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
          </label>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div>
            <h3>Tracked Applications</h3>
            <p>{filteredApplications.length} visible entries</p>
          </div>
          <div className="table-header-actions">
            <button
              className="toolbar-button"
              type="button"
              onClick={onRefreshInbox}
              disabled={isProcessingInbox || !user.emailConnected || inboxFullyScanned}
            >
              {refreshing ? "Refreshing..." : inboxFullyScanned ? "Inbox Fully Scanned" : "Refresh Inbox"}
            </button>
            <button className="wrapped-feature-button" type="button" onClick={onViewWrapped}>
              <span aria-hidden="true">{"\u2728"}</span>
              <span>Joblets Wrapped</span>
            </button>
          </div>
        </div>

        <div className="table-toolbar-meta">
          <span className="subtle-copy">
            {!user.emailConnected
              ? "No email connected yet. Use the card above to connect your inbox."
              : inboxFullyScanned
                ? "Inbox fully scanned. Your latest applications are already up to date."
                : "Inbox ready. Refresh to scan for new applications."}
          </span>
          <div className="table-toolbar-links">
            {applications.length === 0 && (
              <button className="link-button muted" type="button" onClick={onLoadDemo} disabled={demoLoading}>
                {demoLoading ? "Running Demo..." : "Demo Mode"}
              </button>
            )}
          </div>
        </div>

        {isProcessingInbox && (
          <div className="refresh-status table-refresh-status" aria-live="polite">
            <div className="refresh-spinner" aria-hidden="true" />
            <div className="refresh-copy">
              <strong>{REFRESH_STEPS[refreshStepIndex]}</strong>
              <span>
                {demoLoading
                  ? "Loading curated demo emails and updating tracked applications."
                  : "Refreshing your inbox and updating tracked applications."}
              </span>
            </div>
            <div className="refresh-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Application Portal</th>
                <th>Date Applied</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <h4>No applications yet</h4>
                      <p>
                        Connect Email using the card above or use Demo Mode to populate the tracker, or adjust your filters if entries
                        are hidden.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => {
                  const isEditing = editingId === application.id;
                  const isNew = newEntryIds.includes(application.id);

                  return (
                    <tr key={application.id} className={isNew ? "new-row" : ""}>
                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.company}
                            onChange={(event) => onEditDraftChange({ ...editDraft, company: event.target.value })}
                          />
                        ) : (
                          <div className="primary-cell">
                            <span>{application.company}</span>
                            {isNew && <small className="new-badge">New</small>}
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.role}
                            onChange={(event) => onEditDraftChange({ ...editDraft, role: event.target.value })}
                          />
                        ) : (
                          <a className="table-link role-link" href={application.emailLink} target="_blank" rel="noreferrer">
                            {application.role}
                          </a>
                        )}
                      </td>
                      <td>
                        {application.portalLink ? (
                          <a
                            className="table-link portal-link"
                            href={application.portalLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Application
                          </a>
                        ) : (
                          <span className="empty-link">No portal available</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDraft.dateApplied}
                            onChange={(event) => onEditDraftChange({ ...editDraft, dateApplied: event.target.value })}
                          />
                        ) : (
                          formatDate(application.dateApplied)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editDraft.status}
                            onChange={(event) => onEditDraftChange({ ...editDraft, status: event.target.value })}
                          >
                            {EDITABLE_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-badge ${getStatusTone(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {isEditing ? (
                            <>
                              <button className="link-button" type="button" onClick={() => onSaveEdit(application.id)}>
                                Save
                              </button>
                              <button className="link-button muted" type="button" onClick={onCancelEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button className="link-button" type="button" onClick={() => onBeginEdit(application)}>
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="activity-card">
        <div className="activity-header">
          <div>
            <h3>Recent activity</h3>
            <p>Latest additions and status changes from inbox refreshes.</p>
          </div>
          <button
            className="activity-toggle"
            type="button"
            onClick={() => setActivityExpanded((current) => !current)}
            aria-expanded={activityExpanded}
          >
            <span>{activityExpanded ? "\u25B2" : "\u25BC"}</span>
            <span>{activityExpanded ? "Collapse" : "Expand"}</span>
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="activity-content activity-content-expanded">
            <div className="activity-empty">
              <h4>No recent activity yet</h4>
              <p>Refresh the inbox to start building a live feed of new applications and status changes.</p>
            </div>
          </div>
        ) : (
          <div className={`activity-content ${activityExpanded ? "activity-content-expanded" : ""}`}>
            <div className="activity-list">
              {visibleActivity.map((activity) => (
                <article key={activity.id} className="activity-item">
                  <div className={`activity-marker ${getActivityTone(activity.type)}`} aria-hidden="true" />
                  <div className="activity-body">
                    <div className="activity-topline">
                      <strong>{activity.company}</strong>
                      <span>{formatTimestamp(activity.createdAt)}</span>
                    </div>
                    <p>{activity.message}</p>
                    <small>{activity.role}</small>
                  </div>
                </article>
              ))}
            </div>

            {canExpandActivity && (
              <div className="activity-actions">
                <button
                  className="activity-link"
                  type="button"
                  onClick={() => setActivityExpanded((current) => !current)}
                >
                  {activityExpanded ? "Show less" : "Show more"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function App() {
  const [route, setRoute] = useState(() => getInitialRoute());
  const [authMode, setAuthMode] = useState("signup");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [user, setUser] = useState(() => getStoredUser());
  const [applications, setApplications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [insights, setInsights] = useState(defaultInsights);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [refreshStepIndex, setRefreshStepIndex] = useState(0);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [newEntryIds, setNewEntryIds] = useState([]);
  const [filters, setFilters] = useState({
    status: "All",
    startDate: "",
    endDate: "",
    sortBy: "date-desc"
  });
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({
    company: "",
    role: "",
    dateApplied: "",
    status: ""
  });

  useEffect(() => {
    const handlePopState = () => setRoute(getInitialRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    loadDashboard(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (newEntryIds.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNewEntryIds([]), 4500);
    return () => window.clearTimeout(timer);
  }, [newEntryIds]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFeedback(""), 3600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const isProcessingInbox = refreshing || demoLoading;

  useEffect(() => {
    if (!isProcessingInbox) {
      setRefreshStepIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRefreshStepIndex((current) => (current + 1) % REFRESH_STEPS.length);
    }, 1100);

    return () => window.clearInterval(interval);
  }, [isProcessingInbox]);

  async function loadDashboard(userId) {
    setLoading(true);

    try {
      const data = await api.getDashboard(userId);
      setApplications(data.applications);
      setRecentActivity(data.recentActivity || []);
      setInsights(data.insights);
      setHasMoreEmails(data.hasMoreEmails);
      setUser((current) => {
        const nextUser = { ...(current || {}), ...data.user };
        persistUser(nextUser);
        return nextUser;
      });
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const action = authMode === "signup" ? api.signup : api.login;
      const payload = {
        email: authForm.email,
        password: authForm.password
      };

      if (authMode === "signup") {
        payload.name = authForm.name;
      }

      const data = await action(payload);
      setUser(data.user);
      persistUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      setFeedback(authMode === "signup" ? "Account created. Welcome in." : "Welcome back.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectEmail() {
    setLoading(true);
    setFeedback("");

    try {
      const data = await api.connectEmail(user.id);
      setUser(data.user);
      persistUser(data.user);
      setFeedback(data.message);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshInbox() {
    setRefreshing(true);
    setFeedback("");

    try {
      const data = await api.refreshInbox(user.id);
      setApplications(data.applications);
      setRecentActivity(data.recentActivity || []);
      setInsights(data.insights);
      setHasMoreEmails(data.inboxSummary.hasMoreEmails);
      setNewEntryIds(data.newIds);
      setUser(data.user);
      persistUser(data.user);
      setFeedback(data.message);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLoadDemo() {
    setDemoLoading(true);
    setFeedback("");

    try {
      const data = await api.loadDemo(user.id);
      setApplications(data.applications);
      setRecentActivity(data.recentActivity || []);
      setInsights(data.insights);
      setHasMoreEmails(data.inboxSummary.hasMoreEmails);
      setNewEntryIds(data.newIds);
      setUser(data.user);
      persistUser(data.user);
      setFeedback(data.message);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setDemoLoading(false);
    }
  }

  function beginEdit(application) {
    setEditingId(application.id);
    setEditDraft({
      company: application.company,
      role: application.role,
      dateApplied: application.dateApplied,
      status: application.status
    });
  }

  function cancelEdit() {
    setEditingId("");
    setEditDraft({ company: "", role: "", dateApplied: "", status: "" });
  }

  async function saveEdit(applicationId) {
    setLoading(true);
    setFeedback("");

    try {
      const data = await api.updateApplication(user.id, applicationId, editDraft);
      setApplications(data.applications);
      setRecentActivity(data.recentActivity || []);
      setInsights(data.insights);
      setFeedback(data.message);
      cancelEdit();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(nextRoute) {
    const routeToUse = nextRoute === WRAPPED_ROUTE ? WRAPPED_ROUTE : DASHBOARD_ROUTE;

    if (window.location.pathname !== routeToUse) {
      window.history.pushState({}, "", routeToUse);
    }

    setRoute(routeToUse);
  }

  function handleLogout() {
    persistUser(null);
    setUser(null);
    setApplications([]);
    setRecentActivity([]);
    setInsights(defaultInsights);
    setFeedback("");
    setHasMoreEmails(true);
    handleNavigate(DASHBOARD_ROUTE);
  }

  const filteredApplications = useMemo(() => {
    const sorted = [...applications].filter((application) => {
      const matchesStatus = filters.status === "All" ? true : application.status === filters.status;
      const appliedTime = new Date(application.dateApplied).getTime();
      const matchesStart = filters.startDate ? appliedTime >= new Date(filters.startDate).getTime() : true;
      const matchesEnd = filters.endDate ? appliedTime <= new Date(filters.endDate).getTime() : true;

      return matchesStatus && matchesStart && matchesEnd;
    });

    sorted.sort((left, right) => {
      switch (filters.sortBy) {
        case "company-asc":
          return left.company.localeCompare(right.company);
        case "company-desc":
          return right.company.localeCompare(left.company);
        case "status-asc":
          return left.status.localeCompare(right.status);
        case "status-desc":
          return right.status.localeCompare(left.status);
        case "date-asc":
          return new Date(left.dateApplied) - new Date(right.dateApplied);
        case "date-desc":
        default:
          return new Date(right.dateApplied) - new Date(left.dateApplied);
      }
    });

    return sorted;
  }, [applications, filters]);

  const wrappedData = useMemo(() => computeWrappedData(applications), [applications]);
  const wrappedSlides = useMemo(() => buildWrappedSlides(wrappedData), [wrappedData]);

  if (!user) {
    return (
      <AuthView
        authMode={authMode}
        authForm={authForm}
        loading={loading}
        feedback={feedback}
        onAuthModeChange={setAuthMode}
        onAuthFormChange={setAuthForm}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className={`app-shell ${route === WRAPPED_ROUTE ? "app-shell-wrapped" : ""}`}>
      <header className={`topbar ${route === WRAPPED_ROUTE ? "topbar-wrapped" : ""}`}>
        <div className="topbar-brand">
          <h1>Joblets</h1>
          <p className="topbar-subtitle">Track your job applications effortlessly</p>
        </div>

        <div className="topbar-actions">
          <nav className="topbar-nav" aria-label="Primary">
            <button
              className={`nav-pill ${route === DASHBOARD_ROUTE ? "active" : ""}`}
              type="button"
              onClick={() => handleNavigate(DASHBOARD_ROUTE)}
            >
              Dashboard
            </button>
            <button
              className={`nav-pill ${route === WRAPPED_ROUTE ? "active" : ""}`}
              type="button"
              onClick={() => handleNavigate(WRAPPED_ROUTE)}
            >
              Joblets Wrapped
            </button>
          </nav>
          <div className="topbar-utility">
            <div className={`connection-indicator ${user.emailConnected ? "connected" : "disconnected"}`}>
              <span className="connection-dot" aria-hidden="true" />
              <span>{user.emailConnected ? "Email Connected" : "No Email Connected"}</span>
            </div>
            <button className="secondary-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      {route === WRAPPED_ROUTE ? (
        <WrappedExperience
          wrappedData={wrappedData}
          slides={wrappedSlides}
          onNavigateDashboard={() => handleNavigate(DASHBOARD_ROUTE)}
        />
      ) : (
        <DashboardView
          user={user}
          feedback={feedback}
          hasMoreEmails={hasMoreEmails}
          loading={loading}
          refreshing={refreshing}
          demoLoading={demoLoading}
          refreshStepIndex={refreshStepIndex}
          newEntryIds={newEntryIds}
          applications={applications}
          recentActivity={recentActivity}
          insights={insights}
          filters={filters}
          editingId={editingId}
          editDraft={editDraft}
          filteredApplications={filteredApplications}
          onConnectEmail={handleConnectEmail}
          onRefreshInbox={handleRefreshInbox}
          onLoadDemo={handleLoadDemo}
          onViewWrapped={() => handleNavigate(WRAPPED_ROUTE)}
          onFilterChange={setFilters}
          onEditDraftChange={setEditDraft}
          onBeginEdit={beginEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
        />
      )}
    </div>
  );
}

export default App;





