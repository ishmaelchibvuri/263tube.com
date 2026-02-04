import { NextRequest, NextResponse } from "next/server";

interface PostHogPerson {
  properties?: {
    email?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PostHogPayload {
  persons?: PostHogPerson[];
  [key: string]: any;
}

interface BrevoContactRequest {
  email: string;
  listIds: number[];
  updateEnabled: boolean;
  attributes?: {
    FIRSTNAME?: string;
    LASTNAME?: string;
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const eventName = payload.event?.event; // Extract event name from nested event object

    // --- 1. Determine Target List Based on Event ---
    const QUIZ_ABANDONERS_LIST_ID = parseInt(
      process.env.BREVO_COMPLETED_QUIZ_LIST_ID || "5"
    );
    const REGISTERED_LIST_ID = parseInt(
      process.env.BREVO_VIEWED_DASHBOARD_LIST_ID || "6"
    );
    const USER_REGISTERED_LIST_ID = parseInt(
      process.env.BREVO_LIST_ID || "20"
    );
    let targetListId: number;

    if (eventName === "quiz_completed") {
      targetListId = QUIZ_ABANDONERS_LIST_ID;
    } else if (eventName === "user_registered") {
      targetListId = USER_REGISTERED_LIST_ID;
    } else if (
      eventName === "dashboard_viewed" ||
      eventName === "account_activated" ||
      eventName === "user_logged_in"
    ) {
      targetListId = REGISTERED_LIST_ID;
    } else {
      console.log(`Ignored event: ${eventName}`);
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    // --- 2. Extract Email and Name ---
    let email = "";
    let firstName = "";
    let lastName = "";

    // Try to get email from person properties (standard PostHog structure)
    if (payload.person?.properties) {
      email = payload.person.properties.email || payload.person.properties.$email;
      firstName = payload.person.properties.firstName || payload.person.properties.first_name || "";
      lastName = payload.person.properties.lastName || payload.person.properties.last_name || "";
    }
    // Fallback to event properties if not in person
    if (payload.event?.properties) {
      if (!email) {
        email = payload.event.properties.email || payload.event.properties.$email;
      }
      // Always prefer event properties for name (more likely to be current)
      firstName = payload.event.properties.firstName || payload.event.properties.first_name || firstName;
      lastName = payload.event.properties.lastName || payload.event.properties.last_name || lastName;
    }

    if (!email) {
      console.log("No email found in webhook payload");
      return NextResponse.json(
        { message: "Skipped: No email" },
        { status: 200 }
      );
    }

    // --- 3. Send to Brevo ---
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    console.log(
      `Syncing ${email} to Brevo list ${targetListId} (Event: ${eventName})...`
    );

    // Build Brevo contact payload
    const brevoPayload: BrevoContactRequest = {
      email: email,
      listIds: [targetListId],
      updateEnabled: true,
    };

    // Include name attributes if available
    if (firstName || lastName) {
      brevoPayload.attributes = {};
      if (firstName) {
        brevoPayload.attributes.FIRSTNAME = firstName;
      }
      if (lastName) {
        brevoPayload.attributes.LASTNAME = lastName;
      }
      console.log(`Including attributes: FIRSTNAME=${firstName}, LASTNAME=${lastName}`);
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!response.ok && response.status !== 400) {
      const errorText = await response.text();
      console.error(`Brevo Error:`, errorText);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
