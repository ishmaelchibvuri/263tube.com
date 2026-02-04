import { NextRequest, NextResponse } from "next/server";

interface AddContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  listId?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddContactRequest = await request.json();
    const { email, firstName, lastName, listId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const DEFAULT_LIST_ID = parseInt(process.env.BREVO_LIST_ID || "20");

    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured");
      return NextResponse.json(
        { error: "Brevo not configured" },
        { status: 500 }
      );
    }

    const targetListId = listId || DEFAULT_LIST_ID;

    // Build Brevo contact payload
    const brevoPayload: {
      email: string;
      listIds: number[];
      updateEnabled: boolean;
      attributes?: {
        FIRSTNAME?: string;
        LASTNAME?: string;
      };
    } = {
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
    }

    console.log(
      `Adding contact ${email} to Brevo list ${targetListId} with attributes:`,
      brevoPayload.attributes
    );

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    const responseText = await response.text();

    if (!response.ok && response.status !== 400) {
      // 400 might mean contact already exists, which is fine
      console.error(`Brevo API Error (${response.status}):`, responseText);
      return NextResponse.json(
        { error: "Failed to add contact to Brevo", details: responseText },
        { status: response.status }
      );
    }

    // Handle duplicate contact (status 400 with "Contact already exist")
    if (response.status === 400 && responseText.includes("Contact already exist")) {
      console.log(`Contact ${email} already exists in Brevo, updating...`);

      // Update existing contact to add to list and update attributes
      const updateResponse = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
        {
          method: "PUT",
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            listIds: [targetListId],
            attributes: brevoPayload.attributes,
          }),
        }
      );

      if (!updateResponse.ok) {
        const updateError = await updateResponse.text();
        console.error(`Brevo Update Error:`, updateError);
      } else {
        console.log(`Successfully updated contact ${email} in Brevo`);
      }
    }

    console.log(`Successfully added/updated contact ${email} in Brevo list ${targetListId}`);

    return NextResponse.json({
      success: true,
      message: "Contact added to Brevo",
      listId: targetListId,
    });
  } catch (error) {
    console.error("Error adding contact to Brevo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
