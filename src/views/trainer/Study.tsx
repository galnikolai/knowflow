"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Card } from "@/entities/card/Card";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { TrainerSidebar } from "@/widgets";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
export const Study: React.FC = () => {
  const router = useRouter();
  const learnspaceId = router.query.learnspace as string | undefined;
  
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);
  const reviewCard = useFlashcardsStore((s) => s.reviewCard);
  const loading = useFlashcardsStore((s) => s.loading);
  const error = useFlashcardsStore((s) => s.error);
  
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);

  // Фильтруем карточки по learnspace
  const filteredCards = useMemo(() => {
    if (!learnspaceId) {
      // Если нет learnspace, показываем все карточки
      return cards.filter((c) => c.nextReview <= Date.now());
    }
    
    const learnspace = learnspaces.find((ls) => ls.id === learnspaceId);
    if (!learnspace) return [];
    
    // Фильтруем карточки, которые принадлежат заметкам из learnspace
    return cards.filter(
      (c) => learnspace.noteIds.includes(c.nodeId) && c.nextReview <= Date.now()
    );
  }, [cards, learnspaceId, learnspaces]);

  useEffect(() => {
    fetchCards();
    fetchLearnspaces();
  }, [fetchCards, fetchLearnspaces]);

  useEffect(() => {
    setCurrentIdx(0);
    setShowAnswer(false);
  }, [filteredCards.length, learnspaceId]);

  const handleNext = () => {
    if (currentIdx < filteredCards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setShowAnswer(false);
    }
  };

  const handleRate = async (grade: 0 | 3 | 5) => {
    if (!filteredCards[currentIdx]) return;
    
    setReviewing(true);
    await reviewCard(filteredCards[currentIdx].id, grade);
    setShowAnswer(false);
    setReviewing(false);
    
    // Переходим к следующей карточке, если она есть
    if (currentIdx < filteredCards.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Если это последняя карточка, начинаем сначала
      setCurrentIdx(0);
    }
  };

  const currentCard = filteredCards[currentIdx];

  return (
    <TrainerSidebar>
      <div
        className="flex flex-1 flex-col items-center justify-center p-10 min-h-screen transition-all duration-300 bg-background"
      >
        {loading ? (
          <div className="text-lg">Загрузка карточек...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold mb-2">Ошибка: {error}</div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">🎉</div>
            <div className="text-2xl font-semibold">
              Нет карточек для повторения
            </div>
            <div className="text-muted-foreground">
              {learnspaceId
                ? "Все карточки из этого learnspace уже изучены"
                : "Добавьте новые карточки или зайдите позже"}
            </div>
          </div>
        ) : currentCard ? (
          <div className="w-full max-w-4xl space-y-6">
            {/* Прогресс */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Карточка {currentIdx + 1} из {filteredCards.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentIdx + 1) / filteredCards.length) * 100}%`,
                    }}
                  />
                </div>
                <span>{Math.round(((currentIdx + 1) / filteredCards.length) * 100)}%</span>
              </div>
            </div>

            {/* Карточка */}
            <Card
              card={currentCard}
              showAnswer={showAnswer}
              onShowAnswer={() => setShowAnswer(true)}
              onRate={handleRate}
            />

            {/* Навигация */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={currentIdx === 0 || reviewing}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setShowAnswer(false);
                  setCurrentIdx(0);
                }}
                disabled={reviewing}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Начать сначала
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={currentIdx === filteredCards.length - 1 || reviewing}
                className="gap-2"
              >
                Вперед
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {reviewing && (
              <div className="text-center text-sm text-muted-foreground">
                Сохраняем результат...
              </div>
            )}
          </div>
        ) : null}
      </div>
    </TrainerSidebar>
  );
};
