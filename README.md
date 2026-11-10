# ✦ Desk Tools (`My-Electron-App`)

A cozy, pastel pixel-art cross-platform desktop companion built with **Electron**, **HTML5**, **CSS3**, and **Vanilla JavaScript**. Designed to sit neatly on your desktop with an optional **Always-on-Top** pin mode and **Dark Mode**.

---

## 🚀 Features

* **🪟 Frameless Custom Window Bar:**
  * Built-in **Pin Always-on-Top** (`📌`), **Dark/Light Mode** (`🌙`/`☀`), **Retro Web-Audio Sound FX** (`🔊`/`🔇`), **Minimize** (`─`), and **Close** (`✕`) controls connected via a secure Electron `contextBridge` preload script.
* **◷ Clock & Interactive Monthly Calendar:**
  * Live clock with **12H / 24H** toggle and UTC offset badge.
  * Instant timezone search filter across all global IANA timezones.
  * Toggle between the big **Day Card** and an interactive **Monthly Calendar Grid** with month navigation.
* **☁ Weather Station (Open-Meteo — No API Key Required):**
  * **📍 Auto-Locate** button using IP geolocation or search any city worldwide.
  * Instant **°C / °F** (and `km/h` / `mph`) unit toggle and quick **↻ Refresh**.
  * Current temperature, condition icon, **Feels Like**, **Humidity**, **Wind Speed**, **UV Index**, and a **5-Day Forecast**.
* **⏱ Focus Timer & Stopwatch:**
  * **Pomodoro Timer** with presets (**Focus 25m**, **Break 5m**, **Long 15m**) + custom minute duration.
  * Visual progress bar, synthesized completion chime, and daily completed focus session counter.
  * Built-in **Stopwatch** with tenth-of-a-second precision and **Lap** recording.
* **✓ Daily Tasks (To-Do Checklist):**
  * Add tasks with priority badges (**High**, **Med**, **Low**).
  * Filter by **All**, **Active**, or **Done**, with a live completion progress bar and one-click **Clear done**.
* **✎ Notes Studio:**
  * Instant search bar to filter notes by title or content.
  * **Pin (`★`)** important notes to the top of your list.
  * Live **word & character count**, one-click **Copy to Clipboard**, **Export as `.txt`**, and two-step safe delete confirmation.
* **⌨️ Keyboard Shortcuts:**
  * Switch tools anytime with `Alt + 1` (Clock), `Alt + 2` (Weather), `Alt + 3` (Focus), `Alt + 4` (Tasks), and `Alt + 5` (Notes).

---

## 📂 Project Structure

```text
My-Electron-App/
├── main.js          # Electron main process & window IPC handlers
├── preload.js       # Context-isolated preload bridge (minimize, close, pin)
├── index.html       # App shell, titlebar, and 5 tool views
├── styles.css       # Pastel & Dark Mode themes, responsive layout
├── script.js        # Renderer logic for Clock, Weather, Focus, Tasks & Notes
├── package.json     # Project metadata, scripts, and Electron dependency
└── README.md        # Documentation
```

---

## 💻 How to Run the Application

### 1. Prerequisites
Make sure you have **Node.js** and **npm** installed:
```bash
node -v
npm -v
```

### 2. Clone the Repository
```bash
git clone https://github.com/alfeeshahrin9-sudo/My-Electron-App.git
cd My-Electron-App
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Launch the App
```bash
npm start
```
