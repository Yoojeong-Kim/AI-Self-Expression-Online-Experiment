import pandas as pd
import glob
import os

folder = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구'
pattern = 'AI Selfie_Pilot Test Result*.xlsx'

files = glob.glob(os.path.join(folder, pattern))
if not files:
    print("File not found")
else:
    excel_path = files[0]
    df = pd.read_excel(excel_path)

    print("Columns:")
    print(df.columns.tolist())
    print("\nUnique values for categorical columns:")
    for col in ['condition', 'image_type', 'timing', 'language', 'gender', 'occupation']:
        if col in df.columns:
            print(f"{col}: {df[col].dropna().unique()}")
