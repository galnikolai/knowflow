"use client";

import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { RotateCcw, X, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Flashcard = {
  id: string;
  nodeId: string; // id узла графа
  question: string;
  answer: string;
  nextReview: number; // timestamp
  interval: number; // дни до следующего повторения
  repetitions: number;
  easeFactor: number;
};

interface CardProps {
  card: Flashcard;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onRate: (grade: 0 | 3 | 5) => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  showAnswer,
  onShowAnswer,
  onRate,
  className,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    if (!showAnswer) {
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
        onShowAnswer();
      }, 150);
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="relative h-[400px] perspective-1000">
        <div
          className="relative w-full h-full preserve-3d transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Лицевая сторона (вопрос) */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-border bg-card shadow-lg flex flex-col items-center justify-center p-8 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={handleFlip}
          >
            <div className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">
              Вопрос
            </div>
            <div className="text-2xl font-semibold text-center mb-6 leading-relaxed">
              {card.question}
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Показать ответ
              </Button>
            </div>
          </div>

          {/* Обратная сторона (ответ) */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-border bg-card shadow-lg flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-primary/10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">
              Ответ
            </div>
            <div className="text-xl text-center mb-8 leading-relaxed">
              {card.answer}
            </div>
            <div className="mt-auto w-full">
              <div className="text-sm text-muted-foreground mb-4 text-center">
                Насколько хорошо вы знаете ответ?
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => onRate(0)}
                  className="gap-2 flex-1 max-w-[140px]"
                >
                  <X className="w-4 h-4" />
                  Сложно
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onRate(3)}
                  className="gap-2 flex-1 max-w-[140px]"
                >
                  <HelpCircle className="w-4 h-4" />
                  Нормально
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => onRate(5)}
                  className="gap-2 flex-1 max-w-[140px]"
                >
                  <Check className="w-4 h-4" />
                  Легко
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
