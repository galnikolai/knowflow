import React, { useState } from "react";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

interface Props {
  nodeId?: string; // можно связать с узлом графа
}

export const CreateCardForm: React.FC<Props> = ({ nodeId }) => {
  const addCard = useFlashcardsStore((s) => s.addCard);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    addCard({
      nodeId: nodeId || "standalone",
      question,
      answer,
      nextReview: Date.now(),
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    });
    setQuestion("");
    setAnswer("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
      <div>
        <label className="block mb-1 font-medium">Вопрос</label>
        <Input
          className="w-full"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Введите вопрос"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Ответ</label>
        <Input
          className="w-full"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Введите ответ"
        />
      </div>
      <Button type="submit" className="w-full">
        Добавить карточку
      </Button>
      {success && (
        <div className="text-green-600 mt-2">Карточка добавлена!</div>
      )}
    </form>
  );
};
