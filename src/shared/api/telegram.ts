/**
 * API для работы с Telegram ботом
 */

import { supabase } from "./supabase";
import type { Flashcard } from "@/entities/card/Card";

export interface TelegramUser {
  id: string;
  userId: string;
  telegramUserId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  isActive: boolean;
  notificationTime: string; // HH:mm:ss format
  timezone: string;
  dailyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramUserSettings {
  notificationTime?: string;
  timezone?: string;
  dailyLimit?: number;
  isActive?: boolean;
}

/**
 * Получить пользователя Telegram по user_id приложения
 */
export async function getTelegramUserByUserId(
  userId: string
): Promise<TelegramUser | null> {
  const { data, error } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        telegramUserId: data.telegram_user_id,
        telegramUsername: data.telegram_username,
        telegramFirstName: data.telegram_first_name,
        telegramLastName: data.telegram_last_name,
        isActive: data.is_active,
        notificationTime: data.notification_time,
        timezone: data.timezone,
        dailyLimit: data.daily_limit,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    : null;
}

/**
 * Получить пользователя Telegram по telegram_user_id
 */
export async function getTelegramUserByTelegramId(
  telegramUserId: number
): Promise<TelegramUser | null> {
  const { data, error } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        telegramUserId: data.telegram_user_id,
        telegramUsername: data.telegram_username,
        telegramFirstName: data.telegram_first_name,
        telegramLastName: data.telegram_last_name,
        isActive: data.is_active,
        notificationTime: data.notification_time,
        timezone: data.timezone,
        dailyLimit: data.daily_limit,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    : null;
}

/**
 * Создать или обновить пользователя Telegram
 */
export async function upsertTelegramUser(
  userId: string,
  telegramUserId: number,
  telegramData: {
    username?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<TelegramUser> {
  const { data, error } = await supabase
    .from("telegram_users")
    .upsert(
      {
        user_id: userId,
        telegram_user_id: telegramUserId,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.firstName,
        telegram_last_name: telegramData.lastName,
        is_active: true,
      },
      {
        onConflict: "telegram_user_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    telegramUserId: data.telegram_user_id,
    telegramUsername: data.telegram_username,
    telegramFirstName: data.telegram_first_name,
    telegramLastName: data.telegram_last_name,
    isActive: data.is_active,
    notificationTime: data.notification_time,
    timezone: data.timezone,
    dailyLimit: data.daily_limit,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Обновить настройки пользователя Telegram
 */
export async function updateTelegramUserSettings(
  telegramUserId: number,
  settings: TelegramUserSettings
): Promise<TelegramUser> {
  const updateData: Record<string, unknown> = {};
  if (settings.notificationTime !== undefined)
    updateData.notification_time = settings.notificationTime;
  if (settings.timezone !== undefined) updateData.timezone = settings.timezone;
  if (settings.dailyLimit !== undefined)
    updateData.daily_limit = settings.dailyLimit;
  if (settings.isActive !== undefined) updateData.is_active = settings.isActive;

  const { data, error } = await supabase
    .from("telegram_users")
    .update(updateData)
    .eq("telegram_user_id", telegramUserId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    telegramUserId: data.telegram_user_id,
    telegramUsername: data.telegram_username,
    telegramFirstName: data.telegram_first_name,
    telegramLastName: data.telegram_last_name,
    isActive: data.is_active,
    notificationTime: data.notification_time,
    timezone: data.timezone,
    dailyLimit: data.daily_limit,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Получить карточки, готовые к повторению для пользователя
 */
export async function getDueFlashcardsForUser(
  userId: string,
  limit: number = 10
): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .lte("next_review", new Date().toISOString())
    .order("next_review", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (
    data?.map((row) => ({
      id: row.id,
      nodeId: row.node_id,
      question: row.question,
      answer: row.answer,
      nextReview: new Date(row.next_review).getTime(),
      interval: row.interval,
      repetitions: row.repetitions,
      easeFactor: row.ease_factor,
    })) || []
  );
}

/**
 * Обновить карточку после повторения (SM-2 алгоритм)
 */
export async function reviewFlashcard(
  cardId: string,
  grade: 0 | 3 | 5
): Promise<void> {
  // Получаем текущую карточку
  const { data: cardData, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", cardId)
    .single();

  if (fetchError) throw fetchError;
  if (!cardData) throw new Error("Карточка не найдена");

  // Применяем алгоритм SM-2
  let { interval, repetitions, ease_factor } = cardData;

  if (grade === 0) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease_factor);
    ease_factor = Math.max(
      1.3,
      ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
    );
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  // Обновляем карточку
  const { error: updateError } = await supabase
    .from("flashcards")
    .update({
      interval,
      repetitions,
      ease_factor,
      next_review: nextReview.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (updateError) throw updateError;
}

