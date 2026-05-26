import { ApiError } from "@/lib/trackflow-api/core";
import {
  getDefaultSender,
  getSenderByEmail,
  getSenderById,
  toApiSenderConfig,
} from "@/lib/senders";

export type SenderConfig = {
  id?: string;
  name: string;
  email: string;
  replyToEmail?: string;
  replyToName?: string;
  dailyLimit: number;
};

type LeadForSender = {
  sender_email?: string;
  sender_id?: string;
  senderId?: string;
};

export function mapSharedSender(sender: ReturnType<typeof getDefaultSender>): SenderConfig {
  if (!sender) throw new ApiError("No active sender configured", 500);
  const apiSender = toApiSenderConfig(sender);
  return {
    id: apiSender.id,
    name: apiSender.name,
    email: apiSender.email,
    replyToEmail: apiSender.replyToEmail,
    replyToName: apiSender.replyToName,
    dailyLimit: apiSender.dailyLimit,
  };
}

export function getSenderFromBody(body: any): SenderConfig {
  const senderId = String(body.senderId || body.sender_id || body.sender?.id || "").trim();
  const sender = getSenderById(senderId);

  if (!sender) {
    throw new ApiError("Invalid sender selected. Choose an active sender from app/config/senders.ts", 400);
  }

  return mapSharedSender(sender);
}

export function getSenderFromLead(lead: LeadForSender): SenderConfig {
  const senderById = getSenderById(String(lead.sender_id || lead.senderId || ""));
  const senderByEmail = getSenderByEmail(String(lead.sender_email || ""));
  const sender = senderById || senderByEmail || getDefaultSender();
  return mapSharedSender(sender);
}
