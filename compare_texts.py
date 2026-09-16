import re

with open('docx_content_updated.txt', 'r', encoding='utf-8') as f:
    docx_text = f.read()

with open('src/data/surveyQuestions.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

# Extract all 'ko:' string values from ts
ts_ko_list = re.findall(r"ko:\s*'([^']+)'", ts_text)

print("Differences found:")
for ts_str in ts_ko_list:
    clean_ts_str = ts_str.replace("\\'", "'").replace('①', '').replace('②', '').replace('③', '').replace('④', '').replace('⑤', '').replace('⑥', '').replace('⑦', '').strip()
    
    # Check if a highly similar string exists in docx
    # We just strip out prefixes like '1. ' and check substring
    core_text = re.sub(r'^\d+[-.\d]*\s*', '', clean_ts_str).strip()
    
    if core_text and core_text not in docx_text:
        # Try to find a line in docx that looks similar
        print(f"TS has: {core_text}")
