export interface AppsScriptGeneratorOptions {
  supplierId: string;
  ingressKey: string;
  webhookUrl: string;
  testPingUrl: string;
  sheetName?: string;
  debounceSeconds?: number;
}

/**
 * Generates tailored Google Apps Script code pre-populated with endpoint URLs and ingress credentials.
 */
export function generateGoogleAppsScript(options: AppsScriptGeneratorOptions): string {
  const debounceSeconds = options.debounceSeconds ?? 5;
  const targetSheet = options.sheetName ? JSON.stringify(options.sheetName) : 'null';
  const webhookUrl = JSON.stringify(options.webhookUrl);
  const testPingUrl = JSON.stringify(options.testPingUrl);
  const ingressKey = JSON.stringify(options.ingressKey);

  return `/**
 * ==============================================================================
 * SpoilerAlert OS - Google Sheets Automated Real-Time Sync & Ingress
 * ==============================================================================
 * This script connects this Google Spreadsheet to SpoilerAlert OS.
 * It provides:
 * 1. Native "SpoilerAlert OS ⚡" toolbar menu for manual sync and connection tests.
 * 2. Real-time onChange & onEdit debounced webhook pushes directly to the ingress engine.
 * ==============================================================================
 */

var CONFIG = {
  WEBHOOK_URL: ${webhookUrl},
  TEST_PING_URL: ${testPingUrl},
  INGRESS_KEY: ${ingressKey},
  TARGET_SHEET: ${targetSheet},
  DEBOUNCE_SECONDS: ${debounceSeconds}
};

/**
 * Adds native custom toolbar menu when spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("SpoilerAlert OS ⚡")
    .addItem("Sync to Platform Now", "syncToPlatform")
    .addItem("Verify Connection", "testConnection")
    .addItem("Install Real-Time Triggers", "installTriggers")
    .addToUi();
}

/**
 * Native simple trigger for cell edits with debounce window.
 */
function onEdit(e) {
  handleDebouncedTrigger();
}

/**
 * Native trigger for structural spreadsheet changes (row insertions, deletions, etc).
 */
function onChange(e) {
  handleDebouncedTrigger();
}

/**
 * Programmatically installs persistent project triggers using ScriptApp.
 */
function installTriggers() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var existingTriggers = ScriptApp.getUserTriggers(spreadsheet);
  for (var i = 0; i < existingTriggers.length; i++) {
    var fnName = existingTriggers[i].getHandlerFunction();
    if (fnName === "onChange" || fnName === "onEdit") {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }

  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(spreadsheet)
    .onChange()
    .create();

  SpreadsheetApp.getUi().alert(
    "SpoilerAlert OS ⚡ Triggers Active",
    "Real-time onChange trigger has been installed successfully.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Debounce coordinator using ScriptCache to prevent webhook storms during rapid cell edits.
 */
function handleDebouncedTrigger() {
  var cache = CacheService.getScriptCache();
  var now = new Date().getTime();
  var syncToken = "sync_scheduled_" + now;

  cache.put("pending_sync_token", syncToken, 60);

  // Debounce wait
  Utilities.sleep(CONFIG.DEBOUNCE_SECONDS * 1000);

  var latestToken = cache.get("pending_sync_token");
  if (latestToken === syncToken) {
    cache.remove("pending_sync_token");
    syncToPlatform();
  }
}

/**
 * Tests connectivity with the SpoilerAlert OS ingress server.
 */
function testConnection() {
  var ui = SpreadsheetApp.getUi();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var payload = {
    spreadsheetId: spreadsheet.getId(),
    sheetName: spreadsheet.getActiveSheet().getName()
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Ingress-Key": CONFIG.INGRESS_KEY,
      "ngrok-skip-browser-warning": "true"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(CONFIG.TEST_PING_URL, options);
    var code = response.getResponseCode();
    var responseData = JSON.parse(response.getContentText());

    if (code === 200 && responseData.success) {
      ui.alert("SpoilerAlert OS ⚡ Connection Verified", "Status: " + (responseData.status || "Connected") + "\\nSupplier: " + (responseData.supplierName || "OK") + "\\nMessage: " + (responseData.message || "Ready for sync."), ui.ButtonSet.OK);
    } else {
      ui.alert("SpoilerAlert OS ⚡ Connection Failed", "HTTP " + code + ": " + (responseData.error || response.getContentText()), ui.ButtonSet.OK);
    }
  } catch (err) {
    ui.alert("SpoilerAlert OS ⚡ Error", "Failed to connect to endpoint: " + err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Scrapes current sheet grid values and posts directly to ingress webhook.
 */
function syncToPlatform() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = CONFIG.TARGET_SHEET ? spreadsheet.getSheetByName(CONFIG.TARGET_SHEET) : spreadsheet.getActiveSheet();
  
  if (!sheet) {
    sheet = spreadsheet.getActiveSheet();
  }

  var range = sheet.getDataRange();
  var values = range.getDisplayValues();

  if (!values || values.length < 2) {
    Logger.log("SpoilerAlert OS: Sheet has insufficient data to sync.");
    return;
  }

  var headers = values[0];
  var rows = values.slice(1);

  var payload = {
    spreadsheetId: spreadsheet.getId(),
    sheetName: sheet.getName(),
    headers: headers,
    rows: rows
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Ingress-Key": CONFIG.INGRESS_KEY,
      "ngrok-skip-browser-warning": "true"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    var code = response.getResponseCode();
    var responseData = JSON.parse(response.getContentText());
    if (code === 200 && responseData.success) {
      Logger.log("SpoilerAlert OS: Sync succeeded! Metrics: " + JSON.stringify(responseData.metrics));
    } else {
      Logger.log("SpoilerAlert OS: Sync error HTTP " + code + ": " + (responseData.error || response.getContentText()));
    }
  } catch (err) {
    Logger.log("SpoilerAlert OS: Sync request error: " + err.toString());
  }
}
`;
}
