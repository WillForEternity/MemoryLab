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
 *
 * Sheet format (10 columns):
 *   Participant ID | Timestamp | Test ID | Noise Type | Correct Count |
 *   Total Words | Score % | Time Taken (s) | Remembered Words | Target Words
 */

var SHEET_NAME = "Results"

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    var headers = [
      "Participant ID", "Timestamp", "Test ID", "Noise Type",
      "Correct Count", "Total Words", "Score %",
      "Time Taken (s)", "Remembered Words", "Target Words"
    ]
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
  }
  return sheet
}

var NUM_COLS = 10

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
    var correct = r.correctCount == null ? 0 : r.correctCount
    var total = r.totalWords == null ? 0 : r.totalWords
    var pct = total > 0 ? Math.round((correct / total) * 100) + "%" : "0%"
    var timeSec = r.timeTakenMs == null ? 0 : +(r.timeTakenMs / 1000).toFixed(1)
    return [
      payload.id,
      ts,
      r.presentationOrder == null ? i + 1 : r.presentationOrder + 1,
      r.noiseType || "",
      correct,
      total,
      pct,
      timeSec,
      remembered.join(", "),
      targets.join(", "),
    ]
  })
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, NUM_COLS).setValues(rows)
  }
}

function deleteParticipant_(id) {
  if (!id) return 0
  var sheet = getSheet_()
  var last = sheet.getLastRow()
  if (last < 2) return 0
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues()
  var deleted = 0
  for (var i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === id) {
      sheet.deleteRow(i + 2)
      deleted++
    }
  }
  return deleted
}

function setMuted_(id, muted) {
  // Muting not supported in the 10-column format — no-op that returns 0.
  return 0
}

// Column indices for the 10-column sheet:
//  0: Participant ID    5: Total Words
//  1: Timestamp         6: Score %
//  2: Test ID           7: Time Taken (s)
//  3: Noise Type        8: Remembered Words
//  4: Correct Count     9: Target Words

function listParticipants_() {
  var sheet = getSheet_()
  var last = sheet.getLastRow()
  if (last < 2) return []

  var values = sheet.getRange(2, 1, last - 1, NUM_COLS).getValues()

  var byId = {}
  var ids = []

  for (var i = 0; i < values.length; i++) {
    var row = values[i]
    var id = row[0]
    if (!id) continue

    if (!byId[id]) {
      var ts = row[1]
      byId[id] = {
        id: id,
        timestamp: ts ? (typeof ts === "object" && ts.getTime ? ts.toISOString() : String(ts)) : new Date().toISOString(),
        completed: true,
        muted: false,
        results: [],
      }
      ids.push(id)
    }

    byId[id].results.push({
      testId: +row[2] || 0,
      presentationOrder: +row[2] || 0,
      noiseType: row[3] || "",
      correctCount: +row[4] || 0,
      totalWords: +row[5] || 0,
      timeTakenMs: Math.round((parseFloat(row[7]) || 0) * 1000),
      rememberedWords: row[8] || "",
      targetWords: row[9] || "",
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
