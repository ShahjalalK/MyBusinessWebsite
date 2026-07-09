"use client";

import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Copy,
  ImageUp,
  LayoutTemplate,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ImageMode = "initials" | "url" | "upload";
type ImageKind = "profile" | "logo";
type OutputFormat = "image/jpeg" | "image/png";
type CopyStatus = "idle" | "copied" | "failed";
type BuilderStep = "details" | "templates";
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
    { label: "LinkedIn", short: "in", url: safeUrl(form.linkedin) },
    { label: "Facebook", short: "f", url: safeUrl(form.facebook) },
    { label: "Instagram", short: "ig", url: safeUrl(form.instagram) },
    { label: "YouTube", short: "yt", url: safeUrl(form.youtube) },
  ].filter((link) => link.url);

  const credit = form.includeCredit
    ? `<div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#64748b;">Created with <a href="https://trackflowpro.com/tools/free-email-signature-generator" style="color:${color};text-decoration:none;font-weight:700;">TrackFlow Pro</a></div>`
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

function imageBlock(parts: ReturnType<typeof getSignatureParts>, size = 92, radius = "999px", border = true) {
  const safeRadius = radius;
  if (parts.imageUrl) {
    return `<img src="${parts.imageUrl}" width="${size}" height="${size}" alt="${parts.name}" style="display:block;width:${size}px;height:${size}px;max-width:${size}px;border-radius:${safeRadius};object-fit:cover;${border ? `border:2px solid ${parts.color};` : ""}">`;
  }

  const fontSize = Math.max(17, Math.round(size * 0.28));
  return `<div style="width:${size}px;height:${size}px;border-radius:${safeRadius};background:${parts.color};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:${fontSize}px;font-weight:700;line-height:${size}px;text-align:center;">${parts.initials}</div>`;
}

function socialTextLinks(parts: ReturnType<typeof getSignatureParts>, divider = " | ") {
  if (!parts.socialLinks.length) return "";
  return `<div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">${parts.socialLinks
    .map(
      (link, index) =>
        `${index ? `<span style="color:#94a3b8;">${divider}</span>` : ""}<a href="${link.url}" style="color:${parts.color};text-decoration:none;font-weight:700;">${escapeHtml(link.label)}</a>`,
    )
    .join("")}</div>`;
}

function socialCircleLinks(parts: ReturnType<typeof getSignatureParts>) {
  if (!parts.socialLinks.length) return "";
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:8px;"><tr>${parts.socialLinks
    .map(
      (link) =>
        `<td style="padding-right:5px;"><a href="${link.url}" aria-label="${escapeHtml(link.label)}" style="display:block;width:23px;height:23px;border-radius:999px;border:1px solid ${parts.color};font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;line-height:23px;text-align:center;color:${parts.color};text-decoration:none;">${escapeHtml(link.short)}</a></td>`,
    )
    .join("")}</tr></table>`;
}

function contactLine(label: string, value: string, url: string, color: string) {
  if (!value) return "";
  const content = url
    ? `<a href="${url}" style="color:${color};text-decoration:none;font-weight:600;">${value}</a>`
    : `<span style="color:#334155;">${value}</span>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#334155;"><span style="color:#64748b;font-weight:700;">${label}:</span> ${content}</div>`;
}

function contactInline(parts: ReturnType<typeof getSignatureParts>) {
  const items = [
    parts.phone ? `<a href="${parts.phoneHref}" style="color:#334155;text-decoration:none;font-weight:600;">${parts.phone}</a>` : "",
    parts.email ? `<a href="${parts.emailHref}" style="color:#334155;text-decoration:none;font-weight:600;">${parts.email}</a>` : "",
    parts.websiteLabel && parts.websiteUrl
      ? `<a href="${parts.websiteUrl}" style="color:#334155;text-decoration:none;font-weight:600;">${parts.websiteLabel}</a>`
      : "",
  ].filter(Boolean);

  if (!items.length) return "";
  return `<div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#334155;">${items.join(
    `<span style="color:${parts.color};font-weight:700;"> &nbsp;•&nbsp; </span>`,
  )}</div>`;
}

function ctaButton(parts: ReturnType<typeof getSignatureParts>, variant: "pill" | "bar" = "pill") {
  if (!parts.ctaUrl || !parts.ctaText) return "";

  if (variant === "bar") {
    return `<div style="margin-top:10px;"><a href="${parts.ctaUrl}" style="display:block;background:${parts.color};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:18px;text-decoration:none;text-align:center;padding:9px 12px;border-radius:8px;">${parts.ctaText}</a></div>`;
  }

  return `<div style="margin-top:10px;"><a href="${parts.ctaUrl}" style="display:inline-block;border-radius:999px;background:${parts.color};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:16px;text-decoration:none;padding:8px 12px;">${parts.ctaText}</a></div>`;
}

function buildModernSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:560px;">
  <tr>
    <td style="vertical-align:middle;padding:0 15px 0 0;">${imageBlock(parts, 92, parts.imageMode === "url" ? "18px" : "999px")}</td>
    <td style="vertical-align:middle;border-left:2px solid ${parts.color};padding:0 0 0 15px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:23px;font-weight:700;color:#0f172a;">${parts.name}</div>
      ${parts.titleLine ? `<div style="margin-top:2px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;font-weight:600;color:#475569;">${parts.titleLine}</div>` : ""}
      <div style="margin-top:8px;">
        ${contactLine("Email", parts.email, parts.emailHref, parts.color)}
        ${contactLine("Phone", parts.phone, parts.phoneHref, parts.color)}
        ${parts.websiteLabel && parts.websiteUrl ? contactLine("Web", parts.websiteLabel, parts.websiteUrl, parts.color) : ""}
        ${parts.address ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#64748b;">${parts.address}</div>` : ""}
      </div>
      ${socialTextLinks(parts)}
      ${ctaButton(parts)}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
}

function buildExecutiveSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:590px;">
  <tr>
    <td style="border-top:4px solid ${parts.color};border-bottom:1px solid #e2e8f0;padding:16px 18px 14px 18px;background:#ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="vertical-align:middle;padding-right:16px;width:82px;">${imageBlock(parts, 76, "16px")}</td>
          <td style="vertical-align:middle;padding-right:14px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:25px;font-weight:700;color:${parts.color};">${parts.name}</div>
            ${parts.titleLine ? `<div style="margin-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#334155;font-weight:600;">${parts.titleLine}</div>` : ""}
            ${socialCircleLinks(parts)}
          </td>
          <td style="vertical-align:middle;border-left:1px solid #e2e8f0;padding-left:14px;min-width:190px;">
            ${contactLine("P", parts.phone, parts.phoneHref, parts.color)}
            ${contactLine("E", parts.email, parts.emailHref, parts.color)}
            ${parts.websiteLabel && parts.websiteUrl ? contactLine("W", parts.websiteLabel, parts.websiteUrl, parts.color) : ""}
          </td>
        </tr>
      </table>
      ${parts.address ? `<div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#64748b;">${parts.address}</div>` : ""}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
}

function buildClassicSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:620px;border-bottom:2px solid ${parts.color};padding-bottom:8px;">
  <tr>
    <td style="vertical-align:top;padding:0 12px 8px 0;">${imageBlock(parts, 86, "8px", false)}</td>
    <td style="vertical-align:top;padding:0 0 8px 0;width:100%;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="vertical-align:top;padding-right:10px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:22px;font-weight:700;color:#111827;">${parts.name}</div>
            ${parts.titleLine ? `<div style="margin-top:2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;color:#475569;">${parts.titleLine}</div>` : ""}
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">${socialCircleLinks(parts)}</td>
        </tr>
      </table>
      ${contactInline(parts)}
      ${parts.address ? `<div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#64748b;">${parts.address}</div>` : ""}
      ${ctaButton(parts)}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
}

function buildCompactSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:520px;">
  <tr>
    <td style="vertical-align:middle;padding-right:10px;">${imageBlock(parts, 54, "999px")}</td>
    <td style="vertical-align:middle;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:19px;font-weight:700;color:#0f172a;">${parts.name}${parts.company ? ` <span style="font-weight:500;color:#64748b;">| ${parts.company}</span>` : ""}</div>
      ${parts.jobTitle ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;color:#475569;">${parts.jobTitle}</div>` : ""}
      ${contactInline(parts)}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
}

function buildCreativeSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:585px;">
  <tr>
    <td style="vertical-align:middle;padding:0 14px 0 0;">${imageBlock(parts, 104, "18px")}</td>
    <td style="vertical-align:middle;padding:0 0 0 14px;border-left:5px solid ${parts.color};">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:27px;font-weight:800;letter-spacing:-0.5px;color:${parts.color};">${parts.name}</div>
      ${parts.titleLine ? `<div style="margin-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;font-weight:600;">${parts.titleLine}</div>` : ""}
      ${socialCircleLinks(parts)}
      <div style="margin-top:8px;">
        ${parts.email ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#334155;"><a href="${parts.emailHref}" style="color:#334155;text-decoration:none;">${parts.email}</a></div>` : ""}
        ${parts.phone ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#334155;"><a href="${parts.phoneHref}" style="color:#334155;text-decoration:none;">${parts.phone}</a></div>` : ""}
        ${parts.websiteLabel && parts.websiteUrl ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#334155;"><a href="${parts.websiteUrl}" style="color:${parts.color};text-decoration:none;font-weight:700;">${parts.websiteLabel}</a></div>` : ""}
      </div>
      ${ctaButton(parts)}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
}

function buildBannerSignature(parts: ReturnType<typeof getSignatureParts>) {
  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:600px;">
  <tr>
    <td style="padding:0 0 9px 0;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="vertical-align:middle;padding-right:13px;width:78px;">${imageBlock(parts, 72, "14px")}</td>
          <td style="vertical-align:middle;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:23px;font-weight:800;color:#0f172a;">${parts.name}</div>
            ${parts.titleLine ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#475569;font-weight:600;">${parts.titleLine}</div>` : ""}
            ${contactInline(parts)}
          </td>
        </tr>
      </table>
      ${ctaButton(parts, "bar")}
      ${parts.address ? `<div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#64748b;">${parts.address}</div>` : ""}
      ${parts.credit}
    </td>
  </tr>
</table>`.trim();
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
  const [builderStep, setBuilderStep] = useState<BuilderStep>("details");
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

  function getTemplatePreview(template: SignatureTemplate) {
    if (form.imageUrl || !optimizedDataUrl || imageMode !== "upload") {
      return buildSignatureHtml(form, imageMode, false, template);
    }

    return buildSignatureHtml({ ...form, imageUrl: optimizedDataUrl }, imageMode, true, template);
  }

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
    setBuilderStep("details");
    setSelectedTemplate("modern");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyRichSignature() {
    setCopyStatus("idle");
    try {
      if (typeof window !== "undefined" && "ClipboardItem" in window && navigator.clipboard?.write) {
        const htmlBlob = new Blob([signatureHtml], { type: "text/html" });
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
          "Image optimized in your browser. Download it, upload it to your own public image host, then paste that image URL below.",
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

  const savedPercent = originalSize && optimizedSize ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100)) : 0;
  const publicImageReady = Boolean(form.imageUrl.trim());
  const selectedTemplateDetails = SIGNATURE_TEMPLATES.find((template) => template.id === selectedTemplate) || SIGNATURE_TEMPLATES[0];

  return (
    <section id="signature-generator" className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-5 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none sm:grid-cols-2 sm:p-4">
        <button
          type="button"
          onClick={() => setBuilderStep("details")}
          className={`rounded-2xl px-4 py-3 text-left transition ${
            builderStep === "details"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-50 text-slate-700 hover:bg-blue-50 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-blue-500/10"
          }`}
        >
          <span className="block text-xs font-black uppercase tracking-[0.18em] opacity-80">Step 1</span>
          <span className="mt-1 block text-sm font-black">Add information & image</span>
        </button>

        <button
          type="button"
          onClick={() => setBuilderStep("templates")}
          className={`rounded-2xl px-4 py-3 text-left transition ${
            builderStep === "templates"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-50 text-slate-700 hover:bg-blue-50 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-blue-500/10"
          }`}
        >
          <span className="block text-xs font-black uppercase tracking-[0.18em] opacity-80">Step 2</span>
          <span className="mt-1 block text-sm font-black">Choose 1 of 6 professional designs</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none sm:p-6">
          {builderStep === "details" ? (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Signature details</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Build your signature</h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-blue-500/10"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Full name" value={form.fullName} onChange={(value) => updateField("fullName", value)} />
                <TextInput label="Job title" value={form.jobTitle} onChange={(value) => updateField("jobTitle", value)} />
                <TextInput label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
                <TextInput label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
                <TextInput label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
                <TextInput label="Website" value={form.website} onChange={(value) => updateField("website", value)} />
                <div className="sm:col-span-2">
                  <TextInput label="Address or short note" value={form.address} onChange={(value) => updateField("address", value)} />
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <ImageUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">Image setup without hosting cost</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                      Crop and optimize the image here, download it, upload it to your own public image host, then paste the final image URL. Nothing is uploaded to TrackFlow Pro.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <RadioCard label="Use initials" active={imageMode === "initials"} onClick={() => setImageMode("initials")} />
                  <RadioCard label="Use image URL" active={imageMode === "url"} onClick={() => setImageMode("url")} />
                  <RadioCard label="Crop & download" active={imageMode === "upload"} onClick={() => setImageMode("upload")} />
                </div>

                <div className="mt-4">
                  <TextInput
                    label="Public image URL for final signature"
                    value={form.imageUrl}
                    placeholder="https://example.com/profile-photo.jpg"
                    onChange={(value) => {
                      updateField("imageUrl", value);
                      if (value.trim()) setImageMode("url");
                    }}
                  />
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-500">
                    Gmail and Outlook need a public image URL. Uploaded files here are only processed locally in your browser.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-blue-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                      />

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <SelectBox
                          label="Image type"
                          value={imageKind}
                          onChange={(value) => handleKindChange(value as ImageKind)}
                          options={[
                            { label: "Profile photo", value: "profile" },
                            { label: "Logo", value: "logo" },
                          ]}
                        />
                        <SelectBox
                          label="Output format"
                          value={outputFormat}
                          onChange={(value) => handleFormatChange(value as OutputFormat)}
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
                          onChange={(event) => handleQualityChange(Number(event.target.value))}
                          className="mt-3 block w-full accent-blue-600"
                        />
                      </label>

                      {imageNotice ? (
                        <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                          {imageNotice}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Optimized image</p>
                      <div className="mt-4 flex min-h-28 items-center justify-center rounded-2xl bg-white p-4 dark:bg-slate-950">
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
                        onClick={downloadOptimizedImage}
                        disabled={!optimizedDataUrl}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        Download optimized image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextInput label="LinkedIn URL" value={form.linkedin} onChange={(value) => updateField("linkedin", value)} />
                <TextInput label="Facebook URL" value={form.facebook} onChange={(value) => updateField("facebook", value)} />
                <TextInput label="Instagram URL" value={form.instagram} onChange={(value) => updateField("instagram", value)} />
                <TextInput label="YouTube URL" value={form.youtube} onChange={(value) => updateField("youtube", value)} />
                <TextInput label="CTA text" value={form.ctaText} onChange={(value) => updateField("ctaText", value)} />
                <TextInput label="CTA link" value={form.ctaUrl} onChange={(value) => updateField("ctaUrl", value)} />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-black text-slate-950 dark:text-white">Brand color</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateField("brandColor", color)}
                      className="h-10 w-10 rounded-2xl border-4 border-white shadow ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:border-slate-950 dark:ring-white/10"
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color} as brand color`}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(event) => updateField("brandColor", event.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-950"
                    aria-label="Custom brand color"
                  />
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.includeCredit}
                    onChange={(event) => updateField("includeCredit", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include “Created with TrackFlow Pro” credit link. Keeping this on helps us keep the tool free.</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setBuilderStep("templates")}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                Next: choose professional design
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div>
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Design templates</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Choose a professional signature style</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">
                    Same information, six polished layouts. Pick the one that fits the brand, then copy it for Gmail or Outlook.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {SIGNATURE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`overflow-hidden rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 ${
                      selectedTemplate === template.id
                        ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-100 dark:border-blue-400/40 dark:bg-blue-500/10 dark:shadow-none"
                        : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-950 dark:text-white">{template.name}</span>
                          {selectedTemplate === template.id ? (
                            <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Selected</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">{template.description}</p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Best for: {template.bestFor}</p>
                      </div>
                    </div>

                    <div className="mt-4 h-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10">
                      <div style={{ transform: "scale(0.58)", transformOrigin: "top left", width: "760px" }} dangerouslySetInnerHTML={{ __html: getTemplatePreview(template.id) }} />
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setBuilderStep("details")}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:bg-blue-500/10"
              >
                Edit information
              </button>
            </div>
          )}
        </div>

        <div className="sticky top-24 space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Live preview</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{selectedTemplateDetails.name}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">{selectedTemplateDetails.description}</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                No data stored
              </div>
            </div>

            {imageMode === "upload" && !publicImageReady ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                Preview can show your optimized local image, but final Gmail/Outlook copy needs a public image URL. Paste the hosted image URL before copying if you want the image to appear everywhere.
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="min-w-[520px] rounded-2xl bg-white p-5 dark:bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyRichSignature}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              >
                {copyStatus === "copied" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copyStatus === "copied" ? "Copied for Gmail" : "Copy signature"}
              </button>

              <button
                type="button"
                onClick={copyHtml}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:bg-blue-500/10"
              >
                <Clipboard className="h-4 w-4" />
                {htmlCopied ? "HTML copied" : "Copy HTML"}
              </button>
            </div>

            <button
              type="button"
              onClick={downloadHtml}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:bg-white/[0.06]"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Download HTML file
            </button>

            {copyStatus === "failed" ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                Clipboard permission was blocked. Use “Copy HTML” or download the HTML file instead.
              </p>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5 dark:border-blue-400/20 dark:bg-blue-500/10 sm:p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">Best result checklist</h3>
                <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                  <li>Choose the template after adding the real information.</li>
                  <li>Use JPG for profile photos and PNG for transparent logos.</li>
                  <li>Use a public image URL, not a private Google Drive preview link.</li>
                  <li>Test the signature by sending one email to yourself first.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
