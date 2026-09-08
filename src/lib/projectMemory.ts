import { ChatMessage, NoteItem, ProjectItem } from '../types';

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-general',
    name: 'General Workspace',
    description: 'Default project workspace for prompts, tools, and notes.',
    systemContext: 'Standard assistant behavior for all general tasks.',
    color: '#ffffff',
    icon: 'layout',
    isDefault: true,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'proj-coding',
    name: 'Coding & Architecture',
    description: 'Dedicated workspace for scripts, debugging, and web components.',
    systemContext: 'Prioritize production TypeScript, clean architecture, and error handling.',
    color: '#38bdf8',
    icon: 'code',
    isDefault: false,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  },
];

export const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to AXON',
    content: `AXON is your intelligent mobile workspace.\n\n• Seamlessly switch between Chat and Workspace views.\n• Manage storage quotas and downsampling.\n• Create rules to automate behaviors.\n• Run code safely and manage multi-account AI keys.`,
    projectId: 'proj-general',
    tags: ['welcome', 'guide'],
    isPinned: true,
    category: 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function formatConversationAsMarkdown(
  messages: ChatMessage[],
  projectName: string,
  projectDesc?: string
): string {
  let md = `# Conversation Export: ${projectName}\n`;
  if (projectDesc) md += `*${projectDesc}*\n`;
  md += `Exported on: ${new Date().toLocaleString()}\n\n---\n\n`;

  for (const msg of messages) {
    const senderName = msg.sender === 'axon' ? 'AXON (AI)' : 'User';
    md += `### ${senderName} [${msg.timestamp}]\n\n${msg.text}\n\n`;
  }

  return md;
}

export function formatConversationAsPlainText(
  messages: ChatMessage[],
  projectName: string
): string {
  let txt = `CONVERSATION EXPORT: ${projectName}\n`;
  txt += `Date: ${new Date().toLocaleString()}\n`;
  txt += `Total Messages: ${messages.length}\n`;
  txt += `=========================================\n\n`;

  for (const msg of messages) {
    const sender = msg.sender === 'axon' ? 'AXON' : 'USER';
    txt += `[${msg.timestamp}] ${sender}:\n${msg.text}\n\n-----------------------------------------\n\n`;
  }

  return txt;
}

export function formatConversationAsJson(
  messages: ChatMessage[],
  projectName: string,
  projectId: string
): string {
  const payload = {
    projectId,
    projectName,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages,
  };
  return JSON.stringify(payload, null, 2);
}

export function synthesizeExecutiveSummary(
  messages: ChatMessage[],
  projectName?: string,
  projectDesc?: string
): string {
  if (messages.length === 0) return 'No conversation history yet.';
  const userPrompts = messages
    .filter((m) => m.sender === 'user')
    .map((m) => m.text.slice(0, 80))
    .slice(-5);
  const header = projectName ? `Executive Summary for ${projectName}:\n` : 'Executive Summary:\n';
  const desc = projectDesc ? `Context: ${projectDesc}\n` : '';
  return `${header}${desc}• Key topics: ${userPrompts.join('; ')}\n• Active context retained across ${messages.length} messages.`;
}

export function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
