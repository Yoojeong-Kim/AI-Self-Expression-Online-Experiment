import json
import csv
import re
import pandas as pd

excel_path = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구\AI Selfie_code book.xlsx'
df = pd.read_excel(excel_path)
print("Empty descriptions:")
print(df[df['설명 (Question / Description / Levels)'].isna() | (df['설명 (Question / Description / Levels)'] == '')]['변수명 (Column)'].tolist())
