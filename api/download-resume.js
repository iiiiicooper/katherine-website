const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 在Vercel环境中，public目录的内容会被复制到根目录
    // 所以我们需要检查多个可能的路径
    const fileName = 'Katherine_Fang-CV-New_York_University.pdf';
    const possiblePaths = [
      // Vercel部署后的路径（public内容在根目录）
      path.join(process.cwd(), 'uploads', fileName),
      // 开发环境路径
      path.join(process.cwd(), 'public', 'uploads', fileName),
      // 备用路径
      path.join(process.cwd(), 'dist', 'uploads', fileName)
    ];
    
    let filePath = null;
    let fileBuffer = null;
    
    // 尝试找到文件
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    if (!filePath) {
      console.error('File not found in any of the paths:', possiblePaths);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // 读取文件
    fileBuffer = fs.readFileSync(filePath);
    console.log('File found and read successfully from:', filePath);
    
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