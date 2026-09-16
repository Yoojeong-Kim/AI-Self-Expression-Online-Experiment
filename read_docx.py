import os
import glob
from docx import Document

folder = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구'
pattern = 'AI Selfie_*.docx'
files = glob.glob(os.path.join(folder, pattern))

if files:
    doc = Document(files[0])
    text = []
    for p in doc.paragraphs:
        if p.text.strip():
            text.append(p.text.strip())
    print('\n'.join(text[:50])) # Print first 50 lines to check
else:
    print('No docx file found')
