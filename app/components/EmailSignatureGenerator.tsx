"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  ImageUp,
  LayoutTemplate,
  Link2,
  Mail,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type ImageMode = "initials" | "url" | "upload";
type ImageKind = "profile" | "logo";
type OutputFormat = "image/jpeg" | "image/png";
type CopyStatus = "idle" | "copied" | "failed";
type WizardStep = "personal" | "contact" | "image" | "links" | "style" | "copy";
type SignatureTemplate = "modern" | "executive" | "classic" | "compact" | "creative" | "banner";

type SignatureForm = {
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  imageUrl: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  youtube: string;
  ctaText: string;
  ctaUrl: string;
  brandColor: string;
  includeCredit: boolean;
};

const DEFAULT_FORM: SignatureForm = {
  fullName: "Shahjalal Khan",
  jobTitle: "Founder & Tracking Specialist",
  company: "TrackFlow Pro",
  email: "shahjalal@trackflowpro.com",
  phone: "+880 1329-532551",
  website: "https://trackflowpro.com",
  address: "Remote tracking support worldwide",
  imageUrl: "",
  linkedin: "https://www.linkedin.com/in/shahjalal-khan/",
  facebook: "",
  instagram: "",
  youtube: "",
  ctaText: "Request a Free Tracking Review",
  ctaUrl: "https://trackflowpro.com/free-tracking-audit",
  brandColor: "#2563eb",
  includeCredit: true,
};

const BRAND_COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#be123c", "#0f172a"];

const SOCIAL_ICON_URLS = {
  facebook: "https://cdn.jsdelivr.net/gh/ShahjalalK/signature-test@master/facebook.png",
  linkedin: "https://cdn.jsdelivr.net/gh/ShahjalalK/annadavid-signature@master/img/linkedin.png",
  instagram: "https://cdn.jsdelivr.net/gh/ShahjalalK/annadavid-signature@master/img/instagram.png",
  youtube: "https://cdn.jsdelivr.net/gh/ShahjalalK/annadavid-signature@master/img/youtube.png",
} as const;

const SIGNATURE_TEMPLATES: Array<{
  id: SignatureTemplate;
  name: string;
  description: string;
  bestFor: string;
}> = [
  {
    id: "modern",
    name: "Modern Split",
    description: "Clean avatar, strong name, and balanced contact details.",
    bestFor: "Consultants & agencies",
  },
  {
    id: "executive",
    name: "Executive Card",
    description: "Premium corporate style with a polished card layout.",
    bestFor: "Founders & managers",
  },
  {
    id: "classic",
    name: "Classic Horizontal",
    description: "Traditional business signature with image and compact contact row.",
    bestFor: "Local businesses",
  },
  {
    id: "compact",
    name: "Compact Clean",
    description: "Lightweight signature for simple professional emails.",
    bestFor: "Sales & support",
  },
  {
    id: "creative",
    name: "Creative Accent",
    description: "Bold name, social links, and a more visual creator-style layout.",
    bestFor: "Freelancers & creators",
  },
  {
    id: "banner",
    name: "CTA Banner",
    description: "Adds a small clickable banner-style call to action under the details.",
    bestFor: "Promotions & bookings",
  },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function withHttps(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function safeUrl(value: string) {
  const normalized = withHttps(value);
  if (!normalized) return "";
  if (/^(https?:|mailto:|tel:)/i.test(normalized)) return escapeHtml(normalized);
  return "";
}

function safeImageUrl(value: string, allowDataImage = false) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (allowDataImage && /^data:image\/(png|jpe?g|webp);base64,/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return safeUrl(trimmed);
}

function formatPhoneHref(value: string) {
  const cleaned = value.replace(/[^+\d]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "TP";
  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getSignatureParts(form: SignatureForm, imageMode: ImageMode, allowDataImages = false) {
  const color = isHexColor(form.brandColor) ? form.brandColor : "#2563eb";
  const name = escapeHtml(form.fullName.trim() || "Your Name");
  const rawJobTitle = form.jobTitle.trim();
  const rawCompany = form.company.trim();
  const jobTitle = escapeHtml(rawJobTitle);
  const company = escapeHtml(rawCompany);
  const email = escapeHtml(form.email.trim());
  const phone = escapeHtml(form.phone.trim());
  const websiteLabel = escapeHtml(form.website.trim().replace(/^https?:\/\//i, ""));
  const websiteUrl = safeUrl(form.website);
  const address = escapeHtml(form.address.trim());
  const imageUrl = safeImageUrl(form.imageUrl, allowDataImages);
  const phoneHref = safeUrl(formatPhoneHref(form.phone));
  const emailHref = safeUrl(`mailto:${form.email.trim()}`);
  const ctaUrl = safeUrl(form.ctaUrl);
  const ctaText = escapeHtml(form.ctaText.trim());
  const initials = escapeHtml(getInitials(form.fullName));
  const titleLine = [jobTitle, company].filter(Boolean).join(" · ");

  const socialLinks = [
    { label: "LinkedIn", icon: SOCIAL_ICON_URLS.linkedin, url: safeUrl(form.linkedin) },
    { label: "Facebook", icon: SOCIAL_ICON_URLS.facebook, url: safeUrl(form.facebook) },
    { label: "Instagram", icon: SOCIAL_ICON_URLS.instagram, url: safeUrl(form.instagram) },
    { label: "YouTube", icon: SOCIAL_ICON_URLS.youtube, url: safeUrl(form.youtube) },
  ].filter((link) => link.url);

  const credit = form.includeCredit
    ? `<tr><td colspan="3" style="padding:7px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;mso-line-height-rule:exactly;color:#64748b;">Created with <a href="https://trackflowpro.com/tools/free-email-signature-generator" style="color:${color};text-decoration:none;font-weight:bold;">TrackFlow Pro</a></td></tr>`
    : "";

  return {
    address,
    color,
    company,
    ctaText,
    ctaUrl,
    credit,
    email,
    emailHref,
    imageMode,
    imageUrl,
    initials,
    jobTitle,
    name,
    phone,
    phoneHref,
    socialLinks,
    titleLine,
    websiteLabel,
    websiteUrl,
  };
}

function tableReset(extraStyle = "") {
  return `border-collapse:collapse;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;${extraStyle}`;
}

function textStyle(size: number, lineHeight: number, color = "#334155", weight = "normal", family = "Arial,Helvetica,sans-serif") {
  return `font-family:${family};font-size:${size}px;line-height:${lineHeight}px;mso-line-height-rule:exactly;color:${color};font-weight:${weight};`;
}

function linkStyle(color = "#334155", weight = "normal") {
  return `color:${color};text-decoration:none;font-weight:${weight};`;
}

function imageBlock(parts: ReturnType<typeof getSignatureParts>, size = 76, radius = "8px", border = true) {
  const safeRadius = radius;
  const borderStyle = border ? `border:2px solid ${parts.color};` : "border:0;";

  if (parts.imageUrl) {
    return `<img src="${parts.imageUrl}" width="${size}" height="${size}" alt="${parts.name}" style="display:block;width:${size}px;height:${size}px;max-width:${size}px;border-radius:${safeRadius};${borderStyle}outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">`;
  }

  const fontSize = Math.max(16, Math.round(size * 0.28));
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="${size}" height="${size}" style="${tableReset(`width:${size}px;height:${size}px;`)}"><tr><td width="${size}" height="${size}" align="center" valign="middle" bgcolor="${parts.color}" style="width:${size}px;height:${size}px;border-radius:${safeRadius};${textStyle(fontSize, size, "#ffffff", "bold")}">${parts.initials}</td></tr></table>`;
}

function socialIconImg(link: { label: string; icon: string; url: string }, size = 20) {
  return `<img src="${escapeHtml(link.icon)}" width="${size}" height="${size}" alt="${escapeHtml(link.label)}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">`;
}

function socialTextLinks(parts: ReturnType<typeof getSignatureParts>) {
  if (!parts.socialLinks.length) return "";

  return `<tr><td colspan="3" style="padding:7px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}"><tr>${parts.socialLinks
    .map(
      (link) =>
        `<td style="padding:0 7px 0 0;"><a href="${link.url}" aria-label="${escapeHtml(link.label)}" style="display:block;text-decoration:none;border:0;line-height:0;">${socialIconImg(link, 19)}</a></td>`,
    )
    .join("")}</tr></table></td></tr>`;
}

function socialCircleLinks(parts: ReturnType<typeof getSignatureParts>) {
  if (!parts.socialLinks.length) return "";

  return `<tr><td colspan="3" style="padding:7px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}"><tr>${parts.socialLinks
    .map(
      (link) =>
        `<td style="padding:0 6px 0 0;"><a href="${link.url}" aria-label="${escapeHtml(link.label)}" style="display:block;text-decoration:none;border:0;line-height:0;">${socialIconImg(link, 21)}</a></td>`,
    )
    .join("")}</tr></table></td></tr>`;
}

function contactLine(label: string, value: string, url: string, color: string) {
  if (!value) return "";
  const content = url
    ? `<a href="${url}" style="${linkStyle("#334155", "normal")}">${value}</a>`
    : `<span style="color:#334155;">${value}</span>`;

  return `<tr><td valign="top" style="padding:0 0 3px 0;${textStyle(12, 17, "#64748b", "bold")};white-space:nowrap;">${label}:&nbsp;</td><td valign="top" style="padding:0 0 3px 0;${textStyle(12, 17)}">${content}</td></tr>`;
}

function contactInline(parts: ReturnType<typeof getSignatureParts>) {
  const items = [
    parts.phone ? `<a href="${parts.phoneHref}" style="${linkStyle("#334155", "normal")}">${parts.phone}</a>` : "",
    parts.email ? `<a href="${parts.emailHref}" style="${linkStyle("#334155", "normal")}">${parts.email}</a>` : "",
    parts.websiteLabel && parts.websiteUrl ? `<a href="${parts.websiteUrl}" style="${linkStyle("#334155", "normal")}">${parts.websiteLabel}</a>` : "",
  ].filter(Boolean);

  if (!items.length) return "";

  return `<tr><td colspan="3" style="padding:6px 0 0 0;${textStyle(12, 17)}">${items.join(
    `<span style="color:${parts.color};font-weight:bold;"> &nbsp;•&nbsp; </span>`,
  )}</td></tr>`;
}

function addressRow(parts: ReturnType<typeof getSignatureParts>) {
  if (!parts.address) return "";
  return `<tr><td colspan="3" style="padding:4px 0 0 0;${textStyle(11, 15, "#64748b")}">${parts.address}</td></tr>`;
}

function ctaButton(parts: ReturnType<typeof getSignatureParts>, variant: "pill" | "bar" = "pill") {
  if (!parts.ctaUrl || !parts.ctaText) return "";

  if (variant === "bar") {
    return `<tr><td colspan="3" style="padding:9px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="${tableReset("width:100%;")}"><tr><td bgcolor="${parts.color}" align="center" style="padding:8px 12px;border-radius:6px;${textStyle(12, 16, "#ffffff", "bold")}"><a href="${parts.ctaUrl}" style="color:#ffffff;text-decoration:none;font-weight:bold;display:block;">${parts.ctaText}</a></td></tr></table></td></tr>`;
  }

  return `<tr><td colspan="3" style="padding:9px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}"><tr><td bgcolor="${parts.color}" style="padding:7px 11px;border-radius:6px;${textStyle(12, 16, "#ffffff", "bold")}"><a href="${parts.ctaUrl}" style="color:#ffffff;text-decoration:none;font-weight:bold;">${parts.ctaText}</a></td></tr></table></td></tr>`;
}

function buildModernSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="520" style="${tableReset("width:520px;max-width:520px;margin:0;padding:0;")}">
  <tr>
    <td width="86" valign="top" style="width:86px;padding:0 12px 0 0;margin:0;">${imageBlock(parts, 76, "8px")}</td>
    <td width="2" bgcolor="${parts.color}" style="width:2px;font-size:0;line-height:0;padding:0;margin:0;">&nbsp;</td>
    <td valign="top" style="padding:0 0 0 14px;margin:0;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset("margin:0;padding:0;")}">
        <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(18, 22, "#0f172a", "bold")}">${parts.name}</td></tr>
        ${parts.titleLine ? `<tr><td colspan="3" style="padding:0 0 7px 0;${textStyle(13, 17, "#475569", "bold")}">${parts.titleLine}</td></tr>` : ""}
        ${contactLine("Email", parts.email, parts.emailHref, parts.color)}
        ${contactLine("Phone", parts.phone, parts.phoneHref, parts.color)}
        ${parts.websiteLabel && parts.websiteUrl ? contactLine("Web", parts.websiteLabel, parts.websiteUrl, parts.color) : ""}
        ${addressRow(parts)}
        ${socialTextLinks(parts)}
        ${ctaButton(parts)}
        ${parts.credit}
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildExecutiveSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="560" style="${tableReset("width:560px;max-width:560px;margin:0;padding:0;")}">
  <tr><td bgcolor="${parts.color}" height="4" style="height:4px;font-size:0;line-height:0;padding:0;margin:0;">&nbsp;</td></tr>
  <tr>
    <td style="padding:14px 16px 12px 16px;border-bottom:1px solid #e2e8f0;background-color:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="${tableReset("width:100%;")}">
        <tr>
          <td width="76" valign="top" style="width:76px;padding:0 14px 0 0;">${imageBlock(parts, 66, "8px")}</td>
          <td valign="top" style="padding:0 14px 0 0;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
              <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(20, 24, parts.color, "bold", "Georgia,'Times New Roman',serif")}">${parts.name}</td></tr>
              ${parts.titleLine ? `<tr><td colspan="3" style="padding:0 0 5px 0;${textStyle(13, 17, "#334155", "bold")}">${parts.titleLine}</td></tr>` : ""}
              ${socialCircleLinks(parts)}
              ${addressRow(parts)}
              ${parts.credit}
            </table>
          </td>
          <td width="185" valign="top" style="width:185px;border-left:1px solid #e2e8f0;padding:0 0 0 14px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
              ${contactLine("P", parts.phone, parts.phoneHref, parts.color)}
              ${contactLine("E", parts.email, parts.emailHref, parts.color)}
              ${parts.websiteLabel && parts.websiteUrl ? contactLine("W", parts.websiteLabel, parts.websiteUrl, parts.color) : ""}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildClassicSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="560" style="${tableReset("width:560px;max-width:560px;margin:0;padding:0;")}">
  <tr>
    <td width="84" valign="top" style="width:84px;padding:0 12px 8px 0;">${imageBlock(parts, 74, "6px", false)}</td>
    <td valign="top" style="padding:0 0 8px 0;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="${tableReset("width:100%;border-bottom:2px solid " + parts.color + ";")}">
        <tr>
          <td valign="top" style="padding:0 10px 0 0;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
              <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(18, 22, "#111827", "bold", "Georgia,'Times New Roman',serif")}">${parts.name}</td></tr>
              ${parts.titleLine ? `<tr><td colspan="3" style="padding:0 0 5px 0;${textStyle(12, 16, "#475569")}">${parts.titleLine}</td></tr>` : ""}
              ${contactInline(parts)}
              ${addressRow(parts)}
              ${ctaButton(parts)}
              ${parts.credit}
            </table>
          </td>
          <td valign="top" align="right" style="padding:0;white-space:nowrap;">${socialCircleLinks(parts)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildCompactSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="500" style="${tableReset("width:500px;max-width:500px;margin:0;padding:0;")}">
  <tr>
    <td width="58" valign="top" style="width:58px;padding:0 10px 0 0;">${imageBlock(parts, 48, "999px")}</td>
    <td valign="top" style="padding:0;margin:0;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
        <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(15, 19, "#0f172a", "bold")}">${parts.name}${parts.company ? ` <span style="font-weight:normal;color:#64748b;">| ${parts.company}</span>` : ""}</td></tr>
        ${parts.jobTitle ? `<tr><td colspan="3" style="padding:0 0 4px 0;${textStyle(12, 16, "#475569")}">${parts.jobTitle}</td></tr>` : ""}
        ${contactInline(parts)}
        ${parts.credit}
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildCreativeSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="540" style="${tableReset("width:540px;max-width:540px;margin:0;padding:0;")}">
  <tr>
    <td width="92" valign="top" style="width:92px;padding:0 12px 0 0;">${imageBlock(parts, 82, "10px")}</td>
    <td width="4" bgcolor="${parts.color}" style="width:4px;font-size:0;line-height:0;padding:0;margin:0;">&nbsp;</td>
    <td valign="top" style="padding:0 0 0 13px;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
        <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(21, 24, parts.color, "bold")}">${parts.name}</td></tr>
        ${parts.titleLine ? `<tr><td colspan="3" style="padding:0 0 6px 0;${textStyle(13, 18, "#111827", "bold")}">${parts.titleLine}</td></tr>` : ""}
        ${parts.email ? contactLine("Email", parts.email, parts.emailHref, parts.color) : ""}
        ${parts.phone ? contactLine("Phone", parts.phone, parts.phoneHref, parts.color) : ""}
        ${parts.websiteLabel && parts.websiteUrl ? contactLine("Web", parts.websiteLabel, parts.websiteUrl, parts.color) : ""}
        ${socialCircleLinks(parts)}
        ${ctaButton(parts)}
        ${parts.credit}
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildBannerSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="540" style="${tableReset("width:540px;max-width:540px;margin:0;padding:0;")}">
  <tr>
    <td style="padding:0;margin:0;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="${tableReset("width:100%;")}">
        <tr>
          <td width="74" valign="top" style="width:74px;padding:0 12px 0 0;">${imageBlock(parts, 64, "8px")}</td>
          <td valign="top" style="padding:0;margin:0;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableReset()}">
              <tr><td colspan="3" style="padding:0 0 2px 0;${textStyle(18, 22, "#0f172a", "bold")}">${parts.name}</td></tr>
              ${parts.titleLine ? `<tr><td colspan="3" style="padding:0 0 4px 0;${textStyle(13, 17, "#475569", "bold")}">${parts.titleLine}</td></tr>` : ""}
              ${contactInline(parts)}
            </table>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="${tableReset("width:100%;")}">
        ${ctaButton(parts, "bar")}
        ${addressRow(parts)}
        ${parts.credit}
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildClipboardHtml(fragment: string) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff;">${fragment}</body></html>`;
}

function buildSignatureHtml(
  form: SignatureForm,
  imageMode: ImageMode,
  allowDataImages = false,
  template: SignatureTemplate = "modern",
) {
  const parts = getSignatureParts(form, imageMode, allowDataImages);

  switch (template) {
    case "executive":
      return buildExecutiveSignature(parts);
    case "classic":
      return buildClassicSignature(parts);
    case "compact":
      return buildCompactSignature(parts);
    case "creative":
      return buildCreativeSignature(parts);
    case "banner":
      return buildBannerSignature(parts);
    case "modern":
    default:
      return buildModernSignature(parts);
  }
}

function buildPlainText(form: SignatureForm) {
  const lines = [
    form.fullName,
    [form.jobTitle, form.company].filter(Boolean).join(" · "),
    form.email ? `Email: ${form.email}` : "",
    form.phone ? `Phone: ${form.phone}` : "",
    form.website ? `Website: ${form.website}` : "",
    form.address,
    form.ctaText && form.ctaUrl ? `${form.ctaText}: ${form.ctaUrl}` : "",
    form.includeCredit ? "Created with TrackFlow Pro: https://trackflowpro.com/tools/free-email-signature-generator" : "",
  ].filter(Boolean);

  return lines.join("\n");
}

const WIZARD_STEPS: Array<{
  id: WizardStep;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "personal",
    label: "Details",
    title: "Start with the basics",
    description: "Add the name and role that should appear first in the signature.",
  },
  {
    id: "contact",
    label: "Contact",
    title: "Add contact information",
    description: "Keep the contact line clear and easy to click from Gmail or Outlook.",
  },
  {
    id: "image",
    label: "Image",
    title: "Prepare the image",
    description: "Use initials, a public image URL, or optimize an image without uploading it to our server.",
  },
  {
    id: "links",
    label: "Links",
    title: "Add social links and CTA",
    description: "Add only the links that matter so the signature stays clean.",
  },
  {
    id: "style",
    label: "Style",
    title: "Choose brand color",
    description: "Match the signature with the brand color and credit preference.",
  },
  {
    id: "copy",
    label: "Copy",
    title: "Copy and install",
    description: "Copy the final signature, paste it into Gmail or Outlook, and send a test email.",
  },
];

export default function EmailSignatureGenerator() {
  const [form, setForm] = useState<SignatureForm>(DEFAULT_FORM);
  const [imageMode, setImageMode] = useState<ImageMode>("initials");
  const [imageKind, setImageKind] = useState<ImageKind>("profile");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(82);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [optimizedDataUrl, setOptimizedDataUrl] = useState("");
  const [optimizedFileName, setOptimizedFileName] = useState("signature-image.jpg");
  const [imageNotice, setImageNotice] = useState("");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<WizardStep>("personal");
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate>("modern");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const signatureHtml = useMemo(
    () => buildSignatureHtml(form, imageMode, false, selectedTemplate),
    [form, imageMode, selectedTemplate],
  );
  const plainText = useMemo(() => buildPlainText(form), [form]);

  const previewHtml = useMemo(() => {
    if (form.imageUrl || !optimizedDataUrl || imageMode !== "upload") return signatureHtml;
    return buildSignatureHtml({ ...form, imageUrl: optimizedDataUrl }, imageMode, true, selectedTemplate);
  }, [form, imageMode, optimizedDataUrl, selectedTemplate, signatureHtml]);

  function updateField<K extends keyof SignatureForm>(key: K, value: SignatureForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setImageMode("initials");
    setImageKind("profile");
    setOutputFormat("image/jpeg");
    setQuality(82);
    setOriginalSize(0);
    setOptimizedSize(0);
    setOptimizedDataUrl("");
    setOptimizedFileName("signature-image.jpg");
    setImageNotice("");
    setCopyStatus("idle");
    setHtmlCopied(false);
    setActiveStep("personal");
    setSelectedTemplate("modern");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyRichSignature() {
    setCopyStatus("idle");
    try {
      if (typeof window !== "undefined" && "ClipboardItem" in window && navigator.clipboard?.write) {
        const htmlBlob = new Blob([buildClipboardHtml(signatureHtml)], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(signatureHtml);
      }
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2600);
    } catch {
      setCopyStatus("failed");
    }
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(signatureHtml);
      setHtmlCopied(true);
      window.setTimeout(() => setHtmlCopied(false), 2200);
    } catch {
      setHtmlCopied(false);
    }
  }

  function downloadHtml() {
    const blob = new Blob([signatureHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTemplate}-email-signature.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadOptimizedImage() {
    if (!optimizedDataUrl) return;
    const link = document.createElement("a");
    link.href = optimizedDataUrl;
    link.download = optimizedFileName;
    link.click();
  }

  function processImage(file: File, nextKind = imageKind, nextFormat = outputFormat, nextQuality = quality) {
    setImageNotice("");
    setOriginalSize(file.size);

    if (!file.type.startsWith("image/")) {
      setImageNotice("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setImageNotice("Your browser could not optimize this image.");
          return;
        }

        if (nextKind === "profile") {
          const target = 200;
          const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = Math.max(0, Math.floor((img.naturalWidth - sourceSize) / 2));
          const sy = Math.max(0, Math.floor((img.naturalHeight - sourceSize) / 2));
          canvas.width = target;
          canvas.height = target;
          if (nextFormat === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, target, target);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, target, target);
        } else {
          const maxWidth = 320;
          const maxHeight = 130;
          const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
          const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale));
          const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          if (nextFormat === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        const dataUrl = canvas.toDataURL(nextFormat, nextQuality / 100);
        const extension = nextFormat === "image/png" ? "png" : "jpg";
        setOptimizedDataUrl(dataUrl);
        setOptimizedSize(estimateDataUrlBytes(dataUrl));
        setOptimizedFileName(`${nextKind === "profile" ? "signature-profile" : "signature-logo"}.${extension}`);
        setImageMode("upload");
        setImageNotice(
          "Image optimized in your browser. Download it, upload it to your own public image host, then paste that public image URL below.",
        );
      };
      img.onerror = () => setImageNotice("This image could not be opened. Please try another image.");
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    processImage(file);
  }

  function handleKindChange(nextKind: ImageKind) {
    setImageKind(nextKind);
    const file = fileInputRef.current?.files?.[0];
    if (file) processImage(file, nextKind, outputFormat, quality);
  }

  function handleFormatChange(nextFormat: OutputFormat) {
    setOutputFormat(nextFormat);
    const file = fileInputRef.current?.files?.[0];
    if (file) processImage(file, imageKind, nextFormat, quality);
  }

  function handleQualityChange(nextQuality: number) {
    setQuality(nextQuality);
    const file = fileInputRef.current?.files?.[0];
    if (file) processImage(file, imageKind, outputFormat, nextQuality);
  }

  function goToStep(step: WizardStep) {
    setActiveStep(step);
  }

  function goNextStep() {
    const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep);
    const nextStep = WIZARD_STEPS[Math.min(WIZARD_STEPS.length - 1, currentIndex + 1)];
    setActiveStep(nextStep.id);
  }

  function goPreviousStep() {
    const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep);
    const previousStep = WIZARD_STEPS[Math.max(0, currentIndex - 1)];
    setActiveStep(previousStep.id);
  }

  function goTemplate(direction: "previous" | "next") {
    const currentIndex = SIGNATURE_TEMPLATES.findIndex((template) => template.id === selectedTemplate);
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % SIGNATURE_TEMPLATES.length
        : (currentIndex - 1 + SIGNATURE_TEMPLATES.length) % SIGNATURE_TEMPLATES.length;
    setSelectedTemplate(SIGNATURE_TEMPLATES[nextIndex].id);
  }

  const savedPercent = originalSize && optimizedSize ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100)) : 0;
  const publicImageReady = Boolean(form.imageUrl.trim());
  const activeStepIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep);
  const activeStepDetails = WIZARD_STEPS[activeStepIndex] || WIZARD_STEPS[0];
  const progressPercent = Math.round(((activeStepIndex + 1) / WIZARD_STEPS.length) * 100);
  const selectedTemplateIndex = SIGNATURE_TEMPLATES.findIndex((template) => template.id === selectedTemplate);
  const selectedTemplateDetails = SIGNATURE_TEMPLATES[selectedTemplateIndex] || SIGNATURE_TEMPLATES[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === WIZARD_STEPS.length - 1;

  return (
    <section id="signature-generator" className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Premium signature builder
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
              Create once. Preview every design live.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">
              Add a few details step by step, then switch through six polished signatures from the preview panel. Your data stays in the browser.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <InfoPill icon={<ShieldCheck className="h-4 w-4" />} label="No data stored" />
            <InfoPill icon={<ImageUp className="h-4 w-4" />} label="No image hosting cost" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
            <div className="border-b border-slate-200 p-4 dark:border-white/10 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    Step {activeStepIndex + 1} of {WIZARD_STEPS.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{activeStepDetails.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">{activeStepDetails.description}</p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-blue-500/10"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="mt-4 hidden grid-cols-6 gap-2 sm:grid">
                {WIZARD_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={`rounded-2xl border px-2 py-2 text-center text-[11px] font-black transition ${
                      activeStep === step.id
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200"
                        : index < activeStepIndex
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <StepContent
                activeStep={activeStep}
                form={form}
                imageMode={imageMode}
                imageKind={imageKind}
                outputFormat={outputFormat}
                quality={quality}
                fileInputRef={fileInputRef}
                originalSize={originalSize}
                optimizedSize={optimizedSize}
                optimizedDataUrl={optimizedDataUrl}
                imageNotice={imageNotice}
                savedPercent={savedPercent}
                onUpdateField={updateField}
                onSetImageMode={setImageMode}
                onFileChange={handleFileChange}
                onKindChange={handleKindChange}
                onFormatChange={handleFormatChange}
                onQualityChange={handleQualityChange}
                onDownloadOptimizedImage={downloadOptimizedImage}
              />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={goPreviousStep}
                  disabled={isFirstStep}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:bg-blue-500/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={isLastStep ? copyRichSignature : goNextStep}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  {isLastStep ? (copyStatus === "copied" ? "Copied for Gmail" : "Copy final signature") : "Continue"}
                  {isLastStep ? copyStatus === "copied" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
            <div className="border-b border-slate-200 p-4 dark:border-white/10 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300"><LayoutTemplate className="h-4 w-4" />Live preview</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{selectedTemplateDetails.name}</h3>
                  <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">
                    {selectedTemplateDetails.description} <span className="text-blue-600 dark:text-blue-300">Best for: {selectedTemplateDetails.bestFor}.</span>
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  No data stored
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mb-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <button
                  type="button"
                  onClick={() => goTemplate("previous")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:bg-blue-500/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center dark:border-blue-400/20 dark:bg-blue-500/10">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                    Design {selectedTemplateIndex + 1} of {SIGNATURE_TEMPLATES.length}
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">Click next to compare with the same information</div>
                </div>

                <button
                  type="button"
                  onClick={() => goTemplate("next")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
                >
                  Next design
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {imageMode === "upload" && !publicImageReady ? (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Preview can show your optimized local image. For Gmail/Outlook copy, paste a public image URL so the image loads for recipients.
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
                <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-200">
                  <div className="space-y-3 border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                      <span className="w-16 text-slate-500">To:</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                      <span className="w-16 text-slate-500">Subject:</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                  </div>

                  <div className="overflow-x-auto px-5 py-6">
                    <div className="min-w-[520px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {SIGNATURE_TEMPLATES.map((template, index) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                      selectedTemplate === template.id
                        ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">Design {index + 1}</span>
                    <span className="mt-1 block text-xs font-black leading-5">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copyRichSignature}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 sm:col-span-1"
                >
                  {copyStatus === "copied" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyStatus === "copied" ? "Copied" : "Copy signature"}
                </button>

                <button
                  type="button"
                  onClick={copyHtml}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:bg-blue-500/10"
                >
                  <Clipboard className="h-4 w-4" />
                  {htmlCopied ? "HTML copied" : "Copy HTML"}
                </button>

                <button
                  type="button"
                  onClick={downloadHtml}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:bg-white/[0.06]"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Download
                </button>
              </div>

              {copyStatus === "failed" ? (
                <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  Clipboard permission was blocked. Use “Copy HTML” or download the HTML file instead.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepContent({
  activeStep,
  form,
  imageMode,
  imageKind,
  outputFormat,
  quality,
  fileInputRef,
  originalSize,
  optimizedSize,
  optimizedDataUrl,
  imageNotice,
  savedPercent,
  onUpdateField,
  onSetImageMode,
  onFileChange,
  onKindChange,
  onFormatChange,
  onQualityChange,
  onDownloadOptimizedImage,
}: {
  activeStep: WizardStep;
  form: SignatureForm;
  imageMode: ImageMode;
  imageKind: ImageKind;
  outputFormat: OutputFormat;
  quality: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  originalSize: number;
  optimizedSize: number;
  optimizedDataUrl: string;
  imageNotice: string;
  savedPercent: number;
  onUpdateField: <K extends keyof SignatureForm>(key: K, value: SignatureForm[K]) => void;
  onSetImageMode: (mode: ImageMode) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKindChange: (kind: ImageKind) => void;
  onFormatChange: (format: OutputFormat) => void;
  onQualityChange: (quality: number) => void;
  onDownloadOptimizedImage: () => void;
}) {
  if (activeStep === "personal") {
    return (
      <div className="space-y-5">
        <StepNote icon={<UserRound className="h-5 w-5" />} title="Keep it clear" description="The first line should instantly tell people who you are and what you do." />
        <div className="grid gap-4">
          <TextInput label="Full name" value={form.fullName} onChange={(value) => onUpdateField("fullName", value)} />
          <TextInput label="Job title" value={form.jobTitle} onChange={(value) => onUpdateField("jobTitle", value)} />
          <TextInput label="Company" value={form.company} onChange={(value) => onUpdateField("company", value)} />
        </div>
      </div>
    );
  }

  if (activeStep === "contact") {
    return (
      <div className="space-y-5">
        <StepNote icon={<Mail className="h-5 w-5" />} title="Make contact easy" description="Use the exact phone, email, and website you want people to click." />
        <div className="grid gap-4">
          <TextInput label="Email" type="email" value={form.email} onChange={(value) => onUpdateField("email", value)} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => onUpdateField("phone", value)} />
          <TextInput label="Website" value={form.website} onChange={(value) => onUpdateField("website", value)} />
          <TextInput label="Address or short note" value={form.address} onChange={(value) => onUpdateField("address", value)} />
        </div>
      </div>
    );
  }

  if (activeStep === "image") {
    return (
      <div className="space-y-5">
        <StepNote
          icon={<ImageUp className="h-5 w-5" />}
          title="Image without hosting cost"
          description="We optimize the image in your browser. You download it, host it yourself, then paste the public image URL."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <RadioCard label="Use initials" active={imageMode === "initials"} onClick={() => onSetImageMode("initials")} />
          <RadioCard label="Use image URL" active={imageMode === "url"} onClick={() => onSetImageMode("url")} />
          <RadioCard label="Crop & download" active={imageMode === "upload"} onClick={() => onSetImageMode("upload")} />
        </div>

        <TextInput
          label="Public image URL for final signature"
          value={form.imageUrl}
          placeholder="https://example.com/profile-photo.jpg"
          onChange={(value) => {
            onUpdateField("imageUrl", value);
            if (value.trim()) onSetImageMode("url");
          }}
        />

        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectBox
              label="Image type"
              value={imageKind}
              onChange={(value) => onKindChange(value as ImageKind)}
              options={[
                { label: "Profile photo", value: "profile" },
                { label: "Logo", value: "logo" },
              ]}
            />
            <SelectBox
              label="Output format"
              value={outputFormat}
              onChange={(value) => onFormatChange(value as OutputFormat)}
              options={[
                { label: "JPG - smaller", value: "image/jpeg" },
                { label: "PNG - transparent", value: "image/png" },
              ]}
            />
          </div>

          <label className="mt-4 block text-sm font-black text-slate-800 dark:text-slate-200">
            Quality: {quality}%
            <input
              type="range"
              min="60"
              max="92"
              value={quality}
              onChange={(event) => onQualityChange(Number(event.target.value))}
              className="mt-3 block w-full accent-blue-600"
            />
          </label>

          {imageNotice ? (
            <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
              {imageNotice}
            </p>
          ) : null}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex min-h-28 items-center justify-center rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              {optimizedDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimizedDataUrl} alt="Optimized signature asset preview" className="max-h-32 max-w-full rounded-2xl object-contain" />
              ) : (
                <div className="text-center text-sm font-bold text-slate-500">Upload an image to create a lightweight signature asset.</div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Metric label="Before" value={formatBytes(originalSize)} />
              <Metric label="After" value={formatBytes(optimizedSize)} />
              <Metric label="Saved" value={savedPercent ? `${savedPercent}%` : "—"} />
            </div>

            <button
              type="button"
              onClick={onDownloadOptimizedImage}
              disabled={!optimizedDataUrl}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Download optimized image
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeStep === "links") {
    return (
      <div className="space-y-5">
        <StepNote icon={<Link2 className="h-5 w-5" />} title="Add only useful links" description="A clean signature usually performs better than a crowded one." />
        <div className="grid gap-4">
          <TextInput label="LinkedIn URL" value={form.linkedin} onChange={(value) => onUpdateField("linkedin", value)} />
          <TextInput label="Facebook URL" value={form.facebook} onChange={(value) => onUpdateField("facebook", value)} />
          <TextInput label="Instagram URL" value={form.instagram} onChange={(value) => onUpdateField("instagram", value)} />
          <TextInput label="YouTube URL" value={form.youtube} onChange={(value) => onUpdateField("youtube", value)} />
          <TextInput label="CTA button text" value={form.ctaText} onChange={(value) => onUpdateField("ctaText", value)} />
          <TextInput label="CTA button link" value={form.ctaUrl} onChange={(value) => onUpdateField("ctaUrl", value)} />
        </div>
      </div>
    );
  }

  if (activeStep === "style") {
    return (
      <div className="space-y-5">
        <StepNote icon={<Palette className="h-5 w-5" />} title="Make it feel branded" description="Choose a color that matches the business. The preview updates instantly." />

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-sm font-black text-slate-950 dark:text-white">Brand color</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {BRAND_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onUpdateField("brandColor", color)}
                className={`h-10 w-10 rounded-2xl border-4 border-white shadow ring-1 transition hover:-translate-y-0.5 dark:border-slate-950 ${
                  form.brandColor === color ? "ring-4 ring-blue-300" : "ring-slate-200 dark:ring-white/10"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Use ${color} as brand color`}
              />
            ))}
            <input
              type="color"
              value={form.brandColor}
              onChange={(event) => onUpdateField("brandColor", event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-950"
              aria-label="Custom brand color"
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.includeCredit}
              onChange={(event) => onUpdateField("includeCredit", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include “Created with TrackFlow Pro” credit link. Keeping this on helps us keep the tool free.</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepNote icon={<CheckCircle2 className="h-5 w-5" />} title="Ready to use" description="Copy the signature from the preview panel, paste it into Gmail or Outlook, then send a test email to yourself." />

      <div className="grid gap-3">
        <InstallTip title="Gmail" description="Settings → See all settings → Signature → Create new → paste the signature → Save changes." />
        <InstallTip title="Outlook" description="Settings → Mail → Compose and reply → Email signature → paste the signature → Save." />
        <InstallTip title="Image check" description="If the image does not appear, use a public image URL instead of a private preview or local file path." />
      </div>
    </div>
  );
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
      <span className="text-blue-600 dark:text-blue-300">{icon}</span>
      {label}
    </div>
  );
}

function StepNote({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">{icon}</div>
        <div>
          <h4 className="text-base font-black text-slate-950 dark:text-white">{title}</h4>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

function InstallTip({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm font-black text-slate-950 dark:text-white">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder:text-slate-600"
      />
    </label>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition hover:-translate-y-0.5 ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-2 py-3 dark:border-white/10 dark:bg-slate-950/70">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
