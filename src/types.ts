export type TokenResponse = {
	access_token: string;
	token_type: "Bearer";
	scope: string;
	expires_in: number;
	refresh_token?: string;
};

export type ImageObject = {
	url: string;
	height: number | null;
	width: number | null;
};

export type SimplifiedArtistObject = {
	external_urls: { spotify?: string };
	href: string;
	id: string;
	name: string;
	type: "artist";
	uri: string;
};

export type ArtistObject = SimplifiedArtistObject & {
	followers: { href: string | null; total: number };
	genres: string[];
	images: ImageObject[];
	popularity: number;
};

export type SavedTrackObject = {
	added_at: string;
	track: {
		album: {
			album_type: "album" | "compilation" | "single";
			total_tracks: number;
			available_markets: string[];
			external_urls: { spotify?: string };
			href: string;
			id: string;
			images: ImageObject[];
			name: string;
			release_date: string;
			release_date_precision: "day" | "month" | "year";
			restrictions?: { reason?: "explicit" | "market" | "product" };
			type: "album";
			uri: string;
			artists: SimplifiedArtistObject[];
		};
		artists: ArtistObject[];
		available_markets: string[];
		disc_number: number;
		duration_ms: number;
		explicit: boolean;
		external_ids: { isrc?: string; ean?: string; upc?: string };
		external_urls: { spotify?: string };
		href: string;
		id: string;
		is_playable?: boolean;
		linked_from?: object;
		restrictions?: { reason?: "explicit" | "market" | "product" };
		name: string;
		popularity: number;
		preview_url: string | null;
		track_number: number;
		type: "track";
		uri: string;
		is_local: boolean;
	};
};

export type SavedTracks = {
	href: string;
	limit: number;
	next: string | null;
	offset: number;
	previous: string | null;
	total: number;
	items: SavedTrackObject[];
};

export type CurrentUserProfile = {
	country?: string;
	display_name: string | null;
	email?: string;
	explicit_content?: { filter_enabled: boolean; filter_locked: boolean };
	external_urls: { spotify?: string };
	followers: { href: string | null; total: number };
	href: string;
	id: string;
	images: ImageObject[];
	product: string;
	type: "user";
	uri: string;
};
