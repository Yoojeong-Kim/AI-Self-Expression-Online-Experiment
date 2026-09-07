import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz64BolqUeBAB08rbKe9SG4ZpqEHy9uksru3UKr-XzV0-ZD2Y6MgLKIj6w0bE3HWuM/exec';

export async function POST(req: NextRequest) {
  try {
    const experimentData = await req.json();
    const googleAppsScriptUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL || DEFAULT_SHEETS_URL;

    // 1. Local JSON backup
    try {
      const backupDir = path.join(process.cwd(), 'data_backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const filename = `sub_${experimentData.participant.id}_${Date.now()}.json`;
      fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(experimentData, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Backup error:', fsErr);
    }

    // 2. Format payload for Google Spreadsheet
    const p = experimentData.participant;
    const msgs = experimentData.chatMessages || [];
    const formattedChatLog = msgs
      .map((m: any) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}${m.imageUrl ? ' (STIMULUS_IMAGE_DISPLAYED)' : ''}`)
      .join('\n');

    const sheetPayload = {
      timestamp: new Date().toISOString(),
      participantId: p.id,
      condition: p.condition || `${p.imageType || p.group}_${p.timing || 'mid'}`,
      image_type: p.imageType || p.group || 'A',
      timing: p.timing || 'mid',
      group: p.group || p.imageType || 'A',
      language: experimentData.language,
      gender: p.gender,
      birthYear: p.birthYear,
      occupation: p.occupation,
      gender_pre: p.gender,
      birthYear_pre: p.birthYear,
      occupation_pre: p.occupation,
      total_chat_seconds: experimentData.totalChatSeconds || 0,
      chat_message_count: msgs.length,
      full_chat_log: formattedChatLog,
      // Dynamic survey responses from StepSurvey (M1, M2, DVs, Manipulation Checks, Control Vars, Traits)
      ...experimentData.surveyResponses
    };

    let sheetsSuccess = false;
    let sheetsMessage = 'Saved locally';

    if (googleAppsScriptUrl && googleAppsScriptUrl.startsWith('https://script.google.com/')) {
      try {
        const response = await fetch(googleAppsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(sheetPayload),
        });
        if (response.ok) {
          sheetsSuccess = true;
          sheetsMessage = 'Synced to Google Sheet';
        }
      } catch (fetchErr: any) {
        console.warn('Sheets fetch error:', fetchErr);
        sheetsMessage = `Sheet sync error: ${fetchErr.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      sheetsSynced: sheetsSuccess,
      message: sheetsMessage,
      participantId: p.id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
