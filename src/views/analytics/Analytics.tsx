"use client";

import React, { useEffect, useMemo } from "react";
import { AppSidebar } from "@/widgets/sidebar/ui/Sidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/shared/ui/sidebar";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Layers,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────

function avgEase(easeFactor: number) {
  const pct = Math.round(((easeFactor - 1.3) / (3.5 - 1.3)) * 100);
  return Math.max(0, Math.min(100, pct));
}

const INTERVAL_BUCKETS = [
  { label: "Сегодня", max: 1 },
  { label: "≤ 3 д.", max: 3 },
  { label: "≤ 1 нед.", max: 7 },
  { label: "≤ 2 нед.", max: 14 },
  { label: "≤ 1 мес.", max: 30 },
  { label: "> 1 мес.", max: Infinity },
];

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

// Генерируем 7-дневный "review forecast" на основе nextReview
function buildForecast(
  cards: { nextReview: number; interval: number }[]
): { day: string; dueCards: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const start = d.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const dueCards = cards.filter(
      (c) => c.nextReview >= start && c.nextReview < end
    ).length;
    return {
      day: i === 0 ? "Сегодня" : d.toLocaleDateString("ru-RU", { weekday: "short" }),
      dueCards,
    };
  });
}

// Интервальное распределение карточек
function buildIntervalDist(cards: { interval: number }[]) {
  return INTERVAL_BUCKETS.map((b, i) => {
    const prev = INTERVAL_BUCKETS[i - 1]?.max ?? 0;
    const count = cards.filter(
      (c) => c.interval > prev && c.interval <= b.max
    ).length;
    return { label: b.label, count };
  });
}

// ─── stat card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = "text-primary" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card border border-border p-5 flex items-start gap-4">
      <div className={`mt-0.5 ${accent} opacity-80`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── section title ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

export const Analytics: React.FC = () => {
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);

  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);

  useEffect(() => {
    fetchCards();
    fetchNotes();
    fetchLearnspaces();
  }, [fetchCards, fetchNotes, fetchLearnspaces]);

  const dueToday = useMemo(
    () => cards.filter((c) => c.nextReview <= Date.now()).length,
    [cards]
  );

  const avgEasePct = useMemo(() => {
    if (!cards.length) return 0;
    const avg = cards.reduce((s, c) => s + c.easeFactor, 0) / cards.length;
    return avgEase(avg);
  }, [cards]);

  const learned = useMemo(
    () => cards.filter((c) => c.repetitions >= 2).length,
    [cards]
  );

  const totalNotes = notes.filter((n) => !n.is_folder).length;
  const totalFolders = notes.filter((n) => n.is_folder).length;

  const forecast = useMemo(() => buildForecast(cards), [cards]);
  const intervalDist = useMemo(() => buildIntervalDist(cards), [cards]);

  const pieData = useMemo(
    () =>
      intervalDist
        .filter((d) => d.count > 0)
        .map((d) => ({ name: d.label, value: d.count })),
    [intervalDist]
  );

  // Retention estimate from average easeFactor
  const retentionEst = useMemo(() => {
    if (!cards.length) return 0;
    const avg = cards.reduce((s, c) => s + c.easeFactor, 0) / cards.length;
    // easeFactor 2.5 ≈ 85% retention (rough heuristic)
    return Math.min(99, Math.round((avg / 3.5) * 100));
  }, [cards]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]!">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background p-8 gap-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Аналитика</h1>
            <p className="text-muted-foreground text-sm">
              Прогресс изучения, статистика карточек и прогноз повторений
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Brain size={22} />}
              label="Всего карточек"
              value={cards.length}
              sub={`${dueToday} к повторению сегодня`}
              accent="text-violet-500"
            />
            <StatCard
              icon={<BookOpen size={22} />}
              label="Заметки"
              value={totalNotes}
              sub={`${totalFolders} папок · ${learnspaces.length} тренировок`}
              accent="text-blue-500"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              label="Изучено"
              value={learned}
              sub={`${cards.length ? Math.round((learned / cards.length) * 100) : 0}% от всех карточек`}
              accent="text-emerald-500"
            />
            <StatCard
              icon={<TrendingUp size={22} />}
              label="Удержание"
              value={`${retentionEst}%`}
              sub="расчётное по ease factor"
              accent="text-amber-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast area chart */}
            <div className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">Прогноз повторений на 7 дней</span>
              </div>
              {cards.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={forecast} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v) => [`${v} карточек`, "К повторению"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="dueCards"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorDue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie — interval distribution */}
            <div className="rounded-xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">Распределение интервалов</span>
              </div>
              {pieData.length === 0 ? (
                <EmptyChart />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <PieChart width={150} height={150}>
                    <Pie
                      data={pieData}
                      cx={75}
                      cy={75}
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v) => [`${v} карточек`]}
                    />
                  </PieChart>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bar — interval dist detail */}
          <Section title="Интервалы по корзинам">
            <div className="rounded-xl bg-card border border-border p-5">
              {cards.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={intervalDist}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v) => [`${v} карточек`]}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Карточек" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>

          {/* Learnspaces health */}
          <Section title="Тренировки">
            {learnspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет тренировок. Создайте их в разделе Тренер.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learnspaces.map((ls) => {
                  const lsCards = cards.filter((c) => ls.noteIds.includes(c.nodeId));
                  const lsDue = lsCards.filter((c) => c.nextReview <= Date.now()).length;
                  const pct = lsCards.length ? Math.round((lsDue / lsCards.length) * 100) : 0;
                  return (
                    <div
                      key={ls.id}
                      className="rounded-xl bg-card border border-border p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{ls.name}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{lsCards.length} карточек</span>
                        <span className={lsDue > 0 ? "text-amber-500 font-semibold" : "text-emerald-500"}>
                          {lsDue > 0 ? `${lsDue} к повт.` : "Всё изучено"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct > 50 ? "#f59e0b" : "#6366f1",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Ease factor gauge */}
          <Section title="Уровень сложности">
            <div className="rounded-xl bg-card border border-border p-5 flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="rotate-[-90deg]">
                  <circle cx="40" cy="40" r="30" fill="none" strokeWidth="8" className="stroke-muted" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="none"
                    strokeWidth="8"
                    stroke="#6366f1"
                    strokeDasharray={`${(avgEasePct / 100) * 188.5} 188.5`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {avgEasePct}%
                </span>
              </div>
              <div>
                <p className="font-semibold mb-1">Средний ease factor</p>
                <p className="text-sm text-muted-foreground">
                  {avgEasePct >= 70
                    ? "Отличный результат — материал хорошо усвоен"
                    : avgEasePct >= 40
                    ? "Хороший прогресс — продолжайте повторять"
                    : "Требуется дополнительное изучение"}
                </p>
                {dueToday > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-500">
                    <AlertCircle size={13} />
                    <span>{dueToday} карточек ждут повторения сегодня</span>
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
      Нет данных — создайте карточки в тренировках
    </div>
  );
}
