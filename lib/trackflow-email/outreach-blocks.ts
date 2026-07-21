export type OutreachBlockId =
  | "greeting"
  | "wordpress_gig"
  | "shopify_gig"
  | "soft_question"
  | "opt_out";

const WORDPRESS_GIG_URL =
  "https://www.fiverr.com/shahjalalk/set-up-wordpress-lead-tracking-with-a-confirmed-enquiry-dashboard";
const SHOPIFY_GIG_URL =
  "https://www.fiverr.com/shahjalalk/build-shopify-tracking-with-server-verified-sales-and-live-dashboard";

const WORDPRESS_GIG_IMAGE =
  "https://trackflowpro.com/email-assets/fiverr-wordpress-lead-tracking.jpg";
const SHOPIFY_GIG_IMAGE =
  "https://trackflowpro.com/email-assets/fiverr-shopify-tracking.jpg";

function buildFiverrCard(input: {
  blockId: "wordpress_gig" | "shopify_gig";
  url: string;
  image: string;
  imageHeight: number;
  eyebrow: string;
  title: string;
}) {
  return `
    <div data-tfp-email-block="${input.blockId}" style="margin:16px 0 14px 0;max-width:480px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:480px;border-collapse:separate;border-spacing:0;border:1px solid #dfe3e8;border-radius:10px;background:#ffffff;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td width="160" valign="middle" style="width:160px;padding:8px;vertical-align:middle;">
            <a href="${input.url}" target="_blank" style="display:block;color:#111827;text-decoration:none;">
              <img src="${input.image}" width="160" height="${input.imageHeight}" alt="${input.title}" border="0" style="display:block;width:160px;height:${input.imageHeight}px;max-width:160px;border:0;border-radius:7px;" />
            </a>
          </td>
          <td valign="middle" style="padding:10px 12px 10px 4px;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;overflow-wrap:break-word;word-break:normal;">
            <a href="${input.url}" target="_blank" style="display:block;color:#111827;text-decoration:none;">
              <span style="display:block;margin:0 0 4px 0;font-size:10px;line-height:14px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:#74767e;">${input.eyebrow}</span>
              <span style="display:block;margin:0;font-size:14px;line-height:19px;font-weight:bold;color:#111827;">${input.title}</span>
              <span style="display:block;margin:7px 0 0 0;font-size:11px;line-height:16px;font-weight:bold;color:#1dbf73;">View this service on Fiverr →</span>
            </a>
          </td>
        </tr>
      </table>
    </div>`;
}

export function buildOutreachBlockHtml(blockId: OutreachBlockId): string {
  switch (blockId) {
    case "greeting":
      return `<p style="margin:0 0 12px 0;">Hi {name},</p>`;
    case "wordpress_gig":
      return buildFiverrCard({
        blockId,
        url: WORDPRESS_GIG_URL,
        image: WORDPRESS_GIG_IMAGE,
        imageHeight: 100,
        eyebrow: "Fiverr service",
        title: "WordPress Lead Tracking with Confirmed Enquiry Dashboard",
      });
    case "shopify_gig":
      return buildFiverrCard({
        blockId,
        url: SHOPIFY_GIG_URL,
        image: SHOPIFY_GIG_IMAGE,
        imageHeight: 100,
        eyebrow: "Fiverr service",
        title: "Shopify GA4 Tracking with Server-Verified Sales Dashboard",
      });
    case "soft_question":
      return `<p style="margin:0 0 12px 0;">Would it be useful if I shared the first measurement points I would verify for {company}?</p>`;
    case "opt_out":
      return `<p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;line-height:18px;">If this is not relevant, please let me know and I will not follow up.</p>`;
    default:
      return "";
  }
}
