import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ExperimentCondition, ImageType, DisclosureTiming } from '@/types/experiment';

interface ConditionCounter {
  A_pre: number;
  A_mid: number;
  B_pre: number;
  B_mid: number;
}

const COUNTER_PATH = path.join(process.cwd(), 'data_backups', 'condition_counts.json');

function getCounts(): ConditionCounter {
  try {
    if (fs.existsSync(COUNTER_PATH)) {
      const data = fs.readFileSync(COUNTER_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading counter file:', e);
  }
  return { A_pre: 0, A_mid: 0, B_pre: 0, B_mid: 0 };
}

function saveCounts(counts: ConditionCounter) {
  try {
    const dir = path.dirname(COUNTER_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COUNTER_PATH, JSON.stringify(counts, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving counter file:', e);
  }
}

export async function GET() {
  const counts = getCounts();
  const conditions: ExperimentCondition[] = ['A_pre', 'A_mid', 'B_pre', 'B_mid'];

  // Find condition with the minimum participant count for perfectly balanced recruitment
  let minCount = Infinity;
  let candidateConditions: ExperimentCondition[] = [];

  for (const cond of conditions) {
    const c = counts[cond] || 0;
    if (c < minCount) {
      minCount = c;
      candidateConditions = [cond];
    } else if (c === minCount) {
      candidateConditions.push(cond);
    }
  }

  // Random pick among tied minimum candidates
  const assignedCondition = candidateConditions[Math.floor(Math.random() * candidateConditions.length)];
  counts[assignedCondition] = (counts[assignedCondition] || 0) + 1;
  saveCounts(counts);

  const [imageTypeStr, timingStr] = assignedCondition.split('_');
  const imageType = imageTypeStr as ImageType;
  const timing = timingStr as DisclosureTiming;
  const participantId = 'P' + Math.random().toString(36).substring(2, 8).toUpperCase();

  return NextResponse.json({
    participantId,
    condition: assignedCondition,
    imageType,
    timing,
    currentCounts: counts,
  });
}