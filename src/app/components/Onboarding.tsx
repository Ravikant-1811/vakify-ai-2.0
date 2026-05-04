import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, BookOpen, Code, Target, Brain, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  topic: string;
};

type AssessmentResult = {
  language: string;
  score: number;
  total: number;
  percentage: number;
  recommended_level: string;
  weak_topics: string[];
};

const WEAK_TOPIC_OPTIONS = ['Arrays', 'Loops', 'Functions', 'OOP', 'Algorithms', 'Data Structures', 'APIs', 'Databases'];

export function Onboarding() {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const [visualWeight, setVisualWeight] = useState(50);
  const [audioWeight, setAudioWeight] = useState(50);
  const [kineticWeight, setKineticWeight] = useState(50);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    const loadAssessment = async () => {
      if (step !== 2 || !preferredLanguage) {
        return;
      }
      if (assessmentQuestions.length) {
        return;
      }

      setAssessmentLoading(true);
      setAssessmentError('');
      try {
        const response = await apiFetch<{ questions: AssessmentQuestion[] }>(
          `/api/assessment/questions?language=${encodeURIComponent(preferredLanguage)}`,
          { skipAuth: true },
        );
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
  }, [assessmentQuestions.length, preferredLanguage, step]);

  useEffect(() => {
    if (assessmentResult && assessmentResult.weak_topics.length && !weakTopics.length) {
      setWeakTopics(assessmentResult.weak_topics.slice(0, 4));
    }
  }, [assessmentResult, weakTopics.length]);

  const answeredCount = useMemo(
    () => Object.values(assessmentAnswers).filter((value) => value !== -1 && value !== undefined).length,
    [assessmentAnswers],
  );

  const dominantStyle = useMemo(
    () =>
      [
        { key: 'visual', value: visualWeight },
        { key: 'auditory', value: audioWeight },
        { key: 'kinesthetic', value: kineticWeight },
      ].sort((a, b) => b.value - a.value)[0]?.key || 'visual',
    [audioWeight, kineticWeight, visualWeight],
  );

  const handleAssessmentContinue = async () => {
    if (!preferredLanguage || answeredCount < assessmentQuestions.length) {
      return;
    }

    setAssessmentLoading(true);
    setAssessmentError('');
    try {
      const response = await apiFetch<{ assessment: AssessmentResult }>('/api/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({
          preferred_language: preferredLanguage,
          answers: assessmentAnswers,
        }),
      });
      setAssessmentResult(response.assessment);
      setStep(3);
    } catch (err) {
      setAssessmentError(err instanceof Error ? err.message : 'Unable to save assessment.');
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleComplete = async () => {
    setFinishing(true);
    try {
      const mergedWeakTopics = Array.from(
        new Set([
          ...(assessmentResult?.weak_topics || []),
          ...weakTopics,
        ]),
      );

      await updateUser({
        learningLevel: assessmentResult?.recommended_level || 'beginner',
        preferredLanguage,
        visualWeight,
        auditoryWeight: audioWeight,
        kinestheticWeight: kineticWeight,
        weakTopics: mergedWeakTopics,
        onboarded: true,
      });

      await apiFetch('/api/style/select', {
        method: 'POST',
        body: JSON.stringify({ learning_style: dominantStyle }),
      });
    } finally {
      setFinishing(false);
    }
  };

  const renderAssessmentProgress = () => (
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="w-4 h-4 text-secondary" />
      <span className="text-sm text-muted-foreground">
        {answeredCount}/{assessmentQuestions.length || 10} answered
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${i + 1 <= step ? 'bg-secondary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sm:p-8 shadow-sm">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Code className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl">Choose your preferred programming language</h2>
                  <p className="text-muted-foreground">Your assessment, labs, and tasks will adapt to this choice.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Python', 'JavaScript', 'Java', 'C++', 'C'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setPreferredLanguage(lang);
                      setAssessmentQuestions([]);
                      setAssessmentAnswers({});
                      setAssessmentResult(null);
                      setWeakTopics([]);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      preferredLanguage === lang
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border hover:border-secondary/50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl">Vakify assessment: 10 quick questions</h2>
                  <p className="text-muted-foreground">
                    This helps us set your starting level and topics for {preferredLanguage || 'your language'}.
                  </p>
                </div>
              </div>

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
                  {renderAssessmentProgress()}
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

                      <div className="grid gap-2 sm:grid-cols-2">
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

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl">How do you learn best?</h2>
                  <p className="text-muted-foreground">Adjust the weights that power your study mode.</p>
                </div>
              </div>

              {assessmentResult && (
                <div className="mb-6 rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Assessment saved</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Score: {assessmentResult.score}/{assessmentResult.total} ({assessmentResult.percentage}%).
                    Suggested level: <span className="font-medium text-foreground">{assessmentResult.recommended_level}</span>.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">Visual Learning</label>
                    <span className="text-sm text-muted-foreground">{visualWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={visualWeight}
                    onChange={(e) => setVisualWeight(Number(e.target.value))}
                    className="w-full accent-secondary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Diagrams, images, concept maps</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">Audio Learning</label>
                    <span className="text-sm text-muted-foreground">{audioWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioWeight}
                    onChange={(e) => setAudioWeight(Number(e.target.value))}
                    className="w-full accent-secondary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Spoken summaries, pronunciation</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">Hands-on Learning</label>
                    <span className="text-sm text-muted-foreground">{kineticWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={kineticWeight}
                    onChange={(e) => setKineticWeight(Number(e.target.value))}
                    className="w-full accent-secondary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Labs, practice, hands-on exercises</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl">What topics need extra practice?</h2>
                  <p className="text-muted-foreground">Pick the areas you want Vakify to focus on first.</p>
                </div>
              </div>

              {assessmentResult && (
                <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Assessment summary</div>
                      <div className="mt-1 text-lg">
                        {assessmentResult.score}/{assessmentResult.total} correct
                      </div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      Suggested: {assessmentResult.recommended_level}
                    </div>
                  </div>
                  {assessmentResult.weak_topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assessmentResult.weak_topics.map((topic) => (
                        <span key={topic} className="rounded-full border border-border bg-background px-3 py-1 text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {WEAK_TOPIC_OPTIONS.map((topic) => {
                  const isSelected = weakTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => {
                        if (isSelected) {
                          setWeakTopics(weakTopics.filter((t) => t !== topic));
                        } else {
                          setWeakTopics([...weakTopics, topic]);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border hover:border-destructive/50'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
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
                  if (preferredLanguage) {
                    setStep(2);
                  }
                  return;
                }
                if (step === 2) {
                  await handleAssessmentContinue();
                  return;
                }
                if (step === 3) {
                  setStep(4);
                  return;
                }
                await handleComplete();
              }}
              disabled={
                (step === 1 && !preferredLanguage) ||
                (step === 2 && (assessmentLoading || assessmentQuestions.length === 0 || answeredCount < assessmentQuestions.length)) ||
                finishing
              }
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 1 && 'Continue'}
              {step === 2 && (assessmentLoading ? 'Saving Assessment...' : 'Continue to Learning Style')}
              {step === 3 && 'Continue'}
              {step === 4 && (finishing ? 'Finishing...' : 'Get Started')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
