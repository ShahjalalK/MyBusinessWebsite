export type OutreachBlockId =
  | "greeting"
  | "wordpress_gig"
  | "wordpress_dental_gig"
  | "shopify_gig"
  | "soft_question"
  | "opt_out";

const WORDPRESS_GIG_URL =
  "https://www.fiverr.com/shahjalalk/set-up-wordpress-lead-tracking-with-a-confirmed-enquiry-dashboard";
const SHOPIFY_GIG_URL =
  "https://www.fiverr.com/shahjalalk/build-shopify-tracking-with-server-verified-sales-and-live-dashboard";

const WORDPRESS_GIG_IMAGE =
  "https://trackflowpro.com/email-assets/fiverr-wordpress-lead-tracking.jpg";
const WORDPRESS_DENTAL_GIG_IMAGE =
  "https://trackflowpro.com/email-assets/fiverr-wordpress-dental-demo.jpg";
const SHOPIFY_GIG_IMAGE =
  "https://trackflowpro.com/email-assets/fiverr-shopify-tracking.jpg";

function buildFiverrCard(input: {
  blockId: "wordpress_gig" | "wordpress_dental_gig" | "shopify_gig";
  url: string;
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return `
    <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520"><tr><td><![endif]-->
    <div class="tfp-gig-card" data-tfp-email-block="${input.blockId}" style="margin:12px 0 10px 0;width:100%;max-width:520px;min-width:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="tfp-gig-card-table" style="width:100%;max-width:520px;border-collapse:separate;border-spacing:0;border:1px solid #dfe3e8;border-radius:10px;background:#ffffff;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td width="140" valign="middle" class="tfp-gig-image-cell" style="width:140px;padding:7px;vertical-align:middle;">
            <a href="${input.url}" target="_blank" style="display:block;color:#111827;text-decoration:none;">
              <img class="tfp-gig-image" src="${input.image}" width="140" height="88" alt="${input.title} — ${input.subtitle}" border="0" style="display:block;width:140px;height:88px;max-width:140px;border:0;border-radius:7px;object-fit:cover;" />
            </a>
          </td>
          <td valign="middle" class="tfp-gig-text-cell" style="padding:9px 12px 9px 4px;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;overflow-wrap:break-word;word-break:normal;min-width:0;">
            <a href="${input.url}" target="_blank" style="display:block;color:#111827;text-decoration:none;">
              <span style="display:block;margin:0 0 3px 0;font-size:9px;line-height:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:#74767e;">${input.eyebrow}</span>
              <span style="display:block;margin:0;font-size:13px;line-height:18px;font-weight:bold;color:#111827;">${input.title}</span>
              <span style="display:block;margin:1px 0 0 0;font-size:12px;line-height:17px;font-weight:bold;color:#374151;">${input.subtitle}</span>
              <span style="display:block;margin:6px 0 0 0;font-size:10px;line-height:15px;font-weight:bold;color:#1dbf73;">View this service on Fiverr →</span>
            </a>
          </td>
        </tr>
      </table>
    </div>
    <!--[if mso]></td></tr></table><![endif]-->`;
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
        eyebrow: "Fiverr service",
        title: "WordPress Lead Tracking",
        subtitle: "Confirmed Enquiry Dashboard",
      });
    case "wordpress_dental_gig":
      return buildFiverrCard({
        blockId,
        url: WORDPRESS_GIG_URL,
        image: WORDPRESS_DENTAL_GIG_IMAGE,
        eyebrow: "Dental website tracking example",
        title: "WordPress Lead Tracking",
        subtitle: "Confirmed Enquiry Dashboard",
      });
    case "shopify_gig":
      return buildFiverrCard({
        blockId,
        url: SHOPIFY_GIG_URL,
        image: SHOPIFY_GIG_IMAGE,
        eyebrow: "Fiverr service",
        title: "Shopify GA4 Tracking",
        subtitle: "Server-Verified Sales Dashboard",
      });
    case "soft_question":
      return `<p style="margin:0 0 12px 0;">Would it be useful if I shared the first measurement points I would verify for {company}?</p>`;
    case "opt_out":
      return `<p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;line-height:18px;">If this is not relevant, please let me know and I will not follow up.</p>`;
    default:
      return "";
  }
}
