"use client";

import type { FC } from "react";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { Strike } from "@tiptap/extension-strike";
import { Code } from "@tiptap/extension-code";
import { History } from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  Code as CodeIcon,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

interface NoteEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const NoteEditor: FC<NoteEditorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Code,
      History,
      Placeholder.configure({
        placeholder: t("notes.placeholder"),
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Есть выделение - показываем меню
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        // Позиционируем меню над выделенным текстом
        const top = start.top - 10;
        const left = (start.left + end.left) / 2;

        setMenuPosition({ top, left });
        setShowMenu(true);
      } else {
        // Нет выделения - скрываем меню
        setShowMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 bg-white",
      },
    },
  });

  // Обновляем контент редактора при изменении value извне
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Обновляем placeholder при смене языка
  React.useEffect(() => {
    if (editor) {
      const placeholderExtension = editor.extensionManager.extensions.find(
        (ext) => ext.name === "placeholder"
      );
      if (placeholderExtension) {
        editor.commands.updateAttributes("placeholder", {
          placeholder: t("notes.placeholder"),
        });
      }
    }
  }, [editor, t]);

  // Обработка клика вне редактора для скрытия меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  // Обновление позиции меню при скролле
  useEffect(() => {
    if (!showMenu || !editor) return;

    const updatePosition = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        const top = start.top - 10;
        const left = (start.left + end.left) / 2;

        setMenuPosition({ top, left });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showMenu, editor]);

  return (
    <div ref={editorRef} className="relative">
      {editor && showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 flex gap-0.5 border border-border rounded-lg shadow-lg p-0.5"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--popover)",
            opacity: 1,
            backdropFilter: "none",
          }}
        >
          <Button
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              editor.chain().focus().toggleBold().run();
              editor.commands.focus();
            }}
            className="h-8 w-8 cursor-pointer"
            title="Жирный"
          >
            <BoldIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              editor.chain().focus().toggleItalic().run();
              editor.commands.focus();
            }}
            className="h-8 w-8 cursor-pointer"
            title="Курсив"
          >
            <ItalicIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              editor.chain().focus().toggleStrike().run();
              editor.commands.focus();
            }}
            className="h-8 w-8 cursor-pointer"
            title="Зачеркнутый"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-0.5" />
          <Button
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              editor.chain().focus().toggleCode().run();
              editor.commands.focus();
            }}
            className="h-8 w-8 cursor-pointer"
            title="Код"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
