import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import { JsonResponse } from "./JsonResponse";
import type { CurrentUserProfile, SavedTracks, TokenResponse } from "./types";

const server: ExportedHandler<
	Record<"CLIENT_ID" | "CLIENT_SECRET" | "REDIRECT_URI", string> & {
		KV: KVNamespace;
	}
> = {
	fetch: async (request, env) => {
		const url = new URL(request.url);

		console.log({
			ip: request.headers.get("CF-Connecting-IP"),
			latitude: request.cf?.latitude,
			longitude: request.cf?.longitude,
			host: request.cf?.asOrganization,
		});
		if (url.pathname === "/") return new Response("Hello World!");
		if (url.pathname === "/login")
			return Response.redirect(
				`https://accounts.spotify.com/authorize?${new URLSearchParams({
					response_type: "code",
					client_id: env.CLIENT_ID,
					scope: "user-library-read",
					// scope: "user-library-read user-read-private user-read-email",
					redirect_uri: env.REDIRECT_URI,
					state: crypto.randomUUID(),
				}).toString()}`,
			);
		if (url.pathname === "/callback") {
			const code = url.searchParams.get("code");
			const state = url.searchParams.get("state");

			if (!state || !code) return new JsonResponse({ error: "Invalid state" });
			const res = (await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${Buffer.from(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`).toString("base64")}`,
				},
				body: new URLSearchParams({
					code,
					redirect_uri: env.REDIRECT_URI,
					grant_type: "authorization_code",
				}),
			}).catch(console.error)) as Response | undefined;

			if (!res?.ok)
				return (
					res ??
					new JsonResponse({ error: "Internal Server Error" }, { status: 500 })
				);
			const body = (await res.json().catch(console.error)) as
				| TokenResponse
				| undefined;

			if (!body)
				return new JsonResponse({ error: "Invalid JSON" }, { status: 500 });
			const data = (await fetch("https://api.spotify.com/v1/me")
				.then((r) => r.json())
				.catch(console.error)) as CurrentUserProfile | undefined;

			if (data?.id !== "m910295jo03u0wb2qxnsu5ehi")
				return new JsonResponse({ error: "Forbidden" }, { status: 403 });
			await Promise.all([
				env.KV.put("access_token", body.access_token, {
					expirationTtl: body.expires_in - 1,
				}),
				env.KV.put("refresh_token", body.refresh_token),
			]);
			return new Response("No Content", { status: 204 });
		}
		return new JsonResponse({ error: "Not Found" }, { status: 404 });
	},
	scheduled: async (_controller, env) => {
		// eslint-disable-next-line prefer-const
		let [accessToken, etag] = await Promise.all([
			env.KV.get("access_token"),
			env.KV.get("etag"),
		]);

		if (!accessToken) {
			const refreshToken = await env.KV.get("refresh_token");

			if (!refreshToken) {
				console.log("Refresh token missing");
				return;
			}
			const res = await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: refreshToken,
					client_id: env.CLIENT_ID,
				}),
			});

			if (!res.ok) {
				console.log("Error refreshing token");
				return;
			}
			const body = (await res.json()) as TokenResponse;

			accessToken = body.access_token;
			Promise.all([
				env.KV.put("access_token", body.access_token, {
					expirationTtl: body.expires_in - 1,
				}),
				env.KV.put("refresh_token", body.refresh_token),
			]).catch(console.error);
			console.log("Token refreshed");
		}
		const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=5", {
			headers: {
				"If-None-Match": etag ?? "",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!res.ok) {
			console.log(
				res.status === 304 ? "Skipped" : "Error loading saved tracks",
			);
			return;
		}
		const newEtag = res.headers.get("etag");

		if (newEtag) {
			if (newEtag === etag) {
				console.log("Skipped (after)");
				return;
			}
			env.KV.put("etag", newEtag).catch(console.error);
		}
		const [data, lastAddedTimestamp] = await Promise.all([
			res.json() as Promise<SavedTracks>,
			env.KV.get("last_added_timestamp").then((t) => t && Number(t)),
		]);

		if (!lastAddedTimestamp) {
			if (data.items[0])
				await env.KV.put(
					"last_added_timestamp",
					Date.parse(data.items[0].added_at).toString(),
				);
			console.log("Hello World!");
			return;
		}
		const tracks = data.items
			.filter((t) => Date.parse(t.added_at) > lastAddedTimestamp)
			.map((t) => t.track.external_urls.spotify)
			.filter((t): t is string => Boolean(t));

		if (!tracks.length) {
			console.log("No new track found");
			return;
		}
		await Promise.all([
			data.items[0] &&
				env.KV.put(
					"last_added_timestamp",
					Date.parse(data.items[0].added_at).toString(),
				),
			fetch(
				"https://canary.discord.com/api/webhooks/1040704954031149157/aR9VmTxkye3IP2K49jxhb7xWHwIShQVTriI6Zec4M3uSzOfrEmtbcE7KNu2OIWKd_y7l?thread_id=1040643054144606248",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						content: `<@597505862449496065> ha salvato ${tracks.length} nuov${tracks.length === 1 ? "a" : "e"} canzon${tracks.length === 1 ? "e" : "i"} su Spotify!\n${tracks.join("\n")}`,
						allowed_mentions: { parse: [] },
					} satisfies RESTPostAPIWebhookWithTokenJSONBody),
				},
			),
		]);
	},
};

export default server;
