// Health Controller - Handles health check endpoints
export const healthCheck = (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
};

