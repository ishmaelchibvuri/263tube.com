const fs = require('fs');
const path = require('path');

// Files to fix and their required imports/types
const fixes = [
  {
    file: 'lambdas/auth/register.ts',
    addImports: ['import { RegisterData } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateRequest(userSchemas.register, body)',
        to: 'validateRequest<RegisterData>(userSchemas.register, body)'
      }
    ]
  },
  {
    file: 'lambdas/auth/profile.ts',
    addImports: ['import { UpdateProfileData } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateRequest(userSchemas.updateProfile, body)',
        to: 'validateRequest<UpdateProfileData>(userSchemas.updateProfile, body)'
      }
    ]
  },
  {
    file: 'lambdas/exams/create-exam.ts',
    addImports: ['import { CreateExamData } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateRequest(examSchemas.create, body)',
        to: 'validateRequest<CreateExamData>(examSchemas.create, body)'
      }
    ]
  },
  {
    file: 'lambdas/exams/list-exams.ts',
    addImports: ['import { ListExamsParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(examSchemas.list, event.queryStringParameters || {})',
        to: 'validateQueryParams<ListExamsParams>(examSchemas.list, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/leaderboard/get-daily.ts',
    addImports: ['import { LeaderboardParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(leaderboardSchemas.getDaily, event.queryStringParameters || {})',
        to: 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getDaily, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/leaderboard/get-weekly.ts',
    addImports: ['import { LeaderboardParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(leaderboardSchemas.getWeekly, event.queryStringParameters || {})',
        to: 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getWeekly, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/leaderboard/get-monthly.ts',
    addImports: ['import { LeaderboardParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(leaderboardSchemas.getMonthly, event.queryStringParameters || {})',
        to: 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getMonthly, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/leaderboard/get-alltime.ts',
    addImports: ['import { LeaderboardParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(leaderboardSchemas.getAllTime, event.queryStringParameters || {})',
        to: 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getAllTime, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/leaderboard/get-user-rank.ts',
    addImports: ['import { LeaderboardParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(leaderboardSchemas.getUserRank, event.queryStringParameters || {})',
        to: 'validateQueryParams<LeaderboardParams>(leaderboardSchemas.getUserRank, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/user/get-history.ts',
    addImports: ['import { UserHistoryParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(userStatsSchemas.getHistory, event.queryStringParameters || {})',
        to: 'validateQueryParams<UserHistoryParams>(userStatsSchemas.getHistory, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/user/update-preferences.ts',
    addImports: ['import { UpdatePreferencesData } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateRequest(userStatsSchemas.updatePreferences, body)',
        to: 'validateRequest<UpdatePreferencesData>(userStatsSchemas.updatePreferences, body)'
      }
    ]
  },
  {
    file: 'lambdas/admin/analytics.ts',
    addImports: ['import { AnalyticsParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(adminSchemas.getAnalytics, event.queryStringParameters || {})',
        to: 'validateQueryParams<AnalyticsParams>(adminSchemas.getAnalytics, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/admin/manage-users.ts',
    addImports: ['import { ManageUsersParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(adminSchemas.manageUsers, event.queryStringParameters || {})',
        to: 'validateQueryParams<ManageUsersParams>(adminSchemas.manageUsers, event.queryStringParameters)'
      }
    ]
  },
  {
    file: 'lambdas/admin/manage-exams.ts',
    addImports: ['import { ManageExamsParams } from "../../lib/types";'],
    replacements: [
      {
        from: 'validateQueryParams(adminSchemas.manageExams, event.queryStringParameters || {})',
        to: 'validateQueryParams<ManageExamsParams>(adminSchemas.manageExams, event.queryStringParameters)'
      }
    ]
  }
];

console.log('Starting type fixes...\n');

fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${fix.file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add imports after the last import statement
  if (fix.addImports && fix.addImports.length > 0) {
    const lastImportMatch = content.match(/import.*from.*;\n/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);

      // Check if imports already exist
      const newImports = fix.addImports.filter(imp => !content.includes(imp));

      if (newImports.length > 0) {
        content = content.slice(0, lastImportIndex + lastImport.length) +
                  newImports.join('\n') + '\n' +
                  content.slice(lastImportIndex + lastImport.length);
        modified = true;
      }
    }
  }

  // Apply replacements
  fix.replacements.forEach(repl => {
    if (content.includes(repl.from)) {
      content = content.replace(new RegExp(repl.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), repl.to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${fix.file}`);
  } else {
    console.log(`⏭️  No changes needed for ${fix.file}`);
  }
});

console.log('\n✨ Type fixes complete!');
