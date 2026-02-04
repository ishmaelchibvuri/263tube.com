const fs = require('fs');
const path = require('path');

const fileFixes = {
  'lambdas/admin/analytics.ts': {
    importType: 'AnalyticsParams',
    findValidation: /validateQueryParams<AnalyticsParams>\(/,
    addImport: true
  },
  'lambdas/admin/manage-exams.ts': {
    importType: 'ManageExamsParams',
    findValidation: /validateQueryParams<ManageExamsParams>\(/,
    addImport: true
  },
  'lambdas/admin/manage-users.ts': {
    importType: 'ManageUsersParams',
    findValidation: /validateQueryParams<ManageUsersParams>\(/,
    addImport: true
  },
  'lambdas/exams/create-exam.ts': {
    importType: 'CreateExamData',
    findValidation: /validateRequest<CreateExamData>\(/,
    addImport: true
  },
  'lambdas/exams/list-exams.ts': {
    importType: 'ListExamsParams',
    findValidation: /validateQueryParams<ListExamsParams>\(/,
    addImport: true
  },
  'lambdas/leaderboard/get-daily.ts': {
    importType: 'LeaderboardParams',
    findValidation: /validateQueryParams<LeaderboardParams>\(/,
    addImport: true
  },
  'lambdas/leaderboard/get-weekly.ts': {
    importType: 'LeaderboardParams',
    findValidation: /validateQueryParams<LeaderboardParams>\(/,
    addImport: true
  },
  'lambdas/leaderboard/get-monthly.ts': {
    importType: 'LeaderboardParams',
    findValidation: /validateQueryParams<LeaderboardParams>\(/,
    addImport: true
  },
  'lambdas/leaderboard/get-alltime.ts': {
    importType: 'LeaderboardParams',
    findValidation: /validateQueryParams<LeaderboardParams>\(/,
    addImport: true
  },
  'lambdas/leaderboard/get-user-rank.ts': {
    importType: 'LeaderboardParams',
    findValidation: /validateQueryParams<LeaderboardParams>\(/,
    addImport: true
  },
  'lambdas/user/get-history.ts': {
    importType: 'UserHistoryParams',
    findValidation: /validateQueryParams<UserHistoryParams>\(/,
    addImport: true
  },
  'lambdas/user/update-preferences.ts': {
    importType: 'UpdatePreferencesData',
    findValidation: /validateRequest<UpdatePreferencesData>\(/,
    addImport: true
  },
  'lambdas/auth/profile.ts': {
    importType: 'UpdateProfileData',
    findValidation: /validateRequest<UpdateProfileData>\(/,
    addImport: true
  }
};

function addImportIfMissing(content, importType) {
  const importStatement = `import { ${importType} } from "../../lib/types";`;

  if (content.includes(importStatement)) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^import .* from ["'].*["'];?$/)) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join('\n');
  }

  return content;
}

function addTypeParameter(content, filePath) {
  // Handle validateRequest calls
  content = content.replace(
    /validateRequest\((userSchemas|examSchemas|userStatsSchemas|adminSchemas)\./g,
    (match, schema) => {
      if (filePath.includes('create-exam')) return 'validateRequest<CreateExamData>(' + schema + '.';
      if (filePath.includes('profile')) return 'validateRequest<UpdateProfileData>(' + schema + '.';
      if (filePath.includes('update-preferences')) return 'validateRequest<UpdatePreferencesData>(' + schema + '.';
      return match;
    }
  );

  // Handle validateQueryParams calls - be specific about which schema
  if (filePath.includes('admin/analytics')) {
    content = content.replace(
      /validateQueryParams\((adminSchemas\.getAnalytics)/g,
      'validateQueryParams<AnalyticsParams>(adminSchemas.getAnalytics'
    );
  } else if (filePath.includes('admin/manage-exams')) {
    content = content.replace(
      /validateQueryParams\((adminSchemas\.manageExams)/g,
      'validateQueryParams<ManageExamsParams>(adminSchemas.manageExams'
    );
  } else if (filePath.includes('admin/manage-users')) {
    content = content.replace(
      /validateQueryParams\((adminSchemas\.manageUsers)/g,
      'validateQueryParams<ManageUsersParams>(adminSchemas.manageUsers'
    );
  } else if (filePath.includes('exams/list-exams')) {
    content = content.replace(
      /validateQueryParams\((examSchemas\.list)/g,
      'validateQueryParams<ListExamsParams>(examSchemas.list'
    );
  } else if (filePath.includes('leaderboard/')) {
    content = content.replace(
      /validateQueryParams\((leaderboardSchemas\.\w+)/g,
      'validateQueryParams<LeaderboardParams>(leaderboardSchemas.$1'
    );
  } else if (filePath.includes('user/get-history')) {
    content = content.replace(
      /validateQueryParams\((userStatsSchemas\.getHistory)/g,
      'validateQueryParams<UserHistoryParams>(userStatsSchemas.getHistory'
    );
  }

  return content;
}

console.log('🔧 Fixing all Lambda TypeScript issues...\n');

Object.entries(fileFixes).forEach(([filePath, config]) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filePath} not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add import if missing
  if (config.addImport && !content.includes(`import { ${config.importType} }`)) {
    content = addImportIfMissing(content, config.importType);
    modified = true;
  }

  // Add type parameters if missing
  if (!config.findValidation.test(content)) {
    const newContent = addTypeParameter(content, filePath);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`✓  ${filePath} already correct`);
  }
});

console.log('\n✨ All Lambda files processed!');
