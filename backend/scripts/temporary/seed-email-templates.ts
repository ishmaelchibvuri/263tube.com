import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

interface EmailTemplate {
  templateId: string;
  templateName: string;
  description: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  isActive: boolean;
}

const emailTemplates: EmailTemplate[] = [
  {
    templateId: "welcome-email",
    templateName: "Welcome Email",
    description: "Welcome email sent to new users after registration",
    subject: "Welcome to Regulatory Exams! 🎉",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Regulatory Exams! 🎓</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>

      <p>Welcome to the Regulatory Exams Platform! We're thrilled to have you join our community of aspiring financial advisors.</p>

      <p><strong>Here's what you can do now:</strong></p>
      <ul>
        <li>✅ Take your first free practice exam</li>
        <li>📊 Track your progress on the dashboard</li>
        <li>🏆 Compete on the leaderboard</li>
        <li>📚 Access 1000+ practice questions</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      </div>

      <p>Good luck with your studies!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
    <div class="footer">
      <p>© 2025 Regulatory Exams. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Hi {{firstName}},

Welcome to the Regulatory Exams Platform! We're thrilled to have you join our community of aspiring financial advisors.

Here's what you can do now:
- Take your first free practice exam
- Track your progress on the dashboard
- Compete on the leaderboard
- Access 1000+ practice questions

Visit your dashboard: {{dashboardUrl}}

Good luck with your studies!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "dashboardUrl"],
    isActive: true,
  },
  {
    templateId: "password-reset",
    templateName: "Password Reset",
    description: "Password reset email with verification code",
    subject: "Reset Your Password - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>

      <p>We received a request to reset your password. Use the verification code below to proceed:</p>

      <div class="code-box">{{verificationCode}}</div>

      <p style="text-align: center;">Or click the button below:</p>

      <div style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </div>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong><br>
        This code expires in 15 minutes. If you didn't request this password reset, please ignore this email or contact support.
      </div>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Hi {{firstName}},

We received a request to reset your password. Use the verification code below to proceed:

Verification Code: {{verificationCode}}

Or visit: {{resetUrl}}

This code expires in 15 minutes.

If you didn't request this password reset, please ignore this email or contact support.

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "verificationCode", "resetUrl"],
    isActive: true,
  },
  {
    templateId: "email-verification",
    templateName: "Email Verification",
    description: "Email verification for new accounts",
    subject: "Verify Your Email - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .code-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 6px; color: #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>

      <p>Thanks for signing up! Please verify your email address by entering this code:</p>

      <div class="code-box">{{verificationCode}}</div>

      <p style="text-align: center;">Or click the button below:</p>

      <div style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Verify Email</a>
      </div>

      <p><strong>This code expires in 24 hours.</strong></p>

      <p>Once verified, you'll have full access to all features!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Hi {{firstName}},

Thanks for signing up! Please verify your email address by entering this code:

Verification Code: {{verificationCode}}

Or visit: {{verificationUrl}}

This code expires in 24 hours.

Once verified, you'll have full access to all features!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "verificationCode", "verificationUrl"],
    isActive: true,
  },
  {
    templateId: "exam-passed",
    templateName: "Exam Passed Congratulations",
    description: "Congratulatory email when user passes an exam",
    subject: "🎉 Congratulations! You Passed! - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .stats { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .stat-label { font-weight: bold; }
    .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations, {{firstName}}!</h1>
      <h2 style="margin-top: 10px;">You Passed Your Exam! 🏆</h2>
    </div>
    <div class="content">
      <p>Excellent work! You've successfully passed {{examName}}!</p>

      <div class="stats">
        <h3 style="margin-top: 0;">📊 Your Results:</h3>
        <div class="stat-item">
          <span class="stat-label">Score:</span>
          <span>{{score}}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Questions Correct:</span>
          <span>{{correctAnswers}}/{{totalQuestions}}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Time Taken:</span>
          <span>{{timeTaken}}</span>
        </div>
        <div class="stat-item" style="border-bottom: none;">
          <span class="stat-label">Leaderboard Rank:</span>
          <span>#{{rank}}</span>
        </div>
      </div>

      <p><strong>What's next?</strong></p>
      <ul>
        <li>📈 Review your detailed performance analysis</li>
        <li>🏆 Check your position on the leaderboard</li>
        <li>🎯 Continue practicing to maintain your streak</li>
        <li>📚 Try advanced practice tests</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{resultsUrl}}" class="button">View Detailed Results</a>
      </div>

      <p>Keep up the excellent work!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Congratulations, {{firstName}}!

You Passed Your Exam!

You've successfully passed {{examName}}!

Your Results:
- Score: {{score}}%
- Questions Correct: {{correctAnswers}}/{{totalQuestions}}
- Time Taken: {{timeTaken}}
- Leaderboard Rank: #{{rank}}

What's next?
- Review your detailed performance analysis
- Check your position on the leaderboard
- Continue practicing to maintain your streak
- Try advanced practice tests

View your detailed results: {{resultsUrl}}

Keep up the excellent work!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "examName", "score", "correctAnswers", "totalQuestions", "timeTaken", "rank", "resultsUrl"],
    isActive: true,
  },
  {
    templateId: "streak-milestone",
    templateName: "Streak Milestone",
    description: "Celebrate when user reaches a study streak milestone",
    subject: "🔥 {{streakDays}}-Day Streak! You're on Fire! - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .streak-badge { text-align: center; font-size: 72px; margin: 20px 0; }
    .achievement-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Amazing Streak, {{firstName}}!</h1>
    </div>
    <div class="content">
      <div class="streak-badge">🔥</div>

      <div class="achievement-box">
        <h2 style="margin-top: 0; color: #f5576c;">{{streakDays}}-Day Streak!</h2>
        <p style="font-size: 18px;">You've practiced {{streakDays}} days in a row!</p>
      </div>

      <p>Your dedication is truly impressive! Consistency is key to mastering the material.</p>

      <p><strong>Your Stats:</strong></p>
      <ul>
        <li>📚 Total Questions Answered: {{totalQuestions}}</li>
        <li>🎯 Average Score: {{averageScore}}%</li>
        <li>⏱️ Total Study Time: {{totalStudyTime}}</li>
      </ul>

      <p><strong>Keep it going!</strong> Complete another practice session today to maintain your streak.</p>

      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Continue Learning</a>
      </div>

      <p>You're doing great!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Amazing Streak, {{firstName}}!

🔥 {{streakDays}}-Day Streak!

You've practiced {{streakDays}} days in a row!

Your dedication is truly impressive! Consistency is key to mastering the material.

Your Stats:
- Total Questions Answered: {{totalQuestions}}
- Average Score: {{averageScore}}%
- Total Study Time: {{totalStudyTime}}

Keep it going! Complete another practice session today to maintain your streak.

Continue Learning: {{dashboardUrl}}

You're doing great!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "streakDays", "totalQuestions", "averageScore", "totalStudyTime", "dashboardUrl"],
    isActive: true,
  },
  {
    templateId: "leaderboard-top10",
    templateName: "Leaderboard Top 10",
    description: "Notification when user enters top 10 on leaderboard",
    subject: "🏆 You're in the Top 10! - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .rank-badge { text-align: center; font-size: 96px; margin: 20px 0; }
    .leaderboard { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; background: #fcb69f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Congratulations, {{firstName}}!</h1>
      <h2 style="margin-top: 10px;">You're in the Top 10!</h2>
    </div>
    <div class="content">
      <div class="rank-badge">🏆</div>

      <div class="leaderboard">
        <h3 style="margin-top: 0; text-align: center;">Your Ranking</h3>
        <p style="font-size: 24px; text-align: center; margin: 20px 0;"><strong>Rank #{{rank}}</strong> out of {{totalUsers}} users</p>
        <p style="text-align: center;">Score: <strong>{{score}}%</strong></p>
      </div>

      <p>Outstanding performance! You've earned your place among the top performers on the {{leaderboardType}} leaderboard.</p>

      <p><strong>Your achievements:</strong></p>
      <ul>
        <li>🎯 Accuracy: {{accuracy}}%</li>
        <li>📊 Questions Completed: {{questionsCompleted}}</li>
        <li>⚡ Current Streak: {{currentStreak}} days</li>
      </ul>

      <p>Keep up the excellent work to maintain your position!</p>

      <div style="text-align: center;">
        <a href="{{leaderboardUrl}}" class="button">View Leaderboard</a>
      </div>

      <p>You're doing fantastic!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Congratulations, {{firstName}}!

You're in the Top 10!

Your Ranking: Rank #{{rank}} out of {{totalUsers}} users
Score: {{score}}%

Outstanding performance! You've earned your place among the top performers on the {{leaderboardType}} leaderboard.

Your achievements:
- Accuracy: {{accuracy}}%
- Questions Completed: {{questionsCompleted}}
- Current Streak: {{currentStreak}} days

Keep up the excellent work to maintain your position!

View Leaderboard: {{leaderboardUrl}}

You're doing fantastic!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "rank", "totalUsers", "score", "leaderboardType", "accuracy", "questionsCompleted", "currentStreak", "leaderboardUrl"],
    isActive: true,
  },
  {
    templateId: "subscription-activated",
    templateName: "Subscription Activated",
    description: "Confirmation email when subscription is activated",
    subject: "✨ Your {{tierName}} Subscription is Active! - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .features-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Welcome to {{tierName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>

      <p>Great news! Your {{tierName}} subscription is now active and ready to use.</p>

      <div class="features-box">
        <h3 style="margin-top: 0;">🎁 Your {{tierName}} Features:</h3>
        <div class="feature-item">✅ {{feature1}}</div>
        <div class="feature-item">✅ {{feature2}}</div>
        <div class="feature-item">✅ {{feature3}}</div>
        <div class="feature-item" style="border-bottom: none;">✅ {{feature4}}</div>
      </div>

      <p><strong>Subscription Details:</strong></p>
      <ul>
        <li>Plan: {{tierName}}</li>
        <li>Billing: {{billingCycle}}</li>
        <li>Valid Until: {{expiryDate}}</li>
        <li>Amount: R{{amount}}</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Start Learning</a>
      </div>

      <p>Make the most of your subscription and achieve your goals!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Welcome to {{tierName}}!

Hi {{firstName}},

Great news! Your {{tierName}} subscription is now active and ready to use.

Your {{tierName}} Features:
✅ {{feature1}}
✅ {{feature2}}
✅ {{feature3}}
✅ {{feature4}}

Subscription Details:
- Plan: {{tierName}}
- Billing: {{billingCycle}}
- Valid Until: {{expiryDate}}
- Amount: R{{amount}}

Start Learning: {{dashboardUrl}}

Make the most of your subscription and achieve your goals!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "tierName", "feature1", "feature2", "feature3", "feature4", "billingCycle", "expiryDate", "amount", "dashboardUrl"],
    isActive: true,
  },
  {
    templateId: "subscription-expiring",
    templateName: "Subscription Expiring Soon",
    description: "Reminder email when subscription is about to expire",
    subject: "⏰ Your Subscription Expires in {{daysRemaining}} Days - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Subscription Expiring Soon</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>

      <div class="warning-box">
        <strong>Your {{tierName}} subscription expires in {{daysRemaining}} days</strong> (on {{expiryDate}}).
      </div>

      <p>To continue enjoying all the benefits of {{tierName}}, renew your subscription before it expires.</p>

      <p><strong>Don't lose access to:</strong></p>
      <ul>
        <li>🎯 Unlimited practice tests</li>
        <li>📊 Advanced analytics</li>
        <li>🏆 Leaderboard participation</li>
        <li>📚 Full question bank</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{renewUrl}}" class="button">Renew Now</a>
      </div>

      <p>Questions? Contact our support team anytime.</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Subscription Expiring Soon

Hi {{firstName}},

Your {{tierName}} subscription expires in {{daysRemaining}} days (on {{expiryDate}}).

To continue enjoying all the benefits of {{tierName}}, renew your subscription before it expires.

Don't lose access to:
- Unlimited practice tests
- Advanced analytics
- Leaderboard participation
- Full question bank

Renew Now: {{renewUrl}}

Questions? Contact our support team anytime.

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "tierName", "daysRemaining", "expiryDate", "renewUrl"],
    isActive: true,
  },
  {
    templateId: "referral-reward",
    templateName: "Referral Reward",
    description: "Notification when user earns a referral reward",
    subject: "🎁 You Earned a Referral Reward! - Regulatory Exams",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .reward-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #fed6e3; }
    .button { display: inline-block; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Congratulations, {{firstName}}!</h1>
      <h2 style="margin-top: 10px;">You Earned a Reward!</h2>
    </div>
    <div class="content">
      <p>Great news! {{referredName}} just {{action}} using your referral link!</p>

      <div class="reward-box">
        <h3 style="margin-top: 0; color: #ff6b9d;">Your Reward</h3>
        <p style="font-size: 24px; margin: 15px 0;"><strong>{{rewardDescription}}</strong></p>
      </div>

      <p><strong>Your Referral Stats:</strong></p>
      <ul>
        <li>👥 Total Referrals: {{totalReferrals}}</li>
        <li>✅ Successful Conversions: {{successfulReferrals}}</li>
        <li>🎁 Total Rewards Earned: {{totalRewards}}</li>
      </ul>

      <p>Keep sharing to earn more rewards! Share your unique referral link:</p>

      <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; word-break: break-all;">
        <code>{{referralLink}}</code>
      </div>

      <div style="text-align: center;">
        <a href="{{referralPageUrl}}" class="button">View Referral Dashboard</a>
      </div>

      <p>Thank you for spreading the word!</p>

      <p>Best regards,<br>The Regulatory Exams Team</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `Congratulations, {{firstName}}!

You Earned a Reward!

Great news! {{referredName}} just {{action}} using your referral link!

Your Reward: {{rewardDescription}}

Your Referral Stats:
- Total Referrals: {{totalReferrals}}
- Successful Conversions: {{successfulReferrals}}
- Total Rewards Earned: {{totalRewards}}

Keep sharing to earn more rewards! Share your unique referral link:
{{referralLink}}

View Referral Dashboard: {{referralPageUrl}}

Thank you for spreading the word!

Best regards,
The Regulatory Exams Team`,
    variables: ["firstName", "referredName", "action", "rewardDescription", "totalReferrals", "successfulReferrals", "totalRewards", "referralLink", "referralPageUrl"],
    isActive: true,
  },
];

async function seedEmailTemplates() {
  console.log("🌱 Starting email template seeding...");
  const now = new Date().toISOString();

  for (const template of emailTemplates) {
    try {
      const item = {
        PK: "EMAIL_TEMPLATE",
        SK: `TEMPLATE#${template.templateId}`,
        ...template,
        lastModifiedBy: "system",
        createdAt: now,
        updatedAt: now,
        entityType: "EMAIL_TEMPLATE",
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      console.log(`✅ Created template: ${template.templateId} - ${template.templateName}`);
    } catch (error) {
      console.error(`❌ Failed to create template ${template.templateId}:`, error);
    }
  }

  console.log("🎉 Email template seeding completed!");
}

// Run the seed script
seedEmailTemplates()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
