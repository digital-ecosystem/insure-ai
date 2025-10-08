import { NextResponse } from "next/server";
import nodemailer from "nodemailer";



export async function POST(request: Request) {
  const { name, number } = await request.json();
  const Empfanger = "Konstantin Beran";
  const EmpfangerEmail = process.env.RECIPIENT_EMAIL;
  const password = process.env.PASSWORD;
  const email = process.env.EMAIL;
  const host = process.env.HOST;

  const configOptions = {
    host: host,
    port: 587,
    // tls: {
    //     rejectUnauthorized: true,
    //     minVersion: 'TLSv1.2'
    // }
  };
  if (!password || !email || !host) {
    throw Error("Environment variables are not set");
  }
  try {
    const transporter = nodemailer.createTransport({
      ...configOptions,
      auth: {
        user: email,
        pass: password,
      },
    });

    const mailOptions = {
      from: email,
      to: `Konstantin Beran <${EmpfangerEmail}>`,
      subject: "Neue Anfrage über das Kontaktformular",
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Neue Kontaktanfrage</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
              line-height: 1.6;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            
            .header h1 {
              font-size: 24px;
              margin-bottom: 5px;
              font-weight: 600;
            }
            
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .greeting {
              font-size: 16px;
              color: #333333;
              margin-bottom: 20px;
            }
            
            .info-section {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            
            .info-title {
              font-size: 18px;
              color: #333333;
              margin-bottom: 15px;
              font-weight: 600;
            }
            
            .info-item {
              display: flex;
              margin-bottom: 12px;
              align-items: center;
            }
            
            .info-label {
              font-weight: 600;
              color: #555555;
              min-width: 100px;
              margin-right: 10px;
            }
            
            .info-value {
              color: #333333;
              background-color: #e9ecef;
              padding: 8px 12px;
              border-radius: 6px;
              flex: 1;
              font-size: 14px;
            }
            
            .timestamp {
              background-color: #e8f4f8;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              font-size: 14px;
              color: #666666;
            }
            
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            
            .footer p {
              font-size: 12px;
              color: #666666;
            }
            
            .icon {
              display: inline-block;
              width: 16px;
              height: 16px;
              margin-right: 8px;
              vertical-align: middle;
            }
            
            @media (max-width: 600px) {
              .email-container {
                margin: 10px;
                border-radius: 8px;
              }
              
              .content {
                padding: 20px 15px;
              }
              
              .header {
                padding: 20px 15px;
              }
              
              .info-item {
                flex-direction: column;
                align-items: flex-start;
              }
              
              .info-label {
                margin-bottom: 5px;
                min-width: auto;
              }
              
              .info-value {
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>📧 Neue Kontaktanfrage</h1>
              <p>Sie haben eine neue Nachricht über Ihr Kontaktformular erhalten</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Hallo ${Empfanger},
              </div>
              
              <p style="color: #555555; margin-bottom: 20px;">
                Sie haben eine neue Kontaktanfrage über Ihr Website-Formular erhalten. 
                Hier sind die Details:
              </p>
              
              <div class="info-section">
                <div class="info-title">👤 Kontaktinformationen</div>
                
                <div class="info-item">
                  <span class="info-label">🏷️ Name:</span>
                  <span class="info-value">${name || 'Nicht angegeben'}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">📞 Telefon:</span>
                  <span class="info-value">${number || 'Nicht angegeben'}</span>
                </div>
              </div>
              
              <div class="timestamp">
                <strong>📅 Eingegangen am:</strong> ${new Date().toLocaleString('de-DE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              
              <p style="color: #555555; font-size: 14px; margin-top: 25px;">
                Diese E-Mail wurde automatisch von Ihrem Website-Kontaktformular generiert.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ihr Website-Kontaktformular</p>
              <p style="margin-top: 5px;">Diese E-Mail wurde automatisch generiert.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    console.log("Sending email with options:", mailOptions);
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    return NextResponse.json(
      {success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get signed URL" },
      { status: 500 }
    );
  }
}
