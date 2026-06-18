/**
 * Question schemas for the questionnaire-style tasks (1, 2, 3, 4) and the
 * AES-Text task. Every question maps to one row of the source Google Form
 * PDF. Where the source PDF showed a dropdown with no visible options
 * (e.g. Task 1's flight cost), reasonable options that include the
 * story-card value are listed so the question still functions.
 */

import type { Question } from "../components/Questionnaire";

// =============================================================
// Task 1: Story card a — Travel Request
// =============================================================
export const TASK1_STORY = {
  title: "Travel Request",
  intro:
    "Your boss asks you to submit a travel request right now. You'll attend the HFES Conference in Chicago, IL.",
  bullets: [
    "Trip dates: Depart Mon, Oct 12, 2026 and return Thu, Oct 15, 2026.",
    "Conference registration fee: $450.",
    "Flight: $320 round-trip.",
    "Hotel: 3 nights at $165/night.",
    "Local transport: $60 total (airport + local).",
    "Per diem: $55/day for 4 days.",
    "Funding source: Project DARI.",
    "Approver: Dr. Zahabi.",
    "Booking method: University travel portal.",
    "Receipt rules: receipts required for flight, hotel, and registration.",
    "Preferred travel time: depart morning, return afternoon.",
    "Hotel preference: standard room (no upgrades).",
  ],
};

export const TASK1_QUESTIONS: Question[] = [
  { id: "destination",    type: "radio",    prompt: "Destination city:",            options: ["Seattle", "Houston", "Atlanta", "Chicago"] },
  { id: "purpose",        type: "radio",    prompt: "Purpose of travel:",           options: ["Training", "Conference", "Client meeting"] },
  { id: "departure_day",  type: "date",     prompt: "Departure day:" },
  { id: "flight_cost",    type: "dropdown", prompt: "Flight cost:",                 options: ["$220", "$320", "$420", "Not sure"] },
  { id: "hotel_nights",   type: "dropdown", prompt: "Number of hotel nights:",      options: ["2", "3", "4", "5", "Not sure"] },
  { id: "hotel_rate",     type: "radio",    prompt: "Hotel nightly rate:",          options: ["$135", "$165", "$195", "$225"] },
  { id: "registration",   type: "dropdown", prompt: "Conference registration fee:", options: ["$250", "$350", "$450", "$550", "Not sure"] },
  { id: "funding",        type: "radio",    prompt: "Funding source:",              options: ["Project DARI", "Department funds", "Personal", "Not specified"] },
  { id: "approver",       type: "dropdown", prompt: "Approver:",                    options: ["Dr. Zahabi", "Dr. Smith", "Dr. Patel", "Not specified"] },
  { id: "booking_method", type: "radio",    prompt: "Booking method:",              options: ["University travel portal", "Book direct", "Travel agent", "Not specified"] },
];

// =============================================================
// Task 2: Story card b — Invoice approval
// =============================================================
export const TASK2_STORY = {
  title: "Invoice Approval",
  intro:
    "Your supervisor asks you to submit an invoice approval right now so it can be paid this week.",
  bullets: [
    "Vendor: Bright Office Supplies.",
    "Invoice number: INV-18427.",
    "Invoice date: May 11, 2026.",
    "Due date: May 15.",
    "Amount: $1,248.50.",
    "Category: Office supplies.",
    "Payment method: University P-Card.",
    "Cost center: CC-3172.",
    "Approver: Dr. Zahabi.",
    "Urgency note: must be approved today before 5:00 PM.",
    "Attachments: invoice PDF + packing slip (both included).",
  ],
};

export const TASK2_QUESTIONS: Question[] = [
  { id: "vendor",        type: "dropdown", prompt: "Vendor name:",          options: ["Bright Office Supplies", "Crystal Office Hub", "Office Direct", "Not listed"] },
  { id: "amount",        type: "radio",    prompt: "Amount:",               options: ["$1,024.85", "$1,248.50", "$1,284.50", "$1,428.50"] },
  { id: "category",      type: "dropdown", prompt: "Category:",             options: ["Office supplies", "IT equipment", "Software", "Other"] },
  { id: "urgency",       type: "radio",    prompt: "Urgency requirement:",  options: ["Approve today", "Approve within 3 days", "Approve next week", "Not specified"] },
  { id: "payment",       type: "radio",    prompt: "Payment method:",       options: ["P-Card", "Check", "ACH", "Personal card"] },
  { id: "approver",      type: "dropdown", prompt: "Approver:",             options: ["Dr. Zahabi", "Dr. Smith", "Dr. Patel", "Not specified"] },
  { id: "deadline",      type: "radio",    prompt: "Approval deadline today:", options: ["12:00 PM", "3:00 PM", "5:00 PM", "Not listed"] },
  { id: "invoice_no",    type: "radio",    prompt: "Invoice number:",       options: ["INV-18427", "INV-14827", "INV-18472", "Not sure"] },
  { id: "attachments",   type: "multi",    prompt: "Which attachments are included? (multi-select)", options: ["Invoice PDF", "Packing slip", "Receipt", "Contract"] },
];

// =============================================================
// Task 5: Form b (state + habits questionnaire from "task 3 Form b.pdf")
// =============================================================
export const TASK5_QUESTIONS: Question[] = [
  { id: "focus_time",       type: "dropdown", prompt: "At what time of day do you usually feel most focused?", options: ["Morning", "Midday", "Afternoon", "Evening", "Varies"] },
  { id: "noise_distract",   type: "scale",    prompt: "How distracting is noise in your environment right now?", min: 1, max: 5, minLabel: "Not at all", maxLabel: "Extremely" },
  { id: "lighting",         type: "radio",    prompt: "Which best describes your current environment lighting?", options: ["Dim", "Normal indoor", "Bright indoor", "Outdoor light", "Not sure"] },
  { id: "motivation_now",   type: "scale",    prompt: "Right now, how motivated do you feel to complete tasks?",  min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
  { id: "breaks_freq",      type: "radio",    prompt: "How often do you take breaks when using a computer for an hour or more?", options: ["Never", "Once", "Twice", "3+ times", "It varies a lot"] },
  { id: "multitask_freq",   type: "radio",    prompt: "How often do you multitask on a computer (multiple tabs/apps at once)?", options: ["Never", "Rarely", "Sometimes", "Often", "Almost always"] },
  { id: "email_freq",       type: "radio",    prompt: "How often do you check email on a typical day?",            options: ["Never", "Occasionally", "Sometimes", "Often"] },
  { id: "tomorrow_date",    type: "date",     prompt: "What is tomorrow's date?" },
  { id: "procrastinate",    type: "radio",    prompt: "How often do you procrastinate on computer tasks?",         options: ["Always", "Often", "Sometimes", "Rarely", "Never", "I don't do computer tasks"] },
  { id: "motivation_scale", type: "scale",    prompt: "Right now, how motivated do you feel?",                     min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very motivated" },
  { id: "comfort_phys",     type: "scale",    prompt: "How physically comfortable are you right now?",             min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very comfortable" },
  { id: "water_today",      type: "dropdown", prompt: "Have you had water today?",                                 options: ["No", "Yes, a little", "Yes, normal amount", "Yes, a lot"] },
  { id: "rushed",           type: "radio",    prompt: "Do you feel rushed right now?",                             options: ["Yes", "No"] },
  { id: "thermal",          type: "radio",    prompt: "How warm or cold do you feel right now?",                   options: ["Very cold", "Cold", "Neutral", "Warm", "Very warm"] },
  { id: "noise_level",      type: "dropdown", prompt: "How noisy is your environment right now?",                  options: ["Quiet", "Slight", "Moderate", "Loud"] },
  { id: "stressful_react",  type: "multi",    prompt: "When tasks are stressful, you tend to:",                    options: ["Work faster", "Work slower", "Avoid", "Ask for help", "Other", "Does not apply"] },
  { id: "harder_for_you",   type: "multi",    prompt: "Which is harder for you?",                                  options: ["Starting tasks", "Staying on tasks", "Finishing tasks", "None"] },
  { id: "task_order",       type: "radio",    prompt: "When given several tasks, you usually:",                    options: ["Start with easiest", "Start with most urgent", "Start with most important", "Depends"] },
];

// =============================================================
// Task 4: Form a (demographics + state + caffeine)
// =============================================================
export const TASK4_QUESTIONS: Question[] = [
  { id: "today_date",     type: "date",     prompt: "What is today's date?" },
  { id: "age_range",      type: "radio",    prompt: "What is your age range?",         options: ["18–24", "25–34", "35–44", "45–54", "55–65"] },
  { id: "gender",         type: "radio",    prompt: "What is your gender?",            options: ["Woman", "Man", "Non-binary", "Prefer not to say"] },
  { id: "education",      type: "radio",    prompt: "What is your highest education completed?", options: ["High school or less", "Some college", "Bachelor's", "Master's", "Doctorate", "Prefer not to say"] },
  { id: "employment",     type: "radio",    prompt: "What is your employment status?", options: ["Student", "Employed full-time", "Employed part-time", "Not currently employed", "Retired", "Prefer not to say"] },
  { id: "comp_comfort",   type: "scale",    prompt: "How comfortable are you using a computer?",  min: 1, max: 5, minLabel: "Not comfortable", maxLabel: "Extremely comfortable" },
  { id: "devices",        type: "multi",    prompt: "Which of the following devices do you regularly use?", options: ["Desktop computer", "Laptop", "Tablet", "Smart phone", "None of the above"] },
  { id: "hours_pc",       type: "radio",    prompt: "On average, how many hours per day do you use a computer?", options: ["Less than 1 hour", "1 - 3 hours", "4 - 6 hours", "7 - 8 hours", "More than 8 hours"] },
  { id: "email_comfort",  type: "scale",    prompt: "How comfortable are you using email?",       min: 1, max: 5, minLabel: "Not comfortable", maxLabel: "Extremely comfortable" },
  { id: "stress_now",     type: "scale",    prompt: "What is your stress level right now?",       min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
  { id: "caffeine",       type: "dropdown", prompt: "Caffeine intake (today):",                   options: ["None", "1 serving", "2 or more servings"] },
  { id: "sleep_hours",    type: "radio",    prompt: "Sleep last night: Approximately how many hours did you sleep?", options: ["0 - 3 hours", "4 - 6 hours", "7 - 9 hours", "More than 9 hours"] },
  { id: "sleep_quality",  type: "scale",    prompt: "Sleep quality last night:",                  min: 1, max: 5, minLabel: "Very Poor", maxLabel: "Very good" },
  { id: "race",           type: "multi",    prompt: "Race and Ethnicity:",                        options: ["American Indian or Alaska Native", "Asian", "Black or African American", "Hispanic or Latino", "Middle Eastern or North African", "Native Hawaiian or Pacific Islander", "White", "Prefer not to answer", "Other"] },
  { id: "mental_tired",   type: "scale",    prompt: "Right now, how mentally tired do you feel?", min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
  { id: "tools_weekly",   type: "multi",    prompt: "Which of these do you use at least weekly?", options: ["Calendar scheduling", "Video calls", "Online forms", "Spreadsheets", "None of the above"] },
  { id: "exercise_today", type: "radio",    prompt: "Have you exercised today?",                  options: ["No", "Light", "Moderate", "Hard"] },
  { id: "last_meal",      type: "radio",    prompt: "When was your last meal or snack?",          options: ["less than 1 hour ago", "1–3 hours ago", "4–6 hours ago", "more than 6 hours ago"] },
  { id: "kb_mouse_freq",  type: "radio",    prompt: "How often do you use a keyboard and mouse (not touchscreen)?", options: ["Rarely", "Weekly", "A few times a week", "Daily", "Never"] },
  { id: "online_forms",   type: "radio",    prompt: "How often do you use online forms (appointments, billing, registrations)?", options: ["Rarely", "Weekly", "A few times a week", "Daily", "Never"] },
  { id: "alert_now",      type: "scale",    prompt: "How alert do you feel right now?",           min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
];
