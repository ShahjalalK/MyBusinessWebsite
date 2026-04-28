// import { NextResponse } from 'next/server';
// import { adminDb } from '../../../lib/firebase-admin'; 
// import admin from "firebase-admin";

// export async function GET(req: Request) {
//   try {
//     // ১. অথেন্টিকেশন চেক
//     const authHeader = req.headers.get('x-cron-auth');
//     if (authHeader !== process.env.CRON_SECRET) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ২. কনফিগারেশন লোড করা (ড্যাশবোর্ড থেকে ডেইলি লিমিটসহ)
//     const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
//     if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
//     const configData = configDoc.data() as any;
//     const dailyLimit = configData.daily_followup_limit || 50; 
//     const now = new Date();

//     // --- ৩. ডেইলি সেফটি লক: আজ কয়টি ইমেইল পাঠানো হয়েছে তার হিসাব ---
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0); // আজকের রাত ১২:০০ টা

//     const totalSentTodaySnapshot = await adminDb.collection("outreach_leads")
//       .where("lastFollowUp", ">=", admin.firestore.Timestamp.fromDate(todayStart))
//       .get();

//     const alreadySentToday = totalSentTodaySnapshot.size;

//     // যদি ডেইলি লিমিট শেষ হয়ে যায়, তবে কোড এখানেই থেমে যাবে
//     if (alreadySentToday >= dailyLimit) {
//       console.log(`Daily limit reached (${alreadySentToday}/${dailyLimit}).`);
//       return NextResponse.json({ 
//         success: true, 
//         message: "Daily limit reached. No more emails for today.",
//         alreadySentToday 
//       });
//     }

//     // বাকি কয়টি পাঠানো যাবে (Remaining Quota)
//     const remainingLimit = dailyLimit - alreadySentToday;

//     // ৪. ডাটাবেস থেকে যোগ্য লিডগুলো খুঁজে বের করা (Remaining Limit অনুযায়ী)
//     const querySnapshot = await adminDb.collection("outreach_leads")
//       .where("status", "in", ["opened", "interested", "active"]) 
//       .where("follow_up_count", "<", 5)
//       .where("stopAutomation", "==", false)
//       .orderBy("last_opened", "asc") 
//       .limit(remainingLimit) 
//       .get();

//     const sentEmails: string[] = [];

//     // ৫. প্রতিটি লিডের জন্য লজিক প্রসেস করা
//     for (const docSnapshot of querySnapshot.docs) {
//       const lead = { id: docSnapshot.id, ...docSnapshot.data() } as any;
//       const followUpCount = lead.follow_up_count || 0;
//       const nextStepCount = followUpCount + 1;
//       const currentStepKey = `step${nextStepCount}`;

//       // টাইমিং ক্যালকুলেশন (rounding to 30 mins)
//       const baseTimeObj = lead.lastOpenedAt || lead.last_opened || lead.sentAt;
//       if (!baseTimeObj) continue;

//       const baseTimeDate = new Date(baseTimeObj.toMillis ? baseTimeObj.toMillis() : baseTimeObj);
      
//       const roundedMinutes = Math.floor(baseTimeDate.getMinutes() / 30) * 30;
//       const roundedBaseTime = new Date(baseTimeDate);
//       roundedBaseTime.setMinutes(roundedMinutes, 0, 0);

//       const delayMinutes = lead[`${currentStepKey}Delay`] || 1440; 
//       const scheduledTimeMillis = roundedBaseTime.getTime() + (delayMinutes * 60000);

//       // টাইম গেটকিপার (নির্ধারিত সময়ের আগে পাঠাবে না)
//       if (now.getTime() < scheduledTimeMillis) {
//         continue;
//       }

//       // ৬. কন্টেন্ট সিলেকশন
//       const service = lead.service || 'Email Signature';
//       const stepConfig = configData[service]?.[currentStepKey];
//       if (!stepConfig) continue;

//       const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
//       const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

//       if (!finalVariant || !finalVariant.content) continue;

//       // ৭. Brevo API কল
//       const senderName = lead.sender_name || "Shahjalal Khan";
//       const senderEmail = lead.sender_email || "support@mail.trackflowpro.com";
//       const subject = `Re: ${lead.subject || "Our Discussion"}`;
//       const currentStepTag = `${lead.trackingId || lead.id}_step${nextStepCount}`;

//       const response = await fetch('https://api.brevo.com/v3/smtp/email', {
//         method: 'POST',
//         headers: {
//           'api-key': process.env.BREVO_API_KEY as string,
//           'content-type': 'application/json',
//         },
//         body: JSON.stringify({
//           sender: { name: senderName, email: senderEmail },
//           to: [{ email: lead.email }],
//           replyTo: { email: "shahjalal@trackflowpro.com", name: "Shahjalal Khan" },
//           subject: subject,
//           tags: [currentStepTag], 
//           htmlContent: `
//             <html>
//               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//                 ${finalVariant.content.replace(/{name}/g, lead.name || 'there').replace(/{company}/g, lead.company_name || '')}
//                 <div style="display:none; visibility:hidden; font-size:1px;">${currentStepTag}</div>
//               </body>
//             </html>
//           `,
//         }),
//       });

//       // ৮. ডাটাবেস আপডেট (সফলভাবে পাঠানো হলে)
//       if (response.ok) {
//         await adminDb.collection("outreach_leads").doc(lead.id).update({
//           lastFollowUp: admin.firestore.FieldValue.serverTimestamp(),
//           follow_up_count: nextStepCount,
//           status: nextStepCount >= 5 ? 'finished' : 'sent', 
//           sent_messages: admin.firestore.FieldValue.arrayUnion({
//             step: nextStepCount,
//             subject: subject,
//             trackingTag: currentStepTag,
//             sentAt: admin.firestore.Timestamp.now()
//           })
//         });
//         sentEmails.push(lead.email);
//       }

//       // এপিআই ডিলে (Rate Limit এড়াতে)
//       await new Promise(resolve => setTimeout(resolve, 500)); 
//     }

//     return NextResponse.json({ 
//         success: true, 
//         totalSentInThisRun: sentEmails.length,
//         totalSentTodaySoFar: alreadySentToday + sentEmails.length,
//         emails: sentEmails 
//     });

//   } catch (error: any) {
//     console.error("Cron Error:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }






import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import admin from "firebase-admin";

export async function GET(req: Request) {
  try {
    // ১. অথেন্টিকেশন চেক
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ২. কনফিগারেশন লোড করা
    const configDoc = await adminDb.collection("automation_settings").doc("followup_config").get();
    if (!configDoc.exists) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    
    const configData = configDoc.data() as any;
    const dailyLimit = configData.daily_followup_limit || 50; 
    const now = new Date();

    // ৩. ডেইলি সেফটি লক
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); 

    const totalSentTodaySnapshot = await adminDb.collection("outreach_leads")
      .where("lastFollowUp", ">=", admin.firestore.Timestamp.fromDate(todayStart))
      .get();

    const alreadySentToday = totalSentTodaySnapshot.size;

    if (alreadySentToday >= dailyLimit) {
      console.log(`Daily limit reached (${alreadySentToday}/${dailyLimit}).`);
      return NextResponse.json({ 
        success: true, 
        message: "Daily limit reached. No more emails for today.",
        alreadySentToday 
      });
    }

    const remainingLimit = dailyLimit - alreadySentToday;

    // ৪. ডাটাবেস থেকে যোগ্য লিড খুঁজে বের করা
    const querySnapshot = await adminDb.collection("outreach_leads")
      .where("status", "in", ["opened", "interested", "active"]) 
      .where("follow_up_count", "<", 5)
      .where("stopAutomation", "==", false)
      .orderBy("lastOpenedAt", "asc") 
      .limit(remainingLimit) 
      .get();

    console.log(`🔍 Query Result: Found ${querySnapshot.size} leads in current cycle.`);

    const sentEmails: string[] = [];

    // ৫. প্রতিটি লিডের জন্য লজিক প্রসেস করা
    for (const docSnapshot of querySnapshot.docs) {
      const lead = { id: docSnapshot.id, ...docSnapshot.data() } as any;
      const followUpCount = lead.follow_up_count || 0;
      const nextStepCount = followUpCount + 1;
      const currentStepKey = `step${nextStepCount}`;

      // টাইমিং ক্যালকুলেশন
      const baseTimeObj = lead.lastOpenedAt || lead.last_opened || lead.sentAt;
      if (!baseTimeObj) continue;

      const baseTimeDate = new Date(baseTimeObj.toMillis ? baseTimeObj.toMillis() : baseTimeObj);
      
      const roundedMinutes = Math.floor(baseTimeDate.getMinutes() / 30) * 30;
      const roundedBaseTime = new Date(baseTimeDate);
      roundedBaseTime.setMinutes(roundedMinutes, 0, 0);

      const delayMinutes = lead[`${currentStepKey}Delay`] || 1440; 
      const scheduledTimeMillis = roundedBaseTime.getTime() + (delayMinutes * 60000);
      
      const scheduledDate = new Date(scheduledTimeMillis);
      const diffInMinutes = (scheduledTimeMillis - now.getTime()) / 60000;

      // --- টার্মিনাল লগ শুরু ---
      console.log("------------------------------------------");
      console.log(`📧 Lead: ${lead.email}`);
      console.log(`📊 Next Step: ${currentStepKey}`);
      console.log(`⏰ Scheduled At: ${scheduledDate.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BD Time)`);
      console.log(`⏱️ Current Time: ${now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BD Time)`);

      if (now.getTime() < scheduledTimeMillis) {
        console.log(`⏳ Status: WAITING. Baki ache: ${diffInMinutes.toFixed(2)} minutes.`);
        continue; // সময় না হলে পরের লিডে চলে যাবে
      } else {
        console.log("🚀 Status: READY! Pathano hochche...");
      }
      // --- টার্মিনাল লগ শেষ ---

      // ৬. কন্টেন্ট সিলেকশন
      const service = lead.service || 'Email Signature';
      const stepConfig = configData[service]?.[currentStepKey];
      if (!stepConfig) {
        console.log(`⚠️ Warning: No config found for ${service} ${currentStepKey}`);
        continue;
      }

      const assignedVariantId = lead[`${currentStepKey}AssignedVariant`];
      const finalVariant = stepConfig.variants?.find((v: any) => v.id === assignedVariantId) || stepConfig.variants?.[0];

      if (!finalVariant || !finalVariant.content) continue;

      // ৭. Brevo API কল
      const senderName = lead.sender_name || "Shahjalal Khan";
      const senderEmail = lead.sender_email || "support@mail.trackflowpro.com";
      const subject = `Re: ${lead.subject || "Our Discussion"}`;
      const currentStepTag = `${lead.trackingId || lead.id}_step${nextStepCount}`;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY as string,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: lead.email }],
          replyTo: { email: "shahjalal@trackflowpro.com", name: "Shahjalal Khan" },
          subject: subject,
          tags: [currentStepTag], 
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif;">
                <div>
                  ${finalVariant.content.replace(/{name}/g, lead.name || 'there').replace(/{company}/g, lead.company_name || '')}
                </div>

                <br />
                
                  <span style="font-size: 16px; font-weight: bold; color: #222;">Shahjalal Khan</span><br>
                  <span style="font-size: 14px; color: #666;">Founder Of TrackFlowPro</span><br>
                  <a href="https://trackflowpro.com" style="font-size: 14px; color: #007bff; text-decoration: none;">www.trackflowpro.com</a>
                  
                  <p style="margin-top: 20px; font-size: 10px; color: #bbbbbb; letter-spacing: 0.5px; font-family: monospace;">
                    REF: ${currentStepTag.toUpperCase()} | SECURE_TRACK_VERIFIED
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });

      // ৮. ডাটাবেস আপডেট
      if (response.ok) {
        await adminDb.collection("outreach_leads").doc(lead.id).update({
          lastFollowUp: admin.firestore.FieldValue.serverTimestamp(),
          follow_up_count: nextStepCount,
          status: nextStepCount >= 5 ? 'finished' : 'sent', 
          sent_messages: admin.firestore.FieldValue.arrayUnion({
            step: nextStepCount,
            subject: subject,
            trackingTag: currentStepTag,
            sentAt: admin.firestore.Timestamp.now()
          })
        });
        sentEmails.push(lead.email);
        console.log(`✅ Success: Follow-up sent to ${lead.email}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    return NextResponse.json({ 
        success: true, 
        totalSentInThisRun: sentEmails.length,
        totalSentTodaySoFar: alreadySentToday + sentEmails.length,
        emails: sentEmails 
    });

  } catch (error: any) {
    console.error("Cron Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}