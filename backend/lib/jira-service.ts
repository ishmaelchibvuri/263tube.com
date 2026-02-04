import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

/**
 * Jira Service Desk REST API Integration
 *
 * This service creates support tickets directly via Jira REST API
 * and properly sets the reporter to the actual user
 */

export interface SupportTicket {
  email: string;
  subject: string;
  description: string;
  name?: string;
  tier?: string;
}

interface JiraCredentials {
  email: string;
  apiToken: string;
}

export class JiraService {
  private static readonly JIRA_SITE = process.env.JIRA_SITE || 'regulatoryexams.atlassian.net';
  private static readonly JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'RES';
  private static readonly JIRA_EMAIL_PARAM = process.env.JIRA_EMAIL_PARAM;
  private static readonly JIRA_API_TOKEN_PARAM = process.env.JIRA_API_TOKEN_PARAM;
  private static readonly JIRA_SERVICE_DESK_ID = process.env.JIRA_SERVICE_DESK_ID;

  private static ssmClient = new SSMClient({});
  private static credentialsCache: JiraCredentials | null = null;

  /**
   * Get Jira credentials from AWS Parameter Store
   */
  private static async getJiraCredentials(): Promise<JiraCredentials> {
    console.log("JiraService.getJiraCredentials() - START");

    if (this.credentialsCache) {
      console.log("✅ Using cached credentials");
      return this.credentialsCache;
    }

    console.log("Fetching credentials from Parameter Store...");
    console.log("  JIRA_EMAIL_PARAM:", this.JIRA_EMAIL_PARAM);
    console.log("  JIRA_API_TOKEN_PARAM:", this.JIRA_API_TOKEN_PARAM);

    if (!this.JIRA_EMAIL_PARAM || !this.JIRA_API_TOKEN_PARAM) {
      console.error("❌ Jira credential parameter names not configured");
      throw new Error('Jira credential parameter names not configured');
    }

    try {
      const command = new GetParametersCommand({
        Names: [this.JIRA_EMAIL_PARAM, this.JIRA_API_TOKEN_PARAM],
        WithDecryption: true,
      });

      console.log("Sending GetParametersCommand to SSM...");
      const response = await this.ssmClient.send(command);
      console.log("SSM response received. Parameters count:", response.Parameters?.length);

      if (!response.Parameters || response.Parameters.length !== 2) {
        console.error("❌ Expected 2 parameters, got:", response.Parameters?.length);
        console.error("Response parameters:", response.Parameters);
        throw new Error('Failed to retrieve Jira credentials from Parameter Store');
      }

      const params = response.Parameters.reduce((acc, param) => {
        if (param.Name && param.Value) {
          console.log("  Found parameter:", param.Name, "(value length:", param.Value.length, ")");
          acc[param.Name] = param.Value;
        }
        return acc;
      }, {} as Record<string, string>);

      const email = params[this.JIRA_EMAIL_PARAM];
      const apiToken = params[this.JIRA_API_TOKEN_PARAM];

      if (!email || !apiToken) {
        throw new Error('Jira credentials not found in Parameter Store');
      }

      this.credentialsCache = {
        email,
        apiToken,
      };

      console.log("✅ Credentials cached successfully. Email:", this.credentialsCache.email);
      return this.credentialsCache;
    } catch (error: any) {
      console.error('❌ Error retrieving Jira credentials:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to get Jira credentials: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Jira REST API
   */
  private static async makeJiraRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<any> {
    console.log(`JiraService.makeJiraRequest() - ${method} ${endpoint}`);

    const credentials = await this.getJiraCredentials();
    const authString = `${credentials.email}:${credentials.apiToken}`;
    const authB64 = Buffer.from(authString).toString('base64');

    const url = `https://${this.JIRA_SITE}${endpoint}`;
    console.log("Request URL:", url);

    const headers: Record<string, string> = {
      'Authorization': `Basic ${authB64}`,
      'Accept': 'application/json',
    };

    if (data) {
      headers['Content-Type'] = 'application/json';
      console.log("Request body:", JSON.stringify(data, null, 2));
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log("Sending request to Jira...");
      const response = await fetch(url, options);
      console.log("Jira response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Jira API error: ${response.status} - ${errorText}`);
        throw new Error(`Jira API request failed: ${response.status} ${response.statusText}`);
      }

      const jsonResponse = await response.json();
      console.log("✅ Jira response received successfully");
      return jsonResponse;
    } catch (error: any) {
      console.error('❌ Error making Jira request:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Get or detect the Service Desk ID
   */
  private static async getServiceDeskId(): Promise<string | null> {
    if (this.JIRA_SERVICE_DESK_ID) {
      return this.JIRA_SERVICE_DESK_ID;
    }

    try {
      const result = await this.makeJiraRequest('GET', '/rest/servicedeskapi/servicedesk');

      if (result.values) {
        for (const desk of result.values) {
          if (desk.projectKey === this.JIRA_PROJECT_KEY) {
            return desk.id;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error auto-detecting service desk ID:', error);
    }

    return null;
  }

  /**
   * Create a support ticket via Jira Service Desk API
   */
  static async createSupportTicket(ticket: SupportTicket): Promise<{ issueKey: string }> {
    try {
      console.log('=== JiraService.createSupportTicket() START ===');
      console.log('Ticket details:', {
        email: ticket.email,
        subjectLength: ticket.subject.length,
        descriptionLength: ticket.description.length,
      });

      // Get service desk ID
      console.log('Getting service desk ID...');
      const serviceDeskId = await this.getServiceDeskId();
      console.log('Service desk ID:', serviceDeskId || 'NOT FOUND');

      if (!serviceDeskId) {
        console.warn('⚠️ Could not determine service desk ID, using fallback');
        return await this.createRegularIssue(ticket);
      }

      // Create the request using Service Desk API
      // This will automatically create a customer if they don't exist
      const requestData = {
        serviceDeskId: serviceDeskId,
        requestTypeId: '5', // "Emailed request" request type
        requestFieldValues: {
          summary: ticket.subject,
          description: this.formatDescription(ticket),
        },
        raiseOnBehalfOf: ticket.email, // This sets the reporter to the actual user
      };

      console.log('Creating Service Desk request with data:', JSON.stringify(requestData, null, 2));
      const result = await this.makeJiraRequest(
        'POST',
        '/rest/servicedeskapi/request',
        requestData
      );

      console.log('✅ Created Jira ticket:', result.issueKey, 'for reporter:', ticket.email);

      return {
        issueKey: result.issueKey || result.key || 'TICKET_CREATED',
      };
    } catch (error: any) {
      console.error('❌ Error creating ticket via Service Desk API:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // Fallback to regular issue creation
      console.log('Attempting fallback to regular issue creation...');
      return await this.createRegularIssue(ticket);
    }
  }

  /**
   * Fallback: Create a regular Jira issue
   */
  private static async createRegularIssue(ticket: SupportTicket): Promise<{ issueKey: string }> {
    try {
      console.log('📝 Creating regular Jira issue (fallback) for:', ticket.email);

      const tierInfo = ticket.tier ? `Tier: ${ticket.tier.toUpperCase()}\n` : '';
      const issueData = {
        fields: {
          project: { key: this.JIRA_PROJECT_KEY },
          summary: ticket.subject,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `From: ${ticket.email}\n${tierInfo}\n${ticket.description}`,
                  },
                ],
              },
            ],
          },
          issuetype: { name: 'Task' },
        },
      };

      const result = await this.makeJiraRequest('POST', '/rest/api/3/issue', issueData);

      console.log('✅ Created Jira issue (fallback):', result.key);

      return {
        issueKey: result.key || 'ISSUE_CREATED',
      };
    } catch (error: any) {
      console.error('❌ Failed to create Jira issue (fallback):', error);
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }
  }

  /**
   * Format description with user details
   */
  private static formatDescription(ticket: SupportTicket): string {
    const parts = [];

    parts.push(ticket.description);
    parts.push('');
    parts.push('---');
    parts.push(`Submitted via Support Widget on ${new Date().toISOString()}`);
    parts.push(`Reporter: ${ticket.name || ticket.email}`);
    if (ticket.tier) {
      parts.push(`Subscription Tier: ${ticket.tier.toUpperCase()}`);
    }

    return parts.join('\n');
  }

  /**
   * Validate Jira configuration
   */
  static validateConfig(): boolean {
    if (!this.JIRA_SITE || !this.JIRA_PROJECT_KEY) {
      console.error('❌ Missing Jira configuration in environment variables');
      return false;
    }
    if (!this.JIRA_EMAIL_PARAM || !this.JIRA_API_TOKEN_PARAM) {
      console.error('❌ Missing Jira credential parameter names');
      return false;
    }
    return true;
  }
}
