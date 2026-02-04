import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

interface SupportTicketRequest {
  subject: string;
  description: string;
  userEmail?: string;
  userName?: string;
  type?: "support" | "feedback";
  rating?: number;
  category?: string;
}

// Initialize SES client - using af-south-1 for sending (closer to SA)
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || "af-south-1",
});

export async function POST(request: NextRequest) {
  try {
    const body: SupportTicketRequest = await request.json();
    const { subject, description, userEmail, userName, type = "support", rating, category } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: "Subject and description are required" },
        { status: 400 }
      );
    }

    const supportEmail = "support@quickbudget.co.za";
    const isFeedback = type === "feedback";
    const typeLabel = isFeedback ? "Feedback" : "Support";
    const headerColor = isFeedback ? "#f59e0b" : "#3b82f6";

    // Format the From address to show user's name/email in display name
    // Reply-To is set to user's email so hitting "Reply" goes directly to them
    const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Anonymous");
    const fromEmail = userEmail
      ? `"${displayName} via QuickBudget" <noreply@quickbudget.co.za>`
      : `"QuickBudget ${typeLabel}" <noreply@quickbudget.co.za>`;

    // Build feedback metadata section
    const feedbackMeta = isFeedback
      ? [
          rating ? `Rating: ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)` : null,
          category ? `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}` : null,
        ].filter(Boolean).join("\n")
      : "";

    // Format the email body
    const emailBody = `
New ${typeLabel} ${isFeedback ? "Submission" : "Ticket"}

From: ${userName || "Anonymous User"} ${userEmail ? `<${userEmail}>` : "(not logged in)"}
${feedbackMeta ? `\n${feedbackMeta}\n` : ""}
Subject: ${subject}

${isFeedback ? "Feedback" : "Description"}:
${description}

---
This ${typeLabel.toLowerCase()} was submitted via the QuickBudget Widget.
${userEmail ? `Reply directly to this email to respond to the user at: ${userEmail}` : "User was not logged in - no reply email available."}
    `.trim();

    // Create HTML version
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, ${headerColor}, ${isFeedback ? "#d97706" : "#1d4ed8"}); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-top: 8px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 5px; }
    .stars { color: #f59e0b; font-size: 18px; }
    .description { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">New ${typeLabel} ${isFeedback ? "Submission" : "Ticket"}</h2>
    ${isFeedback && category ? `<div class="badge">${category.charAt(0).toUpperCase() + category.slice(1)}</div>` : ""}
  </div>
  <div class="content">
    <div class="field">
      <div class="label">From</div>
      <div class="value">${userName || "Anonymous User"} ${userEmail ? `&lt;${userEmail}&gt;` : "(not logged in)"}</div>
    </div>
    ${isFeedback && rating ? `
    <div class="field">
      <div class="label">Rating</div>
      <div class="value stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)</div>
    </div>
    ` : ""}
    ${isFeedback && category ? `
    <div class="field">
      <div class="label">Category</div>
      <div class="value">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
    </div>
    ` : ""}
    <div class="field">
      <div class="label">${isFeedback ? "Feedback" : "Description"}</div>
      <div class="description">${description ? description.replace(/\n/g, "<br>") : "<em>No content provided</em>"}</div>
    </div>
    <div class="footer">
      This ${typeLabel.toLowerCase()} was submitted via the QuickBudget Widget.<br>
      ${userEmail ? `<strong>Reply directly to this email to respond to the user.</strong>` : "User was not logged in - no reply email available."}
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via SES
    const sendEmailCommand = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [supportEmail],
      },
      ReplyToAddresses: userEmail ? [userEmail] : undefined,
      Message: {
        Subject: {
          Data: `[${typeLabel}] ${subject}`,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: emailBody,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
        },
      },
    });


    // Run email and Jira ticket creation in parallel
    // Use Promise.allSettled to not fail if one service is down
    const results = await Promise.allSettled([
      sesClient.send(sendEmailCommand),
      createJiraTicket({
        subject,
        description,
        userEmail,
        userName,
        type,
        rating,
        category,
      }),
    ]);

    const emailResult = results[0];
    const jiraResult = results[1];

    // Check results
    const emailSuccess = emailResult.status === "fulfilled";
    const jiraSuccess = jiraResult.status === "fulfilled" && jiraResult.value;

    // If both failed, return error
    if (!emailSuccess && !jiraSuccess) {
      return NextResponse.json(
        { error: "Failed to submit. Please try again or email us directly." },
        { status: 500 }
      );
    }

    // At least one succeeded
    return NextResponse.json({
      success: true,
      message: `${typeLabel} submitted successfully`,
      messageId: emailSuccess ? emailResult.value.MessageId : null,
      jiraTicketId: jiraSuccess ? jiraResult.value : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Jira Service Desk integration - uses raiseOnBehalfOf to set reporter properly
async function createJiraTicket(ticket: {
  subject: string;
  description: string;
  userEmail?: string;
  userName?: string;
  type?: "support" | "feedback";
  rating?: number;
  category?: string;
}): Promise<string | null> {
  const jiraBaseUrl = process.env.JIRA_BASE_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;
  const jiraProjectKey = process.env.JIRA_PROJECT_KEY;
  const jiraServiceDeskId = process.env.JIRA_SERVICE_DESK_ID;
  const jiraRequestTypeId = process.env.JIRA_REQUEST_TYPE_ID || "1"; // Default request type

  // If Jira is not configured, skip
  if (!jiraBaseUrl || !jiraEmail || !jiraApiToken || !jiraProjectKey) {
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
  const isFeedback = ticket.type === "feedback";
  const typeLabel = isFeedback ? "Feedback" : "Support";

  // Build description
  const descriptionParts = [
    ticket.description || "No content provided",
    "",
    "---",
    `Submitted via QuickBudget ${typeLabel} Widget`,
    `From: ${ticket.userName || "Anonymous User"}`,
  ];

  if (isFeedback && ticket.rating) {
    descriptionParts.push(`Rating: ${"★".repeat(ticket.rating)}${"☆".repeat(5 - ticket.rating)} (${ticket.rating}/5)`);
  }
  if (isFeedback && ticket.category) {
    descriptionParts.push(`Category: ${ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}`);
  }

  const description = descriptionParts.join("\n");

  // Try Service Desk API first (properly sets reporter via raiseOnBehalfOf)
  if (jiraServiceDeskId && ticket.userEmail) {
    try {
      const serviceDeskResponse = await fetch(`${jiraBaseUrl}/rest/servicedeskapi/request`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          serviceDeskId: jiraServiceDeskId,
          requestTypeId: jiraRequestTypeId,
          requestFieldValues: {
            summary: `[${typeLabel}] ${ticket.subject}`,
            description: description,
          },
          raiseOnBehalfOf: ticket.userEmail, // This sets the reporter to the actual user
        }),
      });

      if (serviceDeskResponse.ok) {
        const data = await serviceDeskResponse.json();
        return data.issueKey || data.key;
      }
    } catch {
      // Fall through to regular API
    }
  }

  // Fallback to regular Jira API
  try {
    const response = await fetch(`${jiraBaseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: jiraProjectKey },
          summary: `[${typeLabel}] ${ticket.subject}`,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `${ticket.userEmail ? `Reporter: ${ticket.userEmail}\n\n` : ""}${description}`,
                  },
                ],
              },
            ],
          },
          issuetype: { id: process.env.JIRA_ISSUE_TYPE_ID || "10002" },
          labels: isFeedback
            ? ["feedback", ticket.category || "general"].filter(Boolean)
            : ["support"],
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.key;
  } catch {
    return null;
  }
}
