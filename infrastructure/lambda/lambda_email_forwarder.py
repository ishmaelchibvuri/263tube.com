import json
import boto3
import email
import os
import base64
import re
from email.utils import parseaddr
try:
    import requests
except ImportError:
    # Fallback to urllib if requests is not available
    import urllib.request
    import urllib.parse
    import urllib.error
    requests = None

s3 = boto3.client('s3')
ssm = boto3.client('ssm')

# Get configuration from environment variables
JIRA_SITE = os.environ.get('JIRA_SITE', 'regulatoryexams.atlassian.net')
JIRA_PROJECT_KEY = os.environ.get('JIRA_PROJECT_KEY', 'RES')
JIRA_EMAIL_PARAM = os.environ.get('JIRA_EMAIL_PARAM')
JIRA_API_TOKEN_PARAM = os.environ.get('JIRA_API_TOKEN_PARAM')
S3_BUCKET = os.environ.get('S3_BUCKET', 'regulatoryexams-inbound-emails')
JIRA_SERVICE_DESK_ID = os.environ.get('JIRA_SERVICE_DESK_ID')  # Will auto-detect if not provided

# Cache for Jira credentials
_jira_credentials = None

def get_jira_credentials():
    """Get Jira credentials from AWS Parameter Store"""
    global _jira_credentials

    if _jira_credentials:
        return _jira_credentials

    try:
        # Get both parameters in one call for efficiency
        response = ssm.get_parameters(
            Names=[JIRA_EMAIL_PARAM, JIRA_API_TOKEN_PARAM],
            WithDecryption=True  # Decrypt the secure string
        )

        params = {p['Name']: p['Value'] for p in response['Parameters']}

        _jira_credentials = {
            'email': params[JIRA_EMAIL_PARAM],
            'api_token': params[JIRA_API_TOKEN_PARAM]
        }
        return _jira_credentials
    except Exception as e:
        print(f"Error retrieving Jira credentials from Parameter Store: {str(e)}")
        raise


def make_jira_request(method, endpoint, data=None, files=None):
    """Make authenticated request to Jira API"""
    credentials = get_jira_credentials()
    auth_string = f"{credentials['email']}:{credentials['api_token']}"
    auth_bytes = auth_string.encode('utf-8')
    auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')

    url = f"https://{JIRA_SITE}{endpoint}"
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Accept': 'application/json'
    }

    if data and not files:
        headers['Content-Type'] = 'application/json'

    if requests:
        # Use requests library if available
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            if files:
                response = requests.post(url, headers=headers, files=files)
            else:
                response = requests.post(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")

        if response.status_code not in [200, 201]:
            print(f"Jira API error: {response.status_code} - {response.text}")
            response.raise_for_status()

        return response.json()
    else:
        # Fallback to urllib
        req_data = json.dumps(data).encode('utf-8') if data else None
        request = urllib.request.Request(url, data=req_data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"HTTP Error {e.code}: {error_body}")
            raise


def get_service_desk_id():
    """Get or detect the Service Desk ID"""
    if JIRA_SERVICE_DESK_ID:
        return JIRA_SERVICE_DESK_ID

    # Auto-detect by getting service desks and finding the one matching our project
    try:
        result = make_jira_request('GET', '/rest/servicedeskapi/servicedesk')
        for desk in result.get('values', []):
            if desk.get('projectKey') == JIRA_PROJECT_KEY:
                return desk.get('id')
    except Exception as e:
        print(f"Error auto-detecting service desk ID: {str(e)}")

    return None


def parse_email_address(email_string):
    """Parse email address from string like 'Name <email@example.com>'"""
    name, email_addr = parseaddr(email_string)
    return email_addr if email_addr else email_string


def get_email_body(msg):
    """Extract plain text body from email message"""
    body = ""

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get('Content-Disposition', ''))

            if 'attachment' not in content_disposition:
                if content_type == 'text/plain':
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        body = payload.decode(charset)
                        break  # Prefer plain text
                    except:
                        body = payload.decode('utf-8', errors='ignore')
                elif content_type == 'text/html' and not body:
                    # Fallback to HTML if no plain text
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        html_body = payload.decode(charset)
                        # Strip HTML tags (basic)
                        body = re.sub('<[^<]+?>', '', html_body)
                    except:
                        pass
    else:
        payload = msg.get_payload(decode=True)
        charset = msg.get_content_charset() or 'utf-8'
        try:
            body = payload.decode(charset)
        except:
            body = payload.decode('utf-8', errors='ignore')

    return body.strip()


def create_jira_ticket(summary, description, reporter_email):
    """Create a Jira Service Desk ticket with the original reporter"""
    try:
        # Get service desk ID
        service_desk_id = get_service_desk_id()
        if not service_desk_id:
            print("Warning: Could not determine service desk ID, using fallback")
            # Fallback to regular issue creation
            return create_regular_issue(summary, description, reporter_email)

        # Create the request using Service Desk API
        # This will automatically create a customer if they don't exist
        request_data = {
            "serviceDeskId": service_desk_id,
            "requestTypeId": "5",  # "Emailed request" request type
            "requestFieldValues": {
                "summary": summary,
                "description": description
            },
            "raiseOnBehalfOf": reporter_email
        }

        result = make_jira_request('POST', '/rest/servicedeskapi/request', data=request_data)

        print(f"Created Jira ticket: {result.get('issueKey')} for reporter: {reporter_email}")
        return result

    except Exception as e:
        print(f"Error creating ticket via Service Desk API: {str(e)}")
        # Fallback to regular issue creation
        return create_regular_issue(summary, description, reporter_email)


def create_regular_issue(summary, description, reporter_email):
    """Fallback: Create a regular Jira issue"""
    issue_data = {
        "fields": {
            "project": {"key": JIRA_PROJECT_KEY},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": f"From: {reporter_email}\n\n{description}"
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"name": "Task"}
        }
    }

    result = make_jira_request('POST', '/rest/api/3/issue', data=issue_data)
    print(f"Created Jira issue (fallback): {result.get('key')} - Reporter info in description")
    return result


def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    # Get the SES message
    ses_notification = event['Records'][0]['ses']
    message_id = ses_notification['mail']['messageId']

    # Get the email from S3
    bucket = S3_BUCKET
    key = f'emails/{message_id}'

    try:
        # Download email from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        email_content = response['Body'].read()

        # Parse the email
        msg = email.message_from_bytes(email_content)

        # Get original sender, subject, and body
        original_from = parse_email_address(msg.get('From', 'unknown@example.com'))
        original_subject = msg.get('Subject', 'No Subject')
        email_body = get_email_body(msg)

        print(f"Processing email from {original_from} with subject: {original_subject}")

        # Create Jira ticket
        result = create_jira_ticket(
            summary=original_subject,
            description=email_body,
            reporter_email=original_from
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Ticket created in Jira',
                'ticket': result.get('issueKey') or result.get('key'),
                'reporter': original_from
            })
        }

    except Exception as e:
        print(f"Error processing email: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e
