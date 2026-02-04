const fs = require('fs');

const fixes = [
  {
    file: 'lambdas/leaderboard/get-daily.ts',
    find: /const validatedParams = validateQueryParams\(\s*leaderboardSchemas\.getDaily,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<LeaderboardParams>(\n      leaderboardSchemas.getDaily,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/leaderboard/get-monthly.ts',
    find: /const validatedParams = validateQueryParams\(\s*leaderboardSchemas\.getMonthly,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<LeaderboardParams>(\n      leaderboardSchemas.getMonthly,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/leaderboard/get-alltime.ts',
    find: /const validatedParams = validateQueryParams\(\s*leaderboardSchemas\.getAllTime,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<LeaderboardParams>(\n      leaderboardSchemas.getAllTime,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/leaderboard/get-user-rank.ts',
    find: /const validatedParams = validateQueryParams\(\s*leaderboardSchemas\.getUserRank,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<LeaderboardParams>(\n      leaderboardSchemas.getUserRank,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/user/get-history.ts',
    find: /const validatedParams = validateQueryParams\(\s*userStatsSchemas\.getHistory,\s*event\.queryStringParameters\s*\);/,
    replace: 'const validatedParams = validateQueryParams<UserHistoryParams>(\n      userStatsSchemas.getHistory,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/exams/list-exams.ts',
    find: /const validatedParams = validateQueryParams\(\s*examSchemas\.list,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<ListExamsParams>(\n      examSchemas.list,\n      event.queryStringParameters\n    );'
  },
  {
    file: 'lambdas/admin/manage-exams.ts',
    find: /const validatedParams = validateQueryParams\(\s*adminSchemas\.manageExams,\s*event\.queryStringParameters \|\| \{\}\s*\);/,
    replace: 'const validatedParams = validateQueryParams<ManageExamsParams>(\n      adminSchemas.manageExams,\n      event.queryStringParameters\n    );'
  }
];

fixes.forEach(fix => {
  if (!fs.existsSync(fix.file)) {
    console.log(`⚠️ ${fix.file} not found`);
    return;
  }

  let content = fs.readFileSync(fix.file, 'utf8');
  
  if (fix.find.test(content)) {
    content = content.replace(fix.find, fix.replace);
    fs.writeFileSync(fix.file, content, 'utf8');
    console.log(`✅ Fixed ${fix.file}`);
  } else {
    console.log(`⏭️ ${fix.file} (already fixed or pattern not found)`);
  }
});

console.log('\n✨ Batch fixes complete!');
