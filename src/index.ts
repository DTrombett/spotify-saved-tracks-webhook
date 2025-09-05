import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import type {
	CurrentUserProfile,
	SavedTracks,
	TokenResponse,
	User,
} from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const importKey = async (base64Key: string) => {
	const binaryString = atob(base64Key);
	const { length } = binaryString;
	const keyData = new Uint8Array(length);

	for (let i = 0; i < length; i++) keyData[i] = binaryString.charCodeAt(i);
	return crypto.subtle.importKey(
		"raw",
		keyData.buffer,
		{ name: "AES-GCM" },
		false,
		["encrypt", "decrypt"],
	);
};

const server: ExportedHandler<
	Record<
		| "CLIENT_ID"
		| "CLIENT_SECRET"
		| "PRIVATE_KEY"
		| "REDIRECT_URI"
		| "SPOTIFY_ID"
		| "THREAD_ID"
		| "WEBHOOK_ID"
		| "WEBHOOK_TOKEN",
		string
	> & {
		DB: D1Database;
	}
> = {
	fetch: async (request, env) => {
		if (request.method !== "GET") return new Response(null, { status: 405 });
		const url = new URL(request.url);

		if (url.pathname === "/")
			return Response.redirect(
				`https://open.spotify.com/user/${env.SPOTIFY_ID}`,
			);
		if (url.pathname === "/login") {
			if (!url.searchParams.has("id"))
				return new Response("Missing id", { status: 400 });
			const iv = crypto.getRandomValues(new Uint8Array(12));

			return Response.redirect(
				`https://accounts.spotify.com/authorize?${new URLSearchParams({
					response_type: "code",
					client_id: env.CLIENT_ID,
					scope: "user-library-read",
					redirect_uri: env.REDIRECT_URI,
					state: `${btoa(
						String.fromCharCode(
							...new Uint8Array(
								await crypto.subtle.encrypt(
									{
										name: "AES-GCM",
										iv: iv.buffer,
									},
									await importKey(env.PRIVATE_KEY),
									encoder.encode(url.searchParams.toString()),
								),
							),
						),
					)},${btoa(String.fromCharCode(...iv))}`,
				}).toString()}`,
			);
		}
		if (url.pathname === "/callback") {
			const code = url.searchParams.get("code");
			const [cipherText, iv] = url.searchParams.get("state")!.split(",");
			const state = new URLSearchParams(
				decoder.decode(
					new Uint8Array(
						await crypto.subtle.decrypt(
							{
								name: "AES-GCM",
								iv: Uint8Array.from(atob(iv!), (c) => c.charCodeAt(0)).buffer,
							},
							await importKey(env.PRIVATE_KEY),
							Uint8Array.from(atob(cipherText!), (c) => c.charCodeAt(0)),
						),
					),
				),
			);

			if (!code || !state.get("id"))
				return new Response("Invalid code", { status: 400 });
			let res = await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`,
				},
				body: new URLSearchParams({
					code,
					redirect_uri: env.REDIRECT_URI,
					grant_type: "authorization_code",
				}),
			});

			if (!res.ok) return res;
			const body = await res.json<TokenResponse>();

			res = await fetch("https://api.spotify.com/v1/me", {
				headers: {
					Authorization: `Bearer ${body.access_token}`,
				},
			});
			if (!res.ok) return res;
			const data = await res.json<CurrentUserProfile>();

			await env.DB.prepare(
				`INSERT OR REPLACE INTO Users (id, discordId, accessToken, expirationDate, refreshToken)
				VALUES (?1, ?2, ?3, datetime('now', '+' || ?4 || ' seconds'), ?5)`,
			)
				.bind(
					data.id,
					state.get("id"),
					body.access_token,
					body.expires_in,
					body.refresh_token,
				)
				.run();
			return new Response("All set!");
		}
		return new Response(null, { status: 404 });
	},
	scheduled: async (_controller, env, ctx) => {
		const { results } = await env.DB.prepare(
			`SELECT *
			FROM Users`,
		).all<User>();

		for (const user of results) {
			if (Date.now() > Date.parse(`${user.expirationDate}Z`)) {
				if (!user.refreshToken) {
					console.error(user.id, "Refresh token missing");
					continue;
				}
				const body = await fetch("https://accounts.spotify.com/api/token", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`,
					},
					body: new URLSearchParams({
						grant_type: "refresh_token",
						refresh_token: user.refreshToken,
					}),
				}).then((res) => res.json<TokenResponse>());

				if (!("access_token" in body)) {
					console.error(user.id, "Error refreshing token", body);
					continue;
				}
				user.accessToken = body.access_token;
				user.refreshToken = body.refresh_token ?? user.refreshToken;
				ctx.waitUntil(
					env.DB.prepare(
						`UPDATE Users SET accessToken = ?1, expirationDate = datetime('now', '+' || ?2 || ' seconds'), refreshToken = ?3 WHERE id = ?4`,
					)
						.bind(user.accessToken, body.expires_in, user.refreshToken, user.id)
						.run()
						.catch(console.error),
				);
			}
			const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=5", {
				headers: {
					"If-None-Match": user.etag!,
					Authorization: `Bearer ${user.accessToken}`,
				},
			});

			if (!res.ok) {
				console.log(
					user.id,
					res.status === 304 ? "Skipped" : "Error loading saved tracks",
					await res.text(),
				);
				continue;
			}
			const newEtag = res.headers.get("etag");

			if (newEtag) {
				if (newEtag === user.etag) {
					console.log(user.id, "Skipped (after)", newEtag);
					continue;
				}
				user.etag = newEtag;
			}
			const data = await res.json<SavedTracks>();
			const lastAdded = Date.parse(`${user.lastAdded}Z`);
			const tracks = data.items
				.filter((t) => Date.parse(t.added_at) > lastAdded)
				.map((t) => t.track.external_urls.spotify)
				.filter((t): t is string => Boolean(t));

			ctx.waitUntil(
				env.DB.prepare(
					`UPDATE Users SET etag = ?1, lastAdded = ?2 WHERE id = ?3`,
				)
					.bind(
						user.etag,
						data.items[0]
							? new Date(data.items[0].added_at).toISOString().slice(0, -1)
							: user.lastAdded,
						user.id,
					)
					.run(),
			);
			if (!tracks.length) {
				console.log(user.id, "No new track found");
				continue;
			}
			await fetch(
				`https://canary.discord.com/api/webhooks/${env.WEBHOOK_ID}/${env.WEBHOOK_TOKEN}?thread_id=${env.THREAD_ID}&wait=true`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						content: `<@${user.discordId}> ha salvato ${tracks.length} nuov${tracks.length === 1 ? "a" : "e"} canzon${tracks.length === 1 ? "e" : "i"} su Spotify!\n${tracks.join("\n")}`,
						allowed_mentions: { parse: [] },
					} satisfies RESTPostAPIWebhookWithTokenJSONBody),
				},
			).catch(console.error);
		}
	},
};

export default server;
