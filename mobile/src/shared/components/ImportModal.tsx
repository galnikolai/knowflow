import React, { useState } from "react";
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
import { colors, spacing, radius, font, shadow } from "@/shared/theme";

type ImportType = "url" | "markdown" | "pdf" | "audio" | null;

interface ImportOption {
  id: ImportType;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  needsApi?: boolean;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    id: "url",
    icon: "globe-outline",
    label: "Веб-статья",
    sublabel: "Вставьте URL любой страницы",
    color: colors.primary,
    bg: colors.primaryDim,
  },
  {
    id: "markdown",
    icon: "document-text-outline",
    label: "Markdown / Текст",
    sublabel: ".md, .txt файлы",
    color: "#a78bfa",
    bg: "#2d1f4e",
  },
  {
    id: "pdf",
    icon: "document-outline",
    label: "PDF",
    sublabel: "Требуется API сервер",
    color: "#f97316",
    bg: "#2a1508",
    needsApi: true,
  },
  {
    id: "audio",
    icon: "mic-outline",
    label: "Аудио / Видео",
    sublabel: "mp3, mp4, wav и др. · Требуется API",
    color: "#ec4899",
    bg: "#2d0f1f",
    needsApi: true,
  },
];

// ─── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({
  result,
  onSave,
  onBack,
  saving,
}: {
  result: ImportResult;
  onSave: (title: string, content: string) => Promise<void>;
  onBack: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(result.title);
  const wordCount = result.content.split(/\s+/).filter(Boolean).length;

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.previewHeaderTitle}>Предпросмотр</Text>
        <TouchableOpacity
          onPress={() => onSave(title, result.content)}
          disabled={saving || !title.trim()}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, !title.trim() && { color: colors.textTertiary }]}>
              Сохранить
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.titleField}>
        <Text style={styles.fieldLabel}>Название заметки</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Название..."
          placeholderTextColor={colors.textTertiary}
          autoFocus
        />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="text-outline" size={11} color={colors.textTertiary} />
          <Text style={styles.metaText}>{wordCount} слов</Text>
        </View>
        <View style={styles.metaBadge}>
          <Ionicons name="document-outline" size={11} color={colors.textTertiary} />
          <Text style={styles.metaText}>{result.content.length} символов</Text>
        </View>
      </View>

      <ScrollView
        style={styles.contentPreview}
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.contentText} selectable>
          {result.content.slice(0, 3000)}
          {result.content.length > 3000 && (
            <Text style={styles.contentTruncated}>
              {"\n\n… ещё {result.content.length - 3000} символов"}
            </Text>
          )}
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── URL input ────────────────────────────────────────────────────────────────

function UrlInput({
  onResult,
  onBack,
}: {
  onResult: (r: ImportResult) => void;
  onBack: () => void;
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
      Alert.alert("Ошибка", e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.urlContainer}
    >
      <View style={styles.previewHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.previewHeaderTitle}>Импорт URL</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.urlBody}>
        <View style={styles.urlIcon}>
          <Ionicons name="globe-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.urlTitle}>Введите адрес статьи</Text>
        <Text style={styles.urlSub}>
          Поддерживаются любые публичные страницы: Wikipedia, Medium, Habr и т.д.
        </Text>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="https://..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleFetch}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.fetchBtn, (!url.trim() || loading) && styles.fetchBtnDisabled]}
          onPress={handleFetch}
          disabled={!url.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.fetchBtnText}>Загрузить</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (title: string, content: string) => Promise<void>;
}

export function ImportModal({ visible, onClose, onImport }: ImportModalProps) {
  const insets = useSafeAreaInsets();
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
        Alert.alert("Ошибка импорта", msg);
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
        />
      );
    }

    return (
      <View style={[styles.optionsContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Header */}
        <View style={styles.optionsHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.optionsTitle}>Импорт</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.optionsSub}>
          Выберите источник для создания заметки
        </Text>

        <View style={styles.optionsList}>
          {IMPORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionRow}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
              disabled={loading !== null}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.bg }]}>
                {loading === option.id ? (
                  <ActivityIndicator size="small" color={option.color} />
                ) : (
                  <Ionicons name={option.icon} size={20} color={option.color} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionSub}>{option.sublabel}</Text>
              </View>
              {option.needsApi && (
                <View style={styles.apiBadge}>
                  <Text style={styles.apiBadgeText}>API</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.apiNote}>
          Опции с меткой API требуют настройки{"\n"}EXPO_PUBLIC_API_URL в .env
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
      <View style={[styles.modal, { paddingTop: insets.top }]}>
        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Options list
  optionsContainer: {
    flex: 1,
  },
  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionsTitle: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: "600",
  },
  optionsSub: {
    color: colors.textTertiary,
    fontSize: font.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  optionsList: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    color: colors.text,
    fontSize: font.base,
    fontWeight: "500",
  },
  optionSub: {
    color: colors.textTertiary,
    fontSize: font.xs,
    marginTop: 2,
  },
  apiBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  apiBadgeText: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  apiNote: {
    color: colors.textTertiary,
    fontSize: font.xs,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  // URL input
  urlContainer: {
    flex: 1,
  },
  urlBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  urlIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  urlTitle: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  urlSub: {
    color: colors.textTertiary,
    fontSize: font.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  urlInput: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: font.base,
    marginTop: spacing.sm,
  },
  fetchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.full,
    width: "100%",
    justifyContent: "center",
    ...shadow.glow,
  },
  fetchBtnDisabled: {
    opacity: 0.5,
  },
  fetchBtnText: {
    color: "#fff",
    fontSize: font.base,
    fontWeight: "600",
  },
  // Preview
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 2,
  },
  previewHeaderTitle: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: "600",
  },
  saveText: {
    color: colors.primary,
    fontSize: font.base,
    fontWeight: "600",
  },
  titleField: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: font.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: font.md,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    color: colors.textTertiary,
    fontSize: font.xs,
  },
  contentPreview: {
    flex: 1,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
