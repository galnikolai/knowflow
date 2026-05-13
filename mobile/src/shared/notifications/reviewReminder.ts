import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_CHANNEL_ID = "review-reminder";
const REMINDER_NOTIFICATION_ID = "daily-review-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Creates the Android notification channel (no-op on iOS).
 */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Напоминания о повторении",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/**
 * Schedules (or reschedules) a daily reminder at the given hour and minute.
 * Cancels any previously scheduled reminder first.
 *
 * @param hour   Hour in local time (0–23)
 * @param minute Minute in local time (0–59)
 * @param dueCount  Number of cards due today (shown in the body)
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  dueCount?: number
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await ensureChannel();
  await cancelDailyReminder();

  const body =
    dueCount !== undefined && dueCount > 0
      ? `${dueCount} карточек ждут повторения`
      : "Время повторить карточки";

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: "KnowFlow",
      body,
      data: { type: "review-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancels the scheduled daily reminder.
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
}

/**
 * Returns the currently scheduled daily reminder time, or null if none.
 */
export async function getScheduledReminder(): Promise<{
  hour: number;
  minute: number;
} | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminder = scheduled.find((n) => n.identifier === REMINDER_NOTIFICATION_ID);
  if (!reminder) return null;

  const trigger = reminder.trigger as { hour?: number; minute?: number };
  if (trigger.hour === undefined || trigger.minute === undefined) return null;
  return { hour: trigger.hour, minute: trigger.minute };
}
