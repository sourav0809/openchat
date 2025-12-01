CREATE TABLE "ChatSessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"profilePictureUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatSessionId" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ChatSessions" ADD CONSTRAINT "ChatSessions_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_chatSessionId_ChatSessions_id_fk" FOREIGN KEY ("chatSessionId") REFERENCES "public"."ChatSessions"("id") ON DELETE cascade ON UPDATE no action;