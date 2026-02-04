const { CloudWatchLogsClient, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");

const client = new CloudWatchLogsClient({ region: "af-south-1" });

async function getLogs() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  const command = new FilterLogEventsCommand({
    logGroupName: "/aws/lambda/debtpayoff-log-payment-dev",
    startTime: fiveMinutesAgo,
  });

  try {
    const response = await client.send(command);

    if (!response.events || response.events.length === 0) {
      console.log("No logs found in the last 5 minutes");
      return;
    }

    console.log(`Found ${response.events.length} log events:\n`);

    response.events.forEach(event => {
      const timestamp = new Date(event.timestamp).toISOString();
      console.log(`[${timestamp}] ${event.message}`);
    });
  } catch (error) {
    console.error("Error fetching logs:", error.message);
  }
}

getLogs();
