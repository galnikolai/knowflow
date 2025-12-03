"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { TrainerSidebar } from "@/widgets";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes";
import { BookOpen, Play, FileText, GraduationCap } from "lucide-react";
import { useTheme } from "@/shared/context/useTheme";

export const Challenges: React.FC = () => {
  const { themeColors } = useTheme();
  const router = useRouter();
  
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);
  
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  useEffect(() => {
    fetchLearnspaces();
    fetchCards();
    fetchNotes();
  }, [fetchLearnspaces, fetchCards, fetchNotes]);

  // Подсчитываем статистику для каждого learnspace
  const learnspacesWithStats = useMemo(() => {
    return learnspaces.map((ls) => {
      const learnspaceCards = cards.filter((c) => ls.noteIds.includes(c.nodeId));
      const dueCards = learnspaceCards.filter((c) => c.nextReview <= Date.now());
      
      return {
        ...ls,
        totalCards: learnspaceCards.length,
        dueCards: dueCards.length,
        noteNames: ls.noteIds.map((noteId) => {
          const note = notes.find((n) => n.id === noteId);
          return note?.title || "Неизвестная заметка";
        }),
      };
    });
  }, [learnspaces, cards, notes]);

  const getNoteName = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    return note?.title || "Неизвестная заметка";
  };

  return (
    <TrainerSidebar>
      <div
        className="flex flex-1 flex-col p-6 min-h-screen transition-all duration-300"
        style={{ backgroundColor: themeColors.lightBg }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Тренировки</h1>
          <p className="text-muted-foreground">
            Выберите тренировку для изучения карточек
          </p>
        </div>

        {learnspacesWithStats.length === 0 ? (
          <div className="text-center space-y-4 py-20">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-2xl font-semibold">Нет тренировок</div>
            <div className="text-muted-foreground">
              Создайте тренировку из заметок, чтобы начать изучение
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learnspacesWithStats.map((ls) => (
              <div
                key={ls.id}
                className="rounded-xl border bg-card shadow-sm p-6 hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                      {ls.name}
                    </h2>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {ls.noteNames.slice(0, 2).map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{name}</span>
                        </div>
                      ))}
                      {ls.noteNames.length > 2 && (
                        <div className="text-xs">
                          +{ls.noteNames.length - 2} еще
                        </div>
                      )}
                    </div>
                  </div>
                  <GraduationCap className="w-6 h-6 text-primary shrink-0 ml-2" />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{ls.totalCards}</div>
                    <div className="text-xs text-muted-foreground">Всего карточек</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-primary">{ls.dueCards}</div>
                    <div className="text-xs text-muted-foreground">К повторению</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    className="flex-1 gap-2"
                    onClick={() => {
                      router.push(`${ROUTES.TRAINER_STUDY}?learnspace=${ls.id}`);
                    }}
                    disabled={ls.dueCards === 0}
                  >
                    <Play className="w-4 h-4" />
                    Изучать
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      router.push(`${ROUTES.TRAINER_CARDS}?learnspace=${ls.id}`);
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TrainerSidebar>
  );
};
