import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Create a new event
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const creatorId = req.userId!;
        const { title, description, location, date, image } = req.body;

        const event = await prisma.event.create({
            data: {
                creatorId,
                title,
                description,
                location,
                date: new Date(date),
                image
            }
        });

        // Creator automatically joins as attendee
        await prisma.eventAttendee.create({
            data: {
                eventId: event.id,
                userId: creatorId,
                status: 'going'
            }
        });

        res.status(201).json({ event });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// List upcoming events
export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const events = await prisma.event.findMany({
            include: {
                _count: {
                    select: { attendees: true }
                },
                creator: {
                    select: { name: true }
                }
            },
            orderBy: { date: 'asc' },
            take: 10
        });

        res.json({ events });
    } catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Failed to list events' });
    }
};

// Join an event
export const joinEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const eventId = parseInt(req.params.id as string);
        const { status } = req.body; // going, interested

        const attendee = await prisma.eventAttendee.upsert({
            where: {
                eventId_userId: { eventId, userId }
            },
            update: { status },
            create: {
                eventId,
                userId,
                status
            }
        });

        res.json({ attendee });
    } catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({ error: 'Failed to join event' });
    }
};
