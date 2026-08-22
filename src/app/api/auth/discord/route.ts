import { NextResponse } from "next/server";
import { discordConfigure, urlRetourDiscord } from "@/lib/auth";
import { poserEtatOAuth } from "@/lib/session";

/** Départ du tour OAuth Discord. */
export async function GET() {
  if (!discordConfigure()) {
    return NextResponse.redirect(new URL("/connexion", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const etat = await poserEtatOAuth();
  const scopes = process.env.DISCORD_GUILD_ID ? "identify guilds.members.read" : "identify";

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID!);
  url.searchParams.set("redirect_uri", urlRetourDiscord());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", etat);
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}
