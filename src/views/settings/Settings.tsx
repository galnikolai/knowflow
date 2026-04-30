import { SettingsSidebar } from "@/widgets";
import React, { useState } from "react";
import { useSettingsStore, type AIProvider } from "@/shared/store/useSettingsStore";
import { CheckCircle, Eye, EyeOff, Cpu, Zap, Bot } from "lucide-react";

// ─── Provider card ────────────────────────────────────────────────────────────

interface ProviderOption {
  id: AIProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini — быстрые и мощные",
    icon: <Zap className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 — глубокое понимание текста",
    icon: <Bot className="h-5 w-5" />,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Локальные модели — без утечки данных",
    icon: <Cpu className="h-5 w-5" />,
    color: "from-blue-500 to-indigo-600",
  },
];

function ProviderCard({
  option,
  active,
  onClick,
}: {
  option: ProviderOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${option.color} text-white shadow-sm`}
      >
        {option.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{option.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{option.description}</p>
      </div>
      {active && (
        <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary shrink-0" />
      )}
    </button>
  );
}

// ─── Masked input ─────────────────────────────────────────────────────────────

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
const ANTHROPIC_MODELS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
];

export const Settings: React.FC = () => {
  const {
    ai,
    setProvider,
    setOpenaiKey,
    setAnthropicKey,
    setOllamaUrl,
    setOpenaiModel,
    setAnthropicModel,
    setOllamaModel,
  } = useSettingsStore();

  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SettingsSidebar>
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте AI-провайдером и ключами доступа
          </p>
        </div>

        {/* AI Provider section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">AI-провайдер</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Выбранный провайдер используется для генерации карточек и квизов
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PROVIDERS.map((opt) => (
              <ProviderCard
                key={opt.id}
                option={opt}
                active={ai.provider === opt.id}
                onClick={() => setProvider(opt.id)}
              />
            ))}
          </div>

          {/* Provider-specific settings */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {ai.provider === "openai" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">API-ключ OpenAI</label>
                  <SecretInput
                    value={ai.openaiKey}
                    onChange={setOpenaiKey}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Получить:{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Модель</label>
                  <select
                    value={ai.openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {OPENAI_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {ai.provider === "anthropic" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">API-ключ Anthropic</label>
                  <SecretInput
                    value={ai.anthropicKey}
                    onChange={setAnthropicKey}
                    placeholder="sk-ant-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Получить:{" "}
                    <a
                      href="https://console.anthropic.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      console.anthropic.com/keys
                    </a>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Модель</label>
                  <select
                    value={ai.anthropicModel}
                    onChange={(e) => setAnthropicModel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {ANTHROPIC_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {ai.provider === "ollama" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">URL сервера Ollama</label>
                  <input
                    type="url"
                    value={ai.ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Запустите:{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono">
                      ollama serve
                    </code>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Модель</label>
                  <input
                    type="text"
                    value={ai.ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Например: llama3.2, mistral, deepseek-r1
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
              >
                Сохранить
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  Сохранено
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Info section */}
        <section className="mt-8 rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold mb-2">Как это работает</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            <li>Ключи хранятся только локально в браузере (localStorage)</li>
            <li>При генерации карточек и квизов ключ отправляется на сервер в теле запроса</li>
            <li>Сервер не логирует и не сохраняет ваши ключи</li>
          </ul>
        </section>
      </div>
    </SettingsSidebar>
  );
};
