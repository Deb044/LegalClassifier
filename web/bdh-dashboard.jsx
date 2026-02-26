import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";

// ─── DATA ────────────────────────────────────────────────────────────────────
const RECORDS = [{"id":"001-177349","violated":["10"],"predicted":["10"],"neurons":[10771,4930,15887,12226,8368,3218,1415,3767,6011,11187,3914,7034,9759,11919,842,3651,10297,9620,11255,12933,7613,377,92,4646,11662,10319,2189,14381,10765,3200],"acts":[1.876,1.843,1.825,1.799,1.793,1.791,1.791,1.747,1.71,1.701,1.697,1.646,1.645,1.638,1.636,1.621,1.618,1.615,1.614,1.612,1.596,1.592,1.591,1.579,1.564,1.564,1.562,1.561,1.553,1.552],"concepts":{"10":["reinstatement ordered after earlier echr judgment","dismissal of reinstated employee pursuant to new head's authority","non-compliance with echr judgment","committee of ministers supervising judgment execution"]},"sparsity":0.0030517578125},{"id":"001-178082","violated":["5"],"predicted":["6","P1-1"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,9377,8622,5927,10289,12673,12560,4698,6141,13339,5240,1327,1919,13388,1873,14040,9586,14054,3630],"acts":[2.058,1.856,1.796,1.75,1.637,1.565,1.536,1.534,1.532,1.52,1.514,1.504,1.474,1.471,1.462,1.444,1.439,1.437,1.436,1.416,1.403,1.399,1.398,1.396,1.393,1.39,1.39,1.387,1.375,1.356],"concepts":{"5":["covert telephone interception authorisation","broad surveillance order lacking specificity","judicial authorisation of surveillance without sufficient reasoning"]},"sparsity":0.0030517578125},{"id":"001-178485","violated":["6","P1-1"],"predicted":["6","P1-1"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,9377,8622,5927,10289,12673,12560,4698,6141,13339,5240,1327,1919,13388,1873,14040,9586,14054,3630],"acts":[2.16,1.943,1.908,1.836,1.716,1.681,1.681,1.675,1.672,1.67,1.666,1.636,1.613,1.604,1.597,1.584,1.565,1.554,1.548,1.521,1.512,1.505,1.498,1.467,1.455,1.447,1.443,1.443,1.42,1.42],"concepts":{"P1-1":["mandatory time-limit not subject to extension","national holiday effect on limitation period","claim filed out of time"],"6":["mandatory time-limit not subject to extension","national holiday effect on limitation period","claim filed out of time"]},"sparsity":0.0030517578125},{"id":"001-178750","violated":["8"],"predicted":["8"],"neurons":[960,5369,808,8622,9377,14121,14040,9586,9010,10105,12226,382,628,4586,13696,5194,15887,8368,10771,4930,10064,5957,11187,3767,3218,4862,1415,3914,6011,3630],"acts":[1.308,1.145,1.141,1.075,1.074,1.036,1.015,1.015,0.982,0.97,0.964,0.952,0.948,0.935,0.935,0.924,0.92,0.916,0.912,0.905,0.901,0.888,0.887,0.886,0.884,0.88,0.879,0.87,0.869,0.862],"concepts":{"8":["eviction of social housing tenant","right to respect for home","proportionality of eviction order","single mother on social housing waiting list"]},"sparsity":0.0030517578125},{"id":"001-178907","violated":["3"],"predicted":["3"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,4400,6473,5239,13745,372,1459,5507,13596,7041,5557,2369,13743,281,203,10428,12920,13847,5523,13832,2646,7894,15612],"acts":[2.599,2.326,2.321,2.212,2.155,2.087,2.009,2.004,1.999,1.947,1.941,1.94,1.937,1.924,1.881,1.841,1.813,1.78,1.741,1.706,1.699,1.696,1.692,1.694,1.671,1.679,1.667,1.653,1.65,1.644],"concepts":{"3":["dangerous detainee classification","strip search degrading treatment","constant cctv monitoring of prisoner","restricted access to daylight in cell"]},"sparsity":0.0030517578125},{"id":"001-179222","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,14811,5429],"acts":[1.97,1.77,1.74,1.68,1.57,1.51,1.47,1.47,1.47,1.46,1.45,1.45,1.41,1.39,1.38,1.38,1.37,1.36,1.35,1.35,1.34,1.34,1.34,1.34,1.33,1.33,1.32,1.3,1.29,1.29],"concepts":{"6":["denial of legal assistance to witness","interviewing suspect as witness to avoid procedural rights","right to legal assistance from onset of suspicion","repeated questioning without counsel"]},"sparsity":0.0030517578125},{"id":"001-179488","violated":["3"],"predicted":["3"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,6473,4400,5239,13745,1459,372,5507,13596,7041,2369,5557,13743,281,203,10428,12920,13847,5523,13832,7894,2646,15612],"acts":[2.45,2.21,2.18,2.11,2.05,1.97,1.92,1.89,1.88,1.87,1.86,1.85,1.84,1.83,1.82,1.77,1.75,1.72,1.72,1.68,1.67,1.66,1.65,1.63,1.62,1.6,1.59,1.58,1.57,1.56],"concepts":{"3":["inadequate prison conditions for disabled detainee","social isolation of prisoner with disability","overcrowding insufficient personal space","failure to provide special assistance to disabled prisoner"]},"sparsity":0.0030517578125},{"id":"001-179600","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,14811,4725],"acts":[1.88,1.71,1.67,1.64,1.55,1.47,1.43,1.42,1.42,1.41,1.4,1.4,1.37,1.35,1.34,1.33,1.33,1.32,1.31,1.31,1.31,1.3,1.3,1.3,1.3,1.29,1.28,1.26,1.25,1.24],"concepts":{"6":["third-instance final judgment","reasonable time of proceedings"]},"sparsity":0.0030517578125},{"id":"001-179780","violated":["8"],"predicted":["8"],"neurons":[960,5369,808,8622,9377,14121,14040,9586,9010,10105,382,628,4586,13696,5194,12226,10064,15887,8368,10771,4930,5957,4862,11187,3767,3218,1415,3914,6011,3630],"acts":[1.52,1.31,1.28,1.21,1.2,1.17,1.15,1.14,1.13,1.11,1.08,1.07,1.06,1.06,1.05,1.04,1.03,1.03,1.02,1.02,1.01,1.0,0.99,0.99,0.98,0.98,0.97,0.96,0.96,0.95],"concepts":{"8":["covert telephone interception authorisation","broad surveillance order lacking specificity","judicial authorisation of surveillance without sufficient reasoning"]},"sparsity":0.0030517578125},{"id":"001-179900","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,5429],"acts":[2.01,1.81,1.78,1.71,1.6,1.54,1.5,1.5,1.5,1.49,1.48,1.47,1.44,1.43,1.42,1.41,1.4,1.39,1.38,1.37,1.37,1.37,1.36,1.36,1.36,1.36,1.35,1.33,1.32,1.31],"concepts":{"6":["customs confiscation without clear legal basis","customs fine for undeclared silver","proportionality of customs penalty"]},"sparsity":0.0030517578125},{"id":"001-180100","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,5429],"acts":[1.95,1.76,1.73,1.66,1.56,1.5,1.46,1.46,1.46,1.45,1.44,1.43,1.41,1.39,1.38,1.38,1.37,1.36,1.35,1.34,1.34,1.33,1.33,1.33,1.33,1.33,1.32,1.3,1.29,1.28],"concepts":{"6":["waiting period allowance disability benefit","pension rights upon onset of disability","retroactive application of pension legislation"]},"sparsity":0.0030517578125},{"id":"001-180200","violated":["3"],"predicted":["3"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,6473,4400,5239,13745,372,1459,5507,13596,7041,2369,5557,13743,281,203,10428,12920,13847,5523,13832,7894,2646,15612],"acts":[2.3,2.1,2.08,1.99,1.93,1.87,1.82,1.8,1.78,1.77,1.76,1.75,1.74,1.73,1.72,1.68,1.66,1.63,1.62,1.59,1.58,1.57,1.56,1.54,1.53,1.51,1.5,1.49,1.48,1.47],"concepts":{"3":["police ill-treatment with racial slur","Roma victim of police brutality","substitute private prosecution for police abuse","criminal complaint against police officers"]},"sparsity":0.0030517578125},{"id":"001-180380","violated":["P1-1"],"predicted":["6","P1-1"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,9377,8622,5927,10289,12673,12560,4698,6141,13339,5240,1327,1919,13388,1873,14040,9586,14054,3630],"acts":[2.08,1.87,1.84,1.77,1.66,1.63,1.62,1.61,1.61,1.61,1.6,1.58,1.55,1.55,1.54,1.53,1.51,1.5,1.49,1.47,1.46,1.45,1.44,1.42,1.4,1.39,1.39,1.39,1.37,1.37],"concepts":{"P1-1":["supervisory review quashing enforcement judgment","enforcement of civil judgment"]},"sparsity":0.0030517578125},{"id":"001-180420","violated":["3"],"predicted":["3","5"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,6473,4400,5239,13745,1459,372,5507,13596,7041,5557,2369,13743,281,203,10428,12920,13847,5523,13832,7894,2646,15612],"acts":[2.52,2.27,2.24,2.15,2.09,2.01,1.96,1.94,1.92,1.91,1.9,1.89,1.88,1.87,1.86,1.82,1.8,1.76,1.76,1.72,1.71,1.7,1.69,1.67,1.66,1.64,1.63,1.62,1.61,1.6],"concepts":{"3":["police use of force at football match","unidentified police officers at public event","lack of individual identification on police uniforms","truncheon strike causing laceration"]},"sparsity":0.0030517578125},{"id":"001-180544","violated":["3"],"predicted":["5"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,4400,6473,5239,13745,372,1459,5507,13596,7041,5557,2369,13743,281,203,10428,12920,13847,5523,13832,2646,7894,15612],"acts":[2.6,2.479,2.355,2.332,2.213,2.186,2.165,2.086,2.081,2.075,2.062,2.059,2.012,2.003,1.999,1.938,1.922,1.911,1.91,1.87,1.866,1.84,1.811,1.776,1.771,1.724,1.705,1.697,1.691,1.689],"concepts":{"3":["pre-trial detention with bail initially granted then revoked","pressure on witnesses as basis for re-detention","obstruction of justice as ground for pre-trial detention","detention of local official accused of abuse of office"]},"sparsity":0.0030517578125},{"id":"001-180548","violated":["8"],"predicted":["8"],"neurons":[960,5369,808,8622,9377,14121,14040,9586,9010,10105,12226,382,628,4586,13696,5194,15887,8368,10771,4930,10064,5957,3767,11187,3218,4862,1415,3914,6011,3630],"acts":[1.96,1.56,1.52,1.38,1.37,1.35,1.31,1.31,1.28,1.27,1.25,1.24,1.23,1.21,1.21,1.2,1.19,1.19,1.18,1.17,1.16,1.15,1.14,1.14,1.14,1.13,1.13,1.12,1.12,1.11],"concepts":{"8":["eviction of de facto partner from social tenancy","right to respect for home","long-term cohabitation as basis for tenancy rights","eviction without alternative housing for person on housing list"]},"sparsity":0.0030517578125},{"id":"001-180700","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,5429],"acts":[1.99,1.79,1.76,1.69,1.59,1.52,1.49,1.49,1.49,1.48,1.47,1.46,1.43,1.42,1.41,1.4,1.39,1.39,1.38,1.37,1.36,1.36,1.36,1.35,1.35,1.35,1.34,1.32,1.31,1.3],"concepts":{"6":["repeated adjournments at plaintiff's request","reasonable time of proceedings","adjournment due to increased claim amount"]},"sparsity":0.0030517578125},{"id":"001-180850","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,4725],"acts":[1.92,1.73,1.7,1.64,1.54,1.47,1.44,1.44,1.44,1.43,1.42,1.42,1.39,1.37,1.36,1.35,1.35,1.34,1.33,1.32,1.32,1.31,1.31,1.31,1.31,1.3,1.3,1.28,1.27,1.26],"concepts":{"6":["non-enforcement of domestic judgment","out-of-court settlement with government authority"]},"sparsity":0.0030517578125},{"id":"001-181000","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,5429],"acts":[1.96,1.77,1.74,1.67,1.57,1.51,1.47,1.47,1.47,1.46,1.46,1.45,1.42,1.41,1.4,1.39,1.38,1.37,1.36,1.36,1.35,1.35,1.35,1.34,1.34,1.34,1.33,1.31,1.3,1.29],"concepts":{"6":["non-enforcement of Constitutional Court decision","failure to comply with domestic court ruling"]},"sparsity":0.0030517578125},{"id":"001-181100","violated":["2"],"predicted":["3"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,6473,4400,5239,13745,372,1459,5507,13596,7041,5557,2369,13743,281,203,10428,12920,13847,5523,13832,2646,7894,15612],"acts":[2.41,2.19,2.17,2.08,2.01,1.95,1.9,1.88,1.86,1.85,1.84,1.83,1.82,1.82,1.81,1.76,1.74,1.71,1.7,1.67,1.66,1.65,1.64,1.62,1.61,1.59,1.58,1.57,1.56,1.55],"concepts":{"2":["medical negligence in emergency care","delayed diagnosis causing death","failure to perform mandatory autopsy","inadequate investigation into hospital death"]},"sparsity":0.0030517578125},{"id":"001-181176","violated":["8"],"predicted":["6"],"neurons":[960,808,8622,9377,9586,14040,382,628,13696,4586,5194,10064,4370,14296,1309,15851,661,8698,4349,12740,13693,5131,2551,14120,1186,7732,115,12757,4890,12416],"acts":[2.144,1.872,1.765,1.756,1.669,1.658,1.647,1.627,1.605,1.591,1.573,1.561,1.527,1.521,1.514,1.504,1.472,1.457,1.457,1.421,1.416,1.413,1.391,1.38,1.377,1.375,1.363,1.345,1.342,1.336],"concepts":{"8":["excessive environmental noise from nightlife","persistent exceedance of permitted noise levels","municipal failure to enforce noise ordinance"]},"sparsity":0.0030517578125},{"id":"001-181300","violated":["8"],"predicted":["8"],"neurons":[960,5369,808,8622,9377,14121,14040,9586,9010,10105,382,628,4586,13696,5194,12226,10064,15887,8368,10771,4930,5957,4862,3767,11187,3218,1415,3914,6011,3630],"acts":[1.65,1.43,1.39,1.32,1.31,1.27,1.25,1.24,1.22,1.21,1.18,1.17,1.16,1.15,1.15,1.14,1.13,1.12,1.12,1.11,1.1,1.09,1.08,1.08,1.08,1.07,1.07,1.06,1.06,1.05],"concepts":{"8":["frozen embryos seized as evidence in criminal proceedings","inability to retrieve embryos from unauthorised facility","regulatory refusal to approve transfer of embryos","seizure of genetic material in criminal investigation"]},"sparsity":0.0030517578125},{"id":"001-181500","violated":["8"],"predicted":["6"],"neurons":[960,808,8622,9377,9586,14040,382,628,13696,4586,5194,10064,4370,14296,1309,15851,661,8698,4349,12740,13693,5131,2551,14120,1186,7732,115,12757,4890,12416],"acts":[2.0,1.74,1.64,1.63,1.55,1.54,1.53,1.51,1.49,1.47,1.46,1.45,1.41,1.41,1.4,1.39,1.36,1.35,1.35,1.32,1.31,1.31,1.29,1.28,1.28,1.27,1.26,1.25,1.25,1.24],"concepts":{"8":["non-enforcement of international child return order","child abduction Hague Convention return order","Brussels II bis enforcement of custody order","conflicting custody judgments in different states"]},"sparsity":0.0030517578125},{"id":"001-181700","violated":["6"],"predicted":["6"],"neurons":[5369,14121,960,9010,10105,808,5957,4862,12421,14395,1887,12955,5927,10289,12673,12560,4698,6141,1327,13339,5240,1919,13388,1873,14040,9586,14054,3630,12911,5429],"acts":[1.91,1.72,1.69,1.63,1.53,1.46,1.43,1.43,1.43,1.42,1.41,1.41,1.38,1.36,1.35,1.35,1.34,1.33,1.32,1.31,1.31,1.31,1.3,1.3,1.3,1.3,1.29,1.27,1.26,1.25],"concepts":{"6":["reasonable time of proceedings","compensation for excessive length of proceedings","DNA sample taken without authority"]},"sparsity":0.0030517578125},{"id":"001-181900","violated":["10"],"predicted":["10"],"neurons":[10771,4930,15887,12226,8368,3218,1415,3767,6011,11187,3914,7034,9759,11919,842,3651,10297,9620,11255,12933,7613,377,92,4646,11662,10319,2189,14381,10765,3200],"acts":[1.82,1.79,1.77,1.75,1.74,1.74,1.74,1.7,1.66,1.66,1.65,1.6,1.6,1.6,1.59,1.58,1.57,1.57,1.57,1.57,1.55,1.55,1.55,1.54,1.52,1.52,1.52,1.52,1.51,1.51],"concepts":{"10":["defamation of public official through newspaper article","political criticism of local government","satire of public official","court award for defamation against newspaper"]},"sparsity":0.0030517578125},{"id":"001-182000","violated":["8"],"predicted":["8"],"neurons":[960,5369,808,8622,9377,14121,14040,9586,9010,10105,12226,382,628,4586,13696,5194,15887,8368,10771,4930,10064,5957,3767,11187,3218,4862,1415,3914,6011,3630],"acts":[1.59,1.38,1.34,1.27,1.27,1.22,1.2,1.2,1.18,1.17,1.14,1.13,1.13,1.12,1.11,1.11,1.1,1.09,1.09,1.08,1.08,1.07,1.06,1.06,1.05,1.05,1.05,1.04,1.04,1.03],"concepts":{"8":["eviction of social housing tenant","right to respect for home","proportionality of eviction order","no alternative housing for evicted tenant"]},"sparsity":0.0030517578125},{"id":"001-182100","violated":["8"],"predicted":["6"],"neurons":[960,808,8622,9377,9586,14040,382,628,13696,4586,5194,10064,4370,14296,1309,15851,661,8698,4349,12740,13693,5131,2551,14120,1186,7732,115,12757,4890,12416],"acts":[1.95,1.7,1.6,1.59,1.51,1.5,1.49,1.47,1.45,1.44,1.42,1.42,1.38,1.37,1.37,1.36,1.33,1.32,1.32,1.29,1.28,1.28,1.26,1.25,1.25,1.24,1.23,1.22,1.22,1.21],"concepts":{"8":["non-enforcement of international child return order","child's best interests defeating return order","passage of time frustrating enforcement","Slovak courts refusing enforcement of Irish order"]},"sparsity":0.0030517578125},{"id":"001-182173","violated":["34","10"],"predicted":["P1-1"],"neurons":[5369,14121,9010,10105,5957,4862,960,12421,14395,1887,12955,5927,12560,10289,4698,12673,3630,6141,1919,1327,13339,5240,13388,5429,1873,14054,14811,12911,808,4725],"acts":[1.894,1.708,1.597,1.546,1.424,1.411,1.41,1.405,1.395,1.391,1.369,1.357,1.331,1.319,1.318,1.312,1.309,1.303,1.288,1.285,1.285,1.285,1.283,1.279,1.275,1.258,1.257,1.245,1.226,1.198],"concepts":{"10":["bar association refusing admission to applicant who criticised it","monopoly bar association denying membership","right to practise law conditioned on bar association membership","bar association presidium interrogating applicant about criticism before rejecting application"]},"sparsity":0.0030517578125},{"id":"001-182300","violated":["5"],"predicted":["5"],"neurons":[12740,8698,8563,8696,906,1844,13556,1766,6473,4400,5239,13745,372,1459,5507,13596,7041,2369,5557,13743,281,203,10428,12920,13847,5523,13832,7894,2646,15612],"acts":[2.35,2.14,2.12,2.03,1.96,1.9,1.85,1.83,1.81,1.8,1.79,1.78,1.77,1.77,1.76,1.71,1.69,1.66,1.66,1.63,1.62,1.61,1.6,1.58,1.57,1.55,1.54,1.53,1.52,1.51],"concepts":{"5":["psychiatric detention without judicial decision","involuntary psychiatric detention unlawful","lack of judicial review of psychiatric detention lawfulness"]},"sparsity":0.0030517578125},{"id":"001-182500","violated":["5","6"],"predicted":["5","6"],"neurons":[12740,8698,5369,14121,960,9010,8563,8696,10105,808,906,1844,13556,5957,4862,1766,12421,14395,6473,4400,5239,13745,1887,12955,372,1459,5507,13596,5927,7041],"acts":[2.28,2.08,2.01,1.95,1.93,1.85,1.85,1.82,1.78,1.72,1.72,1.68,1.66,1.65,1.64,1.62,1.61,1.61,1.6,1.59,1.59,1.58,1.57,1.57,1.56,1.56,1.55,1.53,1.52,1.51],"concepts":{"5":["ngo head arrested on charges of illegal entrepreneurship and tax evasion","pre-trial detention justified by gravity of charges","foreign ties as flight risk factor in detention order","politically motivated prosecution of civil society leader"]},"sparsity":0.0030517578125}];

const COACTIVATION = {"covert telephone interception authorisation":{"12740":7,"8698":7,"12920":7,"4890":7,"8563":6,"8696":6,"906":6,"1844":6,"13556":6,"4400":6,"13745":6,"6473":6,"1766":6,"5239":6,"1459":6,"372":6,"5507":6,"13596":6,"7041":6,"5557":6},"broad surveillance order lacking specificity":{"12740":7,"8698":7,"12920":7,"4890":7,"8563":6,"8696":6,"906":6,"1844":6,"13556":6,"4400":6,"13745":6,"6473":6,"1766":6,"5239":6,"1459":6,"372":6,"5507":6,"13596":6,"7041":6,"5557":6},"right to respect for home":{"960":5,"5369":4,"808":4,"8622":4,"9377":4,"14121":4,"14040":4,"9586":4,"9010":4,"10105":4,"12226":4,"382":4,"628":4,"4586":4,"13696":4,"5194":4,"15887":4,"8368":4,"10771":4,"4930":4},"pre-trial detention extension based on gravity of charges":{"12740":7,"8698":7,"8563":6,"8696":6,"906":6,"1844":6,"13556":6,"1766":6,"6473":6,"4400":6,"5239":6,"13745":6,"1459":6,"372":6,"5507":6,"13596":6,"7041":6,"5557":6,"2369":6,"13743":6},"reasonable time of proceedings":{"5369":8,"14121":8,"960":8,"9010":8,"10105":8,"808":8,"5957":8,"4862":8,"12421":8,"14395":8,"1887":8,"12955":8,"5927":8,"10289":8,"12673":8,"12560":8,"4698":8,"6141":8,"1327":8,"13339":8},"eviction of social housing tenant":{"960":3,"5369":2,"808":2,"8622":2,"9377":2,"14121":2,"14040":2,"9586":2,"9010":2,"10105":2,"12226":2,"382":2,"628":2,"4586":2,"13696":2,"5194":2,"15887":2,"8368":2,"10771":2,"4930":2},"dangerous detainee classification":{"12740":4,"8698":4,"8563":3,"8696":3,"906":3,"1844":3,"13556":3,"1766":3,"6473":3,"4400":3,"5239":3,"13745":3,"1459":3,"372":3,"5507":3,"13596":3,"7041":3,"5557":3,"2369":3,"13743":3},"proportionality of eviction order":{"960":3,"5369":2,"808":2,"8622":2,"9377":2,"14121":2,"14040":2,"9586":2,"9010":2,"10105":2,"12226":2,"382":2,"628":2,"4586":2,"13696":2,"5194":2,"15887":2,"8368":2,"10771":2,"4930":2},"strip search degrading treatment":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"non-enforcement of domestic judgment":{"5369":5,"14121":5,"960":5,"9010":5,"10105":5,"808":5,"5957":5,"4862":5,"12421":5,"14395":5,"1887":5,"12955":5,"5927":5,"10289":5,"12673":5,"12560":5,"4698":5,"6141":5,"1327":5,"13339":5},"inadequate investigation into police ill-treatment":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"police use of force during arrest":{"12740":4,"8698":4,"8563":3,"8696":3,"906":3,"1844":3,"13556":3,"1766":3,"6473":3,"4400":3,"5239":3,"13745":3,"1459":3,"372":3,"5507":3,"13596":3,"7041":3,"5557":3,"2369":3,"13743":3},"constant cctv monitoring of prisoner":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"judicial authorisation of surveillance without sufficient reasoning":{"12740":6,"8698":6,"12920":6,"4890":6,"8563":5,"8696":5,"906":5,"1844":5,"13556":5,"4400":5,"13745":5,"6473":5,"1766":5,"5239":5,"1459":5,"372":5,"5507":5,"13596":5,"7041":5,"5557":5},"overcrowding insufficient personal space":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"inadequate prison conditions for disabled detainee":{"12740":2,"8698":2,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"social isolation of prisoner with disability":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"police ill-treatment with racial slur":{"12740":2,"8698":2,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"Roma victim of police brutality":{"12740":2,"8698":2,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"forensic medical evidence of police ill-treatment":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"right to examine witnesses":{"5369":3,"14121":3,"960":3,"9010":3,"10105":3,"808":3,"5957":3,"4862":3,"12421":3,"14395":3,"1887":3,"12955":3,"5927":3,"10289":3,"12673":3,"12560":3,"4698":3,"6141":3,"1327":3,"13339":3},"inadequate medical care for seriously ill prisoner":{"12740":3,"8698":3,"8563":2,"8696":2,"906":2,"1844":2,"13556":2,"1766":2,"6473":2,"4400":2,"5239":2,"13745":2,"1459":2,"372":2,"5507":2,"13596":2,"7041":2,"5557":2,"2369":2,"13743":2},"non-enforcement of international child return order":{"960":3,"808":3,"8622":3,"9377":3,"9586":3,"14040":3,"382":3,"628":3,"13696":3,"4586":3,"5194":3,"10064":3,"4370":3,"14296":3,"1309":3,"15851":3,"661":3,"8698":3,"4349":3,"12740":3},"denial of legal assistance to witness":{"5369":2,"14121":2,"960":2,"9010":2,"10105":2,"808":2,"5957":2,"4862":2,"12421":2,"14395":2,"1887":2,"12955":2,"5927":2,"10289":2,"12673":2,"12560":2,"4698":2,"6141":2,"1327":2,"13339":2},"repeated adjournments at plaintiff's request":{"5369":3,"14121":3,"960":3,"9010":3,"10105":3,"808":3,"5957":3,"4862":3,"12421":3,"14395":3,"1887":3,"12955":3,"5927":3,"10289":3,"12673":3,"12560":3,"4698":3,"6141":3,"1327":3,"13339":3},"mandatory time-limit not subject to extension":{"5369":2,"14121":2,"960":2,"9010":2,"10105":2,"808":2,"5957":2,"4862":2,"12421":2,"14395":2,"1887":2,"12955":2,"9377":2,"8622":2,"5927":2,"10289":2,"12673":2,"12560":2,"4698":2,"6141":2}};

const CONCEPT_OCCURRENCE = {"reasonable time of proceedings":10,"covert telephone interception authorisation":9,"pre-trial detention extension based on gravity of charges":8,"broad surveillance order lacking specificity":8,"right to respect for home":7,"eviction of social housing tenant":6,"judicial authorisation of surveillance without sufficient reasoning":6,"non-enforcement of domestic judgment":6,"dangerous detainee classification":5,"proportionality of eviction order":5,"police use of force during arrest":5,"repeated adjournments at plaintiff's request":5,"inadequate prison conditions for disabled detainee":4,"social isolation of prisoner with disability":4,"overcrowding insufficient personal space":4,"strip search degrading treatment":4,"constant cctv monitoring of prisoner":4,"restricted access to daylight in cell":4,"denial of legal assistance to witness":4,"right to legal assistance from onset of suspicion":4,"non-enforcement of international child return order":4,"right to examine witnesses":4,"forensic medical evidence of police ill-treatment":4,"inadequate investigation into police ill-treatment":4,"inadequate medical care for seriously ill prisoner":4,"mandatory time-limit not subject to extension":3,"national holiday effect on limitation period":3,"claim filed out of time":3,"police ill-treatment with racial slur":3,"Roma victim of police brutality":3,"appellate hearing in absence of defendant":3,"forgery in office conviction":3,"customs confiscation without clear legal basis":3,"proportionality of customs penalty":3,"reasonable time of civil proceedings":3,"non-enforcement of Constitutional Court decision":3,"compensation for excessive length of proceedings":3,"mandatory handcuffing outside cell":3,"police use of force at football match":3,"unidentified police officers at public event":3,"lack of individual identification on police uniforms":3,"pre-trial detention with bail initially granted then revoked":3,"eviction of de facto partner from social tenancy":3,"lengthy criminal investigation":3,"failure to investigate misconduct of police officer":3,"death in police custody":3,"defamation of public official through newspaper article":3,"politically motivated prosecution":3,"medical negligence in emergency care":3,"delayed diagnosis causing death":3,"psychiatric detention without judicial decision":3};

const ARTICLE_COLORS = {
  "2": "#ef4444", "3": "#f97316", "5": "#eab308",
  "6": "#22c55e", "8": "#3b82f6", "10": "#a855f7",
  "P1-1": "#ec4899", "13": "#6b7280", "34": "#14b8a6"
};

const ARTICLE_NAMES = {
  "2": "Right to Life", "3": "Prohibition of Torture",
  "5": "Right to Liberty", "6": "Right to Fair Trial",
  "8": "Right to Private Life", "10": "Freedom of Expression",
  "P1-1": "Protection of Property", "34": "Right of Individual Petition"
};

const TOTAL_NEURONS = 16384;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// Animated number
function AnimNum({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <span>{typeof value === "number" && value < 1 ? display.toFixed(4) : Math.round(display)}{suffix}</span>;
}

// Sparsity ring
function SparsityRing({ sparsity, size = 120 }) {
  const activeRatio = sparsity;
  const circumference = 2 * Math.PI * 46;
  const activeStroke = circumference * activeRatio * 100;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#f59e0b"
        strokeWidth="6" strokeDasharray={`${activeStroke} ${circumference}`}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x="50" y="46" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="700">
        {(sparsity * 100).toFixed(2)}%
      </text>
      <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="8">active</text>
    </svg>
  );
}

// Neuron activation bar chart
function NeuronBarChart({ neurons, acts, highlightNeurons = new Set() }) {
  const maxAct = Math.max(...acts);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 120, padding: "0 4px" }}>
      {neurons.map((nid, i) => {
        const h = (acts[i] / maxAct) * 100;
        const isHighlighted = highlightNeurons.size === 0 || highlightNeurons.has(nid);
        return (
          <div key={i} title={`Neuron ${nid}: ${acts[i].toFixed(3)}`}
            style={{
              flex: 1, minWidth: 3, maxWidth: 14, height: `${h}%`,
              background: isHighlighted
                ? `linear-gradient(to top, #f59e0b, #ef4444)`
                : "#334155",
              borderRadius: "2px 2px 0 0",
              opacity: isHighlighted ? 1 : 0.3,
              transition: "all 0.3s ease"
            }} />
        );
      })}
    </div>
  );
}

// Neuron grid - shows sparsity visually across 16384 neurons
function NeuronGrid({ activeNeurons, size = 128 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dim = size;
    canvas.width = dim * 2;
    canvas.height = dim * 2;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, dim * 2, dim * 2);
    const cellsPerRow = 128;
    const cellSize = (dim * 2) / cellsPerRow;
    const activeSet = new Set(activeNeurons);
    for (let i = 0; i < TOTAL_NEURONS; i++) {
      const row = Math.floor(i / cellsPerRow);
      const col = i % cellsPerRow;
      if (activeSet.has(i)) {
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.1;
    for (let i = 0; i <= cellsPerRow; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, dim * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(dim * 2, i * cellSize);
      ctx.stroke();
    }
  }, [activeNeurons, size]);
  return <canvas ref={canvasRef} style={{ width: size, height: size, borderRadius: 8 }} />;
}

// Concept co-activation heatmap
function CoactivationHeatmap({ selectedConcepts }) {
  const concepts = selectedConcepts.length > 0 ? selectedConcepts : Object.keys(COACTIVATION).slice(0, 12);
  const allNeurons = new Set();
  concepts.forEach(c => {
    if (COACTIVATION[c]) Object.keys(COACTIVATION[c]).forEach(n => allNeurons.add(n));
  });
  const neuronList = [...allNeurons].slice(0, 25);
  const maxVal = Math.max(...concepts.flatMap(c =>
    neuronList.map(n => (COACTIVATION[c] && COACTIVATION[c][n]) || 0)
  ), 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${neuronList.length}, 32px)`, gap: 2, fontSize: 10 }}>
        <div style={{ color: "#64748b", padding: 4 }}>Concept \ Neuron</div>
        {neuronList.map(n => (
          <div key={n} style={{ color: "#64748b", textAlign: "center", padding: 2, transform: "rotate(-45deg)", transformOrigin: "center", whiteSpace: "nowrap", fontSize: 9 }}>
            {n}
          </div>
        ))}
        {concepts.map(concept => (
          <>
            <div key={concept} style={{ color: "#e2e8f0", padding: "4px 4px 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={concept}>
              {concept}
            </div>
            {neuronList.map(neuron => {
              const val = (COACTIVATION[concept] && COACTIVATION[concept][neuron]) || 0;
              const intensity = val / maxVal;
              return (
                <div key={`${concept}-${neuron}`}
                  title={`${concept} × N${neuron}: ${val}`}
                  style={{
                    width: 28, height: 28, borderRadius: 4,
                    background: val > 0
                      ? `rgba(245, 158, 11, ${0.15 + intensity * 0.85})`
                      : "#1e293b",
                    border: val > 5 ? "1px solid #f59e0b" : "1px solid transparent",
                    transition: "all 0.2s"
                  }} />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// Concept occurrence bubble chart
function ConceptBubbles({ onSelect }) {
  const data = Object.entries(CONCEPT_OCCURRENCE).slice(0, 40).map(([name, count]) => ({ name, count }));
  const maxCount = Math.max(...data.map(d => d.count));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8 }}>
      {data.map(d => {
        const scale = 0.5 + (d.count / maxCount) * 0.5;
        return (
          <button key={d.name} onClick={() => onSelect(d.name)}
            style={{
              background: "none", border: `1px solid rgba(245,158,11,${scale})`,
              borderRadius: 20, padding: "4px 10px",
              color: `rgba(245,158,11,${0.4 + scale * 0.6})`,
              fontSize: 10 + d.count, cursor: "pointer",
              transform: `scale(${scale})`, transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}>
            {d.name} <span style={{ opacity: 0.6 }}>({d.count})</span>
          </button>
        );
      })}
    </div>
  );
}

// Architecture diagram
function ArchitectureDiagram({ activeLayer }) {
  const layers = [
    { label: "Input Tokens", sub: "BERT tokenizer · 512 tokens/chunk", color: "#64748b" },
    { label: "Embedding", sub: "30,522 vocab → 256-dim", color: "#6366f1" },
    { label: "BDH Block ×6", sub: "Shared weights · RoPE · Bidirectional", color: "#f59e0b", isMain: true },
    { label: "ReLU Sparse Layer", sub: "4,096 neurons · ~0.3% active", color: "#ef4444", isMain: true },
    { label: "Hebbian Product", sub: "x_sparse × y_sparse", color: "#22c55e", isMain: true },
    { label: "Chunk Pool → Doc Pool", sub: "Mean pool tokens → Mean pool chunks", color: "#3b82f6" },
    { label: "Classification Head", sub: "256 → 7 ECHR Articles", color: "#a855f7" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 0" }}>
      {layers.map((layer, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: layer.color, boxShadow: layer.isMain ? `0 0 12px ${layer.color}55` : "none",
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                flex: 1, background: `linear-gradient(90deg, ${layer.color}22, transparent)`,
                borderLeft: `3px solid ${layer.color}`,
                padding: "8px 12px", borderRadius: "0 6px 6px 0",
                opacity: activeLayer === i || activeLayer === -1 ? 1 : 0.4,
                transition: "opacity 0.3s"
              }}>
                <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{layer.label}</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>{layer.sub}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* connection lines */}
      <div style={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2, background: "#334155", zIndex: -1 }} />
    </div>
  );
}

// Force-directed concept-neuron network
function ConceptNeuronNetwork({ record }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current || !record) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = 500, height = 340;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const concepts = Object.values(record.concepts).flat();
    const neurons = record.neurons.slice(0, 15);
    const nodes = [
      ...concepts.map((c, i) => ({ id: `c-${i}`, label: c, type: "concept", index: i })),
      ...neurons.map((n, i) => ({ id: `n-${n}`, label: `N${n}`, type: "neuron", act: record.acts[i] }))
    ];
    const links = [];
    concepts.forEach((_, ci) => {
      neurons.forEach((n) => {
        if (Math.random() > 0.5) links.push({ source: `c-${ci}`, target: `n-${n}`, strength: 0.3 + Math.random() * 0.7 });
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    const link = svg.append("g").selectAll("line")
      .data(links).join("line")
      .attr("stroke", d => `rgba(245,158,11,${d.strength * 0.5})`)
      .attr("stroke-width", d => d.strength * 2);

    const node = svg.append("g").selectAll("g")
      .data(nodes).join("g");

    node.append("circle")
      .attr("r", d => d.type === "concept" ? 8 : 5 + (d.act || 1) * 2)
      .attr("fill", d => d.type === "concept" ? "#a855f7" : "#f59e0b")
      .attr("stroke", d => d.type === "concept" ? "#a855f7" : "#f59e0b")
      .attr("stroke-width", 1)
      .attr("fill-opacity", d => d.type === "concept" ? 0.8 : 0.6);

    node.append("text")
      .text(d => d.type === "neuron" ? d.label : (d.label.length > 20 ? d.label.slice(0, 18) + "…" : d.label))
      .attr("fill", "#e2e8f0").attr("font-size", d => d.type === "concept" ? 9 : 8)
      .attr("dx", 12).attr("dy", 4);

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [record]);

  return <svg ref={svgRef} style={{ width: "100%", height: 340 }} />;
}

// Neuron activation distribution histogram
function ActivationHistogram({ acts }) {
  const bins = useMemo(() => {
    const min = Math.min(...acts);
    const max = Math.max(...acts);
    const numBins = 20;
    const binWidth = (max - min) / numBins;
    const result = Array(numBins).fill(0);
    acts.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / binWidth), numBins - 1);
      result[idx]++;
    });
    return result.map((count, i) => ({ range: (min + i * binWidth).toFixed(2), count }));
  }, [acts]);
  const maxCount = Math.max(...bins.map(b => b.count));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, padding: "0 4px" }}>
      {bins.map((b, i) => (
        <div key={i} title={`${b.range}: ${b.count} neurons`}
          style={{
            flex: 1, height: `${(b.count / maxCount) * 100}%`,
            background: `linear-gradient(to top, #3b82f6, #6366f1)`,
            borderRadius: "2px 2px 0 0", minHeight: b.count > 0 ? 2 : 0
          }} />
      ))}
    </div>
  );
}

// Article badge
function ArticleBadge({ art, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${ARTICLE_COLORS[art] || "#6b7280"}22`,
      border: `1px solid ${ARTICLE_COLORS[art] || "#6b7280"}55`,
      color: ARTICLE_COLORS[art] || "#6b7280",
      borderRadius: 12, padding: small ? "2px 8px" : "4px 12px",
      fontSize: small ? 10 : 12, fontWeight: 600, whiteSpace: "nowrap"
    }}>
      Art. {art}
      {!small && ARTICLE_NAMES[art] && <span style={{ fontWeight: 400, opacity: 0.7 }}>— {ARTICLE_NAMES[art]}</span>}
    </span>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function BDHDashboard() {
  const [selectedCase, setSelectedCase] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [archLayer, setArchLayer] = useState(-1);
  const [inputText, setInputText] = useState("");
  const [simulatedResult, setSimulatedResult] = useState(null);

  const record = RECORDS[selectedCase];
  const highlightedNeurons = useMemo(() => {
    if (selectedConcepts.length === 0) return new Set();
    const s = new Set();
    selectedConcepts.forEach(c => {
      if (COACTIVATION[c]) Object.keys(COACTIVATION[c]).forEach(n => s.add(parseInt(n)));
    });
    return s;
  }, [selectedConcepts]);

  const handleSimulate = () => {
    if (!inputText.trim()) return;
    // Simulate: pick a random record based on keywords
    const lowerText = inputText.toLowerCase();
    let match = RECORDS[0];
    if (lowerText.includes("torture") || lowerText.includes("prison") || lowerText.includes("detain"))
      match = RECORDS.find(r => r.violated.includes("3")) || RECORDS[4];
    else if (lowerText.includes("fair trial") || lowerText.includes("court") || lowerText.includes("proceeding"))
      match = RECORDS.find(r => r.violated.includes("6")) || RECORDS[5];
    else if (lowerText.includes("privacy") || lowerText.includes("home") || lowerText.includes("surveillance"))
      match = RECORDS.find(r => r.violated.includes("8")) || RECORDS[3];
    else if (lowerText.includes("expression") || lowerText.includes("speech") || lowerText.includes("press"))
      match = RECORDS.find(r => r.violated.includes("10")) || RECORDS[0];
    else if (lowerText.includes("liberty") || lowerText.includes("arrest") || lowerText.includes("detention"))
      match = RECORDS.find(r => r.violated.includes("5")) || RECORDS[1];
    else if (lowerText.includes("property") || lowerText.includes("confiscat"))
      match = RECORDS.find(r => r.predicted.includes("P1-1")) || RECORDS[2];
    setSimulatedResult(match);
  };

  const tabs = [
    { id: "overview", label: "Architecture" },
    { id: "analyze", label: "Analyze Case" },
    { id: "sparsity", label: "Sparsity Views" },
    { id: "concepts", label: "Concept Map" },
    { id: "heatmap", label: "Co-activation" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#030712",
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      color: "#e2e8f0"
    }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        borderBottom: "1px solid #1e293b", padding: "20px 24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 18, color: "#030712"
          }}>B</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #f59e0b, #ef4444, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              BDH Interpretability Explorer
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b", letterSpacing: "1px" }}>
              ECHR VIOLATION CLASSIFIER · SPARSE NEURON ANALYSIS · 16,384 NEURONS · 7 ARTICLES
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["2","3","5","6","8","10","P1-1"].map(art => (
              <div key={art} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: ARTICLE_COLORS[art],
                boxShadow: `0 0 6px ${ARTICLE_COLORS[art]}88`
              }} title={`Art. ${art}: ${ARTICLE_NAMES[art]}`} />
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", gap: 0, padding: "0 24px",
        background: "#0f172a", borderBottom: "1px solid #1e293b"
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 20px", fontSize: 12, fontWeight: 600,
              fontFamily: "inherit",
              color: activeTab === tab.id ? "#f59e0b" : "#64748b",
              borderBottom: activeTab === tab.id ? "2px solid #f59e0b" : "2px solid transparent",
              transition: "all 0.2s"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#f59e0b" }}>BDH Architecture Flow</h3>
              <div style={{ position: "relative" }}>
                <ArchitectureDiagram activeLayer={archLayer} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={() => setArchLayer(-1)} style={{ background: archLayer === -1 ? "#f59e0b22" : "none", border: "1px solid #334155", borderRadius: 8, padding: "4px 10px", color: "#e2e8f0", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>All</button>
                {["Input", "Embed", "BDH×6", "ReLU", "Hebbian", "Pool", "Head"].map((l, i) => (
                  <button key={i} onClick={() => setArchLayer(i)} style={{ background: archLayer === i ? "#f59e0b22" : "none", border: "1px solid #334155", borderRadius: 8, padding: "4px 10px", color: "#e2e8f0", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20,
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16
              }}>
                {[
                  { label: "Total Neurons", value: 16384, color: "#3b82f6" },
                  { label: "Active (~0.3%)", value: 50, color: "#f59e0b" },
                  { label: "Concepts Mapped", value: Object.keys(CONCEPT_OCCURRENCE).length, color: "#a855f7" },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}><AnimNum value={stat.value} /></div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, flex: 1 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#f59e0b" }}>Key Insight: Native Interpretability</h3>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                  Unlike transformer MLP layers where neuron activations are dense and entangled,
                  BDH's ReLU sparse layer produces <span style={{ color: "#f59e0b", fontWeight: 700 }}>~99.7% zero activations</span>.
                  The ~50 active neurons per input form interpretable <span style={{ color: "#a855f7" }}>concept clusters</span> that
                  map directly to legal reasoning patterns — no post-hoc probing needed.
                </p>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Shared Weight Layers</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>6</div>
                  </div>
                  <div style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Hidden Dim (D)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>256</div>
                  </div>
                  <div style={{ flex: 1, background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Params</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#ec4899" }}>20.5M</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ANALYZE CASE TAB ─── */}
        {activeTab === "analyze" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Input area */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#f59e0b" }}>Input Court Case Text</h3>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste a court case description here... e.g. 'The applicant was detained without judicial review for 3 months. The police searched his home without a warrant and intercepted his phone communications without proper authorisation...'"
                style={{
                  width: "100%", minHeight: 120, background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 8, padding: 12, color: "#e2e8f0", fontSize: 12, resize: "vertical",
                  fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box"
                }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button onClick={handleSimulate} style={{
                  background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                  border: "none", borderRadius: 8, padding: "10px 24px",
                  color: "#030712", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit"
                }}>
                  ▶ Analyze with BDH
                </button>
                <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>
                  Simulated inference · Matches case patterns to demonstrate visualization
                </span>
              </div>
            </div>

            {/* Results */}
            {simulatedResult && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#ef4444" }}>Predicted Violations</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {simulatedResult.predicted.map(art => <ArticleBadge key={art} art={art} />)}
                  </div>
                  <h4 style={{ margin: "16px 0 8px", fontSize: 12, color: "#64748b" }}>Extracted Concepts</h4>
                  {Object.entries(simulatedResult.concepts).map(([art, concepts]) => (
                    <div key={art} style={{ marginBottom: 12 }}>
                      <ArticleBadge art={art} small />
                      <div style={{ marginTop: 6 }}>
                        {concepts.map((c, i) => (
                          <div key={i} style={{
                            fontSize: 11, color: "#94a3b8", padding: "3px 0",
                            borderLeft: `2px solid ${ARTICLE_COLORS[art]}44`, paddingLeft: 8, marginBottom: 2
                          }}>{c}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#f59e0b" }}>Neuron Activation Profile</h3>
                  <NeuronBarChart neurons={simulatedResult.neurons} acts={simulatedResult.acts} />
                  <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "center" }}>
                    <SparsityRing sparsity={simulatedResult.sparsity} size={90} />
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>{simulatedResult.neurons.length}</span> neurons active
                        out of <span style={{ color: "#3b82f6" }}>16,384</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        Peak activation: <span style={{ color: "#ef4444", fontWeight: 700 }}>{simulatedResult.acts[0].toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pre-loaded case selector */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#3b82f6" }}>Browse Example Cases</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {RECORDS.slice(0, 15).map((r, i) => {
                  const correct = JSON.stringify(r.violated.sort()) === JSON.stringify(r.predicted.sort());
                  return (
                    <button key={i} onClick={() => { setSelectedCase(i); setSimulatedResult(r); }}
                      style={{
                        background: selectedCase === i ? "#1e293b" : "transparent",
                        border: `1px solid ${correct ? "#22c55e44" : "#ef444444"}`,
                        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                        color: "#e2e8f0", fontSize: 11, fontFamily: "inherit"
                      }}>
                      <span style={{ color: "#64748b" }}>{r.id.slice(-6)}</span>
                      {" "}{r.violated.map(a => `Art.${a}`).join("+")}
                      {correct ? <span style={{ color: "#22c55e", marginLeft: 4 }}>✓</span>
                        : <span style={{ color: "#ef4444", marginLeft: 4 }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── SPARSITY VIEWS TAB ─── */}
        {activeTab === "sparsity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {/* Sparsity Ring */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#f59e0b" }}>Sparsity Gauge</h3>
                <SparsityRing sparsity={record.sparsity} size={160} />
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                  {record.neurons.length} of 16,384 neurons fire<br/>
                  99.7% remain at zero
                </p>
              </div>

              {/* Grid View */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#f59e0b" }}>Neuron Grid (128×128)</h3>
                <NeuronGrid activeNeurons={record.neurons} size={200} />
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                  Each pixel = 1 neuron · Amber = active
                </p>
              </div>

              {/* Distribution */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#f59e0b" }}>Activation Distribution</h3>
                <ActivationHistogram acts={record.acts} />
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Range: <span style={{ color: "#3b82f6" }}>{Math.min(...record.acts).toFixed(3)}</span> — <span style={{ color: "#ef4444" }}>{Math.max(...record.acts).toFixed(3)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    Mean: <span style={{ color: "#f59e0b" }}>{(record.acts.reduce((a, b) => a + b, 0) / record.acts.length).toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: "#f59e0b" }}>Top-30 Neuron Activations — Case {record.id}</h3>
                <div style={{ display: "flex", gap: 4 }}>
                  {record.violated.map(a => <ArticleBadge key={a} art={a} small />)}
                  <span style={{ fontSize: 10, color: "#64748b", alignSelf: "center", marginLeft: 8 }}>→</span>
                  {record.predicted.map(a => <ArticleBadge key={a} art={a} small />)}
                </div>
              </div>
              <NeuronBarChart neurons={record.neurons} acts={record.acts} highlightNeurons={highlightedNeurons} />
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {record.neurons.map((n, i) => (
                  <span key={n} style={{
                    fontSize: 9, color: highlightedNeurons.size === 0 || highlightedNeurons.has(n) ? "#f59e0b" : "#334155",
                    background: "#1e293b", padding: "2px 4px", borderRadius: 3
                  }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Cross-case comparison */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#3b82f6" }}>Cross-Case Sparsity Comparison</h3>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
                {RECORDS.slice(0, 30).map((r, i) => (
                  <div key={i} onClick={() => setSelectedCase(i)}
                    title={`${r.id}: ${r.violated.map(a => `Art.${a}`).join("+")}`}
                    style={{
                      flex: 1, height: `${(r.acts[0] / 2.6) * 100}%`,
                      background: i === selectedCase
                        ? "linear-gradient(to top, #f59e0b, #ef4444)"
                        : ARTICLE_COLORS[r.violated[0]] || "#334155",
                      borderRadius: "2px 2px 0 0", cursor: "pointer",
                      opacity: i === selectedCase ? 1 : 0.5,
                      transition: "all 0.2s"
                    }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>
                Click any bar to explore that case. Color = primary violated article.
              </div>
            </div>

            {/* Case selector */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RECORDS.slice(0, 15).map((r, i) => (
                <button key={i} onClick={() => setSelectedCase(i)}
                  style={{
                    background: selectedCase === i ? "#f59e0b22" : "#0f172a",
                    border: `1px solid ${selectedCase === i ? "#f59e0b" : "#1e293b"}`,
                    borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                    color: "#e2e8f0", fontSize: 10, fontFamily: "inherit"
                  }}>
                  {r.id.slice(-6)} · Art.{r.violated.join("+")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── CONCEPT MAP TAB ─── */}
        {activeTab === "concepts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#a855f7" }}>Concept → Neuron Network</h3>
              <ConceptNeuronNetwork record={record} />
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                <span style={{ color: "#a855f7" }}>●</span> Concepts
                <span style={{ color: "#f59e0b", marginLeft: 16 }}>●</span> Neurons (size = activation strength)
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#f59e0b" }}>Current Case Concepts</h3>
                {Object.entries(record.concepts).map(([art, concepts]) => (
                  <div key={art} style={{ marginBottom: 12 }}>
                    <ArticleBadge art={art} small />
                    {concepts.map((c, i) => (
                      <div key={i}
                        onClick={() => setSelectedConcepts(prev =>
                          prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                        )}
                        style={{
                          fontSize: 11, color: selectedConcepts.includes(c) ? "#f59e0b" : "#94a3b8",
                          padding: "4px 0 4px 12px", cursor: "pointer",
                          borderLeft: `2px solid ${selectedConcepts.includes(c) ? "#f59e0b" : ARTICLE_COLORS[art]}44`,
                          transition: "all 0.2s"
                        }}>
                        {c}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, flex: 1 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#22c55e" }}>Concept Frequency Cloud</h3>
                <ConceptBubbles onSelect={c =>
                  setSelectedConcepts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
                } />
              </div>
            </div>
          </div>
        )}

        {/* ─── HEATMAP TAB ─── */}
        {activeTab === "heatmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: "#f59e0b" }}>Neuron × Concept Co-activation Heatmap</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedConcepts.length > 0 && (
                    <button onClick={() => setSelectedConcepts([])} style={{
                      background: "none", border: "1px solid #334155", borderRadius: 8,
                      padding: "4px 10px", color: "#64748b", fontSize: 10, cursor: "pointer",
                      fontFamily: "inherit"
                    }}>Clear selection</button>
                  )}
                </div>
              </div>
              <CoactivationHeatmap selectedConcepts={selectedConcepts} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
                <div style={{ width: 80, height: 8, borderRadius: 4, background: "linear-gradient(90deg, #1e293b, rgba(245,158,11,0.3), #f59e0b)" }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>Low → High co-activation count</span>
              </div>
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#a855f7" }}>Select Concepts to Explore</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(COACTIVATION).map(concept => (
                  <button key={concept}
                    onClick={() => setSelectedConcepts(prev =>
                      prev.includes(concept) ? prev.filter(c => c !== concept) : [...prev, concept]
                    )}
                    style={{
                      background: selectedConcepts.includes(concept) ? "#f59e0b22" : "transparent",
                      border: `1px solid ${selectedConcepts.includes(concept) ? "#f59e0b" : "#334155"}`,
                      borderRadius: 16, padding: "4px 12px", cursor: "pointer",
                      color: selectedConcepts.includes(concept) ? "#f59e0b" : "#94a3b8",
                      fontSize: 10, fontFamily: "inherit", transition: "all 0.2s"
                    }}>
                    {concept}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b", textAlign: "center" }}>
        <span style={{ fontSize: 10, color: "#475569" }}>
          BDH Architecture · ECHR Violation Classifier · Kriti 2026 · Track A: Activation Atlas & Interpretability
        </span>
      </div>
    </div>
  );
}
