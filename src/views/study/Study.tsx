import React, { useEffect, useState, useMemo } from "react";
import { Card } from "@/entities/card/Card";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { StudySidebar } from "@/widgets";
import { useTheme } from "@/shared/context/useTheme";

export const Study: React.FC = () => {
  const { themeColors } = useTheme();
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);
  const reviewCard = useFlashcardsStore((s) => s.reviewCard);
  const loading = useFlashcardsStore((s) => s.loading);
  const error = useFlashcardsStore((s) => s.error);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const dueCards = useMemo(
    () => cards.filter((c) => c.nextReview <= Date.now()),
    [cards]
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    setCurrentIdx(0);
    setShowAnswer(false);
  }, [dueCards.length]);

  const selectedCard = selectedCardId
    ? cards.find((c) => c.id === selectedCardId)
    : null;

  return (
    <StudySidebar selectedId={selectedCardId} onSelectCard={setSelectedCardId}>
      <div 
        className="flex flex-1 flex-col items-center justify-center p-10 min-h-screen transition-all duration-300"
        style={{ backgroundColor: themeColors.lightBg }}
      >
        {loading ? (
          <div className="text-lg">Загрузка карточек...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold mb-2">Ошибка: {error}</div>
        ) : selectedCard ? (
          <Card
            card={selectedCard}
            showAnswer={showAnswer}
            onShowAnswer={() => setShowAnswer(true)}
            onRate={async (grade) => {
              setReviewing(true);
              await reviewCard(selectedCard.id, grade);
              setShowAnswer(false);
              setReviewing(false);
            }}
          />
        ) : dueCards.length === 0 ? (
          <div className="text-2xl font-semibold mb-4">
            Нет карточек для повторения 🎉
            <div className="text-muted-foreground mt-2">
              Добавьте новые карточки или зайдите позже.
            </div>
          </div>
        ) : (
          <>
            <Card
              card={dueCards[currentIdx]}
              showAnswer={showAnswer}
              onShowAnswer={() => setShowAnswer(true)}
              onRate={async (grade) => {
                setReviewing(true);
                await reviewCard(dueCards[currentIdx].id, grade);
                setShowAnswer(false);
                setReviewing(false);
                if (currentIdx < dueCards.length - 1) {
                  setCurrentIdx(currentIdx + 1);
                }
              }}
            />
            <div className="mt-4 text-muted-foreground">
              Карточка {currentIdx + 1} из {dueCards.length}
            </div>
            {reviewing && (
              <div className="mt-2 text-sm">Сохраняем результат...</div>
            )}
          </>
        )}
      </div>
    </StudySidebar>
  );
};

export default Study;
