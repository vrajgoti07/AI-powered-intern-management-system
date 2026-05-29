import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { v2 as cloudinary } from 'cloudinary';

export interface GenerateCertificateParams {
  internName: string;
  department: string;
  startDate: Date;
  endDate: Date;
  performanceScore: number;
  hrManagerName: string;
  deptHeadName: string;
  companyName: string;
}

export interface GenerateOfferLetterParams {
  internName: string;
  position: string;
  department: string;
  startDate: Date;
  endDate: Date;
  mentorName: string;
  stipend?: string;
  acceptDeadline: Date;
  hrManagerName: string;
  companyName: string;
  companyAddress: string;
}

export interface GeneratePerformanceReportParams {
  internName: string;
  department: string;
  mentorName: string;
  month: string;
  year: number;
  attendanceData: any[];
  taskData: any[];
  performanceMetrics: {
    attendancePercent: number;
    taskCompletionPercent: number;
    avgTaskRating: number;
  };
  mentorFeedback: string;
}

// --- Color Palette ---
const COLORS = {
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  secondary: '#6366F1',
  accent: '#8B5CF6',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dark: '#1F2937',
  medium: '#6B7280',
  light: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

// --- Helper: Draw Table ---
function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths: number[]
): number {
  const startX = 50;
  const rowHeight = 24;
  let y = startY;

  // Header row
  doc.fillColor(COLORS.primary).rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
  doc.fillColor(COLORS.white).fontSize(9).font('Helvetica-Bold');
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 4, y + 7, { width: colWidths[i] - 8, align: 'left' });
    x += colWidths[i];
  });
  y += rowHeight;

  // Data rows
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.dark);
  rows.forEach((row, rowIndex) => {
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.fillColor(COLORS.light)
        .rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill();
    }
    doc.fillColor(COLORS.dark);
    x = startX;
    row.forEach((cell, i) => {
      doc.text(cell, x + 4, y + 7, { width: colWidths[i] - 8, align: 'left' });
      x += colWidths[i];
    });
    y += rowHeight;

    // Page break check
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
  });

  return y;
}

// --- Helper: Draw Stat Card ---
function drawStatCard(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  color: string = COLORS.primary
): void {
  // Card background
  doc.fillColor(COLORS.light).roundedRect(x, y, width, 50, 6).fill();
  // Colored left accent
  doc.fillColor(color).rect(x, y, 4, 50).fill();
  // Value
  doc.fillColor(color).fontSize(18).font('Helvetica-Bold');
  doc.text(value, x + 12, y + 8, { width: width - 20 });
  // Label
  doc.fillColor(COLORS.medium).fontSize(8).font('Helvetica');
  doc.text(label, x + 12, y + 32, { width: width - 20 });
}

// --- Helper: Page Header ---
function drawPageHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
  // Header bar
  doc.fillColor(COLORS.primary).rect(0, 0, 612, 70).fill();
  // Accent stripe
  doc.fillColor(COLORS.secondary).rect(0, 70, 612, 4).fill();

  // Title
  doc.fillColor(COLORS.white).fontSize(22).font('Helvetica-Bold');
  doc.text(title, 50, 20, { width: 512 });

  if (subtitle) {
    doc.fillColor('#CBD5E1').fontSize(10).font('Helvetica');
    doc.text(subtitle, 50, 48, { width: 512 });
  }
}

// --- Helper: Section Title ---
function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold');
  doc.text(title, 50, y);
  doc.fillColor(COLORS.primaryLight).rect(50, y + 18, 120, 2).fill();
  return y + 28;
}

// --- Helper: Footer ---
function drawFooter(doc: PDFKit.PDFDocument, pageNum: number): void {
  doc.fillColor(COLORS.border).rect(0, 762, 612, 30).fill();
  doc.fillColor(COLORS.medium).fontSize(7).font('Helvetica');
  doc.text('AI-Powered Intern Management System', 50, 770);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 250, 770);
  doc.text(`Page ${pageNum}`, 500, 770);
}

// --- PDF Service ---

export class PDFService {
  /**
   * Export attendance records as a styled PDF
   */
  async exportAttendancePDF(data: any): Promise<PDFKit.PDFDocument> {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

      drawPageHeader(
        doc,
        'Attendance Report',
        `${data.intern.name} | ${data.intern.department} | ${data.summary.dateRange.startDate?.slice(0, 10)} to ${data.summary.dateRange.endDate?.slice(0, 10)}`
      );

      let y = 90;

      // Summary cards
      y += 10;
      const cardWidth = 120;
      drawStatCard(doc, 'Total Days', String(data.summary.totalDays), 50, y, cardWidth, COLORS.primary);
      drawStatCard(doc, 'Present', String(data.summary.present), 180, y, cardWidth, COLORS.success);
      drawStatCard(doc, 'Absent', String(data.summary.absent), 310, y, cardWidth, COLORS.danger);
      drawStatCard(doc, 'Attendance %', `${data.summary.attendanceRate}%`, 440, y, cardWidth, COLORS.secondary);
      y += 70;

      // Attendance table
      y = drawSectionTitle(doc, 'Daily Records', y);

      const headers = ['Date', 'Check In', 'Check Out', 'Status', 'Notes'];
      const colWidths = [100, 90, 90, 80, 152];
      const rows = data.records.map((r: any) => [
        r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-',
        r.status || 'N/A',
        r.notes || '-',
      ]);

      drawTable(doc, headers, rows, y, colWidths);
      drawFooter(doc, 1);

      doc.end();
      return doc;
    } catch (error) {
      logger.error('Attendance PDF export error:', error);
      throw error;
    }
  }

  /**
   * Export performance report as a styled PDF
   */
  async exportPerformancePDF(data: any): Promise<PDFKit.PDFDocument> {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

      drawPageHeader(
        doc,
        'Performance Report',
        `${data.intern.name} | ${data.intern.department}`
      );

      let y = 90;

      // Performance score hero
      y += 10;
      const scoreColor = data.performanceScore >= 70 ? COLORS.success :
        data.performanceScore >= 50 ? COLORS.warning : COLORS.danger;
      drawStatCard(doc, 'Performance Score', `${data.performanceScore}/100`, 50, y, 150, scoreColor);
      drawStatCard(doc, 'Task Completion', `${data.taskStats.taskCompletionRate}%`, 210, y, 130, COLORS.primary);
      drawStatCard(doc, 'Attendance', `${data.attendanceStats.attendanceRate}%`, 350, y, 110, COLORS.secondary);
      drawStatCard(doc, 'Avg Rating', `${data.feedbackStats.avgRating}/5`, 470, y, 95, COLORS.accent);
      y += 70;

      // Intern details
      y = drawSectionTitle(doc, 'Intern Profile', y);
      doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica');
      const profileItems = [
        `Name: ${data.intern.name}`,
        `Email: ${data.intern.email}`,
        `Department: ${data.intern.department}`,
        `Mentor: ${data.intern.mentor}`,
        `College: ${data.intern.college}`,
        `CGPA: ${data.intern.cgpa || 'N/A'}`,
        `Status: ${data.intern.status}`,
        `Joined: ${data.intern.joinedDate ? new Date(data.intern.joinedDate).toLocaleDateString() : 'N/A'}`,
      ];
      profileItems.forEach((item) => {
        doc.text(item, 55, y);
        y += 14;
      });
      y += 10;

      // Task breakdown
      y = drawSectionTitle(doc, 'Task Statistics', y);
      const taskHeaders = ['Metric', 'Count'];
      const taskColWidths = [260, 252];
      const taskRows = [
        ['Total Tasks', String(data.taskStats.totalTasks)],
        ['Completed', String(data.taskStats.completedTasks)],
        ['In Progress', String(data.taskStats.inProgressTasks)],
        ['Under Review', String(data.taskStats.reviewTasks)],
        ['To Do', String(data.taskStats.todoTasks)],
        ['Overdue', String(data.taskStats.overdueTasks)],
      ];
      y = drawTable(doc, taskHeaders, taskRows, y, taskColWidths);
      y += 15;

      // AI Prediction (if available)
      if (data.aiPrediction) {
        if (y > 600) { doc.addPage(); y = 50; }
        y = drawSectionTitle(doc, 'AI Performance Prediction', y);
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica');
        doc.text(`Predicted Grade: ${data.aiPrediction.predictedGrade}`, 55, y); y += 14;
        doc.text(`Predicted Score: ${data.aiPrediction.predictedScore}`, 55, y); y += 14;
        doc.text(`Risk Level: ${data.aiPrediction.riskLevel}`, 55, y); y += 14;
        if (data.aiPrediction.keyDrivers?.length) {
          doc.text('Key Drivers:', 55, y); y += 14;
          data.aiPrediction.keyDrivers.forEach((driver: string) => {
            doc.text(`  • ${driver}`, 60, y); y += 12;
          });
        }
      }

      drawFooter(doc, 1);
      doc.end();
      return doc;
    } catch (error) {
      logger.error('Performance PDF export error:', error);
      throw error;
    }
  }

  /**
   * Export internship completion certificate as a premium PDF
   */
  async exportCompletionCertificate(data: any): Promise<PDFKit.PDFDocument> {
    try {
      const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 40 });

      // Outer border
      doc.lineWidth(3).strokeColor(COLORS.primary).rect(20, 20, 752, 572).stroke();
      // Inner border
      doc.lineWidth(1).strokeColor(COLORS.secondary).rect(30, 30, 732, 552).stroke();

      // Decorative corner accents
      const cornerSize = 30;
      [
        [35, 35], [757 - cornerSize, 35],
        [35, 577 - cornerSize], [757 - cornerSize, 577 - cornerSize],
      ].forEach(([cx, cy]) => {
        doc.fillColor(COLORS.accent).rect(cx, cy, cornerSize, 3).fill();
        doc.fillColor(COLORS.accent).rect(cx, cy, 3, cornerSize).fill();
      });

      // Header emblem line
      doc.fillColor(COLORS.primary).rect(200, 60, 392, 3).fill();
      doc.fillColor(COLORS.secondary).rect(250, 66, 292, 2).fill();

      // Institution title
      doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold');
      doc.text('AI-POWERED INTERN MANAGEMENT SYSTEM', 0, 80, { width: 792, align: 'center' });

      // Certificate title
      doc.fillColor(COLORS.dark).fontSize(30).font('Helvetica-Bold');
      doc.text('CERTIFICATE OF COMPLETION', 0, 120, { width: 792, align: 'center' });

      // Subtitle
      doc.fillColor(COLORS.medium).fontSize(11).font('Helvetica');
      doc.text('This is to certify that', 0, 175, { width: 792, align: 'center' });

      // Intern name
      doc.fillColor(COLORS.primary).fontSize(26).font('Helvetica-Bold');
      doc.text(data.intern.name, 0, 200, { width: 792, align: 'center' });

      // Underline
      const nameWidth = doc.widthOfString(data.intern.name);
      const nameX = (792 - nameWidth) / 2;
      doc.fillColor(COLORS.accent).rect(nameX, 233, nameWidth, 2).fill();

      // Details
      doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica');
      doc.text(
        `has successfully completed the internship program in the ${data.department.name} department`,
        100, 255, { width: 592, align: 'center' }
      );

      const joinDate = data.intern.joinedDate
        ? new Date(data.intern.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
      const completeDate = data.intern.completedDate
        ? new Date(data.intern.completedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      doc.text(`Duration: ${joinDate} to ${completeDate}`, 100, 280, { width: 592, align: 'center' });

      // Performance summary
      doc.fillColor(COLORS.medium).fontSize(10).font('Helvetica');
      doc.text(
        `Performance Score: ${data.performance.performanceScore}/100  |  ` +
        `Task Completion: ${data.performance.taskCompletionRate}%  |  ` +
        `Attendance: ${data.performance.attendanceRate}%`,
        100, 310, { width: 592, align: 'center' }
      );

      // Distinction
      let distinction = '';
      if (data.performance.performanceScore >= 90) distinction = 'With Highest Distinction';
      else if (data.performance.performanceScore >= 80) distinction = 'With High Distinction';
      else if (data.performance.performanceScore >= 70) distinction = 'With Distinction';

      if (distinction) {
        doc.fillColor(COLORS.accent).fontSize(14).font('Helvetica-BoldOblique');
        doc.text(distinction, 0, 340, { width: 792, align: 'center' });
      }

      // Divider
      doc.fillColor(COLORS.border).rect(200, 375, 392, 1).fill();

      // Signature lines
      const sigY = 420;
      // Left signature
      doc.fillColor(COLORS.dark).rect(150, sigY + 30, 180, 1).fill();
      doc.fillColor(COLORS.medium).fontSize(9).font('Helvetica');
      doc.text('Program Director', 150, sigY + 36, { width: 180, align: 'center' });

      // Right signature
      doc.fillColor(COLORS.dark).rect(462, sigY + 30, 180, 1).fill();
      doc.text('Department Head', 462, sigY + 36, { width: 180, align: 'center' });

      // Date issued
      doc.fillColor(COLORS.medium).fontSize(8).font('Helvetica');
      doc.text(
        `Date Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        0, 510, { width: 792, align: 'center' }
      );

      // Bottom decorative line
      doc.fillColor(COLORS.primary).rect(200, 540, 392, 3).fill();
      doc.fillColor(COLORS.secondary).rect(250, 546, 292, 2).fill();

      doc.end();
      return doc;
    } catch (error) {
      logger.error('Completion certificate PDF export error:', error);
      throw error;
    }
  }

  /**
   * Export analytics summary PDF
   */
  async exportSummaryPDF(data: any): Promise<PDFKit.PDFDocument> {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

      drawPageHeader(doc, 'Analytics Summary Report', `Generated on ${new Date().toLocaleDateString()}`);

      let y = 90;

      // Overview cards
      y += 10;
      drawStatCard(doc, 'Total Interns', String(data.totalInterns || 0), 50, y, 120, COLORS.primary);
      drawStatCard(doc, 'Active Interns', String(data.activeInterns || 0), 180, y, 120, COLORS.success);
      drawStatCard(doc, 'Total Mentors', String(data.totalMentors || 0), 310, y, 120, COLORS.secondary);
      drawStatCard(doc, 'Departments', String(data.totalDepartments || 0), 440, y, 120, COLORS.accent);
      y += 70;

      // Department breakdown
      if (data.departments?.length) {
        y = drawSectionTitle(doc, 'Department Overview', y);
        const deptHeaders = ['Department', 'Interns', 'Mentors', 'Avg Score', 'Task Completion'];
        const deptColWidths = [150, 80, 80, 100, 102];
        const deptRows = data.departments.map((d: any) => [
          d.name,
          String(d.internCount),
          String(d.mentorCount),
          String(d.avgScore),
          `${d.taskCompletionRate}%`,
        ]);
        y = drawTable(doc, deptHeaders, deptRows, y, deptColWidths);
        y += 20;
      }

      // Task overview
      if (data.taskStats) {
        if (y > 600) { doc.addPage(); y = 50; }
        y = drawSectionTitle(doc, 'Task Analytics', y);
        const taskHeaders = ['Status', 'Count'];
        const taskColWidths = [260, 252];
        const taskRows = Object.entries(data.taskStats as Record<string, number>).map(([status, count]) => [
          status,
          String(count),
        ]);
        y = drawTable(doc, taskHeaders, taskRows, y, taskColWidths);
      }

      drawFooter(doc, 1);
      doc.end();
      return doc;
    } catch (error) {
      logger.error('Summary PDF export error:', error);
      throw error;
    }
  }

  /**
   * Generates an Internship Certificate
   */
  async generateCertificate(data: GenerateCertificateParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 50,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Draw border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

        // Certificate ID
        const certId = `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
        doc.fontSize(10).text(`Certificate ID: ${certId}`, 40, 40);
        doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 40, 55);

        // Header
        doc.moveDown(2);
        doc.fontSize(24).font('Helvetica-Bold').text(data.companyName, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(36).fillColor('#2c3e50').text('Certificate of Internship Completion', { align: 'center' });
        doc.moveDown(1.5);

        // Body
        doc.fontSize(16).fillColor('#000000').font('Helvetica').text('This is to certify that', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(26).font('Helvetica-Bold').fillColor('#2980b9').text(data.internName, { align: 'center' });
        doc.moveDown(0.5);

        const startDateStr = new Date(data.startDate).toLocaleDateString();
        const endDateStr = new Date(data.endDate).toLocaleDateString();

        doc.fontSize(14).font('Helvetica').fillColor('#000000')
          .text(`has successfully completed an internship in the `, { align: 'center', continued: true })
          .font('Helvetica-Bold').text(`${data.department} department`, { continued: true })
          .font('Helvetica').text(` from `, { continued: true })
          .font('Helvetica-Bold').text(`${startDateStr} to ${endDateStr}.`, { align: 'center' });

        doc.moveDown(1);

        let grade = 'Satisfactory';
        if (data.performanceScore >= 9) grade = 'Excellent';
        else if (data.performanceScore >= 7.5) grade = 'Good';

        doc.fontSize(14).font('Helvetica').text('Performance Grade: ', { align: 'center', continued: true })
          .font('Helvetica-Bold').text(grade);

        // Signatures
        const signatureY = doc.page.height - 120;
        
        doc.fontSize(12).font('Helvetica');
        
        // HR Signature
        doc.text('_______________________', 150, signatureY);
        doc.text(data.hrManagerName, 150, signatureY + 20);
        doc.text('HR Manager', 150, signatureY + 35);

        // Dept Head Signature
        doc.text('_______________________', doc.page.width - 300, signatureY);
        doc.text(data.deptHeadName, doc.page.width - 300, signatureY + 20);
        doc.text('Department Head', doc.page.width - 300, signatureY + 35);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates an Offer Letter
   */
  async generateOfferLetter(data: GenerateOfferLetterParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margin: 50,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header: Company Name & Address
        doc.fontSize(20).font('Helvetica-Bold').text(data.companyName, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(data.companyAddress, { align: 'right' });
        doc.moveDown(3);

        // Date
        doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
        doc.moveDown(1);

        // Recipient
        doc.font('Helvetica-Bold').text(`To:\n${data.internName}`);
        doc.moveDown(1);

        // Subject
        doc.font('Helvetica-Bold').text('Subject: Internship Offer Letter');
        doc.moveDown(1);

        // Salutation
        doc.font('Helvetica').text(`Dear ${data.internName},`);
        doc.moveDown(1);

        // Body
        doc.text(`We are pleased to offer you an internship as `)
          .font('Helvetica-Bold').text(data.position, { continued: true })
          .font('Helvetica').text(` in the `)
          .font('Helvetica-Bold').text(data.department, { continued: true })
          .font('Helvetica').text(` department at ${data.companyName}.`);
        
        doc.moveDown(1);

        const startDateStr = new Date(data.startDate).toLocaleDateString();
        const endDateStr = new Date(data.endDate).toLocaleDateString();
        
        doc.text(`Internship period: `)
          .font('Helvetica-Bold').text(`${startDateStr} to ${endDateStr}`);
        
        doc.moveDown(0.5);
        doc.font('Helvetica').text(`Reporting to: `)
          .font('Helvetica-Bold').text(data.mentorName);

        if (data.stipend) {
          doc.moveDown(0.5);
          doc.font('Helvetica').text(`Stipend: `)
            .font('Helvetica-Bold').text(data.stipend);
        }

        doc.moveDown(0.5);
        doc.font('Helvetica').text(`Working hours: Monday-Friday, 9:00 AM - 6:00 PM`);

        doc.moveDown(1.5);
        doc.font('Helvetica-Bold').text('Terms and Conditions:');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        const terms = [
          'During your internship, you may have access to confidential, proprietary, or trade secret information. You agree to keep all this information strictly confidential.',
          'Your internship will include training, orientation, and focus primarily on learning and developing new skills.',
          'You will be required to abide by all the policies and procedures of the company.',
          'This offer is contingent upon the successful verification of your educational documents.',
          'Either party may terminate this internship agreement at any time by giving a written notice of 7 days.',
        ];
        terms.forEach((term, idx) => {
          doc.text(`${idx + 1}. ${term}`, { indent: 20 });
          doc.moveDown(0.5);
        });

        doc.moveDown(1);
        const deadlineStr = new Date(data.acceptDeadline).toLocaleDateString();
        doc.text(`Please confirm your acceptance of this offer by signing and returning this letter by ${deadlineStr}.`);

        doc.moveDown(3);
        doc.text('Sincerely,');
        doc.moveDown(2);
        doc.text('_______________________');
        doc.font('Helvetica-Bold').text(data.hrManagerName);
        doc.font('Helvetica').text('HR Manager');
        doc.text(data.companyName);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates a Monthly Performance Report
   */
  async generatePerformanceReport(data: GeneratePerformanceReportParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margin: 50,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('Monthly Performance Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`${data.internName} - ${data.department} Department`, { align: 'center' });
        doc.text(`${data.month} ${data.year}`, { align: 'center' });
        doc.moveDown(1.5);

        // Section 1: Performance Metrics
        doc.fontSize(14).font('Helvetica-Bold').text('1. Performance Metrics');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Attendance Rate: ${data.performanceMetrics.attendancePercent}%`, { indent: 20 });
        doc.text(`Task Completion Rate: ${data.performanceMetrics.taskCompletionPercent}%`, { indent: 20 });
        doc.text(`Average Task Rating: ${data.performanceMetrics.avgTaskRating} / 10`, { indent: 20 });
        doc.moveDown(1.5);

        // Section 2: Attendance Summary
        doc.fontSize(14).font('Helvetica-Bold').text('2. Attendance Summary');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        let totalPresent = 0;
        let totalAbsent = 0;
        data.attendanceData.forEach(a => {
          if (a.status === 'PRESENT') totalPresent++;
          else totalAbsent++;
        });
        doc.text(`Total Days Present: ${totalPresent}`, { indent: 20 });
        doc.text(`Total Days Absent/Leave: ${totalAbsent}`, { indent: 20 });
        doc.moveDown(1.5);

        // Section 3: Task Summary
        doc.fontSize(14).font('Helvetica-Bold').text('3. Task Summary');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        
        if (data.taskData.length === 0) {
          doc.text('No tasks recorded for this period.', { indent: 20 });
        } else {
          data.taskData.slice(0, 10).forEach((task, idx) => {
            const status = task.status || 'UNKNOWN';
            doc.text(`${idx + 1}. ${task.title} - Status: ${status}`, { indent: 20 });
          });
          if (data.taskData.length > 10) {
            doc.text(`...and ${data.taskData.length - 10} more tasks.`, { indent: 20 });
          }
        }
        doc.moveDown(1.5);

        // Section 4: Mentor Feedback
        doc.fontSize(14).font('Helvetica-Bold').text('4. Mentor Feedback');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(data.mentorFeedback || 'No feedback provided.', { indent: 20, align: 'justify' });
        doc.moveDown(2);

        // Footer
        doc.fontSize(9).fillColor('gray').text(`Generated on ${new Date().toLocaleDateString()} | Mentor: ${data.mentorName}`, 50, doc.page.height - 50, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Uploads a PDF buffer to Cloudinary
   */
  async uploadToCloudinary(buffer: Buffer, filename: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // Important for PDFs
          folder: 'intern_documents',
          public_id: filename.replace('.pdf', ''),
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Unknown error during Cloudinary upload'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export default new PDFService();
