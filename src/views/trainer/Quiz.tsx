"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { TrainerSidebar } from "@/widgets";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { Button } from "@/shared/ui/button";
import type { QuizQuestion } from "@/pages/api/generate-quiz";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes";

// ─── types ─────────────────────────────────────────────────────────────────

type AnswerState = "unanswered" | "correct" | "wrong";

interface QuestionState {
  question: QuizQuestion;
  selected: string | null;
  state: AnswerState;
  showExplanation: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function generateQuiz(content: string, count: number): Promise<QuizQuestion[]> {
  const res = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, count }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Ошибка генерации квиза");
  }
  const data = await res.json();
  return data.questions as QuizQuestion[];
}

// ─── Quiz question card ─────────────────────────────────────────────────────

interface QuestionCardProps {
  qs: QuestionState;
  idx: number;
  total: number;
  onAnswer: (answer: string) => void;
  onToggleExplanation: () => void;
  onNext: () => void;
  isLast: boolean;
}

function QuestionCard({
  qs,
  idx,
  total,
  onAnswer,
  onToggleExplanation,
  onNext,
  isLast,
}: QuestionCardProps) {
  const { question, selected, state, showExplanation } = qs;
  const answered = state !== "unanswered";

  const options =
    question.type === "true_false"
      ? ["Верно", "Неверно"]
      : (question.options ?? []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Вопрос {idx + 1} / {total}
        </span>
        <span className="capitalize">
          {question.type === "true_false" ? "Верно / Неверно" : "Выбор ответа"}
        </span>
      </div>
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-base font-medium leading-relaxed mb-6">{question.question}</p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === question.answer;
            let cls =
              "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ";

            if (!answered) {
              cls +=
                "border-border hover:border-primary hover:bg-primary/5 cursor-pointer bg-background";
            } else if (isCorrect) {
              cls += "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300";
            } else if (isSelected && !isCorrect) {
              cls += "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300";
            } else {
              cls += "border-border bg-background opacity-50";
            }

            return (
              <button
                key={opt}
                className={cls}
                disabled={answered}
                onClick={() => onAnswer(opt)}
              >
                <span className="flex items-center gap-2">
                  {answered && isCorrect && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  {answered && isSelected && !isCorrect && <XCircle size={14} className="text-red-500 shrink-0" />}
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result banner */}
        {answered && (
          <div
            className={`mt-4 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 ${
              state === "correct"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            }`}
          >
            {state === "correct" ? (
              <><CheckCircle size={14} /> Правильно!</>
            ) : (
              <><XCircle size={14} /> Неверно. Правильный ответ: <strong>{question.answer}</strong></>
            )}
          </div>
        )}

        {/* Explanation */}
        {answered && question.explanation && (
          <div className="mt-3">
            <button
              onClick={onToggleExplanation}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lightbulb size={13} />
              {showExplanation ? "Скрыть объяснение" : "Показать объяснение"}
            </button>
            {showExplanation && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                {question.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {answered && (
        <div className="flex justify-end">
          <Button onClick={onNext} className="gap-2">
            {isLast ? "Завершить" : "Следующий вопрос"}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Results screen ──────────────────────────────────────────────────────────

interface ResultsProps {
  states: QuestionState[];
  onRestart: () => void;
  onRetryWrong: () => void;
}

function Results({ states, onRestart, onRetryWrong }: ResultsProps) {
  const correct = states.filter((s) => s.state === "correct").length;
  const total = states.length;
  const pct = Math.round((correct / total) * 100);
  const wrongCount = total - correct;

  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "📚" : "💪";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 py-8">
      <div className="text-5xl">{emoji}</div>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Квиз завершён</h2>
        <p className="text-muted-foreground">
          {pct >= 80
            ? "Отличный результат!"
            : pct >= 50
            ? "Хороший прогресс, продолжайте!"
            : "Стоит повторить материал"}
        </p>
      </div>

      {/* Score ring */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="64"
            cy="64"
            r="52"
            fill="none"
            strokeWidth="10"
            stroke={pct >= 80 ? "#10b981" : pct >= 50 ? "#6366f1" : "#f59e0b"}
            strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{pct}%</span>
          <span className="text-xs text-muted-foreground">{correct}/{total}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correct}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Правильных</p>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-center">
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">{wrongCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Неправильных</p>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <Button variant="outline" onClick={onRestart} className="flex-1 gap-2">
          <RotateCcw size={15} />
          Пройти снова
        </Button>
        {wrongCount > 0 && (
          <Button onClick={onRetryWrong} className="flex-1 gap-2">
            <BookOpen size={15} />
            Повторить ошибки ({wrongCount})
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

export const Quiz: React.FC = () => {
  const router = useRouter();
  const learnspaceId = router.query.learnspace as string | undefined;

  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);

  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  useEffect(() => {
    fetchLearnspaces();
    fetchNotes();
  }, [fetchLearnspaces, fetchNotes]);

  const learnspace = learnspaces.find((ls) => ls.id === learnspaceId);

  const noteContent = useMemo(() => {
    if (!learnspace) return "";
    return learnspace.noteIds
      .map((nid) => {
        const note = notes.find((n) => n.id === nid);
        if (!note) return "";
        return `### ${note.title}\n${note.content ?? ""}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }, [learnspace, notes]);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [questionStates, setQuestionStates] = useState<QuestionState[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);

  const startQuiz = useCallback(
    async (questions?: QuizQuestion[]) => {
      setGenError(null);
      setDone(false);
      setCurrentIdx(0);
      if (questions) {
        setQuestionStates(
          questions.map((q) => ({ question: q, selected: null, state: "unanswered", showExplanation: false }))
        );
        return;
      }
      if (!noteContent.trim()) {
        setGenError("Нет контента в заметках выбранной тренировки");
        return;
      }
      setGenerating(true);
      setQuestionStates(null);
      try {
        const qs = await generateQuiz(noteContent, 8);
        setQuestionStates(
          qs.map((q) => ({ question: q, selected: null, state: "unanswered", showExplanation: false }))
        );
      } catch (e) {
        setGenError(e instanceof Error ? e.message : "Ошибка генерации");
      } finally {
        setGenerating(false);
      }
    },
    [noteContent]
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      setQuestionStates((prev) => {
        if (!prev) return prev;
        return prev.map((qs, i) => {
          if (i !== currentIdx) return qs;
          const correct = answer === qs.question.answer;
          return { ...qs, selected: answer, state: correct ? "correct" : "wrong" };
        });
      });
    },
    [currentIdx]
  );

  const handleNext = useCallback(() => {
    if (!questionStates) return;
    if (currentIdx >= questionStates.length - 1) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questionStates]);

  const handleToggleExplanation = useCallback(() => {
    setQuestionStates((prev) => {
      if (!prev) return prev;
      return prev.map((qs, i) =>
        i === currentIdx ? { ...qs, showExplanation: !qs.showExplanation } : qs
      );
    });
  }, [currentIdx]);

  const handleRetryWrong = useCallback(() => {
    if (!questionStates) return;
    const wrong = questionStates
      .filter((qs) => qs.state === "wrong")
      .map((qs) => qs.question);
    startQuiz(wrong);
  }, [questionStates, startQuiz]);

  // ── no learnspace selected ──
  if (!learnspaceId || !learnspace) {
    return (
      <TrainerSidebar>
        <div className="flex flex-1 flex-col items-center justify-center p-10 gap-6 min-h-screen bg-background">
          <div className="text-5xl">🎯</div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Выберите тренировку</h2>
            <p className="text-muted-foreground">
              Перейдите в Тренировки и нажмите «Квиз» у нужной тренировки
            </p>
          </div>
          <Button onClick={() => router.push(ROUTES.TRAINER_CHALLENGES)}>
            К тренировкам
          </Button>
        </div>
      </TrainerSidebar>
    );
  }

  // ── generating ──
  if (generating) {
    return (
      <TrainerSidebar>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-screen bg-background">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Генерируем вопросы…</p>
        </div>
      </TrainerSidebar>
    );
  }

  // ── error ──
  if (genError) {
    return (
      <TrainerSidebar>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-screen bg-background">
          <XCircle size={36} className="text-red-500" />
          <p className="font-semibold">Ошибка генерации</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">{genError}</p>
          <Button onClick={() => startQuiz()}>Попробовать снова</Button>
        </div>
      </TrainerSidebar>
    );
  }

  // ── start screen ──
  if (!questionStates) {
    return (
      <TrainerSidebar>
        <div className="flex flex-1 flex-col items-center justify-center p-10 gap-6 min-h-screen bg-background">
          <div className="text-5xl">🧠</div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{learnspace.name}</h2>
            <p className="text-muted-foreground text-sm">
              AI сгенерирует 8 вопросов по материалу тренировки
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground text-center">
            <p>• Выбор одного из 4 вариантов</p>
            <p>• Вопросы «Верно / Неверно»</p>
            <p>• Объяснение каждого ответа</p>
          </div>
          <Button size="lg" onClick={() => startQuiz()} className="gap-2 px-8">
            Начать квиз
            <ChevronRight size={16} />
          </Button>
        </div>
      </TrainerSidebar>
    );
  }

  // ── results ──
  if (done) {
    return (
      <TrainerSidebar>
        <div className="flex flex-1 flex-col min-h-screen bg-background p-6 justify-center">
          <Results
            states={questionStates}
            onRestart={() => startQuiz()}
            onRetryWrong={handleRetryWrong}
          />
        </div>
      </TrainerSidebar>
    );
  }

  // ── active quiz ──
  const current = questionStates[currentIdx];

  return (
    <TrainerSidebar>
      <div className="flex flex-1 flex-col min-h-screen bg-background p-6 justify-center">
        <QuestionCard
          qs={current}
          idx={currentIdx}
          total={questionStates.length}
          onAnswer={handleAnswer}
          onToggleExplanation={handleToggleExplanation}
          onNext={handleNext}
          isLast={currentIdx === questionStates.length - 1}
        />
      </div>
    </TrainerSidebar>
  );
};
