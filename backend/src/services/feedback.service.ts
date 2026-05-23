import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class FeedbackService {
  /**
   * Create a new feedback from an intern about a mentor
   */
  async createFeedback(data: { internUserId: string; rating: number; comment: string; category?: string }) {
    // Find the intern using the user ID
    const intern = await prisma.intern.findUnique({
      where: { userId: data.internUserId },
    });

    if (!intern) {
      throw new Error('Intern profile not found for the logged-in user');
    }

    if (!intern.mentorId) {
      throw new Error('You are not assigned to a mentor yet');
    }

    const feedback = await prisma.feedback.create({
      data: {
        internId: intern.id,
        mentorId: intern.mentorId,
        rating: data.rating,
        comment: data.comment,
        category: data.category,
      },
    });

    return feedback;
  }

  /**
   * Get all feedbacks for HR view
   */
  async getHRFeedbacks() {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        intern: {
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } }
          }
        },
        mentor: {
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return feedbacks;
  }
}

export default new FeedbackService();
