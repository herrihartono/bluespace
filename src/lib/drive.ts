async function appendRows(
  spreadsheetId: string,
  rows: string[][],
  accessToken: string,
): Promise<void> {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Messages!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    },
  );
}

/** Upload a file to the user's Google Drive and return a public thumbnail URL. */
export async function uploadToDrive(file: File, accessToken: string): Promise<string> {
  const form = new FormData();
  form.append(
    "metadata",
    new Blob(
      [JSON.stringify({ name: `bs_${Date.now()}_${file.name}`, mimeType: file.type })],
      { type: "application/json" },
    ),
  );
  form.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form },
  );
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  const { id } = await res.json();

  // Make the file publicly readable
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

/**
 * Append chat messages to the user's personal Google Sheets backup.
 * Creates the spreadsheet on first call for each chatId; subsequent calls append new rows.
 * Returns the spreadsheet URL so the UI can show a link.
 */
export async function backupChatHistory(
  chatId: string,
  chatTitle: string,
  messages: { senderName: string; content: string; createdAt: number }[],
  accessToken: string,
): Promise<string> {
  if (messages.length === 0) throw new Error("No messages to export");

  const cache: Record<string, string> = JSON.parse(
    localStorage.getItem("gsheets") || "{}",
  );
  let spreadsheetId = cache[chatId];

  if (!spreadsheetId) {
    // Create a new spreadsheet in the user's Drive
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: `BlueSpace - ${chatTitle}` },
        sheets: [{ properties: { title: "Messages" } }],
      }),
    });
    if (!createRes.ok) throw new Error(`Failed to create spreadsheet: ${createRes.status}`);
    const sheet = await createRes.json();
    spreadsheetId = sheet.spreadsheetId;
    cache[chatId] = spreadsheetId;
    localStorage.setItem("gsheets", JSON.stringify(cache));

    // Write header row
    await appendRows(spreadsheetId, [["Timestamp", "Sender", "Message"]], accessToken);
  }

  // Append all messages as rows
  const rows = messages.map((m) => [
    new Date(m.createdAt).toLocaleString(),
    m.senderName,
    m.content,
  ]);
  await appendRows(spreadsheetId, rows, accessToken);

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
