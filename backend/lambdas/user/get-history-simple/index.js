exports.handler = async (event) => {
  console.log(
    "Get user history Lambda function called",
    JSON.stringify(event, null, 2)
  );

  // Mock user history data
  const mockHistory = [
    {
      attemptId: "attempt-1",
      examId: "exam-1",
      examTitle: "Regulatory Compliance Fundamentals",
      score: 85,
      correctAnswers: 17,
      totalQuestions: 20,
      passed: true,
      timeSpent: 1800, // 30 minutes in seconds
      completedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      attemptId: "attempt-2",
      examId: "exam-2",
      examTitle: "Advanced Risk Management",
      score: 78,
      correctAnswers: 23,
      totalQuestions: 30,
      passed: true,
      timeSpent: 2400, // 40 minutes in seconds
      completedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];

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
      attempts: mockHistory,
      total: mockHistory.length,
      message: "User history endpoint working (mock data)",
      timestamp: new Date().toISOString(),
    }),
  };
};





