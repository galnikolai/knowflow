"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { TrainerSidebar } from "@/widgets";
import { Button } from "@/shared/ui/button";
import { Card } from "@/entities/card/Card";
import { X, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useTheme } from "@/shared/context/useTheme";

export const Cards: React.FC = () => {
  const { themeColors } = useTheme();
  const router = useRouter();
  const learnspaceId = router.query.learnspace as string | undefined;
  
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);
  const removeCard = useFlashcardsStore((s) => s.removeCard);
  const loading = useFlashcardsStore((s) => s.loading);
  const error = useFlashcardsStore((s) => s.error);
  
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  // Фильтруем карточки по learnspace
  const filteredCards = useMemo(() => {
    if (!learnspaceId) {
      return cards;
    }
    
    const learnspace = learnspaces.find((ls) => ls.id === learnspaceId);
    if (!learnspace) return [];
    
    return cards.filter((c) => learnspace.noteIds.includes(c.nodeId));
  }, [cards, learnspaceId, learnspaces]);

  // Группируем карточки по заметкам
  const cardsByNote = useMemo(() => {
    const grouped: Record<string, typeof filteredCards> = {};
    filteredCards.forEach((card) => {
      if (!grouped[card.nodeId]) {
        grouped[card.nodeId] = [];
      }
      grouped[card.nodeId].push(card);
    });
    return grouped;
  }, [filteredCards]);

  useEffect(() => {
    fetchCards();
    fetchLearnspaces();
    fetchNotes();
  }, [fetchCards, fetchLearnspaces, fetchNotes]);

  const getNoteName = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    return note?.title || "Неизвестная заметка";
  };

  const toggleAnswer = (cardId: string) => {
    setShowAnswer((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const selectedCard = selectedCardId
    ? cards.find((c) => c.id === selectedCardId)
    : null;

  return (
    <TrainerSidebar>
      <div
        className="flex flex-1 flex-col p-6 min-h-screen transition-all duration-300"
        style={{ backgroundColor: themeColors.lightBg }}
      >
        {loading ? (
          <div className="text-lg">Загрузка карточек...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold mb-2">Ошибка: {error}</div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center space-y-4 py-20">
            <div className="text-4xl mb-4">📚</div>
            <div className="text-2xl font-semibold">Нет карточек</div>
            <div className="text-muted-foreground">
              {learnspaceId
                ? "В этом learnspace пока нет карточек"
                : "Создайте карточки из заметок"}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Все карточки</h1>
              <div className="text-sm text-muted-foreground">
                Всего: {filteredCards.length}
              </div>
            </div>

            {/* Группировка по заметкам */}
            {Object.entries(cardsByNote).map(([noteId, noteCards]) => (
              <div key={noteId} className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  {getNoteName(noteId)} ({noteCards.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {noteCards.map((card) => (
                    <div
                      key={card.id}
                      className="relative rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-medium line-clamp-2 flex-1">
                          {card.question}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAnswer(card.id);
                          }}
                        >
                          {showAnswer[card.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {showAnswer[card.id] && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {card.answer}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("Удалить эту карточку?")) {
                            await removeCard(card.id);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Диалог просмотра карточки */}
        <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCardId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Просмотр карточки</DialogTitle>
              <DialogDescription>
                {selectedCard && getNoteName(selectedCard.nodeId)}
              </DialogDescription>
            </DialogHeader>
            {selectedCard && (
              <Card
                card={selectedCard}
                showAnswer={showAnswer[selectedCard.id] || false}
                onShowAnswer={() => toggleAnswer(selectedCard.id)}
                onRate={() => {}}
                className="max-w-full"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TrainerSidebar>
  );
};
