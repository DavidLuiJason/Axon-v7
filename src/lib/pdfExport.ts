import { jsPDF } from 'jspdf';
import { ChatMessage } from '../types';

export function exportChatToPdf(
  messages: ChatMessage[],
  projectName: string,
  projectDescription?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(`AXON Transcript: ${projectName}`, margin, y);
  y += 22;

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleString();
  doc.text(`Exported: ${dateStr} • Total Messages: ${messages.length}`, margin, y);
  y += 14;

  if (projectDescription) {
    doc.text(`Project Description: ${projectDescription}`, margin, y);
    y += 14;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // Messages Loop
  for (const msg of messages) {
    const isUser = msg.sender === 'user';
    const senderLabel = isUser ? 'User' : `AXON (${msg.modelUsed || 'AI'})`;
    const timeLabel = msg.timestamp ? ` • ${msg.timestamp}` : '';

    // Check if new page needed
    if (y > pageHeight - margin - 40) {
      doc.addPage();
      y = margin;
    }

    // Sender Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    if (isUser) {
      doc.setTextColor(20, 20, 20);
    } else {
      doc.setTextColor(40, 40, 40);
    }
    doc.text(`${senderLabel}${timeLabel}`, margin, y);
    y += 14;

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);

    const rawText = typeof msg.text === 'string' ? msg.text : String(msg.text || '');
    const cleanText = rawText.replace(/\r\n/g, '\n');
    const lines = doc.splitTextToSize(cleanText, contentWidth);

    for (const line of lines) {
      if (y > pageHeight - margin - 15) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 13;
    }

    if (msg.attachment) {
      if (y > pageHeight - margin - 15) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `[Attached file: ${msg.attachment.name} (${msg.attachment.size || msg.attachment.type})]`,
        margin,
        y
      );
      y += 13;
    }

    y += 10; // Margin between messages
  }

  const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`${safeName}-chat-${fileDate}.pdf`);
}
