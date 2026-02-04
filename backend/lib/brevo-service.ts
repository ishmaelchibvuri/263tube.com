/**
 * Brevo (formerly Sendinblue) Email Marketing Service
 *
 * This service handles integration with Brevo for email list management
 * and marketing automation.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = process.env.BREVO_LIST_ID;
const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

interface BrevoContact {
  email: string;
  attributes?: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    [key: string]: any;
  };
  listIds?: number[];
  updateEnabled?: boolean;
}

interface BrevoResponse {
  id?: number;
  message?: string;
  code?: string;
}

/**
 * Add or update a contact in Brevo
 */
export async function addContactToBrevo(
  email: string,
  attributes?: { firstName?: string; lastName?: string; [key: string]: any }
): Promise<{ success: boolean; message: string; contactId?: number }> {
  try {
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return {
        success: false,
        message: 'Brevo API key not configured',
      };
    }

    if (!BREVO_LIST_ID) {
      console.error('BREVO_LIST_ID is not configured');
      return {
        success: false,
        message: 'Brevo list ID not configured',
      };
    }

    // Prepare contact data
    const contactData: BrevoContact = {
      email,
      listIds: [parseInt(BREVO_LIST_ID)],
      updateEnabled: true, // Update if contact already exists
    };

    // Add attributes if provided
    if (attributes) {
      contactData.attributes = {};
      if (attributes.firstName) {
        contactData.attributes.FIRSTNAME = attributes.firstName;
      }
      if (attributes.lastName) {
        contactData.attributes.LASTNAME = attributes.lastName;
      }

      // Add any other custom attributes
      Object.keys(attributes).forEach(key => {
        if (key !== 'firstName' && key !== 'lastName' && attributes[key]) {
          contactData.attributes![key.toUpperCase()] = attributes[key];
        }
      });
    }

    console.log('Adding contact to Brevo:', { email, listId: BREVO_LIST_ID });

    // Make API request to Brevo
    const response = await fetch(`${BREVO_API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(contactData),
    });

    const responseData = await response.json() as BrevoResponse;

    if (response.ok) {
      console.log('Contact added to Brevo successfully:', responseData);
      return {
        success: true,
        message: 'Contact added to email list successfully',
        contactId: responseData.id,
      };
    } else {
      // Check if contact already exists (code: duplicate_parameter)
      if (responseData.code === 'duplicate_parameter') {
        console.log('Contact already exists in Brevo, attempting update');

        // Try to update the contact instead
        const updateResponse = await fetch(`${BREVO_API_BASE_URL}/contacts/${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({
            attributes: contactData.attributes,
            listIds: contactData.listIds,
          }),
        });

        if (updateResponse.ok) {
          console.log('Contact updated in Brevo successfully');
          return {
            success: true,
            message: 'Contact updated in email list successfully',
          };
        } else {
          const updateError = await updateResponse.json() as any;
          console.error('Failed to update contact in Brevo:', updateError);
          return {
            success: false,
            message: `Failed to update contact: ${updateError.message || 'Unknown error'}`,
          };
        }
      }

      console.error('Failed to add contact to Brevo:', responseData);
      return {
        success: false,
        message: `Failed to add contact to email list: ${responseData.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Error adding contact to Brevo:', error);
    return {
      success: false,
      message: `Error adding contact to email list: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Remove a contact from a Brevo list
 */
export async function removeContactFromBrevoList(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
      return {
        success: false,
        message: 'Brevo not configured',
      };
    }

    const response = await fetch(
      `${BREVO_API_BASE_URL}/contacts/lists/${BREVO_LIST_ID}/contacts/remove`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          emails: [email],
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: 'Contact removed from email list successfully',
      };
    } else {
      const errorData = await response.json() as any;
      return {
        success: false,
        message: `Failed to remove contact: ${errorData.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Error removing contact from Brevo:', error);
    return {
      success: false,
      message: `Error removing contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get contact information from Brevo
 */
export async function getBrevoContact(
  email: string
): Promise<{ success: boolean; contact?: any; message?: string }> {
  try {
    if (!BREVO_API_KEY) {
      return {
        success: false,
        message: 'Brevo API key not configured',
      };
    }

    const response = await fetch(
      `${BREVO_API_BASE_URL}/contacts/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'api-key': BREVO_API_KEY,
        },
      }
    );

    if (response.ok) {
      const contact = await response.json();
      return {
        success: true,
        contact,
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: 'Contact not found',
      };
    } else {
      const errorData = await response.json() as any;
      return {
        success: false,
        message: `Failed to get contact: ${errorData.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Error getting contact from Brevo:', error);
    return {
      success: false,
      message: `Error getting contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update contact attributes in Brevo (for automation triggers)
 */
export async function updateContactAttributes(
  email: string,
  attributes: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    if (!BREVO_API_KEY) {
      console.log('BREVO_API_KEY not configured - skipping contact update');
      return { success: false, message: 'Brevo not configured' };
    }

    // Convert attribute keys to uppercase (Brevo convention)
    const uppercaseAttributes: Record<string, any> = {};
    Object.keys(attributes).forEach(key => {
      uppercaseAttributes[key.toUpperCase()] = attributes[key];
    });

    const response = await fetch(
      `${BREVO_API_BASE_URL}/contacts/${encodeURIComponent(email)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          attributes: uppercaseAttributes,
        }),
      }
    );

    if (response.ok) {
      console.log('Contact attributes updated in Brevo:', email);
      return { success: true, message: 'Contact updated successfully' };
    } else {
      const errorData = await response.json() as any;
      console.error('Failed to update contact in Brevo:', errorData);
      return { success: false, message: errorData.message || 'Update failed' };
    }
  } catch (error) {
    console.error('Error updating contact in Brevo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMON EVENTS (USE THESE IN YOUR LAMBDAS)
// ============================================================================

/**
 * Track user signup - creates contact with initial attributes
 */
export async function trackUserSignup(
  email: string,
  firstName: string,
  lastName: string = '',
  tier: 'free' | 'premium' | 'pro' = 'free'
): Promise<void> {
  try {
    await addContactToBrevo(email, {
      firstName,
      lastName,
      SIGNUP_DATE: new Date().toISOString(),
      TIER: tier,
      PROFILE_COMPLETED: false,
      LAST_LOGIN_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking signup in Brevo:', error);
    // Don't throw - email failures shouldn't break app
  }
}

/**
 * Track profile completion
 */
export async function trackProfileCompleted(email: string): Promise<void> {
  try {
    await updateContactAttributes(email, {
      PROFILE_COMPLETED: true,
      PROFILE_COMPLETED_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking profile completion:', error);
  }
}

/**
 * Track user login/activity
 */
export async function trackUserActivity(email: string): Promise<void> {
  try {
    await updateContactAttributes(email, {
      LAST_LOGIN_DATE: new Date().toISOString(),
      LAST_ACTIVITY_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
}

/**
 * Update weekly performance stats (for weekly email automation)
 */
export async function updateWeeklyStats(
  email: string,
  stats: {
    questionsAnsweredWeek: number;
    accuracyRate: number;
    leaderboardRank?: number;
    weakestTask?: string;
    weakestTaskName?: string;
    weakestAccuracy?: number;
  }
): Promise<void> {
  try {
    await updateContactAttributes(email, {
      QUESTIONS_ANSWERED_WEEK: stats.questionsAnsweredWeek,
      ACCURACY_RATE: stats.accuracyRate,
      LEADERBOARD_RANK: stats.leaderboardRank || 0,
      WEAKEST_TASK: stats.weakestTask || '',
      WEAKEST_TASK_NAME: stats.weakestTaskName || '',
      WEAKEST_ACCURACY: stats.weakestAccuracy || 0,
      LAST_ACTIVITY_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating weekly stats:', error);
  }
}

/**
 * Track tier upgrade
 */
export async function trackTierUpgrade(
  email: string,
  newTier: 'premium' | 'pro'
): Promise<void> {
  try {
    await updateContactAttributes(email, {
      TIER: newTier,
      UPGRADE_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking tier upgrade:', error);
  }
}

/**
 * Track exam passed (triggers success email automation)
 */
export async function trackExamPassed(
  email: string,
  examScore: number
): Promise<void> {
  try {
    await updateContactAttributes(email, {
      EXAM_PASSED: true,
      EXAM_PASS_DATE: new Date().toISOString(),
      EXAM_SCORE: examScore,
    });
  } catch (error) {
    console.error('Error tracking exam pass:', error);
  }
}

/**
 * Track referral code generation
 */
export async function trackReferralGenerated(
  email: string,
  referralCode: string
): Promise<void> {
  try {
    await updateContactAttributes(email, {
      REFERRAL_CODE: referralCode,
      REFERRAL_GENERATED_DATE: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking referral generation:', error);
  }
}
