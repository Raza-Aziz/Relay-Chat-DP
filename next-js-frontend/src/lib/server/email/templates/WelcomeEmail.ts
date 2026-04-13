type Params = {
  username: string;
};

const welcomeEmailContent = ({ username }: Params) => `
      <p>Hi ${username},</p>
      <p>Welcome to <strong>MernChat</strong>! 🎉 We're thrilled to have you on board.</p>
      <p>MernChat is designed to provide a seamless and secure messaging experience. Here’s what you can do:</p>
      
      <ul>
          <li>🔒 <strong>End-to-End Encryption</strong> - Your messages stay private.</li>
          <li>🔑 <strong>Private Key Recovery</strong> – Secure access to your chats.</li>
          <li>📲 <strong>Push Notifications</strong> – Stay updated in real time.</li>
          <li>💬 <strong>Real-time Messaging</strong> – Instant conversations.</li>
          <li>👥 <strong>Friends & Group Chats</strong> – Connect and collaborate.</li>
          <li>👀 <strong>Message Seen Status</strong> – Know when your message is read.</li>
          <li>✍️ <strong>Typing Indicators</strong> – See when someone is replying.</li>
          <li>📎 <strong>File Sharing</strong> – Send images, documents, and more.</li>
          <li>🎭 <strong>GIF & Polling Features</strong> – Make chats fun!</li>
          <li>🔐 <strong>OAuth Integration</strong> – Secure login with trusted providers.</li>
          <li>✔️ <strong>Verification Badge</strong> – Get recognized as a verified user.</li>
      </ul>
  
      <p>We’re constantly improving MernChat and adding new features. If you have any questions or suggestions, we’d love to hear from you!</p>
      
      <p>📧 Contact us anytime at <a href="mailto:mernchat.online@gmail.com">mernchat.online@gmail.com</a>.</p>
      
      <p>Ready to start chatting? Click below to log in and explore!</p>
  
      <p style="text-align: center;">
          <a href="https://mernchat.in" style="text-decoration: none;">
              <button style="
                  background-color: #007bff;
                  color: #ffffff;
                  border: none;
                  padding: 10px 20px;
                  font-size: 16px;
                  border-radius: 5px;
                  cursor: pointer;
              ">
                  Get Started
              </button>
          </a>
      </p>
  
      <p>Thank you for joining us. We can't wait for you to experience MernChat!</p>
  
      <p>Best regards,</p>
      <p><strong>The MernChat Team</strong></p>
  `;

const welcomeEmailSubject = "Welcome to MernChat! Get Started Today 🚀";

export { welcomeEmailContent, welcomeEmailSubject };
