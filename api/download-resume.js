const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 尝试不同的文件路径
    let filePath = path.join(process.cwd(), 'uploads', 'Katherine Fang-CV-New York University.pdf');
    let fileBuffer;
    
    if (!fs.existsSync(filePath)) {
      // 尝试备用路径
      filePath = path.join(process.cwd(), 'public', 'uploads', 'Katherine Fang-CV-New York University.pdf');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
    }
    
    // 读取文件
    fileBuffer = fs.readFileSync(filePath);
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Katherine_Fang-CV-New_York_University.pdf"');
    res.setHeader('Content-Length', fileBuffer.length);
    
    // 发送文件
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};