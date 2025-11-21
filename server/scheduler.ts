import * as cron from 'node-cron';
import { getDb } from './db';
import { schedules, scheduleExecutions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ScheduleJob {
  scheduleId: number;
  cronExpression: string;
  task: cron.ScheduledTask;
}

class SchedulerService {
  private jobs: Map<number, ScheduleJob> = new Map();
  private checkInterval: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler service
   * Checks for due schedules every minute
   */
  async start() {
    console.log('[Scheduler] Starting scheduler service...');
    
    // Load all active schedules from database
    await this.loadSchedules();
    
    // Check for new/updated schedules every minute
    this.checkInterval = cron.schedule('* * * * *', async () => {
      await this.loadSchedules();
    });
    
    console.log('[Scheduler] Scheduler service started');
  }

  /**
   * Stop the scheduler service
   */
  stop() {
    console.log('[Scheduler] Stopping scheduler service...');
    
    // Stop all scheduled jobs
    for (const job of Array.from(this.jobs.values())) {
      job.task.stop();
    }
    this.jobs.clear();
    
    // Stop the check interval
    if (this.checkInterval) {
      this.checkInterval.stop();
      this.checkInterval = null;
    }
    
    console.log('[Scheduler] Scheduler service stopped');
  }

  /**
   * Load schedules from database and create cron jobs
   */
  private async loadSchedules() {
    const db = await getDb();
    if (!db) return;

    try {
      // Get all active schedules
      const activeSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.isActive, 1));

      // Remove jobs that no longer exist or are inactive
      for (const [scheduleId, job] of Array.from(this.jobs.entries())) {
        const stillActive = activeSchedules.find(s => s.id === scheduleId);
        if (!stillActive) {
          job.task.stop();
          this.jobs.delete(scheduleId);
          console.log(`[Scheduler] Removed job ${scheduleId}`);
        }
      }

      // Add or update jobs
      for (const schedule of activeSchedules) {
        const existingJob = this.jobs.get(schedule.id);
        
        // If cron expression changed, recreate the job
        if (existingJob && existingJob.cronExpression !== schedule.cronExpression) {
          existingJob.task.stop();
          this.jobs.delete(schedule.id);
        }

        // Create new job if it doesn't exist
        if (!this.jobs.has(schedule.id)) {
          await this.createJob(schedule);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error loading schedules:', error);
    }
  }

  /**
   * Create a cron job for a schedule
   */
  private async createJob(schedule: any) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule.cronExpression)) {
        console.error(`[Scheduler] Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpression}`);
        return;
      }

      const task = cron.schedule(schedule.cronExpression, async () => {
        await this.executeSchedule(schedule);
      });

      this.jobs.set(schedule.id, {
        scheduleId: schedule.id,
        cronExpression: schedule.cronExpression,
        task,
      });

      console.log(`[Scheduler] Created job ${schedule.id} with cron: ${schedule.cronExpression}`);
    } catch (error) {
      console.error(`[Scheduler] Error creating job for schedule ${schedule.id}:`, error);
    }
  }

  /**
   * Execute a scheduled agent
   */
  private async executeSchedule(schedule: any) {
    const db = await getDb();
    if (!db) return;

    console.log(`[Scheduler] Executing schedule ${schedule.id} for agent ${schedule.agentConfigId}`);

    const executionStart = new Date();
    let status: 'success' | 'failure' = 'success';
    let result = '';
    let errorMessage: string | null = null;

    try {
      // Import execution logic
      const { executeAgent } = await import('./execution');
      
      // Execute the agent
      const executionResult = await executeAgent({
        agentConfigId: schedule.agentConfigId,
        input: schedule.input || '{}',
      });

      result = JSON.stringify(executionResult);
      status = 'success';
      
      console.log(`[Scheduler] Schedule ${schedule.id} executed successfully`);
    } catch (error: any) {
      status = 'failure';
      errorMessage = error.message || 'Unknown error';
      result = JSON.stringify({ error: errorMessage });
      
      console.error(`[Scheduler] Schedule ${schedule.id} execution failed:`, error);
    }

    // Store execution result
    try {
      await db.insert(scheduleExecutions).values({
        scheduleId: schedule.id,
        executedAt: executionStart,
        status,
        result,
        errorMessage,
      });

      // Update last execution time
      await db
        .update(schedules)
        .set({ lastExecutedAt: executionStart })
        .where(eq(schedules.id, schedule.id));
    } catch (error) {
      console.error(`[Scheduler] Error storing execution result for schedule ${schedule.id}:`, error);
    }

    // Send notification if configured
    if (schedule.notifyOnCompletion) {
      await this.sendNotification(schedule, status, result, errorMessage);
    }
  }

  /**
   * Send notification about execution result
   */
  private async sendNotification(
    schedule: any,
    status: 'success' | 'failure',
    result: string,
    errorMessage: string | null
  ) {
    try {
      const { notifyOwner } = await import('./_core/notification');
      
      const title = status === 'success' 
        ? `✅ Schedule Executed Successfully`
        : `❌ Schedule Execution Failed`;
      
      const content = status === 'success'
        ? `Schedule "${schedule.name}" for agent ${schedule.agentConfigId} completed successfully.\n\nResult: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`
        : `Schedule "${schedule.name}" for agent ${schedule.agentConfigId} failed.\n\nError: ${errorMessage}`;

      await notifyOwner({ title, content });
    } catch (error) {
      console.error(`[Scheduler] Error sending notification for schedule ${schedule.id}:`, error);
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
