/**
 * Google Apps Script for Memory Lab
 * ----------------------------------
 * Single source of truth for participant data.
 *
 * Endpoints (deploy as Web App, "Execute as: Me", "Who has access: Anyone"):
 *
 *   POST (from participant browsers — no key needed)
 *     body: { id, timestamp, results: [...] }
 *     → appends one row per result to the "Results" sheet
 *
 *   POST (admin actions — require ?key=SHEETS_ADMIN_KEY)
 *     body: { action: "delete", id, key }
 *     body: { action: "mute", id, muted: true|false, key }
 *
 *   GET ?action=list&key=SHEETS_ADMIN_KEY
 *     → { participants: [{ id, timestamp, completed, muted, results: [...] }, ...] }
 *
 * Setup:
 *   1. Open your Google Sheet → Extensions → Apps Script, paste this file.
 *   2. In Apps Script: Project Settings → Script Properties → add
 *        SHEETS_ADMIN_KEY = <a long random string>
 *   3. Put the SAME value in your Vercel env as SHEETS_ADMIN_KEY.
 *   4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone.
 *   5. Copy the /exec URL into SHEETS_URL in use-test-store.ts and
 *      app/api/participants/route.ts (they should match).
 */

var SHEET_NAME = "Results"
var HEADERS = [
  "participant_id",
  "timestamp",
  "trial_number",
  "presentation_order",
  "noise_type",
  "correct_count",
  "total_words",
  "false_alarm_count",
  "time_ms",
  "remembered_words",
  "target_words",
  "muted",
]

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.setFrozenRows(1)
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.setFrozenRows(1)
  }
  return sheet
}

function adminKey_() {
  return PropertiesService.getScriptProperties().getProperty("SHEETS_ADMIN_KEY") || ""
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || ""
  var key = (e && e.parameter && e.parameter.key) || ""

  if (action === "list") {
    if (key !== adminKey_()) return json_({ error: "unauthorized" })
    return json_({ participants: listParticipants_() })
  }
  return json_({ ok: true })
}

function doPost(e) {
  var body = {}
  try {
    body = JSON.parse(e.postData.contents || "{}")
  } catch (err) {
    return json_({ error: "invalid JSON" })
  }

  var action = body.action || "submit"

  if (action === "submit") {
    appendSubmission_(body)
    return json_({ ok: true })
  }

  // Admin actions require the key
  if (body.key !== adminKey_()) return json_({ error: "unauthorized" })

  if (action === "delete") {
    var deleted = deleteParticipant_(body.id)
    return json_({ ok: true, deleted: deleted })
  }

  if (action === "mute") {
    var updated = setMuted_(body.id, !!body.muted)
    return json_({ ok: true, updated: updated })
  }

  return json_({ error: "unknown action: " + action })
}

function appendSubmission_(payload) {
  if (!payload || !payload.id || !Array.isArray(payload.results)) return
  var sheet = getSheet_()
  var ts = payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString()
  var rows = payload.results.map(function (r, i) {
    var remembered = Array.isArray(r.rememberedWords) ? r.rememberedWords : []
    var targets = Array.isArray(r.targetWords) ? r.targetWords : []
    return [
      payload.id,
      ts,
      i + 1,
      r.presentationOrder == null ? "" : r.presentationOrder,
      r.noiseType || "",
      r.correctCount == null ? 0 : r.correctCount,
      r.totalWords == null ? 0 : r.totalWords,
      remembered.length - (r.correctCount == null ? 0 : r.correctCount),
      r.timeTakenMs == null ? 0 : r.timeTakenMs,
      remembered.join(", "),
      targets.join(", "),
      0, // muted flag, default 0
    ]
  })
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows)
  }
}

function deleteParticipant_(id) {
  if (!id) return 0
  var sheet = getSheet_()
  var last = sheet.getLastRow()
  if (last < 2) return 0
  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues()
  var deleted = 0
  // Delete from the bottom up so row indices stay valid.
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 2)
      deleted++
    }
  }
  return deleted
}

function setMuted_(id, muted) {
  if (!id) return 0
  var sheet = getSheet_()
  var last = sheet.getLastRow()
  if (last < 2) return 0
  var mutedCol = HEADERS.indexOf("muted") + 1
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues()
  var updated = 0
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      sheet.getRange(i + 2, mutedCol).setValue(muted ? 1 : 0)
      updated++
    }
  }
  return updated
}

function listParticipants_() {
  var sheet = getSheet_()
  var last = sheet.getLastRow()
  if (last < 2) return []

  // Single bulk read — this is the expensive I/O call; do it once.
  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues()

  // Column indices (avoid repeated lookups)
  var COL_ID = 0, COL_TS = 1, COL_TRIAL = 2, COL_ORDER = 3, COL_NOISE = 4
  var COL_CORRECT = 5, COL_TOTAL = 6, COL_TIME = 8
  var COL_REMEMBERED = 9, COL_TARGETS = 10, COL_MUTED = 11

  var byId = {}
  var ids = [] // preserve insertion order for output

  for (var i = 0; i < values.length; i++) {
    var row = values[i]
    var id = row[COL_ID]
    if (!id) continue

    var mutedVal = row[COL_MUTED]
    var isMuted = mutedVal === 1 || mutedVal === "1" || mutedVal === true

    if (!byId[id]) {
      var ts = row[COL_TS]
      byId[id] = {
        id: id,
        timestamp: ts ? (typeof ts === "object" && ts.getTime ? ts.toISOString() : String(ts)) : new Date().toISOString(),
        completed: true,
        muted: isMuted,
        results: [],
      }
      ids.push(id)
    } else if (isMuted) {
      byId[id].muted = true
    }

    // Keep remembered/target as raw strings — parse client-side to save GAS CPU
    byId[id].results.push({
      testId: +row[COL_TRIAL] || 0,
      presentationOrder: +row[COL_ORDER] || 0,
      noiseType: row[COL_NOISE] || "",
      correctCount: +row[COL_CORRECT] || 0,
      totalWords: +row[COL_TOTAL] || 0,
      timeTakenMs: +row[COL_TIME] || 0,
      rememberedWords: row[COL_REMEMBERED] || "",
      targetWords: row[COL_TARGETS] || "",
    })
  }

  var out = new Array(ids.length)
  for (var j = 0; j < ids.length; j++) {
    var p = byId[ids[j]]
    p.results.sort(function (a, b) { return a.testId - b.testId })
    out[j] = p
  }
  out.sort(function (a, b) {
    return (b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0)
  })
  return out
}
