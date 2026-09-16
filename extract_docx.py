import os
import glob
from docx import Document

folder = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구'
pattern = '*260916*.docx'
files = glob.glob(os.path.join(folder, pattern))

if files:
    doc = Document(files[0])
    text = []
    for p in doc.paragraphs:
        if p.text.strip():
            text.append(p.text.strip())
    
    with open('docx_content_updated.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(text))
    print("Saved to docx_content_updated.txt")
else:
    print('No docx file found')
