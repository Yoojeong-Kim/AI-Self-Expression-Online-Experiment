import json
import csv
import re
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

columns = [
    "timestamp", "participantId", "condition", "image_type", "timing", "language",
    "gender", "birthYear", "occupation",
    "total_chat_seconds", "chat_message_count", "full_chat_log",
    "m1_control_1", "m1_control_2", "m1_control_3", "m1_control_4",
    "m2_self_1", "m2_self_2", "m2_self_3", "m2_ios_scale",
    "dv_advice_1", "dv_advice_2", "dv_advice_3",
    "dv_emo_1", "dv_emo_2", "dv_emo_3", "dv_emo_4",
    "dv_psi_1", "dv_psi_2", "dv_psi_3", "dv_psi_4", "dv_psi_5", "dv_psi_6",
    "dv_cog_1", "dv_cog_2", "dv_cog_3", "dv_cog_4", "dv_cog_5", "dv_cog_6",
    "mc_timing", "mc_staged_1", "mc_staged_2", "mc_staged_3", "mc_attention",
    "ctrl_sim_1", "ctrl_sim_2", "ctrl_exp_1", "ctrl_exp_2", "ctrl_exp_3", "ctrl_prior_1", "ctrl_prior_2",
    "trait_ai_freq", "trait_ai_emo_share", 
    "trait_lit_1", "trait_lit_2", "trait_lit_3", "trait_lit_4",
    "trait_lone_1", "trait_lone_2", "trait_lone_3"
]

group_headers = {
    "timestamp": "▶ 기본 정보 및 실험 조건 (Demographics & Setup)",
    "m1_control_1": "▶ M1. 지각된 통제감",
    "m2_self_1": "▶ M2-1. 자기일치",
    "m2_ios_scale": "▶ M2-2. 시각적 도식 (IOS)",
    "dv_advice_1": "▶ 종속변수 1: 조언 이행 의도",
    "dv_emo_1": "▶ 종속변수 2: 정서적 의존",
    "dv_psi_1": "▶ 종속변수 3: 준사회적 상호작용 경험",
    "dv_cog_1": "▶ 종속변수 4: 인지적 의존",
    "mc_timing": "▶ 조작 점검",
    "ctrl_sim_1": "▶ 통제 변수",
    "trait_ai_freq": "▶ 개인 특성 및 인구통계"
}

q_map = {}
with open('src/data/surveyQuestions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r"id:\s*'([^']+)',\s*type:\s*'([^']+)',\s*(?:isAttentionCheck:\s*(?:true|false),\s*)?ko:\s*'([^']+)'", content, re.DOTALL)
for match in matches:
    qid = match.group(1)
    qtext = match.group(3).replace("\\'", "'")
    q_map[qid] = qtext

excel_path = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구\AI Selfie_code book_v2.xlsx'

data = []
for col in columns:
    # Check if we need to insert a header row
    if col in group_headers:
        data.append({'변수명 (Column)': group_headers[col], '설명 (Question / Description / Levels)': None})

    if col in q_map:
        desc = q_map[col]
    else:
        if col == 'timestamp': desc = "제출 시간"
        elif col == 'participantId': desc = "참가자 고유 ID (랜덤 생성)"
        elif col == 'condition': desc = "배정된 실험 조건 (A_pre, B_pre, A_mid, B_mid) \n- A: Posed (연출된) 챗봇 이미지\n- B: Candid (자연스러운) 챗봇 이미지\n- pre: 대화 시작 전 이미지 노출\n- mid: 대화 중간에 이미지 노출"
        elif col == 'image_type': desc = "보여진 챗봇 이미지 종류 (A, B)\n- A: Posed (연출된)\n- B: Candid (자연스러운)"
        elif col == 'timing': desc = "이미지 공개 시점 (pre, mid)\n- pre: 대화 시작 전\n- mid: 대화 중간"
        elif col == 'language': desc = "실험 진행 언어 (ko 등)"
        elif col == 'gender': desc = "참가자 성별 (female, male 등)"
        elif col == 'birthYear': desc = "참가자 출생연도 (예: 1995)"
        elif col == 'occupation': desc = "참가자 직업 (employed, professional, student, unemployed 등)"
        elif col == 'total_chat_seconds': desc = "총 대화 시간 (초 단위)"
        elif col == 'chat_message_count': desc = "참가자가 전송한 메시지 총 개수"
        elif col == 'full_chat_log': desc = "전체 채팅 로그 (JSON 형식)"
        else: desc = ""
        
    data.append({'변수명 (Column)': col, '설명 (Question / Description / Levels)': desc})

df = pd.DataFrame(data)

with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
    df.to_excel(writer, index=False, sheet_name='Codebook')
    
    workbook = writer.book
    worksheet = writer.sheets['Codebook']
    
    # 1. Main Header Formatting
    header_fill = PatternFill(start_color='4F81BD', end_color='4F81BD', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True, size=11)
    
    for cell in worksheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')
        
    worksheet.column_dimensions['A'].width = 35
    worksheet.column_dimensions['B'].width = 120
    
    # 2. Border style for section headers
    thin_border = Side(border_style="thick", color="000000")
    top_bottom_border = Border(top=thin_border, bottom=thin_border)
    section_fill = PatternFill(start_color='E9EEF4', end_color='E9EEF4', fill_type='solid')
    section_font = Font(bold=True, size=12, color="1F497D")

    # 3. Apply formatting
    for row_idx, row in enumerate(worksheet.iter_rows(min_row=2, max_row=worksheet.max_row, min_col=1, max_col=2), start=2):
        col_name = row[0].value
        if col_name and col_name.startswith('▶'):
            # It's a section header row
            worksheet.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=2)
            for cell in row:
                cell.font = section_font
                cell.fill = section_fill
                cell.border = top_bottom_border
                cell.alignment = Alignment(horizontal='center', vertical='center')
        else:
            # Regular data row
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical='center')

print("Success with sections")
