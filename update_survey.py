import re

with open('src/data/surveyQuestions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. 'AI 챗봇' -> '챗봇' 
# But only in the Korean question texts. The safest way is to just replace 'AI 챗봇' with '챗봇' globally for Korean text.
text = text.replace('AI 챗봇', '챗봇')

# 2. m2_self_1
text = text.replace('나 자신을 보는 방식과', '나 자신을 바라보는 방식과')

# 3. IOS
text = text.replace('1. 나와 이 챗봇의 관계 도식 선택', '1. 아래 그림 중 나와 이 챗봇의 관계를 가장 잘 나타내는 것을 선택해 주세요.')

# 4. mc_timing
text = text.replace('5-1. 챗봇의 사진은 언제 처음 보셨나요?', '5-1. 챗봇의 사진은 언제 처음 보셨나요? (단일선택)')

with open('src/data/surveyQuestions.ts', 'w', encoding='utf-8') as f:
    f.write(text)
