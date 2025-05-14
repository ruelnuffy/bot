# Venille WhatsApp Bot

A WhatsApp bot for menstrual tracking and sexual health information, built with WhatsApp Web.js and Supabase.

## Features

- Period tracking
- Symptom logging
- Sexual health education
- Multi-language support (English and Hausa)
- Automated reminders
- Product ordering system

## Tech Stack

- Node.js
- WhatsApp Web.js
- Supabase (Database & Auth)
- Express.js (Health checks)
- Docker
- Koyeb (Deployment)

## Prerequisites

- Node.js >= 16.0.0
- Supabase account and project
- Chrome/Chromium (for WhatsApp Web)

## Environment Variables

Create a `.env` file in the root directory:

```env
SUPA_URL=your_supabase_project_url
SUPA_KEY=your_supabase_service_role_key
PORT=8080 # Optional, defaults to 8080
```

## Supabase Setup

1. Create required tables:

```sql
-- WhatsApp sessions
create table wa_sessions (
  id text primary key,
  state jsonb,
  updated_at timestamp with time zone
);

-- QR codes
create table qr_codes (
  id text primary key,
  qr_code text,
  created_at timestamp with time zone
);

-- Bot status
create table bot_status (
  id text primary key,
  status text,
  last_connect timestamp with time zone,
  last_disconnect timestamp with time zone,
  reason text
);
```

2. Additional tables (users, symptoms, feedback) are created automatically.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd venille-whatsapp-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Run the bot:
```bash
npm start
```

## Docker

Build and run with Docker:

```bash
docker build -t venille-bot .
docker run -p 8080:8080 --env-file .env venille-bot
```

## Deployment

The bot is configured for deployment on Koyeb:

1. Push to GitHub
2. Connect your GitHub repository to Koyeb
3. Configure environment variables in Koyeb
4. Deploy!

## Health Checks

The bot exposes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-03-XX..."
}
```

## License

[Add your license here]
