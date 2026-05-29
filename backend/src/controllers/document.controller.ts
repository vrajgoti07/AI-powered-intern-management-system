import { Request, Response } from 'express';
import prisma from '../config/database';
import pdfService from '../services/pdf.service';

export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const { internId } = req.params;

    const intern = await prisma.intern.findUnique({
      where: { id: internId as string },
      include: { department: true, mentor: { include: { user: true } }, user: true },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    if (intern.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Certificate can only be generated after the internship is completed.' });
    }

    const hrManagerName = 'Jane Doe'; // This would usually come from settings or HR user profile
    const companyName = 'TechNova Solutions'; // Mock company name

    const pdfBuffer = await pdfService.generateCertificate({
      internName: intern.user.name,
      department: intern.department.name,
      startDate: intern.startDate || intern.joinedDate,
      endDate: intern.completedDate || new Date(),
      performanceScore: intern.score,
      hrManagerName,
      deptHeadName: intern.department.headId ? 'Department Head' : 'Department Head', // Needs resolving if head name needed
      companyName,
    });

    const filename = `certificate_${internId}_${Date.now()}.pdf`;
    const uploadResult = await pdfService.uploadToCloudinary(pdfBuffer, filename);

    const doc = await prisma.internDocument.create({
      data: {
        internId: internId as string,
        type: 'CERTIFICATE',
        name: 'Certificate of Internship Completion',
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      }
    });

    return res.status(201).json({ message: 'Certificate generated successfully', document: doc });
  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return res.status(500).json({ message: 'Error generating certificate', error: error.message });
  }
};

export const generateOfferLetter = async (req: Request, res: Response) => {
  try {
    const { internId } = req.params;

    const intern = await prisma.intern.findUnique({
      where: { id: internId as string },
      include: { department: true, mentor: { include: { user: true } }, user: true },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const pdfBuffer = await pdfService.generateOfferLetter({
      internName: intern.user.name,
      position: 'Software Engineering Intern',
      department: intern.department.name,
      startDate: intern.startDate || new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)), // 6 months from now
      mentorName: intern.mentor?.user.name || 'Assigned Mentor',
      stipend: '$1000',
      acceptDeadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
      hrManagerName: 'Jane Doe',
      companyName: 'TechNova Solutions',
      companyAddress: '123 Tech Park, Innovation City, 10001',
    });

    const filename = `offer_letter_${internId}_${Date.now()}.pdf`;
    const uploadResult = await pdfService.uploadToCloudinary(pdfBuffer, filename);

    const doc = await prisma.internDocument.create({
      data: {
        internId: internId as string,
        type: 'OFFER_LETTER',
        name: 'Internship Offer Letter',
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      }
    });

    return res.status(201).json({ message: 'Offer letter generated successfully', document: doc });
  } catch (error: any) {
    console.error('Error generating offer letter:', error);
    return res.status(500).json({ message: 'Error generating offer letter', error: error.message });
  }
};

export const generatePerformanceReport = async (req: Request, res: Response) => {
  try {
    const { internId } = req.params;
    const month = req.query.month as string || new Date().toLocaleString('default', { month: 'long' });
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const intern = await prisma.intern.findUnique({
      where: { id: internId as string },
      include: { 
        department: true, 
        mentor: { include: { user: true } }, 
        user: true
      },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const pdfBuffer = await pdfService.generatePerformanceReport({
      internName: intern.user.name,
      department: intern.department.name,
      mentorName: intern.mentor?.user.name || 'N/A',
      month,
      year,
      attendanceData: [],
      taskData: [],
      performanceMetrics: {
        attendancePercent: 95, // mock or calculate based on intern.attendance
        taskCompletionPercent: 88, // mock or calculate
        avgTaskRating: intern.score || 8.5
      },
      mentorFeedback: 'The intern has shown great progress this month. Completed assigned tasks on time and actively participated in discussions.'
    });

    const filename = `performance_report_${internId}_${month}_${year}_${Date.now()}.pdf`;
    const uploadResult = await pdfService.uploadToCloudinary(pdfBuffer, filename);

    const doc = await prisma.internDocument.create({
      data: {
        internId: internId as string,
        type: 'PERFORMANCE_REPORT',
        name: `Performance Report - ${month} ${year}`,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        metadata: { month, year }
      }
    });

    return res.status(201).json({ message: 'Performance report generated successfully', document: doc });
  } catch (error: any) {
    console.error('Error generating performance report:', error);
    return res.status(500).json({ message: 'Error generating performance report', error: error.message });
  }
};

export const getInternDocuments = async (req: Request, res: Response) => {
  try {
    const { internId } = req.params;
    const documents = await prisma.internDocument.findMany({
      where: { internId: internId as string },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(documents) as any;
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const doc = await prisma.internDocument.findUnique({ where: { id: documentId as string } });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    // Since we're using Cloudinary, we just redirect to the URL or return it
    // For direct inline streaming, we'd need to fetch it from Cloudinary as a stream
    // but redirect is easier for downloading:
    res.redirect(doc.url);
    return;
  } catch (error: any) {
    return res.status(500).json({ message: 'Error downloading document', error: error.message });
  }
};
