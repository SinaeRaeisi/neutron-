// lib/email-templates.ts

const BRAND_COLOR = "#C6F24E";
const BG_COLOR = "#080B16";      // تیره‌تر و عمیق‌تر
const CARD_BG = "#121A2E";
const BORDER_COLOR = "#1F2B48";
const TEXT_COLOR = "#F7F8FC";
const MUTED_COLOR = "#8A93A8";
const DANGER_COLOR = "#FF6B6B";

/**
 * قالب پایه (Layout) با ظاهر پریمیوم
 */
export function getBaseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>نوترون</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: Vazirmatn, Tahoma, Arial, sans-serif; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${BG_COLOR}; padding: 40px 15px;">
        <tr>
          <td align="center">
            
            <!-- لوگو بالای کارت -->
            <table width="100%" style="max-width: 600px; margin-bottom: 20px;">
              <tr>
                <td align="center">
                  <a href="https://neutron.ir" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                    <span style="color: ${BRAND_COLOR}; font-size: 26px; font-weight: 900; letter-spacing: 2px;">نوترون</span>
                  </a>
                </td>
              </tr>
            </table>

            <!-- کارت اصلی -->
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- نوار رنگی بالای کارت -->
              <tr>
                <td style="height: 4px; background: linear-gradient(90deg, ${BRAND_COLOR} 0%, #5B8CFF 100%);"></td>
              </tr>

              <!-- محتوای اصلی -->
              <tr>
                <td style="padding: 40px 35px; color: ${TEXT_COLOR};">
                  ${content}
                </td>
              </tr>

              <!-- فوتر -->
              <tr>
                <td align="center" style="padding: 25px; background-color: ${BG_COLOR}; border-top: 1px solid ${BORDER_COLOR}; color: ${MUTED_COLOR}; font-size: 13px;">
                  <p style="margin: 0 0 8px 0;">این ایمیل به صورت خودکار ارسال شده است.</p>
                  <p style="margin: 0;">© ۱۴۰۵ نوترون - هستهٔ یادگیری</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * قالب OTP (کد ورود)
 */
export function getOtpTemplate(code: string): string {
  const content = `
    <h2 style="margin: 0 0 15px 0; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 800;">سلام 👋</h2>
    <p style="margin: 0 0 30px 0; color: ${MUTED_COLOR}; font-size: 15px; line-height: 1.7;">
      کد ورود شما به نوترون درخواست شده است. برای ادامه، کد ۶ رقمی زیر را در صفحه وارد کنید:
    </p>
    
    <!-- باکس کد با افکت نئون -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 30px 0;">
      <tr>
        <td align="center">
          <div style="background-color: ${BG_COLOR}; border: 2px solid ${BRAND_COLOR}; border-radius: 16px; padding: 25px; display: inline-block; min-width: 220px; box-shadow: 0 0 20px rgba(198, 242, 78, 0.2);">
            <span style="color: ${BRAND_COLOR}; font-size: 42px; font-weight: 900; letter-spacing: 15px; direction: ltr; display: inline-block; padding-left: 15px;">${code}</span>
          </div>
        </td>
      </tr>
    </table>

    <div style="background-color: rgba(255, 107, 107, 0.1); border-right: 4px solid ${DANGER_COLOR}; padding: 12px 15px; border-radius: 8px;">
      <p style="margin: 0; color: ${DANGER_COLOR}; font-size: 13px; line-height: 1.5;">
        این کد فقط به مدت <b>۲ دقیقه</b> معتبر است. اگر شما درخواست ورود نداده‌اید، این ایمیل را نادیده بگیرید.
      </p>
    </div>
  `;
  return getBaseTemplate(content);
}

/**
 * قالب خوش‌آمدگویی
 */
export function getWelcomeTemplate(name: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 48px; margin-bottom: 15px;">🚀</div>
      <h2 style="margin: 0; color: ${BRAND_COLOR}; font-size: 24px; font-weight: 900;">به نوترون خوش آمدی، ${name}!</h2>
    </div>
    
    <p style="margin: 0 0 25px 0; color: ${MUTED_COLOR}; font-size: 15px; line-height: 1.7; text-align: center;">
      حساب تو با موفقیت ساخته شد. حالا وقتشه که مسیر یادگیری خودت رو شروع کنی.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 15px 0; color: ${TEXT_COLOR}; font-size: 15px; font-weight: bold;">با نوترون می‌تونی:</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: ${MUTED_COLOR}; font-size: 14px; line-height: 2;">
            <tr><td>✅ دوره‌های مناسب پایهٔ خودت رو ببینی</td></tr>
            <tr><td>✅ آزمون بدی و شکاف‌های یادگیریت رو پیدا کنی</td></tr>
            <tr><td>✅ در کلاس‌های زنده با استاد و بچه‌ها تعامل کنی</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="https://neutron.ir/app" style="background-color: ${BRAND_COLOR}; color: ${BG_COLOR}; padding: 16px 35px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block;">
            شروع یادگیری
          </a>
        </td>
      </tr>
    </table>
  `;
  return getBaseTemplate(content);
}

/**
 * قالب تایید خرید اشتراک
 */
export function getSubscriptionTemplate(name: string, planName: string, expiresAt: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 48px; margin-bottom: 15px;">👑</div>
      <h2 style="margin: 0; color: ${BRAND_COLOR}; font-size: 24px; font-weight: 900;">اشتراک شما فعال شد!</h2>
    </div>
    
    <p style="margin: 0 0 25px 0; color: ${MUTED_COLOR}; font-size: 15px; line-height: 1.7; text-align: center;">
      ${name} عزیز، پرداخت شما با موفقیت تایید شد و حساب شما به پلن <b style="color: ${TEXT_COLOR};">${planName}</b> ارتقا یافت.
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 25px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-bottom: 15px; color: ${MUTED_COLOR}; font-size: 14px;">نوع پلن:</td>
              <td align="left" style="padding-bottom: 15px; color: ${BRAND_COLOR}; font-size: 16px; font-weight: 900;">${planName}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 15px; color: ${MUTED_COLOR}; font-size: 14px;">تاریخ فعال‌سازی:</td>
              <td align="left" style="padding-bottom: 15px; color: ${TEXT_COLOR}; font-size: 14px; font-weight: bold;">${new Date().toLocaleDateString("fa-IR")}</td>
            </tr>
            <tr>
              <td style="color: ${MUTED_COLOR}; font-size: 14px;">معتبر تا تاریخ:</td>
              <td align="left" style="color: ${TEXT_COLOR}; font-size: 14px; font-weight: bold; direction: rtl;">${expiresAt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="https://neutron.ir/app" style="background-color: transparent; color: ${BRAND_COLOR}; padding: 15px 35px; border-radius: 12px; border: 2px solid ${BRAND_COLOR}; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block;">
            رفتن به داشبورد
          </a>
        </td>
      </tr>
    </table>
  `;
  return getBaseTemplate(content);
}