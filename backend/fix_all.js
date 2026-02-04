const fs = require('fs');
const glob = require('glob');

const fixes = {
  'lambdas/admin/manage-exams.ts': {
    addImport: 'import { ManageExamsParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(adminSchemas\.manageExams, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<ManageExamsParams>(adminSchemas.manageExams, event.queryStringParameters)']
    ]
  },
  'lambdas/exams/list-exams.ts': {
    addImport: 'import { ListExamsParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(examSchemas\.list, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<ListExamsParams>(examSchemas.list, event.queryStringParameters)']
    ]
  },
  'lambdas/leaderboard/get-daily.ts': {
    addImport: 'import { LeaderboardParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(leaderboardSchemas\.getDaily, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getDaily, event.queryStringParameters)']
    ]
  },
  'lambdas/leaderboard/get-weekly.ts': {
    addImport: 'import { LeaderboardParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(leaderboardSchemas\.getWeekly, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getWeekly, event.queryStringParameters)']
    ]
  },
  'lambdas/leaderboard/get-monthly.ts': {
    addImport: 'import { LeaderboardParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(leaderboardSchemas\.getMonthly, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getMonthly, event.queryStringParameters)']
    ]
  },
  'lambdas/leaderboard/get-alltime.ts': {
    addImport: 'import { LeaderboardParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(leaderboardSchemas\.getAllTime, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getAllTime, event.queryStringParameters)']
    ]
  },
  'lambdas/leaderboard/get-user-rank.ts': {
    addImport: 'import { LeaderboardParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(leaderboardSchemas\.getUserRank, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getUserRank, event.queryStringParameters)']
    ]
  },
  'lambdas/user/get-history.ts': {
    addImport: 'import { UserHistoryParams } from "../../lib/types";',
    replace: [
      [/validateQueryParams\(userStatsSchemas\.getHistory, event\.queryStringParameters \|\| \{\}\)/g, 'validateQueryParams<UserHistoryParams>(userStatsSchemas.getHistory, event.queryStringParameters)']
    ]
  },
  'lambdas/user/update-preferences.ts': {
    addImport: 'import { UpdatePreferencesData } from "../../lib/types";',
    replace: [
      [/validateRequest\(userStatsSchemas\.updatePreferences, body\)/g, 'validateRequest<UpdatePreferencesData>(userStatsSchemas.updatePreferences, body)']
    ]
  },
  'lambdas/auth/profile.ts': {
    addImport: 'import { UpdateProfileData } from "../../lib/types";',
    replace: [
      [/validateRequest\(userSchemas\.updateProfile, body\)/g, 'validateRequest<UpdateProfileData>(userSchemas.updateProfile, body)']
    ]
  },
  'lambdas/exams/submit-exam.ts': {
    replace: [
      [/\.sort\(\(a, b\) => a\.questionNumber - b\.questionNumber\) as Question\[\]/g, '.sort((a, b) => a.questionNumber - b.questionNumber) as unknown as Question[]']
    ]
  },
  'lambdas/admin/manage-users.ts': {
    replace: [
      [/limit\: number/g, 'limit?: number'],
      [/return await listUsers\(limit\);/g, 'return await listUsers(limit || 20);']
    ]
  }
};

Object.entries(fixes).forEach(([file, config]) => {
  const filePath = file;
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${file} not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  if (config.addImport && !content.includes(config.addImport)) {
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import .* from/)) {
        lastImportIndex = i;
      }
    }
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, config.addImport);
      content = lines.join('\n');
      modified = true;
    }
  }

  if (config.replace) {
    config.replace.forEach(([pattern, replacement]) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  } else {
    console.log(`⏭️ ${file} already fixed`);
  }
});

console.log('\n✨ All fixes complete!');
