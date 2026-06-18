/**
 * Mock email banks for Tasks 5 & 6 (email-classification).
 *
 * Each task = 15 emails. Each email's body is sized for ~normal viewing
 * distance (the EmailMockup CSS bumps body font-size to 18px). Categories
 * are roughly balanced across each set.
 */

import type { MockEmail } from "../components/EmailMockup";

export const TASK3_EMAILS: MockEmail[] = [
  {
    id: "t3-01",
    subject: "WiFi password rotated this morning",
    sender_name: "IT Helpdesk",
    sender_addr: "helpdesk@company.com",
    timestamp: "9:02 AM (15 minutes ago)",
    body:
      "Hi team,\n\nWe rotated the office WiFi password at 8 AM today. The new password is posted on the whiteboard near reception. Reconnect your devices when you have a moment.\n\n– IT Helpdesk",
    category: "Update",
  },
  {
    id: "t3-02",
    subject: "Can you forward the contract draft?",
    sender_name: "Eleanor Mbeki",
    sender_addr: "e.mbeki@company.com",
    timestamp: "8:48 AM (29 minutes ago)",
    body:
      "Hi,\n\nDo you have the latest contract draft from legal? Could you forward it over when you get a chance? I want to start the redline before our 2 PM meeting.\n\nThanks,\nEleanor",
    category: "Question/Request",
  },
  {
    id: "t3-03",
    subject: "🎁 Your FREE $500 gift card is waiting!",
    sender_name: "Reward Express",
    sender_addr: "claim@reward-express-now.shop",
    timestamp: "5:12 AM (4 hours ago)",
    body:
      "Congratulations! You have been selected to receive a $500 gift card.\n\nClick the link below within 24 hours to claim before someone else does. No purchase necessary — just verify your shipping details!",
    category: "Advertisement/Spam",
  },
  {
    id: "t3-04",
    subject: "Cafeteria hours change starting Monday",
    sender_name: "Facilities",
    sender_addr: "facilities@company.com",
    timestamp: "Yesterday, 3:50 PM",
    body:
      "Hello,\n\nStarting Monday, the cafeteria will open at 7:30 AM and close at 2:30 PM. The coffee bar remains open until 4 PM. No action needed — just a heads up.\n\n– Facilities",
    category: "Update",
  },
  {
    id: "t3-05",
    subject: "Available for a 10-minute call this afternoon?",
    sender_name: "Hiroshi Yamada",
    sender_addr: "h.yamada@partner-co.com",
    timestamp: "10:20 AM (10 minutes ago)",
    body:
      "Hi,\n\nWould you have 10 minutes this afternoon to talk through the integration spec? I'm flexible between 1 PM and 4 PM. Let me know what works on your end.\n\nThanks,\nHiroshi",
    category: "Question/Request",
  },
  {
    id: "t3-06",
    subject: "Doctor's secret: melt 20 lbs in 14 days",
    sender_name: "SlimDaily Tips",
    sender_addr: "tips@slimdaily-trial.online",
    timestamp: "4:30 AM (5 hours ago)",
    body:
      "One simple morning ritual is helping people drop 20+ pounds in 14 days.\n\nNo diet, no exercise — just one trick. Get your free trial bottle today. Pay only $4.99 shipping.\n\nLimited stock available!",
    category: "Advertisement/Spam",
  },
  {
    id: "t3-07",
    subject: "Q2 report posted on the portal",
    sender_name: "Finance Team",
    sender_addr: "finance@company.com",
    timestamp: "Yesterday, 1:15 PM",
    body:
      "Team,\n\nThe Q2 quarterly report is now available on the intranet portal under Documents → Reports → 2026 → Q2. No action required — for your reference.\n\n– Finance",
    category: "Update",
  },
  {
    id: "t3-08",
    subject: "Need your input on the FY27 budget proposal",
    sender_name: "Aaron Cole",
    sender_addr: "a.cole@company.com",
    timestamp: "11:05 AM (now)",
    body:
      "Hi,\n\nCould you review the attached FY27 budget proposal and share your feedback by Friday? Specifically I'd like your take on the equipment line and the contractor estimate.\n\nThanks!\nAaron",
    category: "Question/Request",
  },
  {
    id: "t3-09",
    subject: "🚀 Make $5,000/week from home — proven system!",
    sender_name: "EZ Income System",
    sender_addr: "info@ez-income-blueprint.click",
    timestamp: "3:55 AM (6 hours ago)",
    body:
      "Are you tired of your 9–5? Ordinary people are making $5,000/week from home using our proven system.\n\nNo skills, no experience, no startup costs. Watch the free training video below — it might change your life!",
    category: "Advertisement/Spam",
  },
  {
    id: "t3-10",
    subject: "Elevator maintenance Wednesday morning",
    sender_name: "Building Operations",
    sender_addr: "ops@company.com",
    timestamp: "Yesterday, 4:25 PM",
    body:
      "All staff:\n\nThe east elevator will be out of service Wednesday from 7 AM to 11 AM for routine maintenance. Use the west elevator or the stairs during that window.\n\n– Building Operations",
    category: "Update",
  },
  {
    id: "t3-11",
    subject: "Could you review the meeting notes?",
    sender_name: "Vanessa Chen",
    sender_addr: "v.chen@company.com",
    timestamp: "9:36 AM (1 hour ago)",
    body:
      "Hi,\n\nI wrote up the notes from yesterday's planning meeting. Would you mind reviewing and letting me know if I missed anything before I send them out to the wider team?\n\nThanks,\nVanessa",
    category: "Question/Request",
  },
  {
    id: "t3-12",
    subject: "⚠ LAST CHANCE: crypto fortune closes tonight",
    sender_name: "Crypto Wealth Insider",
    sender_addr: "alerts@crypto-wealth-pro.tk",
    timestamp: "2:00 AM (7 hours ago)",
    body:
      "This is your LAST CHANCE to join the elite trading group that turned $1,000 into $87,432 in just 11 weeks.\n\nDoors close at midnight tonight. Click below to lock in your spot before it's too late!",
    category: "Advertisement/Spam",
  },
  {
    id: "t3-13",
    subject: "New travel reimbursement form goes live Aug 1",
    sender_name: "Accounts Payable",
    sender_addr: "ap@company.com",
    timestamp: "Tuesday, 11:00 AM",
    body:
      "Team,\n\nA new travel reimbursement form replaces the current one on August 1. All submissions after that date must use the new template, available on the intranet. Existing submissions are unaffected.\n\n– Accounts Payable",
    category: "Update",
  },
  {
    id: "t3-14",
    subject: "Could you share dashboard access with my intern?",
    sender_name: "Felix Hartman",
    sender_addr: "f.hartman@company.com",
    timestamp: "10:42 AM (35 minutes ago)",
    body:
      "Hi,\n\nWould you be able to add my new intern, Maria López (m.lopez@company.com), to the analytics dashboard? Read-only access is fine. She starts pulling data tomorrow.\n\nThanks!\nFelix",
    category: "Question/Request",
  },
  {
    id: "t3-15",
    subject: "Limited offer: brain booster supplement — 70% off!",
    sender_name: "BrainPeak Labs",
    sender_addr: "offers@brainpeak-labs.biz",
    timestamp: "1:18 AM (8 hours ago)",
    body:
      "Boost your memory, focus, and mental energy with the #1 doctor-recommended nootropic.\n\nToday only: 70% off + free shipping. Try risk-free for 30 days. Order now — supplies running low!",
    category: "Advertisement/Spam",
  },
];

export const TASK5_EMAILS: MockEmail[] = [
  {
    id: "t5-01",
    subject: "New room for today's meeting",
    sender_name: "Office Manager",
    sender_addr: "office@company.com",
    timestamp: "10:32 AM (3 minutes ago)",
    body:
      "Hi team,\n\nWe've been moved to Room 214 for the 2:00 PM meeting. Same agenda as before.\n\nSee you there!\n– Office Manager",
    category: "Update",
  },
  {
    id: "t5-02",
    subject: "Quick question about the Q3 report draft",
    sender_name: "Maya Patel",
    sender_addr: "m.patel@company.com",
    timestamp: "9:48 AM (47 minutes ago)",
    body:
      "Hey,\n\nCould you confirm whether the revenue numbers on page 3 should include the partnership deal? I want to make sure we're using the right figure before I finalize the charts.\n\nThanks,\nMaya",
    category: "Question/Request",
  },
  {
    id: "t5-03",
    subject: "🔥 50% OFF this weekend only — don't miss out!",
    sender_name: "MegaDeals",
    sender_addr: "deals@megadeals-promo.com",
    timestamp: "8:12 AM (2 hours ago)",
    body:
      "MASSIVE WEEKEND SALE!\n\nGet 50% off every item in our store — this weekend only. Use code SAVE50 at checkout.\n\nShop now before it's gone! Free shipping on orders over $25.",
    category: "Advertisement/Spam",
  },
  {
    id: "t5-04",
    subject: "Server maintenance window — Saturday 8 PM",
    sender_name: "IT Operations",
    sender_addr: "it-ops@company.com",
    timestamp: "Yesterday, 4:15 PM",
    body:
      "All staff:\n\nThe primary file server will be offline for maintenance from 8 PM to 11 PM this Saturday. Plan accordingly and save any critical work before then.\n\n– IT Ops",
    category: "Update",
  },
  {
    id: "t5-05",
    subject: "Can you review the slides before Thursday?",
    sender_name: "James Whitfield",
    sender_addr: "j.whitfield@company.com",
    timestamp: "7:55 AM (3 hours ago)",
    body:
      "Hi,\n\nI've attached the draft slides for the client presentation. Could you take a look and let me know if anything is missing? I'd like to send the final version by Thursday morning.\n\nAppreciate it,\nJames",
    category: "Question/Request",
  },
  {
    id: "t5-06",
    subject: "You've been pre-approved for a $25,000 line of credit",
    sender_name: "QuickCredit Bank",
    sender_addr: "no-reply@quickcredit-offers.net",
    timestamp: "6:02 AM (5 hours ago)",
    body:
      "Congratulations! You are pre-approved for an instant credit line of up to $25,000.\n\nClick here to claim within 24 hours. Limited-time offer. Apply now!",
    category: "Advertisement/Spam",
  },
  {
    id: "t5-07",
    subject: "Updated payroll schedule for July",
    sender_name: "Payroll Team",
    sender_addr: "payroll@company.com",
    timestamp: "Yesterday, 11:20 AM",
    body:
      "Hi everyone,\n\nDue to the holiday on July 4, paychecks will be issued on July 3 instead of July 5. No action is needed on your end.\n\nThanks,\nPayroll",
    category: "Update",
  },
  {
    id: "t5-08",
    subject: "Are you free for a 15-minute call tomorrow?",
    sender_name: "Priya Desai",
    sender_addr: "priya.d@partner-co.com",
    timestamp: "Yesterday, 6:30 PM",
    body:
      "Hi,\n\nWould you have 15 minutes tomorrow to talk through the data-sharing agreement? Any time between 10 AM and 3 PM works on my end.\n\nLet me know what suits you.\n\nBest,\nPriya",
    category: "Question/Request",
  },
  {
    id: "t5-09",
    subject: "WIN A FREE iPhone 15 — JUST CLICK HERE!",
    sender_name: "Mega Prize Draw",
    sender_addr: "winner@prize-draws-now.biz",
    timestamp: "5:18 AM (6 hours ago)",
    body:
      "You are TODAY'S LUCKY WINNER!!! 🎉\n\nClaim your brand-new iPhone 15 right now. No purchase necessary. Click here and enter your details within 1 hour or the prize will be forfeited!",
    category: "Advertisement/Spam",
  },
  {
    id: "t5-10",
    subject: "Office holiday closure dates",
    sender_name: "Human Resources",
    sender_addr: "hr@company.com",
    timestamp: "Tuesday, 2:10 PM",
    body:
      "Dear staff,\n\nThe office will be closed from December 24 through January 1. Normal operations resume on January 2. Please plan deadlines and PTO requests accordingly.\n\n– HR",
    category: "Update",
  },
  {
    id: "t5-11",
    subject: "Could you share the dataset folder with me?",
    sender_name: "Daniel Ortiz",
    sender_addr: "d.ortiz@company.com",
    timestamp: "11:05 AM (10 minutes ago)",
    body:
      "Hi,\n\nWould you mind adding me to the shared Drive folder for the participant dataset? I need read access to start the analysis this afternoon.\n\nThanks!\nDan",
    category: "Question/Request",
  },
  {
    id: "t5-12",
    subject: "Last chance — extended warranty expiring soon",
    sender_name: "AutoShield Warranty",
    sender_addr: "alerts@autoshield-warranty.co",
    timestamp: "4:00 AM (7 hours ago)",
    body:
      "Your vehicle warranty is set to expire. Act now before it's too late!\n\nCall 1-800-555-0199 to renew at our lowest price ever. Limited spots remaining today.",
    category: "Advertisement/Spam",
  },
  {
    id: "t5-13",
    subject: "Cafeteria menu change starting next week",
    sender_name: "Facilities",
    sender_addr: "facilities@company.com",
    timestamp: "Yesterday, 3:45 PM",
    body:
      "Hi all,\n\nStarting next Monday, the cafeteria will run on a new rotating menu. The full schedule is posted on the floor 2 notice board and on the intranet portal.\n\n– Facilities",
    category: "Update",
  },
  {
    id: "t5-14",
    subject: "Need your sign-off on the budget by Friday",
    sender_name: "Lena Kowalski",
    sender_addr: "l.kowalski@company.com",
    timestamp: "10:50 AM (25 minutes ago)",
    body:
      "Hi,\n\nCan you review and sign off on the attached departmental budget by end of day Friday? Let me know if anything needs adjustment.\n\nThanks,\nLena",
    category: "Question/Request",
  },
  {
    id: "t5-15",
    subject: "🚨 Crypto millionaires don't want you to see this!",
    sender_name: "Crypto Insider",
    sender_addr: "tips@crypto-insider-news.tk",
    timestamp: "3:22 AM (8 hours ago)",
    body:
      "I turned $100 into $84,000 in 3 weeks using ONE simple trick that banks HATE.\n\nWatch the free 7-minute video before they take it down. Click here to start earning today!",
    category: "Advertisement/Spam",
  },
];

export const TASK6_EMAILS: MockEmail[] = [
  {
    id: "t6-01",
    subject: "Building access card system update tonight",
    sender_name: "Security Office",
    sender_addr: "security@company.com",
    timestamp: "1:12 PM (8 minutes ago)",
    body:
      "Hi all,\n\nThe access card system will be updated tonight from 1 AM to 3 AM. Cards may briefly not work during that window. Use the security desk if you need entry.\n\n– Security",
    category: "Update",
  },
  {
    id: "t6-02",
    subject: "Could you forward last month's vendor list?",
    sender_name: "Rachel Nguyen",
    sender_addr: "r.nguyen@company.com",
    timestamp: "12:45 PM (35 minutes ago)",
    body:
      "Hi,\n\nDo you still have the vendor list from last month's procurement review? I'd appreciate it if you could forward it to me — I'm trying to match a few invoices.\n\nThanks!\nRachel",
    category: "Question/Request",
  },
  {
    id: "t6-03",
    subject: "Earn $5000/week working from home — NO experience needed!",
    sender_name: "Work From Home Pros",
    sender_addr: "jobs@wfh-easy-money.click",
    timestamp: "5:01 AM (8 hours ago)",
    body:
      "Tired of your job? Make up to $5,000 PER WEEK from your couch!\n\nNo skills, no resume, no interviews. Just sign up below and start earning today!\n\nLIMITED SLOTS — APPLY NOW!",
    category: "Advertisement/Spam",
  },
  {
    id: "t6-04",
    subject: "New benefits portal launches July 1",
    sender_name: "Benefits Admin",
    sender_addr: "benefits@company.com",
    timestamp: "Yesterday, 5:30 PM",
    body:
      "Team,\n\nOur new benefits portal goes live July 1. The old portal will redirect automatically. Your existing elections carry over — no action is required at this time.\n\n– Benefits",
    category: "Update",
  },
  {
    id: "t6-05",
    subject: "Quick favor — can you proofread this email?",
    sender_name: "Kenji Tanaka",
    sender_addr: "k.tanaka@company.com",
    timestamp: "11:30 AM (1 hour ago)",
    body:
      "Hey,\n\nWould you mind giving the attached client email a quick proofread before I send it? I want to make sure the tone is right. Just a few paragraphs.\n\nThanks!\nKenji",
    category: "Question/Request",
  },
  {
    id: "t6-06",
    subject: "Lose 30 pounds in 3 weeks — doctor reveals trick",
    sender_name: "HealthyLiving Tips",
    sender_addr: "info@healthtips-trial.shop",
    timestamp: "2:30 AM (10 hours ago)",
    body:
      "One weird trick a doctor doesn't want you to know!\n\nMelt belly fat overnight with this natural supplement. Free trial bottle available — pay only shipping. Order now!",
    category: "Advertisement/Spam",
  },
  {
    id: "t6-07",
    subject: "New parking garage opens Monday",
    sender_name: "Operations",
    sender_addr: "ops@company.com",
    timestamp: "Yesterday, 9:20 AM",
    body:
      "Hello everyone,\n\nThe new South Garage opens Monday. Your existing parking pass works automatically. Enter from Locust St or Maple Ave.\n\n– Operations",
    category: "Update",
  },
  {
    id: "t6-08",
    subject: "Quick — what time works for our 1:1 this week?",
    sender_name: "Sara Lindqvist",
    sender_addr: "sara.l@company.com",
    timestamp: "10:15 AM (2 hours ago)",
    body:
      "Hi,\n\nCould we lock in our weekly 1:1? My calendar is open Wednesday afternoon and Thursday morning. Let me know what works best for you.\n\nThanks,\nSara",
    category: "Question/Request",
  },
  {
    id: "t6-09",
    subject: "💸 Your Amazon refund of $128.34 is waiting",
    sender_name: "Amazon Refund Center",
    sender_addr: "refunds@amaz0n-pay.support",
    timestamp: "4:12 AM (9 hours ago)",
    body:
      "Action required! Your refund of $128.34 is pending.\n\nClick here within 24 hours to claim or it will be returned to the original merchant.\n\nVerify your card details to receive the funds.",
    category: "Advertisement/Spam",
  },
  {
    id: "t6-10",
    subject: "Quarterly all-hands meeting on July 18",
    sender_name: "Executive Office",
    sender_addr: "exec-office@company.com",
    timestamp: "Monday, 8:00 AM",
    body:
      "Team,\n\nOur quarterly all-hands is scheduled for Thursday, July 18, at 10 AM in the main auditorium. Calendar invites have been sent. No action needed beyond accepting.\n\n– Executive Office",
    category: "Update",
  },
  {
    id: "t6-11",
    subject: "Could you join the kickoff call at 3?",
    sender_name: "Marcus O'Connor",
    sender_addr: "m.oconnor@company.com",
    timestamp: "1:25 PM (now)",
    body:
      "Hi,\n\nWe're starting the project kickoff in about an hour. Could you join the call at 3 PM today? Even just for the first 30 minutes would be helpful.\n\nThanks!\nMarcus",
    category: "Question/Request",
  },
  {
    id: "t6-12",
    subject: "FINAL NOTICE: claim your $1,000 gift card today",
    sender_name: "Rewards Center",
    sender_addr: "rewards@rewards-claim-now.xyz",
    timestamp: "3:48 AM (10 hours ago)",
    body:
      "This is your FINAL chance to claim a $1,000 gift card.\n\nWe'll close the offer at midnight tonight. Don't miss out — confirm your address below to receive it.",
    category: "Advertisement/Spam",
  },
  {
    id: "t6-13",
    subject: "Updated travel policy effective August 1",
    sender_name: "Finance Team",
    sender_addr: "finance@company.com",
    timestamp: "Yesterday, 1:50 PM",
    body:
      "Hi all,\n\nOur travel policy has been updated. The new per-diem rates and receipt requirements take effect August 1. The full document is on the intranet.\n\n– Finance",
    category: "Update",
  },
  {
    id: "t6-14",
    subject: "Can you cover my shift on Friday?",
    sender_name: "Tomás Alvarez",
    sender_addr: "t.alvarez@company.com",
    timestamp: "11:40 AM (50 minutes ago)",
    body:
      "Hey,\n\nWould you be willing to cover my Friday afternoon shift (1–5 PM)? I have a family appointment I can't move. Happy to swap for one of yours next week.\n\nLet me know!\nTomás",
    category: "Question/Request",
  },
  {
    id: "t6-15",
    subject: "🚀 Boost your traffic — top SEO secret revealed!",
    sender_name: "RankBoost SEO",
    sender_addr: "marketing@rankboost-seo-pro.co",
    timestamp: "2:05 AM (11 hours ago)",
    body:
      "Want to rank #1 on Google? Our secret SEO formula has helped 10,000+ businesses dominate search.\n\nClaim your free strategy session today. Limited consults available!",
    category: "Advertisement/Spam",
  },
];
