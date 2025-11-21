export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  category: "common" | "advanced" | "custom";
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  // Common templates
  {
    id: "hourly",
    name: "Every Hour",
    description: "Runs at the start of every hour",
    cronExpression: "0 * * * *",
    category: "common",
  },
  {
    id: "daily",
    name: "Daily at Midnight",
    description: "Runs once per day at 12:00 AM",
    cronExpression: "0 0 * * *",
    category: "common",
  },
  {
    id: "daily-morning",
    name: "Daily at 9 AM",
    description: "Runs every day at 9:00 AM",
    cronExpression: "0 9 * * *",
    category: "common",
  },
  {
    id: "weekly",
    name: "Weekly (Monday)",
    description: "Runs every Monday at midnight",
    cronExpression: "0 0 * * 1",
    category: "common",
  },
  {
    id: "monthly",
    name: "Monthly (1st)",
    description: "Runs on the 1st of every month at midnight",
    cronExpression: "0 0 1 * *",
    category: "common",
  },
  
  // Advanced templates
  {
    id: "every-15min",
    name: "Every 15 Minutes",
    description: "Runs 4 times per hour",
    cronExpression: "*/15 * * * *",
    category: "advanced",
  },
  {
    id: "every-30min",
    name: "Every 30 Minutes",
    description: "Runs twice per hour",
    cronExpression: "*/30 * * * *",
    category: "advanced",
  },
  {
    id: "business-hours",
    name: "Business Hours (9-5)",
    description: "Runs hourly from 9 AM to 5 PM on weekdays",
    cronExpression: "0 9-17 * * 1-5",
    category: "advanced",
  },
  {
    id: "weekdays",
    name: "Weekdays at 8 AM",
    description: "Runs Monday through Friday at 8:00 AM",
    cronExpression: "0 8 * * 1-5",
    category: "advanced",
  },
  {
    id: "weekend",
    name: "Weekends at 10 AM",
    description: "Runs Saturday and Sunday at 10:00 AM",
    cronExpression: "0 10 * * 0,6",
    category: "advanced",
  },
  {
    id: "quarterly",
    name: "Quarterly",
    description: "Runs on the 1st of Jan, Apr, Jul, Oct at midnight",
    cronExpression: "0 0 1 1,4,7,10 *",
    category: "advanced",
  },
];

export function getTemplateById(id: string): ScheduleTemplate | undefined {
  return SCHEDULE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: ScheduleTemplate["category"]): ScheduleTemplate[] {
  return SCHEDULE_TEMPLATES.filter(t => t.category === category);
}
