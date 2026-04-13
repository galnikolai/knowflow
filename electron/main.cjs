const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const isPackaged = app.isPackaged;
const DEV_SERVER_URL =
  process.env.KNOWFLOW_DEV_URL || "http://localhost:3000";
const PROD_PORT = process.env.KNOWFLOW_PORT || "30443";

let mainWindow = null;
let nextChild = null;
/** Базовый URL приложения (для загрузки и проверки навигации) */
let appBaseUrl = DEV_SERVER_URL;

function getStandaloneDir() {
  if (isPackaged) {
    return path.join(process.resourcesPath, "standalone");
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function waitForServer(url, isCancelled) {
  const deadline = Date.now() + 90000;
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (isCancelled && isCancelled()) {
        reject(new Error("Запуск сервера прерван."));
        return;
      }
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (isCancelled && isCancelled()) {
          reject(new Error("Запуск сервера прерван."));
          return;
        }
        if (Date.now() > deadline) {
          reject(
            new Error(
              "Не удалось дождаться запуска сервера. Проверьте сборку (npm run build && npm run electron:prepare)."
            )
          );
        } else {
          setTimeout(tick, 400);
        }
      });
      req.setTimeout(2500, () => req.destroy());
    };
    tick();
  });
}

function startStandaloneServer() {
  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");
  const fs = require("fs");

  if (!fs.existsSync(serverJs)) {
    return Promise.reject(
      new Error(
        `Не найден ${serverJs}. Соберите приложение: npm run build && npm run electron:prepare`
      )
    );
  }

  appBaseUrl = `http://127.0.0.1:${PROD_PORT}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    let stderrBuf = "";
    let childExitedError = false;

    const appendStderr = (chunk) => {
      const s = chunk.toString();
      if (process.env.KNOWFLOW_DEBUG) console.error("[next]", s);
      stderrBuf = (stderrBuf + s).slice(-8000);
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      try {
        if (nextChild && !nextChild.killed) {
          nextChild.kill("SIGTERM");
        }
      } catch (_) {
        /* ignore */
      }
      reject(err);
    };

    const ok = (val) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    const { NODE_OPTIONS: _ignoreNodeOptions, ...parentEnv } = process.env;
    const env = {
      ...parentEnv,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(PROD_PORT),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    };

    nextChild = spawn(process.execPath, [serverJs], {
      cwd: standaloneDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    nextChild.stdout?.on("data", (d) => {
      const s = d.toString();
      if (process.env.KNOWFLOW_DEBUG) console.log("[next]", s);
    });

    nextChild.stderr?.on("data", appendStderr);

    nextChild.on("error", fail);
    nextChild.on("exit", (code, signal) => {
      if (settled || signal === "SIGTERM") return;
      if (!code || code === 0) return;
      childExitedError = true;
      const tail = stderrBuf.trim();
      const portHint =
        /EADDRINUSE|address already in use/i.test(tail)
          ? ` Порт ${PROD_PORT} занят — закройте другую копию KnowFlow или процесс на этом порту.`
          : "";
      fail(
        new Error(
          `Next.js-сервер не запустился (код выхода ${code}).${portHint}` +
            (tail ? `\n\n${tail.slice(-2500)}` : "")
        )
      );
    });

    waitForServer(appBaseUrl, () => settled || childExitedError)
      .then(() => ok(appBaseUrl))
      .catch((err) => {
        if (settled || childExitedError) return;
        fail(
          new Error(
            `${err.message}\n\nЕсли порт ${PROD_PORT} занят, закройте другую копию приложения.`
          )
        );
      });
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, "../public/vite.svg");
  const fs = require("fs");
  const icon =
    fs.existsSync(iconPath) ? iconPath : undefined;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    ...(icon ? { icon } : {}),
    show: false,
    titleBarStyle: "default",
  });

  mainWindow.loadURL(appBaseUrl);

  if (!isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  /** Показ окна: ready-to-show иногда не приходит (редиректы Next, зависший рендер). */
  let shown = false;
  const showMain = () => {
    if (!mainWindow || mainWindow.isDestroyed() || shown) return;
    shown = true;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once("ready-to-show", showMain);
  mainWindow.webContents.once("dom-ready", () => {
    setTimeout(showMain, 50);
  });
  setTimeout(showMain, 2500);

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    const { dialog } = require("electron");
    if (code === -3) return;
    dialog.showErrorBox(
      "KnowFlow",
      `Не удалось загрузить страницу (${code}): ${desc}\n${url}`
    );
    showMain();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const allowedOrigin = (() => {
    try {
      return new URL(appBaseUrl).origin;
    } catch {
      return "http://127.0.0.1";
    }
  })();

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    let parsed;
    try {
      parsed = new URL(navigationUrl);
    } catch {
      event.preventDefault();
      return;
    }
    if (parsed.origin !== allowedOrigin && parsed.protocol !== "file:") {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

function createMenu() {
  const template = [
    {
      label: "KnowFlow",
      submenu: [
        {
          label: "About KnowFlow",
          click: () => {
            console.log("About KnowFlow");
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on("before-quit", () => {
  if (nextChild) {
    nextChild.kill("SIGTERM");
    nextChild = null;
  }
});

app.whenReady().then(async () => {
  try {
    if (isPackaged) {
      await startStandaloneServer();
    } else {
      appBaseUrl = DEV_SERVER_URL;
    }
    createWindow();
    createMenu();
  } catch (err) {
    console.error(err);
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "KnowFlow",
      err.message ||
        "Не удалось запустить приложение. Переустановите сборку или обратитесь к разработчику."
    );
    app.quit();
  }

  app.on("activate", () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length === 0) {
      createWindow();
      return;
    }
    for (const win of wins) {
      if (win.isDestroyed()) continue;
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

app.setAsDefaultProtocolClient("knowflow");
