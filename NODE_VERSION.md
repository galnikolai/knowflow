# Настройка версии Node.js

Проект требует Node.js версии >= 20.9.0. В проекте используется версия **20.19.5** (LTS).

## Автоматическое переключение версии

### Через nvm (рекомендуется)

Если у вас установлен nvm, версия будет автоматически переключаться при входе в директорию проекта:

```bash
cd /path/to/knowflow
nvm use  # Автоматически использует версию из .nvmrc
```

### Установка версии по умолчанию

Чтобы версия 20.19.5 использовалась по умолчанию:

```bash
nvm alias default 20.19.5
```

### Если версия не установлена

```bash
nvm install 20.19.5
nvm use 20.19.5
nvm alias default 20.19.5
```

## Настройка для VS Code / Cursor

В проекте уже настроен файл `.vscode/settings.json`, который автоматически использует правильную версию Node.js в терминале IDE.

Если это не работает:

1. Перезапустите IDE
2. Откройте новый терминал в IDE
3. Проверьте версию: `node --version`

## Проверка версии

```bash
node --version  # Должно быть v20.19.5 или выше
```

## Решение проблем

Если в терминале IDE все еще используется старая версия:

1. Закройте все терминалы в IDE
2. Откройте новый терминал
3. Выполните: `nvm use`
4. Проверьте: `node --version`

Если проблема сохраняется, добавьте в ваш `~/.zshrc` или `~/.bashrc`:

```bash
# Автоматическое переключение версии Node.js при входе в директорию
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

