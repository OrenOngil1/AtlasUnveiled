CREATE TABLE "discovered_coordinates" (
	"user_id" integer NOT NULL,
	"coordinates" geometry(point) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discovered_coordinates_user_id_coordinates_pk" PRIMARY KEY("user_id","coordinates")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"hashed_token" text NOT NULL,
	"expired_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"hashed_password" text NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "discovered_coordinates" ADD CONSTRAINT "discovered_coordinates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;