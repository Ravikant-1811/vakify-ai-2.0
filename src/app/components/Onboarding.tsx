import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, BookOpen, Code, Target, Brain } from 'lucide-react';
import { apiFetch } from '../lib/api';

export function Onboarding() {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [learningLevel, setLearningLevel] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [visualWeight, setVisualWeight] = useState(50);
  const [audioWeight, setAudioWeight] = useState(50);
  const [kineticWeight, setKineticWeight] = useState(50);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  const topics = ['Arrays', 'Loops', 'Functions', 'OOP', 'Algorithms', 'Data Structures', 'APIs', 'Databases'];

  const handleComplete = async () => {
    const dominantStyle = [
      { key: 'visual', value: visualWeight },
      { key: 'auditory', value: audioWeight },
      { key: 'kinesthetic', value: kineticWeight },
    ].sort((a, b) => b.value - a.value)[0]?.key || 'visual';

    await updateUser({
      learningLevel,
      preferredLanguage,
      visualWeight,
      auditoryWeight: audioWeight,
      kinestheticWeight: kineticWeight,
      weakTopics,
      onboarded: true
    });

    await apiFetch('/api/style/select', {
      method: 'POST',
      body: JSON.stringify({ learning_style: dominantStyle }),
    });
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i + 1 <= step ? 'bg-secondary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl">What's your learning level?</h2>
                  <p className="text-muted-foreground">This helps us personalize your experience</p>
                </div>
              </div>

              <div className="space-y-3">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setLearningLevel(level)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      learningLevel === level
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border hover:border-secondary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{level}</span>
                      {learningLevel === level && (
                        <ChevronRight className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Code className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl">Preferred programming language?</h2>
                  <p className="text-muted-foreground">You can practice in multiple languages later</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Python', 'JavaScript', 'Java', 'C++', 'C'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPreferredLanguage(lang)}
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

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl">How do you learn best?</h2>
                  <p className="text-muted-foreground">Adjust weights for your learning style</p>
                </div>
              </div>

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
                    <label className="text-sm">Kinetic Learning</label>
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
                  <h2 className="text-2xl">What topics need work?</h2>
                  <p className="text-muted-foreground">Select areas where you need more practice</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {topics.map((topic) => {
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
              onClick={() => {
                if (step < totalSteps) {
                  setStep(step + 1);
                } else {
                  void handleComplete();
                }
              }}
              disabled={
                (step === 1 && !learningLevel) ||
                (step === 2 && !preferredLanguage)
              }
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step < totalSteps ? 'Continue' : 'Get Started'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
