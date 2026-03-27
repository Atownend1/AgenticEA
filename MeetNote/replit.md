# Meeting Intelligence Hub

## Overview

The Meeting Intelligence Hub is an automated meeting management system that processes transcripts from Fireflies.ai, extracts actionable insights using OpenAI, and manages them through Notion databases. The application provides a comprehensive dashboard for tracking meetings, action items, and automated reminders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Deployment**: Production build using esbuild for server bundling

### Database Design
The application uses PostgreSQL with the following core entities:
- **Users**: Authentication and user management
- **Meetings**: Store meeting metadata, transcripts, and AI-processed insights
- **Action Items**: Track tasks extracted from meetings with assignees and due dates
- **Reminders**: Automated notification system for action items
- **Integration Status**: Monitor health of external service connections
- **Activity Log**: Audit trail for system activities

### AI Processing Pipeline
- **Transcript Analysis**: OpenAI GPT models extract structured data from meeting transcripts
- **Data Extraction**: Identifies key topics, outcomes, takeaways, next steps, and action items
- **Automated Assignment**: Associates action items with attendees and due dates

### Automation Features
- **Webhook Processing**: Receives real-time updates from Fireflies when meetings are processed
- **Scheduled Reminders**: Cron-based morning reminders for due action items
- **Notion Synchronization**: Bidirectional sync with Notion databases for meetings and action items

## External Dependencies

### Third-Party Services
- **Fireflies.ai**: Meeting transcription and recording service integration
- **OpenAI API**: AI-powered content analysis and structured data extraction
- **Notion API**: Project management and database synchronization
- **Neon Database**: PostgreSQL hosting service (@neondatabase/serverless)

### Email Infrastructure
- **Nodemailer**: SMTP-based email delivery for automated reminders
- **Configuration**: Supports Gmail and custom SMTP providers

### Development Tools
- **Replit Integration**: Development environment integration with runtime error handling
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **Type Safety**: Comprehensive TypeScript coverage across client and server