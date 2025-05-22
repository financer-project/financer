/**
 * Base email template that provides consistent styling and structure for all emails
 */
export function baseTemplate(params: {
    title: string;
    previewText?: string;
    content: string;
    logoUrl?: string;
}): string {
    const {
        title,
        previewText = "",
        content,
        logoUrl = `${process.env.APP_ORIGIN || process.env.BLITZ_DEV_SERVER_ORIGIN}/logo.png`
    } = params

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${title}</title>
        <style>
          @media only screen and (max-width: 620px) {
            table.body h1 {
              font-size: 28px !important;
              margin-bottom: 10px !important;
            }
            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
              font-size: 16px !important;
            }
            table.body .wrapper,
            table.body .article {
              padding: 10px !important;
            }
            table.body .content {
              padding: 0 !important;
            }
            table.body .container {
              padding: 0 !important;
              width: 100% !important;
            }
            table.body .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
            table.body .btn table {
              width: 100% !important;
            }
            table.body .btn a {
              width: 100% !important;
            }
            table.body .img-responsive {
              height: auto !important;
              max-width: 100% !important;
              width: auto !important;
            }
          }
          @media all {
            .ExternalClass {
              width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
              line-height: 100%;
            }
            .apple-link a {
              color: inherit !important;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
              text-decoration: none !important;
            }
            #MessageViewBody a {
              color: inherit;
              text-decoration: none;
              font-size: inherit;
              font-family: inherit;
              font-weight: inherit;
              line-height: inherit;
            }
            .btn-primary table td:hover {
              background-color: #34495e !important;
            }
            .btn-primary a:hover {
              background-color: #34495e !important;
              border-color: #34495e !important;
            }
          }
        </style>
      </head>
      <body style="background-color: #f6f6f6; font-family: sans-serif; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <span style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">
          ${previewText}
        </span>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; width: 100%;">
          <tr>
            <td style="padding: 10px;">&nbsp;</td>
            <td style="display: block; margin: 0 auto !important; max-width: 580px; padding: 10px; width: 580px;">
              <div style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                <!-- Logo Header -->
                <div style="text-align: center; padding: 20px 0;">
                  <img src="${logoUrl}" alt="Logo" style="height: 50px; width: auto;">
                </div>

                <!-- Main Content -->
                <table role="presentation" style="background-color: #ffffff; border-color: #dedede; border-radius: 3px; border-width: 1px; width: 100%;">
                  <tr>
                    <td style="box-sizing: border-box; padding: 20px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td>
                            <h1 style="color: #000000; font-family: sans-serif; font-weight: 300; line-height: 1.4; margin: 0; margin-bottom: 30px; font-size: 35px; text-align: center; text-transform: capitalize;">
                              ${title}
                            </h1>
                            ${content}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <div style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="color: #999999; font-size: 12px; text-align: center; padding: 20px;">
                        <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
                          &copy; ${new Date().getFullYear()} Financer App. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
            <td style="padding: 10px;">&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  `
}

/**
 * Creates a button for email templates
 */
export function createButton(params: {
    href: string;
    text: string;
    color?: string;
}): string {
    const { href, text, color = "#3498db" } = params

    return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <a href="${href}" target="_blank" style="background-color: ${color}; border-radius: 5px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize;">
                  ${text}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Creates a paragraph for email templates
 */
export function createParagraph(text: string): string {
    return `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">${text}</p>`
}