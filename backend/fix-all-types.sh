#!/bin/bash

# Fix manage-exams.ts
echo "Fixing manage-exams.ts..."
sed -i 's/import { validateQueryParams, adminSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateQueryParams, adminSchemas } from "..\/..\/lib\/validation";\nimport { ManageExamsParams } from "..\/..\/lib\/types";/' backend/lambdas/admin/manage-exams.ts
sed -i 's/validateQueryParams(adminSchemas\.manageExams, event\.queryStringParameters || {})/validateQueryParams<ManageExamsParams>(adminSchemas.manageExams, event.queryStringParameters)/g' backend/lambdas/admin/manage-exams.ts

# Fix create-exam.ts
echo "Fixing create-exam.ts..."
sed -i 's/import { validateRequest, examSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateRequest, examSchemas } from "..\/..\/lib\/validation";\nimport { CreateExamData } from "..\/..\/lib\/types";/' backend/lambdas/exams/create-exam.ts
sed -i 's/validateRequest(examSchemas\.create, body)/validateRequest<CreateExamData>(examSchemas.create, body)/g' backend/lambdas/exams/create-exam.ts

# Fix list-exams.ts
echo "Fixing list-exams.ts..."
sed -i 's/import { validateQueryParams, examSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateQueryParams, examSchemas } from "..\/..\/lib\/validation";\nimport { ListExamsParams } from "..\/..\/lib\/types";/' backend/lambdas/exams/list-exams.ts
sed -i 's/validateQueryParams(examSchemas\.list, event\.queryStringParameters || {})/validateQueryParams<ListExamsParams>(examSchemas.list, event.queryStringParameters)/g' backend/lambdas/exams/list-exams.ts

# Fix leaderboard files
echo "Fixing leaderboard files..."
for file in backend/lambdas/leaderboard/get-{daily,weekly,monthly,alltime,user-rank}.ts; do
  if [ -f "$file" ]; then
    sed -i 's/import { validateQueryParams, leaderboardSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateQueryParams, leaderboardSchemas } from "..\/..\/lib\/validation";\nimport { LeaderboardParams } from "..\/..\/lib\/types";/' "$file"
    sed -i 's/validateQueryParams(leaderboardSchemas\.[^,]*, event\.queryStringParameters || {})/validateQueryParams<LeaderboardParams>(leaderboardSchemas.\1, event.queryStringParameters)/g' "$file"
    sed -i 's/validateQueryParams(leaderboardSchemas\.[^,]*, event\.queryStringParameters)/validateQueryParams<LeaderboardParams>(leaderboardSchemas.\1, event.queryStringParameters)/g' "$file"
  fi
done

# Fix user files
echo "Fixing user files..."
sed -i 's/import { validateQueryParams, userStatsSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateQueryParams, userStatsSchemas } from "..\/..\/lib\/validation";\nimport { UserHistoryParams } from "..\/..\/lib\/types";/' backend/lambdas/user/get-history.ts
sed -i 's/validateQueryParams(userStatsSchemas\.getHistory, event\.queryStringParameters || {})/validateQueryParams<UserHistoryParams>(userStatsSchemas.getHistory, event.queryStringParameters)/g' backend/lambdas/user/get-history.ts

sed -i 's/import { validateRequest, userStatsSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateRequest, userStatsSchemas } from "..\/..\/lib\/validation";\nimport { UpdatePreferencesData } from "..\/..\/lib\/types";/' backend/lambdas/user/update-preferences.ts
sed -i 's/validateRequest(userStatsSchemas\.updatePreferences, body)/validateRequest<UpdatePreferencesData>(userStatsSchemas.updatePreferences, body)/g' backend/lambdas/user/update-preferences.ts

# Fix profile.ts
echo "Fixing profile.ts..."
sed -i 's/import { validateRequest, userSchemas } from "\.\.\/\.\.\/lib\/validation";/import { validateRequest, userSchemas } from "..\/..\/lib\/validation";\nimport { UpdateProfileData } from "..\/..\/lib\/types";/' backend/lambdas/auth/profile.ts
sed -i 's/validateRequest(userSchemas\.updateProfile, body)/validateRequest<UpdateProfileData>(userSchemas.updateProfile, body)/g' backend/lambdas/auth/profile.ts

echo "All type fixes applied!"
