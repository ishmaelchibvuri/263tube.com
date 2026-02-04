exports.handler = async (event) => {
  console.log(
    "Get user stats Lambda function called",
    JSON.stringify(event, null, 2)
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({
      totalAttempts: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      passedAttempts: 0,
      bestScore: 0,
      message: "User stats endpoint working (mock data)",
      timestamp: new Date().toISOString(),
    }),
  };
};





