import pandas as pd
import numpy as np
import scipy.stats as stats
import statsmodels.api as sm
import statsmodels.formula.api as smf

excel_path = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구\AI Selfie_Pilot Test Result(260916).xlsx'
report_path = r'C:\Users\COM\Documents\성균관\AXIS\자유 연구\AI Selfie 연구\Data_Analysis_Report.md'

df = pd.read_excel(excel_path)

# 1. Data Cleaning
original_n = len(df)
df = df[df['mc_attention'] == 1].copy()
valid_n = len(df)

# 2. Compute composite scores
df['M1_Control'] = df[['m1_control_1', 'm1_control_2', 'm1_control_3', 'm1_control_4']].mean(axis=1)
df['M2_Self'] = df[['m2_self_1', 'm2_self_2', 'm2_self_3']].mean(axis=1)
df['DV_Advice'] = df[['dv_advice_1', 'dv_advice_2', 'dv_advice_3']].mean(axis=1)
df['DV_Emo'] = df[['dv_emo_1', 'dv_emo_2', 'dv_emo_3', 'dv_emo_4']].mean(axis=1)
df['DV_PSI'] = df[['dv_psi_1', 'dv_psi_2', 'dv_psi_3', 'dv_psi_4', 'dv_psi_5', 'dv_psi_6']].mean(axis=1)
df['DV_Cog'] = df[['dv_cog_1', 'dv_cog_2', 'dv_cog_3', 'dv_cog_4', 'dv_cog_5', 'dv_cog_6']].mean(axis=1)

df['Trait_Lit'] = df[['trait_lit_1', 'trait_lit_2', 'trait_lit_3', 'trait_lit_4']].mean(axis=1)
df['Trait_Lone'] = df[['trait_lone_1', 'trait_lone_2', 'trait_lone_3']].mean(axis=1)
df['Ctrl_Sim'] = df[['ctrl_sim_1', 'ctrl_sim_2']].mean(axis=1)

# Factor variables
# timing: pre=0, mid=1
df['timing_num'] = df['timing'].apply(lambda x: 1 if x == 'mid' else 0)
# image_type: A(Posed)=0, B(Candid)=1
df['image_num'] = df['image_type'].apply(lambda x: 1 if x == 'B' else 0)

with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# AI Selfie 1차 파일럿 데이터 통계 분석 리포트\n\n")
    f.write(f"본 리포트는 총 {original_n}명의 파일럿 데이터를 바탕으로 파이썬(`scipy.stats`, `statsmodels`)을 활용해 분석된 결과입니다.\n")
    f.write(f"주의 확인 문항(mc_attention != 1)을 통과하지 못한 응답자를 제외하여 **최종 {valid_n}명**의 데이터를 분석에 사용했습니다.\n")
    f.write("> **주의사항**: 본 분석은 파일럿 테스트로 표본(N) 수가 매우 작아(셀당 약 {valid_n/4:.1f}명) 통계적 유의성(p-value)이 엄격하게 도출되지 않을 수 있습니다. 따라서 p-value뿐만 아니라 **평균값의 차이(경향성)** 위주로 결과를 해석하는 것이 바람직합니다.\n\n")

    f.write("## 1. 조작 점검 (Manipulation Checks)\n")
    
    f.write("### 1) 노출 시점 조작 점검 (mc_timing)\n")
    cross = pd.crosstab(df['timing'], df['mc_timing'])
    f.write(f"개방 시점(pre vs mid)에 따른 참가자의 인지(mc_timing=1:대화 전, 2:대화 중간) 교차표입니다.\n")
    f.write("```text\n")
    f.write(cross.to_string())
    f.write("\n```\n")
    
    f.write("### 2) 사진 유형 조작 점검 (mc_staged_1, 3 - 연출됨 / mc_staged_2 - 자연스러움)\n")
    posed_staged = df[df['image_type'] == 'A'][['mc_staged_1', 'mc_staged_3']].mean().mean()
    candid_staged = df[df['image_type'] == 'B'][['mc_staged_1', 'mc_staged_3']].mean().mean()
    posed_nat = df[df['image_type'] == 'A']['mc_staged_2'].mean()
    candid_nat = df[df['image_type'] == 'B']['mc_staged_2'].mean()
    
    f.write(f"- **연출됨(Staged) 인지**: Posed(A) 평균 {posed_staged:.2f} vs Candid(B) 평균 {candid_staged:.2f}\n")
    f.write(f"- **자연스러움(Natural) 인지**: Posed(A) 평균 {posed_nat:.2f} vs Candid(B) 평균 {candid_nat:.2f}\n")
    f.write(f"*(분석 해석: Posed 이미지가 더 연출된 것으로, Candid 이미지가 더 자연스러운 것으로 평가되었다면 조작이 성공적입니다.)*\n\n")

    f.write("## 2. 가설 검증 결과\n\n")
    
    # H1
    f.write("### H1: 개방 시점(Timing)의 주효과\n")
    f.write("**가설**: 대화 중간(mid)에 공개할 때 정서적 의존 및 PSI가 더 높을 것이다.\n")
    pre_emo = df[df['timing'] == 'pre']['DV_Emo']
    mid_emo = df[df['timing'] == 'mid']['DV_Emo']
    t1, p1 = stats.ttest_ind(pre_emo, mid_emo, equal_var=False)
    
    pre_psi = df[df['timing'] == 'pre']['DV_PSI']
    mid_psi = df[df['timing'] == 'mid']['DV_PSI']
    t2, p2 = stats.ttest_ind(pre_psi, mid_psi, equal_var=False)
    
    f.write(f"- 정서적 의존(DV_Emo): Pre 평균 = {pre_emo.mean():.2f} / Mid 평균 = {mid_emo.mean():.2f} (t={t1:.2f}, p={p1:.3f})\n")
    f.write(f"- 준사회적 상호작용(DV_PSI): Pre 평균 = {pre_psi.mean():.2f} / Mid 평균 = {mid_psi.mean():.2f} (t={t2:.2f}, p={p2:.3f})\n")
    
    # H1-a
    f.write("\n**H1-a**: 지각된 유사성(Ctrl_Sim)을 통제했을 때, mid 조건에서 효과가 더 뚜렷할 것이다.\n")
    model_h1a = smf.ols('DV_Emo ~ timing_num + Ctrl_Sim', data=df).fit()
    f.write("```text\n")
    f.write(model_h1a.summary().tables[1].as_text())
    f.write("\n```\n")
    f.write("*(해석: timing_num의 계수가 양수(positive)라면 mid 조건이 더 높은 정서적 의존을 보인다는 의미입니다.)*\n\n")

    # H2
    f.write("### H2: 사진 유형(Image Type)의 주효과\n")
    f.write("**가설**: 일상 사진(Candid, B)이 연출된 사진(Posed, A)보다 자기투영(M2)과 조언 이행 의도(DV_Advice)가 더 높을 것이다.\n")
    a_self = df[df['image_type'] == 'A']['M2_Self']
    b_self = df[df['image_type'] == 'B']['M2_Self']
    t3, p3 = stats.ttest_ind(a_self, b_self, equal_var=False)
    
    a_adv = df[df['image_type'] == 'A']['DV_Advice']
    b_adv = df[df['image_type'] == 'B']['DV_Advice']
    t4, p4 = stats.ttest_ind(a_adv, b_adv, equal_var=False)
    
    f.write(f"- 자기일치(M2_Self): Posed(A) 평균 = {a_self.mean():.2f} / Candid(B) 평균 = {b_self.mean():.2f} (t={t3:.2f}, p={p3:.3f})\n")
    f.write(f"- 조언 이행 의도(DV_Advice): Posed 평균 = {a_adv.mean():.2f} / Candid 평균 = {b_adv.mean():.2f} (t={t4:.2f}, p={p4:.3f})\n\n")

    # H3
    f.write("### H3: 상호작용 효과 (Interaction Effect: Timing × Image Type)\n")
    f.write("**가설**: 대화 중간(mid) + 자연스러운 사진(Candid) 조건에서 관계적 상호작용이 가장 극대화될 것이다.\n")
    f.write("Two-way ANOVA (OLS Regression 방식 적용) 결과:\n")
    model_h3 = smf.ols('DV_PSI ~ timing_num * image_num', data=df).fit()
    f.write("```text\n")
    f.write(model_h3.summary().tables[1].as_text())
    f.write("\n```\n")
    
    means = df.groupby(['timing', 'image_type'])['DV_PSI'].mean().unstack()
    f.write("\n**조건별 DV_PSI (준사회적 상호작용) 평균:**\n")
    f.write("```text\n")
    f.write(means.to_string())
    f.write("\n```\n\n")

    # H4
    f.write("### H4: 매개 효과 (Mediation via M1 & M2)\n")
    f.write("지각된 통제감(M1)과 자기투영(M2)이 종속변수(DV_Advice)에 미치는 영향(경향성)을 확인하기 위한 상관관계(Correlation) 및 단순회귀 분석 결과입니다.\n")
    corrs = df[['M1_Control', 'M2_Self', 'DV_Advice', 'DV_Emo', 'DV_PSI']].corr()
    f.write("```text\n")
    f.write(corrs.to_string())
    f.write("\n```\n")
    f.write("*(해석: M1, M2가 DV들과 높은 상관(양수)을 보인다면, 간접효과(매개효과)를 가질 잠재력이 매우 높음을 시사합니다.)*\n\n")

    # H5
    f.write("### H5: 외로움 성향의 조절 효과 (Moderation by Loneliness)\n")
    f.write("**가설**: 외로움이 높을수록 Mid+Candid(조건 1=mid, 1=candid)에서 정서적 의존(DV_Emo)이 극대화된다.\n")
    # Simplify to timing x loneliness to test the moderation concept
    model_h5 = smf.ols('DV_Emo ~ timing_num * Trait_Lone', data=df).fit()
    f.write("```text\n")
    f.write(model_h5.summary().tables[1].as_text())
    f.write("\n```\n")
    f.write("*(해석: `timing_num:Trait_Lone` 상호작용항의 계수가 양수라면, 외로움이 높은 사람이 mid 조건에서 특히 정서적 의존도가 크게 상승함을 의미합니다.)*\n\n")

    # H6
    f.write("### H6: 통제감의 역설 (Paradox of Control)\n")
    f.write("**가설**: Pre+Posed(0,0) 조건이 통제감(M1)은 가장 높으나, 조언 이행이나 정서적 의존(DV)은 낮을 것이다.\n")
    m1_means = df.groupby(['timing', 'image_type'])['M1_Control'].mean().unstack()
    f.write("\n**조건별 M1 (지각된 통제감) 평균:**\n")
    f.write("```text\n")
    f.write(m1_means.to_string())
    f.write("\n```\n")
    f.write("*(해석: pre/A 조건의 통제감 평균이 mid/B 등 다른 조건보다 높은지 확인합니다. 만약 높다면 통제감 자체는 높지만 앞서 H1/H2 결과에서 본 것처럼 DV는 낮아 '역설'이 성립함을 방증합니다.)*\n\n")

    # H7
    f.write("### H7: AI 리터러시의 조절 효과 (Moderation by AI Literacy)\n")
    f.write("**가설**: 리터러시가 낮을수록 Mid 조건에서 인지적 의존(DV_Cog)이 급격히 높아질 것이다.\n")
    model_h7 = smf.ols('DV_Cog ~ timing_num * Trait_Lit', data=df).fit()
    f.write("```text\n")
    f.write(model_h7.summary().tables[1].as_text())
    f.write("\n```\n")
    f.write("*(해석: `timing_num:Trait_Lit` 상호작용항이 음수(-)라면, 리터러시가 낮을수록 Mid 조건에서 인지적 의존도가 높아진다는 가설이 지지됩니다.)*\n")

print("Analysis complete.")
