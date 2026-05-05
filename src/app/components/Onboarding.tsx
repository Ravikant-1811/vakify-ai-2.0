import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, BookOpen, Brain, CheckCircle2, Code2, FileText, Loader2, Mail, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  topic: string;
};

type AssessmentResult = {
  learning_style: 'visual' | 'auditory' | 'kinesthetic';
  visual_score: number;
  auditory_score: number;
  kinesthetic_score: number;
  total: number;
  percentage: number;
  weak_topics: string[];
};

const LANGUAGE_CHOICES = ['Python', 'JavaScript', 'Java', 'C++', 'C'];

export function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferredLanguage || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otherDetails, setOtherDetails] = useState('');
  const [finishing, setFinishing] = useState(false);

  const totalSteps = 3;

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.preferredLanguage) {
      setSelectedLanguage(user.preferredLanguage);
    }
  }, [user?.displayName, user?.email, user?.preferredLanguage]);

  useEffect(() => {
    const loadAssessment = async () => {
      if (step !== 1 || assessmentQuestions.length) {
        return;
      }

      setAssessmentLoading(true);
      setAssessmentError('');
      try {
        const response = await apiFetch<{ questions: AssessmentQuestion[] }>('/api/assessment/questions');
        setAssessmentQuestions(response.questions || []);
        setAssessmentAnswers((current) => {
          const next = { ...current };
          for (const question of response.questions || []) {
            if (!(question.id in next)) {
              next[question.id] = -1;
            }
          }
          return next;
        });
      } catch (err) {
        setAssessmentError(err instanceof Error ? err.message : 'Unable to load assessment questions.');
      } finally {
        setAssessmentLoading(false);
      }
    };

    void loadAssessment();
  }, [assessmentQuestions.length, step]);

  useEffect(() => {
    if (assessmentResult && step === 2) {
      setDisplayName((current) => current || user?.displayName || '');
    }
  }, [assessmentResult, step, user?.displayName]);

  const answeredCount = useMemo(
    () => Object.values(assessmentAnswers).filter((value) => value !== -1 && value !== undefined).length,
    [assessmentAnswers],
  );

  const dominantStyle = assessmentResult?.learning_style || 'visual';

  const canFinish = Boolean(
    displayName.trim() &&
      email.trim() &&
      selectedLanguage &&
      assessmentResult &&
      !finishing,
  );

  const submitAssessment = async () => {
    if (answeredCount < assessmentQuestions.length || assessmentLoading) {
      return;
    }

    setAssessmentLoading(true);
    setAssessmentError('');
    try {
      const response = await apiFetch<{ assessment: AssessmentResult }>('/api/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({
          answers: assessmentAnswers,
        }),
      });
      setAssessmentResult(response.assessment);
      setStep(2);
    } catch (err) {
      setAssessmentError(err instanceof Error ? err.message : 'Unable to save assessment.');
    } finally {
      setAssessmentLoading(false);
    }
  };

  const finishOnboarding = async () => {
    if (!canFinish) {
      return;
    }

    setFinishing(true);
    try {
      await completeOnboarding({
        displayName: displayName.trim(),
        email: email.trim(),
        preferredLanguage: selectedLanguage,
        phoneNumber: phoneNumber.trim(),
        otherDetails: otherDetails.trim() ? { notes: otherDetails.trim() } : null,
      });
    } finally {
      setFinishing(false);
    }
  };

  const renderStepHeader = (title: string, description: string, icon: ReactNode) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${i + 1 <= step ? 'bg-secondary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
            <p className="text-sm text-muted-foreground">Create your account, learn your style, and launch into Vakify.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sm:p-8 shadow-sm">
          {step === 1 && (
            <div>
              {renderStepHeader(
                'Vakify assessment: 10 quick questions',
                'This identifies your learning style so the rest of Vakify can adapt to you.',
                <Brain className="w-6 h-6 text-secondary" />,
              )}

              {assessmentLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your assessment...
                </div>
              )}

              {assessmentError && (
                <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {assessmentError}
                </div>
              )}

              {!assessmentLoading && assessmentQuestions.length > 0 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">
                      {answeredCount}/{assessmentQuestions.length} answered
                    </span>
                  </div>
                  {assessmentQuestions.map((question, index) => (
                    <div key={question.id} className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                            Question {index + 1}
                          </div>
                          <h3 className="mt-2 text-base sm:text-lg">{question.prompt}</h3>
                        </div>
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                          {question.topic}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {question.options.map((option, optionIndex) => {
                          const selected = assessmentAnswers[question.id] === optionIndex;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAssessmentAnswers((current) => ({
                                  ...current,
                                  [question.id]: optionIndex,
                                }))
                              }
                              className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                                selected
                                  ? 'border-secondary bg-secondary/5 text-foreground'
                                  : 'border-border bg-background hover:border-secondary/50'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {renderStepHeader(
                'Choose your programming language',
                'Vakify will tailor tasks, labs, and code examples to this language.',
                <Code2 className="w-6 h-6 text-secondary" />,
              )}

              {assessmentResult && (
                <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Assessment saved</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your strongest learning mode is{' '}
                    <span className="font-medium text-foreground capitalize">{dominantStyle}</span>. We’ll use this to shape the interface and prompts.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LANGUAGE_CHOICES.map((lang) => {
                  const selected = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={`rounded-xl border px-4 py-4 text-left transition-all ${
                        selected
                          ? 'border-secondary bg-secondary/5 shadow-sm'
                          : 'border-border bg-background hover:border-secondary/50'
                      }`}
                    >
                      <div className="text-base font-medium">{lang}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Daily tasks and labs in {lang}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {renderStepHeader(
                'Complete your profile',
                'Add the details Vakify uses to personalize your dashboard and support.',
                <BookOpen className="w-6 h-6 text-secondary" />,
              )}

              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm mb-2">Full Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Chosen Language</label>
                      <input
                        type="text"
                        value={selectedLanguage}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border border-border bg-muted/40 text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Other Details</label>
                    <textarea
                      value={otherDetails}
                      onChange={(e) => setOtherDetails(e.target.value)}
                      className="w-full min-h-36 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="Tell Vakify about your goals, current level, school, college, or anything else you want us to know."
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Your setup summary</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Learning style</div>
                      <div className="mt-1 text-base capitalize">{dominantStyle}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Programming language</div>
                      <div className="mt-1 text-base">{selectedLanguage || 'Not selected yet'}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile details</div>
                      <div className="mt-1 text-base">{displayName || 'Your name'} · {email || 'your@email.com'}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What happens next</div>
                      <div className="mt-1 text-base">We’ll open your dashboard with language-aware tasks and labs.</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/5 px-4 py-3 text-sm text-muted-foreground">
                    <FileText className="inline-block mr-2 h-4 w-4 text-secondary" />
                    You can change your profile details later in Settings.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={async () => {
                if (step === 1) {
                  await submitAssessment();
                  return;
                }
                if (step === 2) {
                  if (selectedLanguage) {
                    setStep(3);
                  }
                  return;
                }
                await finishOnboarding();
              }}
              disabled={
                (step === 1 && (assessmentLoading || assessmentQuestions.length === 0 || answeredCount < assessmentQuestions.length)) ||
                (step === 2 && !selectedLanguage) ||
                (step === 3 && !canFinish)
              }
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 1 && (assessmentLoading ? 'Saving Assessment...' : 'Continue to Language')}
              {step === 2 && 'Continue to Profile'}
              {step === 3 && (finishing ? 'Finishing...' : 'Get Started')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
