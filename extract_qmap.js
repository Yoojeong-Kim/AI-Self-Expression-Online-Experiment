const fs = require('fs');
const path = require('path');
require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});

const { allSurveyQuestions } = require('./src/data/surveyQuestions.ts');

const map = {};
allSurveyQuestions.forEach(q => {
  map[q.id] = q.ko;
});

fs.writeFileSync('qmap.json', JSON.stringify(map, null, 2));
