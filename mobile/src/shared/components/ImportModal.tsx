import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  importMarkdownOrText,
  importFromUrl,
  importPdf,
  importAudioOrVideo,
  type ImportResult,
} from "@/shared/api/import";
import { useTheme } from "@/shared/context/ThemeContext";
import { spacing, radius, font, type ThemeColors } from "@/shared/theme";

type ImportType = "url" | "markdown" | "pdf" | "audio" | null;

type ImportStyles = ReturnType<typeof createImportStyles>;

interface ImportOption {
  id: ImportType;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  hint: string;
  needsApi?: boolean;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    id: "url",
    icon: "link-outline",
    label: "Страница по ссылке",
    hint: "URL публичной статьи",
  },
  {
    id: "markdown",
    icon: "document-text-outline",
    label: "Файл",
    hint: "Markdown или текст",
  },
  {
    id: "pdf",
    icon: "document-outline",
    label: "PDF",
    hint: "Нужен API на сервере",
    needsApi: true,
  },
  {
    id: "audio",
    icon: "mic-outline",
    label: "Аудио или видео",
    hint: "Нужен API на сервере",
    needsApi: true,
  },
];

function createImportStyles(colors: ThemeColors) {
  return StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    sheet: {
      flex: 1,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    iconHit: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      color: colors.text,
      fontSize: font.md,
      fontWeight: "600",
    },
    actionText: {
      color: colors.primary,
      fontSize: font.base,
      fontWeight: "600",
    },
    actionTextDisabled: {
      color: colors.textTertiary,
    },
    lead: {
      color: colors.textTertiary,
      fontSize: font.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    list: {
      marginHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      color: colors.text,
      fontSize: font.base,
      fontWeight: "500",
    },
    rowHint: {
      color: colors.textTertiary,
      fontSize: font.xs,
      marginTop: 2,
    },
    footnote: {
      color: colors.textTertiary,
      fontSize: font.xs,
      textAlign: "center",
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      lineHeight: 16,
    },
    urlBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    urlInput: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: font.base,
    },
    helper: {
      color: colors.textTertiary,
      fontSize: font.sm,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    primaryBtn: {
      marginTop: spacing.lg,
      backgroundColor: colors.text,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryBtnOff: {
      opacity: 0.45,
    },
    primaryBtnLabel: {
      color: colors.textInverse,
      fontSize: font.base,
      fontWeight: "600",
    },
    previewBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: font.sm,
      marginBottom: spacing.xs,
    },
    titleInput: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
      fontSize: font.md,
      fontWeight: "500",
    },
    metaLine: {
      color: colors.textTertiary,
      fontSize: font.xs,
      marginTop: spacing.sm,
    },
    previewScroll: {
      flex: 1,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    previewScrollInner: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    contentText: {
      color: colors.textSecondary,
      fontSize: font.sm,
      lineHeight: 22,
    },
    contentTruncated: {
      color: colors.textTertiary,
      fontStyle: "italic",
    },
  });
}

function PreviewPanel({
  result,
  onSave,
  onBack,
  saving,
  styles,
  colors,
}: {
  result: ImportResult;
  onSave: (title: string, content: string) => Promise<void>;
  onBack: () => void;
  saving: boolean;
  styles: ImportStyles;
  colors: ThemeColors;
}) {
  const [title, setTitle] = useState(result.title);
  const wordCount = result.content.split(/\s+/).filter(Boolean).length;
  const rest = result.content.length > 3000 ? result.content.length - 3000 : 0;

  return (
    <View style={styles.sheet}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.iconHit} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Проверка</Text>
        <TouchableOpacity
          onPress={() => onSave(title, result.content)}
          disabled={saving || !title.trim()}
          style={styles.iconHit}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.actionText, !title.trim() && styles.actionTextDisabled]}>
              Сохранить
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewBody}>
        <Text style={styles.inputLabel}>Название</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Заголовок заметки"
          placeholderTextColor={colors.textTertiary}
          autoFocus
        />

        <Text style={styles.metaLine}>
          {wordCount} слов{rest > 0 ? ` · +${rest} симв.` : ""}
        </Text>

        <ScrollView
          style={styles.previewScroll}
          contentContainerStyle={styles.previewScrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.contentText} selectable>
            {result.content.slice(0, 3000)}
            {rest > 0 ? (
              <Text style={styles.contentTruncated}>{`\n\n… обрезано для просмотра`}</Text>
            ) : null}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

function UrlInput({
  onResult,
  onBack,
  styles,
  colors,
}: {
  onResult: (r: ImportResult) => void;
  onBack: () => void;
  styles: ImportStyles;
  colors: ThemeColors;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const result = await importFromUrl(url);
      onResult(result);
    } catch (e) {
      Alert.alert("Не получилось", e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.sheet}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.iconHit} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Ссылка</Text>
        <View style={styles.iconHit} />
      </View>

      <View style={styles.urlBody}>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleFetch}
          autoFocus
        />
        <Text style={styles.helper}>Откроем текст страницы, без оформления сайта.</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, (!url.trim() || loading) && styles.primaryBtnOff]}
          onPress={handleFetch}
          disabled={!url.trim() || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.primaryBtnLabel}>Загрузить</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (title: string, content: string) => Promise<void>;
}

export function ImportModal({ visible, onClose, onImport }: ImportModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createImportStyles(colors), [colors]);
  const [activeType, setActiveType] = useState<ImportType>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState<ImportType>(null);

  const handleClose = () => {
    setActiveType(null);
    setResult(null);
    setSaving(false);
    onClose();
  };

  const handleOptionPress = async (option: ImportOption) => {
    if (option.id === "url") {
      setActiveType("url");
      return;
    }

    setLoading(option.id);
    try {
      let importResult: ImportResult;
      if (option.id === "markdown") {
        importResult = await importMarkdownOrText();
      } else if (option.id === "pdf") {
        importResult = await importPdf();
      } else if (option.id === "audio") {
        importResult = await importAudioOrVideo();
      } else {
        return;
      }
      setResult(importResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "cancelled") {
        Alert.alert("Импорт", msg);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSave = async (title: string, content: string) => {
    setSaving(true);
    try {
      await onImport(title, content);
      handleClose();
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const handleBack = () => {
    setActiveType(null);
    setResult(null);
  };

  const renderContent = () => {
    if (result) {
      return (
        <PreviewPanel
          result={result}
          onSave={handleSave}
          onBack={handleBack}
          saving={saving}
          styles={styles}
          colors={colors}
        />
      );
    }

    if (activeType === "url") {
      return (
        <UrlInput
          onResult={(r) => {
            setActiveType(null);
            setResult(r);
          }}
          onBack={handleBack}
          styles={styles}
          colors={colors}
        />
      );
    }

    return (
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleClose} style={styles.iconHit} accessibilityRole="button">
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Новая заметка</Text>
          <View style={styles.iconHit} />
        </View>

        <Text style={styles.lead}>Откуда взять текст</Text>

        <View style={styles.list}>
          {IMPORT_OPTIONS.map((option, i) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.65}
              disabled={loading !== null}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Ionicons name={option.icon} size={22} color={colors.textSecondary} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{option.label}</Text>
                <Text style={styles.rowHint}>
                  {option.needsApi ? `${option.hint}` : option.hint}
                </Text>
              </View>
              {loading === option.id ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footnote}>
          PDF и медиа работают, если задан EXPO_PUBLIC_API_URL
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modal, { paddingTop: insets.top }]}>{renderContent()}</View>
    </Modal>
  );
}
