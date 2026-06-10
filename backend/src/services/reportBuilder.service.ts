import prisma from '../config/database';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportBuilderService {
  /**
   * List all saved report configs
   */
  async getSavedReports(organizationId: string) {
    return prisma.savedReport.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Save a report configuration
   */
  async saveReport(data: {
    name: string;
    description?: string;
    selectedColumns: string[];
    filters: any;
    sortBy?: string;
    sortOrder?: string;
    createdBy: string;
    organizationId: string;
  }) {
    return prisma.savedReport.create({
      data: {
        name: data.name,
        description: data.description,
        selectedColumns: data.selectedColumns,
        filters: data.filters,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder || 'DESC',
        createdBy: data.createdBy,
        organizationId: data.organizationId,
      },
    });
  }

  /**
   * Query database for report rows dynamically
   */
  async generateReportData(
    filters: any,
    sortBy: string | undefined,
    sortOrder: string = 'DESC',
    selectedColumns: string[],
    organizationId: string
  ) {
    logger.info(`Generating report data for org ${organizationId}`);

    // Build where clause
    const where: any = { organizationId };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.cgpaMin !== undefined || filters.cgpaMax !== undefined) {
      where.cgpa = {};
      if (filters.cgpaMin !== undefined) where.cgpa.gte = Number(filters.cgpaMin);
      if (filters.cgpaMax !== undefined) where.cgpa.lte = Number(filters.cgpaMax);
    }
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      where.score = {};
      if (filters.scoreMin !== undefined) where.score.gte = Number(filters.scoreMin);
      if (filters.scoreMax !== undefined) where.score.lte = Number(filters.scoreMax);
    }
    if (filters.attendanceMin !== undefined || filters.attendanceMax !== undefined) {
      where.attendance = {};
      if (filters.attendanceMin !== undefined) where.attendance.gte = Number(filters.attendanceMin);
      if (filters.attendanceMax !== undefined) where.attendance.lte = Number(filters.attendanceMax);
    }
    if (filters.joinedDateStart || filters.joinedDateEnd) {
      where.joinedDate = {};
      if (filters.joinedDateStart) where.joinedDate.gte = new Date(filters.joinedDateStart);
      if (filters.joinedDateEnd) where.joinedDate.lte = new Date(filters.joinedDateEnd);
    }
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      where.skills = {
        hasSome: filters.skills,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      if (sortBy === 'name' || sortBy === 'email') {
        orderBy.user = { [sortBy]: sortOrder.toLowerCase() };
      } else {
        orderBy[sortBy] = sortOrder.toLowerCase();
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch interns
    const interns = await prisma.intern.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: {
          select: { name: true },
        },
        mentor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Extract selected fields
    return interns.map(intern => {
      const row: any = {};
      selectedColumns.forEach(col => {
        switch (col) {
          case 'internId':
            row.internId = intern.id;
            break;
          case 'name':
            row.name = intern.user.name;
            break;
          case 'email':
            row.email = intern.user.email;
            break;
          case 'phone':
            row.phone = intern.phone || '-';
            break;
          case 'college':
            row.college = intern.college;
            break;
          case 'degree':
            row.degree = intern.degree || '-';
            break;
          case 'branch':
            row.branch = intern.branch || '-';
            break;
          case 'cgpa':
            row.cgpa = intern.cgpa || 0;
            break;
          case 'joinedDate':
            row.joinedDate = intern.joinedDate.toISOString().split('T')[0];
            break;
          case 'startDate':
            row.startDate = intern.startDate ? intern.startDate.toISOString().split('T')[0] : '-';
            break;
          case 'status':
            row.status = intern.status;
            break;
          case 'score':
            row.score = intern.score;
            break;
          case 'attendance':
            row.attendance = intern.attendance;
            break;
          case 'skills':
            row.skills = (intern.skills || []).join(', ');
            break;
          case 'departmentName':
            row.departmentName = intern.department?.name || 'N/A';
            break;
          case 'mentorName':
            row.mentorName = intern.mentor?.user?.name || 'Unassigned';
            break;
          default:
            break;
        }
      });
      return row;
    });
  }

  /**
   * Compile formatted Excel sheet buffer
   */
  async generateReportExcel(data: any[], selectedColumns: string[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InternFlow Custom Report Builder';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Custom Intern Report');

    // Define column headers
    const friendlyHeaders: Record<string, string> = {
      internId: 'Intern ID',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      college: 'College',
      degree: 'Degree',
      branch: 'Branch',
      cgpa: 'CGPA',
      joinedDate: 'Joined Date',
      startDate: 'Start Date',
      status: 'Status',
      score: 'Score',
      attendance: 'Attendance',
      skills: 'Skills',
      departmentName: 'Department',
      mentorName: 'Mentor',
    };

    sheet.columns = selectedColumns.map(col => ({
      header: friendlyHeaders[col] || col,
      key: col,
      width: col === 'email' || col === 'college' || col === 'skills' ? 25 : 16,
    }));

    // Add rows
    data.forEach(row => {
      sheet.addRow(row);
    });

    // Style headers
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // Lavender theme indigo
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 28;

    // Style data cells
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        cell.alignment = { vertical: 'middle' };
        if (i % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });
      row.height = 22;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Compile formatted PDF tabular report buffer
   */
  async generateReportPDF(data: any[], selectedColumns: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const buffers: Buffer[] = [];

        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- Document Header ---
        doc
          .fillColor('#1E1B4B')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('InternFlow Custom Report', 30, 30);
          
        doc
          .fillColor('#6B7280')
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated on: ${new Date().toLocaleDateString()} | Total Records: ${data.length}`, 30, 55);

        doc.moveTo(30, 70).lineTo(812, 70).strokeColor('#E5E7EB').stroke();

        // Friendly Headers mapping
        const friendlyHeaders: Record<string, string> = {
          internId: 'Intern ID',
          name: 'Name',
          email: 'Email',
          phone: 'Phone',
          college: 'College',
          degree: 'Degree',
          branch: 'Branch',
          cgpa: 'CGPA',
          joinedDate: 'Joined Date',
          startDate: 'Start Date',
          status: 'Status',
          score: 'Score',
          attendance: 'Attendance',
          skills: 'Skills',
          departmentName: 'Department',
          mentorName: 'Mentor',
        };

        const totalWidth = 782; // Landscape A4 width is 842 - 60 margin
        const colWidth = totalWidth / selectedColumns.length;

        // Draw Table Header
        let currentY = 90;
        doc.rect(30, currentY, totalWidth, 24).fill('#4F46E5');

        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
        selectedColumns.forEach((col, index) => {
          doc.text(
            friendlyHeaders[col] || col,
            35 + index * colWidth,
            currentY + 7,
            { width: colWidth - 10, align: 'left', lineBreak: false }
          );
        });

        currentY += 24;

        // Draw Data Rows
        doc.font('Helvetica').fontSize(9).fillColor('#374151');
        data.forEach((row, rowIndex) => {
          // Auto-page breaks
          if (currentY > 540) {
            doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
            currentY = 40;
            
            // Re-draw Table Header on new page
            doc.rect(30, currentY, totalWidth, 24).fill('#4F46E5');
            doc.fillColor('#FFFFFF').font('Helvetica-Bold');
            selectedColumns.forEach((col, idx) => {
              doc.text(
                friendlyHeaders[col] || col,
                35 + idx * colWidth,
                currentY + 7,
                { width: colWidth - 10, align: 'left', lineBreak: false }
              );
            });
            doc.font('Helvetica').fontSize(9).fillColor('#374151');
            currentY += 24;
          }

          // Row background highlights
          if (rowIndex % 2 === 1) {
            doc.rect(30, currentY, totalWidth, 20).fill('#F9FAFB');
          }

          doc.fillColor('#374151');
          selectedColumns.forEach((col, colIdx) => {
            const val = String(row[col] !== undefined ? row[col] : '-');
            doc.text(
              val,
              35 + colIdx * colWidth,
              currentY + 5,
              { width: colWidth - 10, align: 'left', ellipsis: true, lineBreak: false }
            );
          });

          // Draw bottom line
          doc.moveTo(30, currentY + 20).lineTo(812, currentY + 20).strokeColor('#F3F4F6').stroke();
          currentY += 20;
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new ReportBuilderService();
