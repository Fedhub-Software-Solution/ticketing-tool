import nodemailer from 'nodemailer';
import { config } from '../config';

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export type SendWelcomeEmailResult = { sent: true } | { sent: false; reason: string };

/**
 * Send verification email with link. User must click to verify before they can log in.
 */
export async function sendVerificationEmail(to: string, name: string, verificationLink: string): Promise<SendWelcomeEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: `Verify your email – ${appName}`,
      text: `Hello ${name},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link expires in 24 hours. After verification you can sign in with your email and password.\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Verify my email</a></p>
      <p>Or copy this link: ${verificationLink}</p>
      <p>This link expires in 24 hours. After verification you can sign in with your email and password.</p>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Verification email failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

/**
 * Send verification email for admin-created user (includes temporary password). User must verify before log in.
 */
export async function sendVerificationWithPasswordEmail(
  to: string,
  name: string,
  plainPassword: string,
  verificationLink: string
): Promise<SendWelcomeEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: `Verify your email – ${appName}`,
      text: `Hello ${name},\n\nYour account has been created. To sign in, you must first verify your email by clicking:\n\n${verificationLink}\n\nThis link expires in 24 hours. After verification you can sign in with:\n\nEmail: ${to}\nPassword: ${plainPassword}\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${name},</p>
      <p>Your account has been created. To sign in, you must first verify your email:</p>
      <p><a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Verify my email</a></p>
      <p>Or copy: ${verificationLink}</p>
      <p>This link expires in 24 hours. After verification you can sign in with:</p>
      <ul>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Password:</strong> <code>${plainPassword}</code></li>
      </ul>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Verification (with password) email failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

/**
 * Send welcome email with temporary password (for already-verified or legacy flow).
 * Returns { sent: false, reason } if SMTP is not configured or if sending fails.
 */
export async function sendWelcomeEmail(to: string, name: string, plainPassword: string): Promise<SendWelcomeEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: `Welcome to ${appName} – Your login details`,
      text: `Hello ${name},\n\nYour account has been created. You can sign in with:\n\nEmail: ${to}\nPassword: ${plainPassword}\n\nPlease sign in and change your password from your profile if you wish.\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${name},</p>
      <p>Your account has been created. You can sign in with:</p>
      <ul>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Password:</strong> <code>${plainPassword}</code></li>
      </ul>
      <p>Please sign in and change your password from your profile if you wish.</p>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Welcome email failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

export type ProfileUpdatedData = {
  name: string;
  email: string;
  role: string;
  status: string;
  location?: string;
  zoneName?: string;
  branchName?: string;
};

export type SendEmailResult = { sent: true } | { sent: false; reason: string };

/**
 * Send profile-updated notification email with the updated user data.
 */
export async function sendProfileUpdatedEmail(to: string, data: ProfileUpdatedData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Role: ${data.role}`,
    `Status: ${data.status}`,
    ...(data.location ? [`Location: ${data.location}`] : []),
    ...(data.zoneName ? [`Zone: ${data.zoneName}`] : []),
    ...(data.branchName ? [`Branch: ${data.branchName}`] : []),
  ];
  const textBody = lines.join('\n');
  const htmlLines = lines
    .map((line) => {
      const idx = line.indexOf(':');
      const key = idx >= 0 ? line.slice(0, idx) : line;
      const value = idx >= 0 ? line.slice(idx + 1).trim() : '';
      return `<li><strong>${key}:</strong> ${value}</li>`;
    })
    .join('');
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: `Your profile has been updated – ${appName}`,
      text: `Hello ${data.name},\n\nYour account profile has been updated. Here are your current details:\n\n${textBody}\n\nIf you did not request this change, please contact your administrator.\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${data.name},</p>
      <p>Your account profile has been updated. Here are your current details:</p>
      <ul>${htmlLines}</ul>
      <p>If you did not request this change, please contact your administrator.</p>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Profile updated email failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

/**
 * Send zone assigned/updated notification to the zone manager.
 * @param kind - 'created' or 'updated'
 */
export async function sendZoneNotificationEmail(
  to: string,
  managerName: string,
  zoneName: string,
  zoneCode: string | undefined,
  kind: 'created' | 'updated'
): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  const subject = kind === 'created'
    ? `You have been assigned as manager of zone "${zoneName}" – ${appName}`
    : `Zone "${zoneName}" has been updated – ${appName}`;
  const intro = kind === 'created'
    ? `You have been assigned as the manager of the following zone.`
    : `The following zone you manage has been updated.`;
  const details = [`Zone Name: ${zoneName}`, ...(zoneCode ? [`Zone Code: ${zoneCode}`] : [])].join('\n');
  const htmlDetails = [`<li><strong>Zone Name:</strong> ${zoneName}</li>`, ...(zoneCode ? [`<li><strong>Zone Code:</strong> ${zoneCode}</li>`] : [])].join('');
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text: `Hello ${managerName},\n\n${intro}\n\n${details}\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${managerName},</p>
      <p>${intro}</p>
      <ul>${htmlDetails}</ul>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Zone notification failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

/**
 * Send branch assigned/updated notification to the branch manager.
 * @param kind - 'created' or 'updated'
 */
export async function sendBranchNotificationEmail(
  to: string,
  managerName: string,
  branchName: string,
  branchCode: string | undefined,
  zoneName: string | undefined,
  kind: 'created' | 'updated'
): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  const subject = kind === 'created'
    ? `You have been assigned as manager of branch "${branchName}" – ${appName}`
    : `Branch "${branchName}" has been updated – ${appName}`;
  const intro = kind === 'created'
    ? `You have been assigned as the manager of the following branch.`
    : `The following branch you manage has been updated.`;
  const lines = [
    `Branch Name: ${branchName}`,
    ...(branchCode ? [`Branch Code: ${branchCode}`] : []),
    ...(zoneName ? [`Zone: ${zoneName}`] : []),
  ];
  const details = lines.join('\n');
  const htmlDetails = lines
    .map((line) => {
      const idx = line.indexOf(':');
      const key = idx >= 0 ? line.slice(0, idx) : line;
      const value = idx >= 0 ? line.slice(idx + 1).trim() : '';
      return `<li><strong>${key}:</strong> ${value}</li>`;
    })
    .join('');
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text: `Hello ${managerName},\n\n${intro}\n\n${details}\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${managerName},</p>
      <p>${intro}</p>
      <ul>${htmlDetails}</ul>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Branch notification failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}

export type TicketDetailsForEmail = {
  ticketId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  subCategory?: string;
  zone?: string;
  branch?: string;
  location?: string;
  createdBy?: string;
  /** Creator's email (e.g. admin who created on behalf of requester) */
  createdByEmail?: string;
  assignedTo?: string;
  slaDueDate?: string;
};

/** When true, email is worded for the assigned professional ("assigned to you"). */
export type TicketEmailRecipient = 'requester' | 'assignee';

/**
 * Send ticket created/updated notification with full ticket details.
 * Use for requester, creator, and assigned professional. Pass recipient: 'assignee' when sending to the Assigned Professional.
 */
export async function sendTicketNotificationEmail(
  to: string,
  recipientName: string,
  details: TicketDetailsForEmail,
  kind: 'created' | 'updated',
  recipient: TicketEmailRecipient = 'requester'
): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }
  const appName = 'Ticketing Tool Management';
  const isAssignee = recipient === 'assignee';
  const createdOnBehalf =
    !isAssignee &&
    kind === 'created' &&
    details.createdBy &&
    details.createdByEmail;

  const subject =
    isAssignee
      ? kind === 'created'
        ? `Ticket assigned to you: ${details.title} – ${appName}`
        : `Ticket updated (assigned to you): ${details.title} – ${appName}`
      : kind === 'created'
        ? `Ticket created: ${details.title} – ${appName}`
        : `Ticket updated: ${details.title} – ${appName}`;

  let intro: string;
  if (isAssignee) {
    intro =
      kind === 'created'
        ? 'A ticket has been assigned to you. Here are the complete details.'
        : 'A ticket assigned to you has been updated. Here are the complete details.';
  } else if (createdOnBehalf) {
    intro = `A ticket has been created on your behalf by ${details.createdBy} (${details.createdByEmail}). Here are the complete details.`;
  } else {
    intro =
      kind === 'created'
        ? 'A ticket has been created. Here are the complete details.'
        : 'A ticket has been updated. Here are the complete details.';
  }
  const lines = [
    `Ticket ID: ${details.ticketId}`,
    `Subject: ${details.title}`,
    ...(details.description ? [`Description: ${details.description}`] : []),
    `Status: ${details.status}`,
    `Priority: ${details.priority}`,
    ...(details.category ? [`Category: ${details.category}`] : []),
    ...(details.subCategory ? [`Sub-category: ${details.subCategory}`] : []),
    ...(details.zone ? [`Zone: ${details.zone}`] : []),
    ...(details.branch ? [`Branch: ${details.branch}`] : []),
    ...(details.location ? [`Location: ${details.location}`] : []),
    ...(details.createdBy ? [`Created by: ${details.createdBy}`] : []),
    ...(details.assignedTo ? [`Assigned to: ${details.assignedTo}`] : []),
    ...(details.slaDueDate ? [`SLA due: ${details.slaDueDate}`] : []),
  ];
  const textBody = lines.join('\n');
  const htmlLines = lines
    .map((line) => {
      const idx = line.indexOf(':');
      const key = idx >= 0 ? line.slice(0, idx) : line;
      const value = idx >= 0 ? line.slice(idx + 1).trim() : '';
      return `<li><strong>${key}:</strong> ${value}</li>`;
    })
    .join('');
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text: `Hello ${recipientName},\n\n${intro}\n\n${textBody}\n\nBest regards,\n${appName}`,
      html: `
      <p>Hello ${recipientName},</p>
      <p>${intro}</p>
      <ul>${htmlLines}</ul>
      <p>Best regards,<br/>${appName}</p>
    `,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Ticket notification failed for', to, ':', message);
    return { sent: false, reason: message };
  }
}
