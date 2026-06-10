import prisma from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { VideoCallStatus } from '@prisma/client';

export interface VideoCallHistoryResponse {
  id: string;
  roomName: string;
  initiatedByName: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  status: string;
  participants: string[];
}

class VideoCallService {
  /**
   * Format call duration into MM:SS format
   */
  private formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Initiate a new video call room session
   */
  async initiateCall(
    initiatedById: string,
    conversationId: string,
    organizationId: string | null
  ) {
    // Generate an alphanumeric Jitsi room name
    const shortUuid = uuidv4().split('-')[0];
    const cleanOrg = organizationId ? organizationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) : 'default';
    const roomName = `internflow-${cleanOrg}-${shortUuid}`;

    const videoCall = await prisma.videoCall.create({
      data: {
        organizationId,
        roomName,
        initiatedById,
        conversationId,
        status: VideoCallStatus.ACTIVE,
      },
      include: {
        initiatedBy: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    // Write a starting notification message in the conversation feed (optional but helpful)
    try {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: initiatedById,
          organizationId,
          content: `📞 Video Call started`,
          metadata: {
            type: 'video_call_started',
            roomName,
            callId: videoCall.id,
          },
        },
      });
    } catch (msgErr: any) {
      logger.error(`Failed to create call start message: ${msgErr.message}`);
    }

    return videoCall;
  }

  /**
   * End a video call session and log duration and participants list
   */
  async endCall(
    roomName: string,
    participants: string[],
    statusInput?: 'ENDED' | 'MISSED'
  ) {
    const videoCall = await prisma.videoCall.findUnique({
      where: { roomName },
    });

    if (!videoCall) {
      throw new Error(`Video call session not found for room: ${roomName}`);
    }

    if (videoCall.status !== VideoCallStatus.ACTIVE) {
      return videoCall; // Already finalized
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - videoCall.startedAt.getTime()) / 1000)
    );

    // If there were no participants other than initiator (or participants list empty) and status is ACTIVE, we check if it is MISSED
    let finalStatus: VideoCallStatus = VideoCallStatus.ENDED;
    if (statusInput === 'MISSED' || (participants.length <= 1 && durationSeconds < 30)) {
      finalStatus = VideoCallStatus.MISSED;
    }

    const updatedCall = await prisma.videoCall.update({
      where: { id: videoCall.id },
      data: {
        endedAt,
        durationSeconds,
        status: finalStatus,
        participants: Array.from(new Set(participants)), // Unique list
      },
    });

    // Log the call summary inside the conversation timeline feed
    if (videoCall.conversationId) {
      try {
        const summaryContent =
          finalStatus === VideoCallStatus.MISSED
            ? `📞 Missed Video Call`
            : `📞 Video Call ended — Duration: ${this.formatDuration(durationSeconds)}`;

        await prisma.message.create({
          data: {
            conversationId: videoCall.conversationId,
            senderId: videoCall.initiatedById,
            organizationId: videoCall.organizationId,
            content: summaryContent,
            metadata: {
              type: finalStatus === VideoCallStatus.MISSED ? 'video_call_missed' : 'video_call_ended',
              roomName,
              callId: videoCall.id,
              durationSeconds,
            },
          },
        });
      } catch (msgErr: any) {
        logger.error(`Failed to create call summary message: ${msgErr.message}`);
      }
    }

    return updatedCall;
  }

  /**
   * Fetch historical call logs for a conversation or tenant organization
   */
  async getCallHistory(organizationId: string, conversationId?: string) {
    const list = await prisma.videoCall.findMany({
      where: {
        organizationId,
        ...(conversationId ? { conversationId } : {}),
      },
      include: {
        initiatedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((c) => ({
      id: c.id,
      roomName: c.roomName,
      initiatedByName: c.initiatedBy.name,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      durationSeconds: c.durationSeconds,
      status: c.status,
      participants: c.participants,
    }));
  }
}

export default new VideoCallService();
