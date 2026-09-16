import re

with open('docx_content_updated.txt', 'r', encoding='utf-8') as f:
    docx_lines = [line.strip() for line in f if line.strip()]

# Let's print out all docx lines that start with a digit followed by a dot and space (e.g., "1. ")
import codecs
with codecs.open('docx_questions.txt', 'w', encoding='utf-8') as f:
    for line in docx_lines:
        if re.match(r'^\d+\.\s', line):
            f.write(line + '\n')
